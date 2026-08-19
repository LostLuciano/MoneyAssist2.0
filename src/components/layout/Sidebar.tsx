'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ScanLine,
  Bot,
  PieChart,
  Target,
  Smartphone,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import clsx from 'clsx';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Transaksi',
    href: '/transactions',
    icon: ArrowLeftRight,
  },
  {
    name: 'Scan Struk OCR',
    href: '/ocr-scan',
    icon: ScanLine,
    badge: 'Gemini Vision',
  },
  {
    name: 'AI Advisor',
    href: '/ai-assistant',
    icon: Bot,
    badge: 'AI',
  },
  {
    name: 'Anggaran Bulanan',
    href: '/budgets',
    icon: PieChart,
  },
  {
    name: 'Target Tabungan',
    href: '/savings',
    icon: Target,
  },
  {
    name: 'Pintasan & Bot',
    href: '/integrations',
    icon: Smartphone,
    badge: 'iOS & Bot',
  },
];

export default function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0b0f19] flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Logo Section */}
        <div className="h-16 px-6 flex items-center border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                MoneyAssist
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  2.0
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded font-mono font-medium',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User and Logout footer */}
      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">
              {userEmail || 'Pengguna'}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Session
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
