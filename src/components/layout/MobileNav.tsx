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
  ChevronRight,
  ShieldCheck,
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
      {/* 1. Sleek Frosted Glass Mobile Bottom Tab Bar (Fixed at bottom on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/90 backdrop-blur-xl border-t border-white/10 px-3 py-2">
        <div className="flex items-center justify-around">
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            if (tab.isAction) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center -mt-5 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-transform">
                    <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-400" />
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
                  'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
                )}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400')} />
                <span className="text-[10px] mt-1">{tab.name}</span>
              </Link>
            );
          })}

          {/* More Menu Drawer Trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] mt-1 font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* 2. Mobile Slide-Out Drawer for Secondary Navigation */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-xs bg-[#0b0f19] border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5">
                    <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <span className="font-bold text-white text-sm">MoneyAssist 2.0</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-3 py-1">
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
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {item.badge}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Profile & Logout */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {userEmail ? userEmail[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{userEmail || 'Akun Pengguna'}</p>
                  <p className="text-[10px] text-emerald-400">Online</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all"
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
