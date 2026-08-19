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
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import clsx from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Utama',
    items: [
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
        name: 'Anggaran Bulanan',
        href: '/budgets',
        icon: PieChart,
      },
      {
        name: 'Target Tabungan',
        href: '/savings',
        icon: Target,
      },
    ],
  },
  {
    title: 'AI & Automasi',
    items: [
      {
        name: 'Scan Struk OCR',
        href: '/ocr-scan',
        icon: ScanLine,
        badge: 'Gemini',
      },
      {
        name: 'AI Advisor',
        href: '/ai-assistant',
        icon: Bot,
        badge: 'AI',
      },
      {
        name: 'Pintasan & Bot',
        href: '/integrations',
        icon: Smartphone,
        badge: 'iOS',
      },
    ],
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
    <aside className="hidden md:flex w-64 border-r border-white/[0.08] bg-[#0c101a]/95 backdrop-blur-2xl flex-col justify-between shrink-0 min-h-screen select-none">
      <div>
        {/* macOS Window Controls + App Branding */}
        <div className="h-16 px-5 flex items-center gap-3.5 border-b border-white/[0.06]">
          {/* Traffic Lights */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <span className="macos-traffic-light macos-traffic-close hover:opacity-80 cursor-pointer" title="Tutup" />
            <span className="macos-traffic-light macos-traffic-minimize hover:opacity-80 cursor-pointer" title="Minimalkan" />
            <span className="macos-traffic-light macos-traffic-maximize hover:opacity-80 cursor-pointer" title="Perbesar" />
          </div>

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 group">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-xs text-white tracking-tight truncate flex items-center gap-1.5">
              <span>MoneyAssist</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
                2.0
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative',
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={clsx(
                          'w-4 h-4 transition-colors shrink-0',
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={clsx(
                          'text-[9px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0',
                          isActive
                            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/5 group-hover:text-slate-200'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User Session & macOS Control Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-2 bg-[#090d16]/40">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0">
            <div className="w-full h-full bg-[#0c101a] rounded-[6px] flex items-center justify-center font-bold text-[10px] text-emerald-400">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {userEmail || 'Pengguna'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Online</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all macos-btn-press"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
