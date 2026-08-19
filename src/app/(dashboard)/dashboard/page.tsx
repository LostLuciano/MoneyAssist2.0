'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  ScanLine,
  Bot,
  Plus,
  ArrowRight,
  TrendingUp,
  Target,
  Sparkles,
  PieChart as PieIcon,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import TrendChart from '@/components/dashboard/TrendChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import TransactionModal from '@/components/transactions/TransactionModal';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Category, Profile } from '@/lib/types/database';
import { formatIDR, evaluateFinancialHealth } from '@/lib/utils/currency';

const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#ef4444', is_system: true, user_id: null, created_at: '' },
  { id: '2', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#f97316', is_system: true, user_id: null, created_at: '' },
  { id: '3', name: 'Belanja & Kebutuhan', type: 'expense', icon: 'ShoppingBag', color: '#f59e0b', is_system: true, user_id: null, created_at: '' },
  { id: '4', name: 'Tagihan & Utilitas', type: 'expense', icon: 'Receipt', color: '#8b5cf6', is_system: true, user_id: null, created_at: '' },
  { id: '5', name: 'Gaji Utama', type: 'income', icon: 'Wallet', color: '#10b981', is_system: true, user_id: null, created_at: '' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'user-1',
    category_id: '5',
    type: 'income',
    amount: 8500000,
    description: 'Gaji Bulanan',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'Transfer Bank',
    receipt_url: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: MOCK_CATEGORIES[4],
  },
  {
    id: 'tx-2',
    user_id: 'user-1',
    category_id: '1',
    type: 'expense',
    amount: 350000,
    description: 'Makan Malam Resto & Kopi',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'QRIS',
    receipt_url: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: MOCK_CATEGORIES[0],
  },
  {
    id: 'tx-3',
    user_id: 'user-1',
    category_id: '4',
    type: 'expense',
    amount: 750000,
    description: 'Tagihan Listrik PLN & Wi-Fi',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'Transfer Bank',
    receipt_url: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: MOCK_CATEGORIES[3],
  },
  {
    id: 'tx-4',
    user_id: 'user-1',
    category_id: '3',
    type: 'expense',
    amount: 600000,
    description: 'Belanja Bulanan Supermarket',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'Kartu Debit',
    receipt_url: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: MOCK_CATEGORIES[2],
  },
];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      const loadedCategories = catData && catData.length > 0 ? catData : MOCK_CATEGORIES;
      setCategories(loadedCategories);

      // Fetch Transactions
      if (user) {
        const { data: txData } = await supabase
          .from('transactions')
          .select('*, categories(*)')
          .order('transaction_date', { ascending: false })
          .limit(20);

        if (txData && txData.length > 0) {
          setTransactions(txData);
        } else {
          setTransactions(INITIAL_TRANSACTIONS);
        }
      } else {
        const local = localStorage.getItem('moneyassist_demo_tx');
        if (local) {
          setTransactions(JSON.parse(local));
        } else {
          setTransactions(INITIAL_TRANSACTIONS);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setTransactions(INITIAL_TRANSACTIONS);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute stats
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const health = evaluateFinancialHealth(totalIncome, totalExpense);

  // Category breakdown for chart
  const expenseByCategory: Record<string, { value: number; color: string }> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const name = t.categories?.name || 'Lainnya';
      const color = t.categories?.color || '#64748b';
      if (!expenseByCategory[name]) {
        expenseByCategory[name] = { value: 0, color };
      }
      expenseByCategory[name].value += Number(t.amount);
    });

  const pieData = Object.entries(expenseByCategory).map(([name, item]) => ({
    name,
    value: item.value,
    color: item.color,
  }));

  // Trend data mock
  const trendData = [
    { month: 'Jan', income: 7800000, expense: 5200000 },
    { month: 'Feb', income: 8000000, expense: 5800000 },
    { month: 'Mar', income: 8200000, expense: 6100000 },
    { month: 'Apr', income: 8500000, expense: 5400000 },
    { month: 'Mei', income: 9000000, expense: 6300000 },
    { month: 'Bulan Ini', income: totalIncome, expense: totalExpense },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard Keuangan"
        subtitle="Ringkasan arus kas, status audit AI, dan pencatatan cepat 2.0"
        financialStatus={health.status}
        onTransactionAdded={fetchData}
        categories={categories}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Quick Actions Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-emerald-950/30 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Fitur AI 2.0 Siap Digunakan</h3>
              <p className="text-xs text-slate-400">
                Pindai nota/struk atau tanyakan strategi hemat ke asisten AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/ocr-scan"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <ScanLine className="w-4 h-4 text-cyan-400" />
              <span>Scan Nota (OCR)</span>
            </Link>
            <Link
              href="/ai-assistant"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>AI Advisor Chat</span>
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sisa Saldo"
            value={formatIDR(balance)}
            subtitle="Saldo aktif bulan ini"
            icon={Wallet}
            accentColor="emerald"
            trend={{ value: '+12.4%', isPositive: true }}
          />
          <StatCard
            title="Total Pemasukan"
            value={formatIDR(totalIncome)}
            subtitle="Pemasukan tercatat"
            icon={ArrowDownRight}
            accentColor="blue"
            trend={{ value: '+8.1%', isPositive: true }}
          />
          <StatCard
            title="Total Pengeluaran"
            value={formatIDR(totalExpense)}
            subtitle="Pengeluaran tercatat"
            icon={ArrowUpRight}
            accentColor="rose"
            trend={{ value: '-3.2%', isPositive: false }}
          />
          <StatCard
            title="Kesehatan Finansial"
            value={`${health.score} / 100`}
            subtitle={health.status}
            icon={ShieldCheck}
            accentColor={health.status === 'Critical Status' ? 'rose' : health.status === 'Elevated Spending' ? 'amber' : 'emerald'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Bar Chart (2 cols) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Tren Arus Kas Bulanan
                </h3>
                <p className="text-xs text-slate-400">Komparasi pemasukan vs pengeluaran</p>
              </div>
            </div>
            <TrendChart data={trendData} />
          </div>

          {/* Expense Breakdown Pie (1 col) */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  Proporsi Pengeluaran
                </h3>
                <p className="text-xs text-slate-400">Distribusi per kategori</p>
              </div>
            </div>
            <ExpenseChart data={pieData} />
          </div>
        </div>

        {/* Bottom Row: Recent Transactions & Savings Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions (2 cols) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Transaksi Terbaru</h3>
                <p className="text-xs text-slate-400">Riwayat pencatatan terakhir</p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Lihat Semua
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <RecentTransactions transactions={transactions.slice(0, 5)} />
          </div>

          {/* Savings Goals Widget (1 col) */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Target Tabungan
                  </h3>
                  <p className="text-xs text-slate-400">Progress tabungan impianmu</p>
                </div>
                <Link
                  href="/savings"
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Detail
                </Link>
              </div>

              {/* Sample Target Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Dana Darurat 6 Bulan</span>
                  <span className="text-emerald-400 font-bold">65%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full w-[65%]"></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Terkumpul: {formatIDR(19500000)}</span>
                  <span>Target: {formatIDR(30000000)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Liburan Akhir Tahun</span>
                  <span className="text-cyan-400 font-bold">40%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-2 rounded-full w-[40%]"></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Terkumpul: {formatIDR(4000000)}</span>
                  <span>Target: {formatIDR(10000000)}</span>
                </div>
              </div>
            </div>

            <Link
              href="/savings"
              className="w-full py-2.5 text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all block mt-2"
            >
              + Tambah Target Baru
            </Link>
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchData();
        }}
        categories={categories}
      />
    </div>
  );
}
