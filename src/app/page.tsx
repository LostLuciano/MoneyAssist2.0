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
  Smartphone,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-white selection:bg-emerald-500 selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-14 md:pt-24 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-emerald-600/15 to-cyan-500/15 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full macos-card border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>MoneyAssist 2.0 • Antarmuka macOS & Supabase PostgreSQL</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Kelola Cashflow Cerdas Bersama{' '}
          <span className="gradient-text">Asisten Keuangan AI</span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Platform finansial pribadi dengan estetika macOS modern, integrasi Gemini Vision OCR untuk membaca nota belanja, dan sinkronisasi real-time Supabase.
        </p>

        {/* Hero Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all min-h-[44px]"
          >
            <span>Mulai Sekarang — Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#audit-demo"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl macos-card hover:bg-white/10 text-white font-semibold text-xs transition-all active:scale-95 min-h-[44px]"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Coba Demo AI Audit</span>
          </a>
        </div>
      </section>

      {/* Guest Mode AI Financial Health Audit Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <GuestAuditModal />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
            Fitur Utama Versi 2.0
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dirancang Bersih, Responsif & Mengutamakan Privasi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl macos-card space-y-3.5 select-none">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
              <ScanLine className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">OCR Nota & Struk Instan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Foto struk belanja minimarket atau restoran. AI Gemini Vision otomatis mengekstrak nominal, nama toko, tanggal, dan rincian item.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl macos-card space-y-3.5 select-none">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 flex items-center justify-center">
              <Bot className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">AI Advisor Interaktif</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dapatkan rekomendasi alokasi 50/30/20, strategi evaluasi defisit, hingga mencatat transaksi langsung dari percakapan santai.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl macos-card space-y-3.5 select-none">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Supabase PostgreSQL & RLS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Data transaksi, target tabungan, dan budget Anda terlindungi dengan Row Level Security langsung di level database.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl macos-card space-y-3.5 select-none">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center">
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Batas Anggaran Bulanan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pasang limit anggaran per kategori pengeluaran dan pantau indikator visual peringatan overspending sebelum saldo menipis.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl macos-card space-y-3.5 select-none">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 flex items-center justify-center">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Target Tabungan Impian</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pantau progres target dana darurat, liburan, atau pembelian aset dengan progress bar dan perayaan saat target tercapai.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl macos-card space-y-3.5 select-none">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">Pintasan iOS & Bot Telegram</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catat pengeluaran instan lewat 2x ketuk punggung iPhone (Back Tap) atau chat langsung ke bot Telegram asisten finansial.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.06] py-8 text-center text-xs text-slate-400 select-none">
        <p>© 2026 MoneyAssist 2.0. Clean macOS Architecture with Supabase & Google Gemini AI.</p>
      </footer>
    </div>
  );
}
