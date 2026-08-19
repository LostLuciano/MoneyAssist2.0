'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { formatIDR } from '@/lib/utils/currency';
import confetti from 'canvas-confetti';

export default function GuestAuditModal() {
  const [step, setStep] = useState<number>(1);
  const [income, setIncome] = useState<string>('8000000');
  const [expense, setExpense] = useState<string>('5500000');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Makanan & Minuman',
    'Belanja & Kebutuhan',
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const categoriesList = [
    'Makanan & Minuman',
    'Transportasi & Bensin',
    'Belanja & Kebutuhan',
    'Tagihan / Listrik / Wi-Fi',
    'Cicilan & Hutang',
    'Hiburan & Hangout',
    'Kesehatan',
  ];

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: Number(income),
          expense: Number(expense),
          topCategories: selectedCategories,
        }),
      });
      const data = await res.json();
      setAuditResult(data);
      setStep(3);

      if (data.status === 'Controlled Spending') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Critical Status':
        return {
          title: 'Status Defisit (Critical)',
          icon: AlertCircle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/15 border-rose-500/25',
        };
      case 'Elevated Spending':
        return {
          title: 'Pengeluaran Waspada (Elevated)',
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/15 border-amber-500/25',
        };
      default:
        return {
          title: 'Cashflow Sehat (Controlled)',
          icon: ShieldCheck,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15 border-emerald-500/25',
        };
    }
  };

  return (
    <div id="audit-demo" className="w-full max-w-4xl mx-auto">
      {/* macOS Window Frame */}
      <div className="rounded-3xl macos-window shadow-macos-window overflow-hidden border border-white/15 select-none">
        {/* macOS Titlebar */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <span className="text-xs font-bold text-white tracking-tight ml-2">
              MoneyAssist — Simulasi AI Audit Keuangan
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mode Demo Instan</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Step 1: Nominal Cashflow */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-lg mx-auto space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Ketahui Skor Kesehatan Finansial Anda
                </h3>
                <p className="text-xs text-slate-400">
                  Masukkan estimasi pemasukan dan pengeluaran bulanan Anda untuk dianalisis oleh AI.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pemasukan Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pengeluaran Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={expense}
                    onChange={(e) => setExpense(e.target.value)}
                    className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[40px]"
                >
                  <span>Lanjut: Pilih Kategori</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Kategori Terbanyak */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-lg mx-auto space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Kategori Pengeluaran Terbanyak
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih kategori yang paling banyak menguras anggaran Anda setiap bulannya.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 min-h-[36px] ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.07]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all min-h-[38px]"
                >
                  Kembali
                </button>
                <button
                  onClick={handleRunAudit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[38px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Cashflow...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Jalankan AI Audit Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Hasil Audit */}
          {step === 3 && auditResult && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              {(() => {
                const statusInfo = getStatusDisplay(auditResult.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div className={`p-5 rounded-2xl border ${statusInfo.bg} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Hasil Evaluasi AI
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">{statusInfo.title}</h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Skor Finansial
                      </span>
                      <h4 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                        {auditResult.score || 85} / 100
                      </h4>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Analisis Alokasi Anggaran
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {auditResult.analysis ||
                      'Pengeluaran Anda berada di kisaran wajar. Pertahankan rasio kebutuhan dasar di bawah 50% dan alokasikan minimal 20% untuk tabungan/investasi.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    Rekomendasi AI Langkah Berikutnya
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {auditResult.recommendation ||
                      'Gunakan fitur batas anggaran bulanan untuk mencegah lonjakan pengeluaran dan simpan struk belanja rutin via OCR scanner.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  ← Coba Simulasi Angka Lain
                </button>

                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all min-h-[40px]"
                >
                  <span>Daftar Akun & Simpan Hasil Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
