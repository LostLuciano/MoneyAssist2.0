'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, PieChart, Bot, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0c101a]/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand with macOS traffic lights & icon */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 pr-2 border-r border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          </div>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0c101a] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">MoneyAssist</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                2.0
              </span>
            </div>
          </Link>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">
            Fitur Utama
          </a>
          <a href="#audit-demo" className="hover:text-white transition-colors">
            AI Financial Audit
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Supabase Security
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/5 transition-all min-h-[36px] flex items-center"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/25 border border-emerald-400/30 min-h-[36px]"
          >
            <span>Mulai Gratis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
