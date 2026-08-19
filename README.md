# 💰 MoneyAssist 2.0

> **AI-Powered Personal Finance Assistant** — Dibangun ulang dari nol dengan arsitektur bersih, **Next.js (App Router, TypeScript, Tailwind CSS)**, **Supabase (PostgreSQL, Auth, Storage, Row Level Security)**, dan **Google Gemini AI**.

---

## 🌟 Fitur Utama MoneyAssist 2.0

1. **Guest Mode (AI Financial Health Audit)**:
   - Pengguna baru dapat langsung menguji kesehatan finansial mereka (Controlled, Elevated, atau Critical status) secara interaktif tanpa harus mendaftar terlebih dahulu.
2. **Supabase Authentication**:
   - Sistem login/register yang aman menggunakan Supabase Auth (Email & Password, Google OAuth, Magic Link) dengan proteksi rute middleware otomatis.
3. **Multi-Modal Input Transaksi**:
   - ✍️ **Formulir Manual**: Input cepat dengan kategori otomatis, metode pembayaran (Cash, Transfer, QRIS, dll.), dan validasi IDR.
   - 📸 **OCR Scan Struk Belanja**: Foto struk/nota pembayaran langsung dipindai menggunakan multimodal **Gemini Vision** untuk mengekstrak nominal, toko/merchant, tanggal, dan rincian belanja dalam hitungan detik.
   - 💬 **AI Financial Advisor Chat**: Asisten percakapan cerdas yang dapat menjawab strategi anggaran, evaluasi pengeluaran, dan **mencatat transaksi langsung dari pesan teks** (contoh: *"tadi bayar bensin 50rb"*).
4. **Financial Dashboard & Analytics**:
   - Visualisasi grafik arus kas bulanan (**Recharts**), proporsi pengeluaran per kategori, status kesehatan kas, dan ringkasan transaksi terbaru.
5. **Manajemen Anggaran (Budgets)**:
   - Pasang limit anggaran per kategori pengeluaran dan pantau indikator persentase untuk mencegah *overspending*.
6. **Target Tabungan (Savings Goals)**:
   - Pelacak target dana darurat, liburan, atau pembelian impian dengan progress bar dan animasi selebrasi.
7. **Database Row Level Security (RLS)**:
   - Keamanan tingkat database PostgreSQL: setiap user hanya memiliki akses ke data keuangannya sendiri.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) & React 18
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & Glassmorphism UI
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Storage Bucket, Realtime)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash`)
- **Grafik & Visualisasi**: Recharts & Lucide Icons

---

## 🚀 Panduan Setup & Menjalankan Aplikasi

### 1. Prasyarat
- Node.js (versi 18 ke atas)
- Akun [Supabase](https://supabase.com) (Gratis)
- API Key [Google AI Studio](https://aistudio.google.com) (Gratis)

### 2. Konfigurasi Environment Variables
Salin template `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu lengkapi nilai variabel berikut di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...
```

### 3. Setup Database Supabase
Buka **SQL Editor** pada project Supabase Anda, lalu jalankan seluruh script yang ada pada file:
[`supabase/schema.sql`](./supabase/schema.sql)

Script ini secara otomatis membuat:
- Tabel `profiles`, `categories`, `transactions`, `budgets`, `savings_goals`, `ai_conversations`, dan `ai_messages`
- Trigger pendaftaran profil pengguna otomatis
- Kategori default sistem
- Kebijakan Row Level Security (RLS) lengkap
- Storage bucket `receipts` untuk upload struk

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Build Produksi
```bash
npm run build
npm start
```

---

## 📁 Struktur Direktori

```
├── src/
│   ├── app/
│   │   ├── (auth)/                # Halaman Login & Register
│   │   ├── (dashboard)/           # Dashboard, Transaksi, OCR, AI, Budgets, Savings
│   │   ├── api/ai/                # Route Handler AI (Chat, OCR Vision, Audit)
│   │   ├── auth/callback/         # Supabase OAuth callback
│   │   ├── globals.css            # Styling & Glassmorphism Tailwind
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing Page & Guest AI Audit
│   ├── components/
│   │   ├── dashboard/             # StatCard, ExpenseChart, TrendChart, RecentTransactions
│   │   ├── guest/                 # GuestAuditModal
│   │   ├── layout/                # Navbar, Sidebar, Header
│   │   └── transactions/          # TransactionModal
│   └── lib/
│       ├── gemini/client.ts       # Google Generative AI client & prompts
│       ├── supabase/              # Supabase Client, Server, & Middleware
│       ├── types/database.ts      # TypeScript types
│       └── utils/currency.ts      # IDR formatters & health status
├── supabase/
│   └── schema.sql                 # PostgreSQL DDL & RLS Policies
├── package.json
└── README.md
```

---

## 🔒 Keamanan & Privasi
- Kunci API Google Gemini disimpan secara aman di Server-Side Route Handlers (`/api/ai/*`) dan tidak pernah terekspos ke browser pengguna.
- Seluruh query data dilindungi oleh Supabase Row Level Security (RLS).

---

## 📄 Lisensi
MoneyAssist 2.0 dikembangkan untuk manajemen keuangan pribadi yang aman dan modern.
