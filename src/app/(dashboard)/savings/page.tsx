'use client';

import { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { formatIDR, formatDateID } from '@/lib/utils/currency';
import confetti from 'canvas-confetti';

interface GoalItem {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  color: string;
}

const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'g-1',
    name: 'Dana Darurat (6 Bulan)',
    target_amount: 30000000,
    current_amount: 19500000,
    target_date: '2026-12-31',
    color: '#10b981',
  },
  {
    id: 'g-2',
    name: 'Liburan Akhir Tahun ke Jepang',
    target_amount: 15000000,
    current_amount: 6000000,
    target_date: '2026-11-15',
    color: '#06b6d4',
  },
  {
    id: 'g-3',
    name: 'Upgrade Laptop & Setup Kerja',
    target_amount: 18000000,
    current_amount: 18000000,
    target_date: '2026-06-30',
    color: '#8b5cf6',
  },
];

export default function SavingsPage() {
  const [goals, setGoals] = useState<GoalItem[]>(INITIAL_GOALS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState<GoalItem | null>(null);
  const [depositAmount, setDepositAmount] = useState('500000');

  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDate, setNewDate] = useState('2026-12-31');

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal || !depositAmount) return;

    const amount = Number(depositAmount);
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === activeGoal.id) {
          const updated = g.current_amount + amount;
          if (updated >= g.target_amount) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          return { ...g, current_amount: updated };
        }
        return g;
      })
    );

    setShowDepositModal(false);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget) return;

    setGoals([
      ...goals,
      {
        id: 'g-' + Date.now(),
        name: newName,
        target_amount: Number(newTarget),
        current_amount: 0,
        target_date: newDate,
        color: '#10b981',
      },
    ]);
    setShowAddModal(false);
    setNewName('');
    setNewTarget('');
  };

  return (
    <div className="space-y-6">
      <Header
        title="Target Tabungan (Savings Goals)"
        subtitle="Rencanakan dan pantau perkembangan tabungan impian serta dana darurat"
      />

      <div className="px-6 space-y-6 max-w-6xl mx-auto">
        {/* Total Summary */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tabungan Terkumpul
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {formatIDR(totalSaved)}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {formatIDR(totalTarget)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Total akumulasi dari {goals.length} target aktif.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Target Baru</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const percentage = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            const isDone = g.current_amount >= g.target_amount;

            return (
              <div
                key={g.id}
                className="glass-panel p-5 rounded-3xl border border-white/5 flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                        style={{
                          backgroundColor: `${g.color}15`,
                          borderColor: `${g.color}30`,
                          color: g.color,
                        }}
                      >
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{g.name}</h4>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Target: {formatDateID(g.target_date, 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    {isDone && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Tercapai 🎉
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-emerald-400 font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Terkumpul</span>
                      <span className="font-bold text-white">{formatIDR(g.current_amount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Target</span>
                      <span className="font-bold text-slate-300">{formatIDR(g.target_amount)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveGoal(g);
                    setShowDepositModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-white/5 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tabungan</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Setor ke: {activeGoal.name}</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal Tambahan (Rp)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-base font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Simpan Tabungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Buat Target Tabungan Baru</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Target / Impian
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Beli Motor, DP Rumah..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="10000000"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
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
                  Buat Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
