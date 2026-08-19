'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR } from '@/lib/utils/currency';
import { Category } from '@/lib/types/database';

interface BudgetItem {
  id: string;
  category_id: string;
  category: string;
  limit: number;
  spent: number;
  color: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newLimit, setNewLimit] = useState('1000000');

  const supabase = createClient();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'expense');
      setCategories(catData || []);
      if (catData && catData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catData[0].id);
      }

      if (user) {
        // Fetch budgets
        const { data: bData } = await supabase
          .from('budgets')
          .select('*, categories(*)')
          .eq('month', currentMonth)
          .eq('year', currentYear);

        // Fetch transactions for this month to calculate spent per category
        const { data: txData } = await supabase
          .from('transactions')
          .select('category_id, amount, type')
          .eq('type', 'expense');

        const spentMap: Record<string, number> = {};
        txData?.forEach((tx) => {
          if (tx.category_id) {
            spentMap[tx.category_id] = (spentMap[tx.category_id] || 0) + Number(tx.amount);
          }
        });

        const mapped: BudgetItem[] = (bData || []).map((b) => ({
          id: b.id,
          category_id: b.category_id,
          category: b.categories?.name || 'Kategori',
          limit: Number(b.amount_limit),
          spent: spentMap[b.category_id] || 0,
          color: b.categories?.color || '#10b981',
        }));

        setBudgets(mapped);
      } else {
        setBudgets([]);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimit || Number(newLimit) <= 0 || !selectedCategoryId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('budgets').upsert([
          {
            user_id: user.id,
            category_id: selectedCategoryId,
            month: currentMonth,
            year: currentYear,
            amount_limit: Number(newLimit),
          },
        ]);
        if (error) throw error;
      }
      setShowAddModal(false);
      fetchBudgets();
    } catch (err: any) {
      alert('Gagal menyimpan anggaran: ' + err.message);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Hapus anggaran kategori ini?')) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      fetchBudgets();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-6">
      <Header
        title="Anggaran Bulanan"
        subtitle="Pantau batas alokasi pengeluaran per kategori agar tidak overspending"
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-6xl mx-auto">
        {/* Summary Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Alokasi Anggaran Bulan Ini
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {formatIDR(totalSpent)}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {formatIDR(totalBudget)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {totalBudget > 0
                ? `Telah terpakai ${((totalSpent / totalBudget) * 100).toFixed(0)}% dari total batas limit.`
                : 'Belum ada batas anggaran yang diatur.'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Set Anggaran Kategori</span>
          </button>
        </div>

        {/* Budget Items Grid */}
        {budgets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm glass-panel rounded-3xl border border-white/5 space-y-3">
            <PieChart className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-white">Belum ada anggaran yang diatur bulan ini</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Atur batas limit bulanan untuk kategori pengeluaran seperti Makanan, Transportasi, atau Belanja agar pengeluaran tetap terkontrol.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggaran Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const percentage = Math.min(100, Math.round((b.spent / b.limit) * 100));
              const isOver = b.spent > b.limit;
              const isWarning = percentage >= 80 && !isOver;

              return (
                <div
                  key={b.id}
                  className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          isOver
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isOver ? 'Over Budget' : `${percentage}%`}
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all"
                        title="Hapus Anggaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isOver
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Terpakai: <strong className="text-white">{formatIDR(b.spent)}</strong></span>
                    <span>Limit: <strong className="text-white">{formatIDR(b.limit)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Set Anggaran Kategori</h3>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Kategori Pengeluaran
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Batas Limit Bulanan (Rp)
                </label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
