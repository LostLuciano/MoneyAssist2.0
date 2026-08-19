-- ==========================================================
-- MONEYASSIST 2.0 - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==========================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 2. PROFILES TABLE (Linked with Supabase Auth)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    monthly_income NUMERIC(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'IDR',
    financial_status TEXT DEFAULT 'Controlled Spending',
    telegram_id TEXT UNIQUE,
    telegram_username TEXT,
    pairing_code TEXT UNIQUE,
    api_token UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Function and trigger to auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, pairing_code)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- 3. SECURE BOT & PAIRING RPC FUNCTIONS (Bypasses RLS Safely)
-- ==========================================================

-- Function 1: Pair Telegram User
CREATE OR REPLACE FUNCTION public.pair_telegram_user(
    p_pairing_code TEXT,
    p_telegram_id TEXT,
    p_telegram_username TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_clean_code TEXT;
BEGIN
    v_clean_code := UPPER(TRIM(p_pairing_code));
    
    SELECT * INTO v_profile FROM public.profiles 
    WHERE UPPER(TRIM(pairing_code)) = v_clean_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kode pairing tidak ditemukan.');
    END IF;

    -- Update profile with telegram_id
    UPDATE public.profiles
    SET telegram_id = p_telegram_id,
        telegram_username = p_telegram_username,
        updated_at = NOW()
    WHERE id = v_profile.id;

    RETURN jsonb_build_object(
        'success', true, 
        'user_id', v_profile.id,
        'full_name', COALESCE(v_profile.full_name, v_profile.email),
        'email', v_profile.email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Get Profile by Telegram ID
CREATE OR REPLACE FUNCTION public.get_profile_by_telegram(
    p_telegram_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT * INTO v_profile FROM public.profiles 
    WHERE telegram_id = p_telegram_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    RETURN jsonb_build_object(
        'found', true,
        'id', v_profile.id,
        'email', v_profile.email,
        'full_name', v_profile.full_name,
        'pairing_code', v_profile.pairing_code,
        'api_token', v_profile.api_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Add Telegram Transaction
CREATE OR REPLACE FUNCTION public.add_telegram_transaction(
    p_telegram_id TEXT,
    p_type TEXT,
    p_amount NUMERIC,
    p_description TEXT,
    p_category_name TEXT DEFAULT 'Lain-lain',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_category_id UUID;
    v_tx_id UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT * INTO v_profile FROM public.profiles 
    WHERE telegram_id = p_telegram_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'User belum terhubung.');
    END IF;

    -- Find or default category
    SELECT id INTO v_category_id FROM public.categories 
    WHERE name ILIKE '%' || p_category_name || '%' AND (user_id = v_profile.id OR is_system = TRUE)
    LIMIT 1;

    INSERT INTO public.transactions (
        user_id, category_id, type, amount, description, transaction_date, payment_method, notes
    ) VALUES (
        v_profile.id, v_category_id, p_type, p_amount, p_description, v_today, 'Cash', p_notes
    )
    RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'user_name', COALESCE(v_profile.full_name, v_profile.email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Get Telegram Financial Summary
CREATE OR REPLACE FUNCTION public.get_telegram_summary(
    p_telegram_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_income NUMERIC := 0;
    v_expense NUMERIC := 0;
BEGIN
    SELECT * INTO v_profile FROM public.profiles 
    WHERE telegram_id = p_telegram_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
    INTO v_income, v_expense
    FROM public.transactions
    WHERE user_id = v_profile.id;

    RETURN jsonb_build_object(
        'found', true,
        'full_name', COALESCE(v_profile.full_name, v_profile.email),
        'income', v_income,
        'expense', v_expense,
        'balance', (v_income - v_expense)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- 4. CATEGORIES TABLE (System default & Custom per-user)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#64748b',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system and their own categories"
    ON public.categories FOR SELECT
    USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create their own custom categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can update their own custom categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete their own custom categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id AND is_system = FALSE);

-- Seed System Default Categories
INSERT INTO public.categories (name, type, icon, color, is_system) VALUES
    ('Makanan & Minuman', 'expense', 'Utensils', '#ef4444', TRUE),
    ('Transportasi', 'expense', 'Car', '#f97316', TRUE),
    ('Belanja & Kebutuhan', 'expense', 'ShoppingBag', '#f59e0b', TRUE),
    ('Tagihan & Utilitas', 'expense', 'Receipt', '#8b5cf6', TRUE),
    ('Hiburan & Rekreasi', 'expense', 'Gamepad2', '#ec4899', TRUE),
    ('Kesehatan & Medis', 'expense', 'HeartPulse', '#06b6d4', TRUE),
    ('Pendidikan', 'expense', 'GraduationCap', '#3b82f6', TRUE),
    ('Investasi & Tabungan', 'expense', 'TrendingUp', '#10b981', TRUE),
    ('Lain-lain', 'expense', 'MoreHorizontal', '#64748b', TRUE),
    ('Gaji Utama', 'income', 'Wallet', '#10b981', TRUE),
    ('Freelance & Side Job', 'income', 'Briefcase', '#06b6d4', TRUE),
    ('Hasil Usaha/Bisnis', 'income', 'Store', '#3b82f6', TRUE),
    ('Bonus & Tunjangan', 'income', 'Gift', '#8b5cf6', TRUE),
    ('Investasi / Dividen', 'income', 'TrendingUp', '#f59e0b', TRUE),
    ('Pemasukan Lainnya', 'income', 'Coins', '#64748b', TRUE)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- 5. TRANSACTIONS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'Cash',
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);

-- ==========================================================
-- 6. BUDGETS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    amount_limit NUMERIC(15, 2) NOT NULL CHECK (amount_limit >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- RLS: Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

-- ==========================================================
-- 7. SAVINGS GOALS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE,
    icon TEXT DEFAULT 'Target',
    color TEXT DEFAULT '#10b981',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Savings Goals
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings goals"
    ON public.savings_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals"
    ON public.savings_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
    ON public.savings_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
    ON public.savings_goals FOR DELETE
    USING (auth.uid() = user_id);

-- ==========================================================
-- 8. AI CONVERSATIONS & CHAT HISTORY TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Percakapan Baru',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI conversations"
    ON public.ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI conversations"
    ON public.ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI messages"
    ON public.ai_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI messages"
    ON public.ai_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================================
-- 9. STORAGE BUCKET SETUP (Receipts)
-- ==========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read public receipts"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete their own receipts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
