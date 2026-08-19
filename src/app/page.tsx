import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import GuestAuditModal from '@/components/guest/GuestAuditModal';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ScanLine,
  Bot,
  PieChart,
  Target,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-600/20 to-cyan-500/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MoneyAssist 2.0 — Arsitektur Bersih & Supabase Powered</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Kelola Cashflow Cerdas Bersama{' '}
          <span className="gradient-text">Asisten Keuangan AI</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Platform manajemen finansial pribadi modern dengan database PostgreSQL realtime dari
          Supabase, OCR nota cerdas via Gemini Vision, dan audit kesehatan finansial otomatis.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
          >
            <span>Mulai Sekarang — Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#audit-demo"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl glass-panel hover:bg-slate-800/80 border border-white/10 text-white font-bold text-sm transition-all"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Coba Demo AI Audit</span>
          </a>
        </div>
      </section>

      {/* Guest Mode AI Financial Health Audit Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <GuestAuditModal />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">
            Fitur Utama Versi 2.0
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Dirancang Bersih, Aman, dan Mengutamakan Privasi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-7 rounded-3xl border border-white/5 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">OCR Nota / Struk Instan</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cukup upload atau foto struk belanja minimarket/resto. AI Gemini Vision otomatis
              mengekstrak total nominal, merchant, tanggal, dan rincian belanja.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-7 rounded-3xl border border-white/5 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Financial Advisor</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dapatkan rekomendasi alokasi 50/30/20, evaluasi defisit, hingga mencatat transaksi
              secara cepat lewat bahasa percakapan santai.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-7 rounded-3xl border border-white/5 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Supabase PostgreSQL & RLS</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Data transaksi, budget, dan target tabungan Anda terenkripsi dan terisolasi dengan Row
              Level Security di level database.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-7 rounded-3xl border border-white/5 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Budgeting & Overspending Alert</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pasang limit bulanan per kategori dan dapatkan peringatan otomatis sebelum pengeluaran
              melebihi anggaran.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-7 rounded-3xl border border-white/5 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Target Tabungan (Savings Goals)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pantau progres target dana darurat, liburan, atau pembelian aset dengan progress bar
              dan perayaan otomatis saat tercapai.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-7 rounded-3xl border border-white/5 space-y-4 glass-panel-hover">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Guest & Auth Mode</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Coba simulasi audit instan di Guest Mode, lalu login untuk sinkronisasi penuh di semua
              perangkat Anda.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>© 2026 MoneyAssist 2.0. Clean architecture with Supabase & Google Gemini AI.</p>
      </footer>
    </div>
  );
}
