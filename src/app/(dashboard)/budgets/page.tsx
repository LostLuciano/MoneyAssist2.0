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
  X,
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
        const { data: bData } = await supabase
          .from('budgets')
          .select('*, categories(*)')
          .eq('month', currentMonth)
          .eq('year', currentYear);

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
        subtitle="Batas limit alokasi pengeluaran per kategori & pencegahan overspending"
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-6xl mx-auto">
        {/* macOS Summary Banner */}
        <div className="p-5 rounded-2xl macos-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Anggaran Bulan Ini
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono mt-1">
              {formatIDR(totalSpent)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400 font-sans">
                / {formatIDR(totalBudget)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {totalBudget > 0
                ? `Telah terpakai ${((totalSpent / totalBudget) * 100).toFixed(0)}% dari total limit anggaran.`
                : 'Belum ada batas anggaran yang diatur.'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Set Anggaran Kategori</span>
          </button>
        </div>

        {/* Budget Items Grid */}
        {budgets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl macos-card space-y-2">
            <PieChart className="w-9 h-9 mx-auto text-slate-600 mb-1" />
            <p className="font-bold text-white text-sm">Belum ada anggaran yang diatur</p>
            <p className="text-slate-400 max-w-sm mx-auto text-[11px]">
              Atur batas limit bulanan untuk kategori Makanan, Transportasi, atau Belanja agar pengeluaran tetap terkontrol.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Anggaran</span>
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
                  className="p-5 rounded-2xl macos-card space-y-3 relative group select-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-white tracking-tight">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                          isOver
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/25'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                        }`}
                      >
                        {isOver ? 'Over Budget' : `${percentage}%`}
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all rounded"
                        title="Hapus Anggaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-white/[0.08] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOver
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (b.spent / b.limit) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Terpakai: <strong className="text-white font-bold">{formatIDR(b.spent)}</strong></span>
                    <span>Limit: <strong className="text-white font-bold">{formatIDR(b.limit)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* macOS Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
          <div className="macos-window rounded-2xl w-full max-w-md shadow-macos-window overflow-hidden">
            {/* Titlebar with Traffic Lights */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-xs font-bold text-white tracking-tight ml-2">Set Anggaran Kategori</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBudget} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Pilih Kategori Pengeluaran
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0e1424] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 min-h-[38px]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0e1424]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Batas Limit Bulanan (Rp)
                </label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500/60 min-h-[38px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-all min-h-[36px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[36px]"
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
