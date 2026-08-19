'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Trash2,
  X,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/client';
import { formatIDR, formatDateID } from '@/lib/utils/currency';
import { SavingsGoal } from '@/lib/types/database';
import confetti from 'canvas-confetti';

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('500000');

  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDate, setNewDate] = useState('2026-12-31');

  const supabase = createClient();

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('savings_goals')
          .select('*')
          .order('created_at', { ascending: false });
        setGoals(data || []);
      } else {
        setGoals([]);
      }
    } catch (err) {
      console.error('Error fetching savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal || !depositAmount) return;

    const amount = Number(depositAmount);
    const updatedAmount = Number(activeGoal.current_amount) + amount;

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({
          current_amount: updatedAmount,
          status: updatedAmount >= Number(activeGoal.target_amount) ? 'completed' : 'active',
        })
        .eq('id', activeGoal.id);

      if (error) throw error;

      if (updatedAmount >= Number(activeGoal.target_amount)) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setShowDepositModal(false);
      fetchGoals();
    } catch (err: any) {
      alert('Gagal menambah tabungan: ' + err.message);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('savings_goals').insert([
          {
            user_id: user.id,
            name: newName.trim(),
            target_amount: Number(newTarget),
            current_amount: 0,
            target_date: newDate || null,
            color: '#10b981',
          },
        ]);
        if (error) throw error;
      }
      setShowAddModal(false);
      setNewName('');
      setNewTarget('');
      fetchGoals();
    } catch (err: any) {
      alert('Gagal membuat target: ' + err.message);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
      fetchGoals();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);

  return (
    <div className="space-y-6">
      <Header
        title="Target Tabungan (Savings Goals)"
        subtitle="Rencanakan target tabungan impian, dana darurat, dan investasi"
      />

      <div className="px-4 sm:px-6 space-y-6 max-w-6xl mx-auto">
        {/* macOS Summary Banner */}
        <div className="p-5 rounded-2xl macos-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Tabungan Terkumpul
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono mt-1">
              {formatIDR(totalSaved)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400 font-sans">
                / {formatIDR(totalTarget)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {goals.length > 0
                ? `Akumulasi progres dari ${goals.length} target tabungan aktif.`
                : 'Belum ada target tabungan yang dibuat.'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[38px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Target Baru</span>
          </button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl macos-card space-y-2">
            <Target className="w-9 h-9 mx-auto text-slate-600 mb-1" />
            <p className="font-bold text-white text-sm">Belum ada target tabungan aktif</p>
            <p className="text-slate-400 max-w-sm mx-auto text-[11px]">
              Tentukan target impian Anda seperti Dana Darurat, Liburan, atau Gadget Impian untuk memotivasi tabungan Anda.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Target Tabungan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g) => {
              const percentage = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100));
              const isCompleted = percentage >= 100;

              return (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl macos-card flex flex-col justify-between space-y-4 relative group select-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border inline-block ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/5 text-slate-400 border-white/10'
                          }`}
                        >
                          {isCompleted ? '✓ Tercapai' : 'Sedang Berjalan'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5 tracking-tight truncate max-w-[180px]">
                          {g.name}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all rounded"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatIDR(g.current_amount)}
                        </span>
                        <span className="font-bold text-emerald-400 font-mono text-xs">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.08] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Target: {formatIDR(g.target_amount)}</span>
                        {g.target_date && <span>Target: {formatDateID(g.target_date, 'dd MMM yyyy')}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveGoal(g);
                      setShowDepositModal(true);
                    }}
                    className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nabung ke Target Ini</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
          <div className="macos-window rounded-2xl w-full max-w-md shadow-macos-window overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-xs font-bold text-white tracking-tight ml-2">Buat Target Tabungan Baru</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nama Rencana Tabungan
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Dana Darurat 3 Bulan, Liburan Jepang"
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 min-h-[38px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Contoh: 10000000"
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500/60 min-h-[38px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Waktu (Opsional)
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0e1424] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 min-h-[38px]"
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
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none">
          <div className="macos-window rounded-2xl w-full max-w-sm shadow-macos-window overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="text-xs font-bold text-white tracking-tight ml-2">Nabung ke "{activeGoal.name}"</span>
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nominal yang Ditabung (Rp)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500/60 min-h-[38px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-white/[0.05] hover:bg-white/[0.08] transition-all min-h-[36px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[36px]"
                >
                  Tambahkan Tabungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
