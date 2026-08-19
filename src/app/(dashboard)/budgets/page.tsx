'use client';

import { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { formatIDR } from '@/lib/utils/currency';

interface BudgetItem {
  id: string;
  category: string;
  limit: number;
  spent: number;
  color: string;
}

const INITIAL_BUDGETS: BudgetItem[] = [
  { id: 'b-1', category: 'Makanan & Minuman', limit: 2500000, spent: 1850000, color: '#ef4444' },
  { id: 'b-2', category: 'Transportasi & Bensin', limit: 1000000, spent: 650000, color: '#f97316' },
  { id: 'b-3', category: 'Belanja & Kebutuhan', limit: 1500000, spent: 1620000, color: '#f59e0b' },
  { id: 'b-4', category: 'Tagihan & Utilitas', limit: 1200000, spent: 750000, color: '#8b5cf6' },
  { id: 'b-5', category: 'Hiburan & Hangout', limit: 800000, spent: 400000, color: '#ec4899' },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>(INITIAL_BUDGETS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Kesehatan');
  const [newLimit, setNewLimit] = useState('500000');

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimit || Number(newLimit) <= 0) return;

    setBudgets([
      ...budgets,
      {
        id: 'b-' + Date.now(),
        category: newCategory,
        limit: Number(newLimit),
        spent: 0,
        color: '#06b6d4',
      },
    ]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Anggaran Bulanan"
        subtitle="Pantau batas alokasi pengeluaran per kategori agar tidak overspending"
      />

      <div className="px-6 space-y-6 max-w-6xl mx-auto">
        {/* Summary Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Alokasi Anggaran Bulan Ini
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {formatIDR(totalSpent)} <span className="text-sm font-normal text-slate-400">/ {formatIDR(totalBudget)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Telah terpakai {((totalSpent / totalBudget) * 100).toFixed(0)}% dari total batas limit.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const percentage = Math.min(100, Math.round((b.spent / b.limit) * 100));
            const isOver = b.spent > b.limit;
            const isWarning = percentage >= 80 && !isOver;

            return (
              <div
                key={b.id}
                className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{b.category}</span>
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
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Tambah Anggaran Kategori</h3>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
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
