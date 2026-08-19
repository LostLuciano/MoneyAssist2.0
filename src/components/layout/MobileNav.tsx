'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ScanLine,
  Bot,
  Menu,
  X,
  PieChart,
  Target,
  Smartphone,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import clsx from 'clsx';

const mobileNavTabs = [
  {
    name: 'Beranda',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Transaksi',
    href: '/transactions',
    icon: ArrowLeftRight,
  },
  {
    name: 'Scan OCR',
    href: '/ocr-scan',
    icon: ScanLine,
    isAction: true,
  },
  {
    name: 'AI Advisor',
    href: '/ai-assistant',
    icon: Bot,
  },
];

export default function MobileNav({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const secondaryNavItems = [
    { name: 'Anggaran Bulanan', href: '/budgets', icon: PieChart, badge: 'Budget' },
    { name: 'Target Tabungan', href: '/savings', icon: Target, badge: 'Goals' },
    { name: 'Pintasan & Bot', href: '/integrations', icon: Smartphone, badge: 'iOS & Bot' },
  ];

  return (
    <>
      {/* Floating macOS/iOS Liquid Glass Bottom Dock */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
        <nav className="bg-[#0e1424]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-macos-dock px-2 py-1.5 flex items-center justify-around">
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            if (tab.isAction) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center -mt-6 group focus:outline-none"
                >
                  <div className="w-13 h-13 p-1 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30 group-active:scale-90 transition-transform">
                    <div className="w-11 h-11 bg-[#0c101a] rounded-[13px] flex items-center justify-center border border-white/10">
                      <Icon className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1">Scan OCR</span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all active:scale-95',
                  isActive
                    ? 'text-emerald-400 font-bold bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                )}
              >
                <Icon
                  className={clsx(
                    'w-5 h-5 transition-transform',
                    isActive ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'
                  )}
                />
                <span className="text-[10px] mt-0.5">{tab.name}</span>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all active:scale-95"
            aria-label="Buka Menu Lainnya"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] mt-0.5 font-medium">Menu</span>
          </button>
        </nav>
      </div>

      {/* Mobile Slide-Out Sheet / Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Sheet Content */}
          <div className="relative ml-auto w-4/5 max-w-xs bg-[#0c101a]/95 backdrop-blur-2xl border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header with macOS Traffic Lights */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <span className="font-bold text-white text-xs tracking-tight">MoneyAssist 2.0</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white border border-white/5 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">
                  Fitur Tambahan
                </span>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={clsx(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px]',
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/5 text-slate-400 border border-white/5">
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Profile & Logout */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {userEmail ? userEmail[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{userEmail || 'Akun Pengguna'}</p>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Online
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all min-h-[44px] active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
