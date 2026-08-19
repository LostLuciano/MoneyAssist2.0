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
          title: 'Critical Status (Defisit)',
          icon: AlertCircle,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
        };
      case 'Elevated Spending':
        return {
          title: 'Elevated Spending (Peringatan)',
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
        };
      default:
        return {
          title: 'Controlled Spending (Terkendali & Sehat)',
          icon: ShieldCheck,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
        };
    }
  };

  return (
    <div id="audit-demo" className="w-full max-w-4xl mx-auto p-6 md:p-8 rounded-3xl glass-panel border border-emerald-500/20 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              AI Financial Health Audit (Guest Mode)
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Gemini Powered
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Coba simulasi audit kondisi finansial Anda secara instan tanpa perlu mendaftar terlebih dahulu.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 text-xs">
          <span
            className={`font-semibold flex items-center gap-1.5 ${
              step >= 1 ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
              1
            </span>
            Data Finansial
          </span>
          <span
            className={`font-semibold flex items-center gap-1.5 ${
              step >= 2 ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
              2
            </span>
            Pos Pengeluaran
          </span>
          <span
            className={`font-semibold flex items-center gap-1.5 ${
              step >= 3 ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
              3
            </span>
            Hasil Audit AI
          </span>
        </div>

        {/* Step 1: Input Nominal */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Estimasi Pemasukan Bulanan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Format: {formatIDR(Number(income) || 0)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Estimasi Pengeluaran Bulanan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={expense}
                    onChange={(e) => setExpense(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Format: {formatIDR(Number(expense) || 0)}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <span>Lanjut ke Pos Pengeluaran</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-3">
                Pilih kategori pengeluaran terbesar yang sering memakan anggaranmu:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {categoriesList.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {cat} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Kembali
              </button>
              <button
                onClick={handleRunAudit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Finansialmu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Jalankan Audit AI Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && auditResult && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Status card */}
            {(() => {
              const display = getStatusDisplay(auditResult.status);
              const StatusIcon = display.icon;
              return (
                <div
                  className={`p-5 rounded-2xl border ${display.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-black/20">
                      <StatusIcon className={`w-7 h-7 ${display.color}`} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Status Finansial Terdeteksi
                      </span>
                      <h4 className={`text-lg font-bold ${display.color}`}>{display.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{auditResult.summary}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-slate-950/40 px-4 py-2.5 rounded-xl border border-white/5">
                    <span className="text-[11px] text-slate-400 block">Skor Kesehatan Finansial</span>
                    <span className="text-2xl font-black text-white">{auditResult.score} / 100</span>
                  </div>
                </div>
              );
            })()}

            {/* Recommendations */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 space-y-3">
              <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Rekomendasi Aksi dari MoneyAssist AI
              </h5>
              <div className="space-y-2">
                {auditResult.recommendations?.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion CTA */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h5 className="text-sm font-bold text-white">Simpan & Pantau Keuangan Otomatis di 2.0</h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar sekarang untuk sinkronisasi otomatis, OCR struk belanja, dan budget tracker.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Ulangi Audit
                </button>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  <span>Daftar Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
