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
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import TrendChart from '@/components/dashboard/TrendChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import TransactionModal from '@/components/transactions/TransactionModal';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Category, SavingsGoal } from '@/lib/types/database';
import { formatIDR, evaluateFinancialHealth } from '@/lib/utils/currency';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      setCategories(catData || []);

      // 2. Fetch User Real Transactions
      if (user) {
        const { data: txData } = await supabase
          .from('transactions')
          .select('*, categories(*)')
          .order('transaction_date', { ascending: false })
          .limit(20);

        setTransactions(txData || []);

        // 3. Fetch User Real Savings Goals
        const { data: goalsData } = await supabase
          .from('savings_goals')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        setSavingsGoals(goalsData || []);
      } else {
        const local = localStorage.getItem('moneyassist_demo_tx');
        setTransactions(local ? JSON.parse(local) : []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute real stats
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

  // Generate real monthly trend data for last 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  const currentMonthIdx = now.getMonth();

  const trendData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), currentMonthIdx - (5 - i), 1);
    const mName = monthNames[d.getMonth()];
    const mYear = d.getFullYear();
    const mNum = String(d.getMonth() + 1).padStart(2, '0');
    const prefix = `${mYear}-${mNum}`;

    const monthIncome = transactions
      .filter((t) => t.type === 'income' && t.transaction_date.startsWith(prefix))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthExpense = transactions
      .filter((t) => t.type === 'expense' && t.transaction_date.startsWith(prefix))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month: i === 5 ? 'Bulan Ini' : mName,
      income: monthIncome,
      expense: monthExpense,
    };
  });

  return (
    <div className="space-y-6">
      <Header
        title="Ringkasan Finansial"
        subtitle="Analisis arus kas cerdas & kontrol finansial macOS"
        financialStatus={health.status}
        onTransactionAdded={fetchData}
        categories={categories}
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-7xl mx-auto">
        {/* macOS Quick Action Bento Banner */}
        <div className="p-4 sm:p-5 rounded-2xl macos-card border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">AI Financial Engine 2.0</h3>
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ekstrak nota kilat via Gemini Vision atau konsultasikan pembagian budget 50/30/20.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Link
              href="/ocr-scan"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 whitespace-nowrap min-h-[38px]"
            >
              <ScanLine className="w-4 h-4 text-cyan-400" />
              <span>Scan Nota</span>
            </Link>
            <Link
              href="/ai-assistant"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95 whitespace-nowrap min-h-[38px]"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>AI Advisor</span>
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap min-h-[38px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sisa Saldo"
            value={formatIDR(balance)}
            subtitle="Saldo aktif keseluruhan"
            icon={Wallet}
            accentColor="emerald"
          />
          <StatCard
            title="Total Pemasukan"
            value={formatIDR(totalIncome)}
            subtitle={`${transactions.filter(t => t.type === 'income').length} transaksi masuk`}
            icon={ArrowDownRight}
            accentColor="blue"
          />
          <StatCard
            title="Total Pengeluaran"
            value={formatIDR(totalExpense)}
            subtitle={`${transactions.filter(t => t.type === 'expense').length} transaksi keluar`}
            icon={ArrowUpRight}
            accentColor="rose"
          />
          <StatCard
            title="Skor Finansial"
            value={`${health.score} / 100`}
            subtitle={health.status}
            icon={ShieldCheck}
            accentColor={
              health.status === 'Critical Status'
                ? 'rose'
                : health.status === 'Elevated Spending'
                ? 'amber'
                : 'emerald'
            }
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Bar Chart (2 cols) */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl macos-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <TrendingUp className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
                  Tren Arus Kas Bulanan
                </h3>
                <p className="text-[11px] text-slate-400">Komparasi pemasukan vs pengeluaran riil</p>
              </div>
            </div>
            <TrendChart data={trendData} />
          </div>

          {/* Expense Breakdown Pie (1 col) */}
          <div className="p-5 sm:p-6 rounded-2xl macos-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <PieIcon className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
                  Distribusi Pengeluaran
                </h3>
                <p className="text-[11px] text-slate-400">Proporsi per kategori</p>
              </div>
            </div>
            <ExpenseChart data={pieData} />
          </div>
        </div>

        {/* Bottom Row: Recent Transactions & Savings Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions (2 cols) */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl macos-card space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Transaksi Terbaru</h3>
                <p className="text-[11px] text-slate-400">Riwayat transaksi aktif</p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <RecentTransactions transactions={transactions.slice(0, 6)} />
          </div>

          {/* Savings Goals Widget (1 col) */}
          <div className="p-5 sm:p-6 rounded-2xl macos-card space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                    <Target className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
                    Target Tabungan
                  </h3>
                  <p className="text-[11px] text-slate-400">Progres rencana impianmu</p>
                </div>
                <Link
                  href="/savings"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Detail
                </Link>
              </div>

              {savingsGoals.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <Target className="w-7 h-7 mx-auto text-slate-600" />
                  <p className="font-semibold text-slate-300">Belum ada target tabungan</p>
                  <p className="text-[11px] text-slate-500">Buat target dana darurat atau liburan Anda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savingsGoals.map((g) => {
                    const percentage = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                    return (
                      <div key={g.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white truncate max-w-[150px]">{g.name}</span>
                          <span className="text-emerald-400 font-bold font-mono">{percentage}%</span>
                        </div>
                        <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{formatIDR(g.current_amount)}</span>
                          <span>Target: {formatIDR(g.target_amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/savings"
              className="w-full py-2.5 text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all block mt-3 active:scale-95"
            >
              + Buat Target Baru
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
