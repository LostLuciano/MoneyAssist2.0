'use client';

import { useState } from 'react';
import { Plus, Sparkles, ShieldCheck, AlertTriangle, AlertCircle, Command } from 'lucide-react';
import TransactionModal from '@/components/transactions/TransactionModal';
import clsx from 'clsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
  financialStatus?: 'Controlled Spending' | 'Elevated Spending' | 'Critical Status';
  onTransactionAdded?: () => void;
  categories?: any[];
}

export default function Header({
  title,
  subtitle,
  financialStatus = 'Controlled Spending',
  onTransactionAdded,
  categories = [],
}: HeaderProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getStatusBadge = () => {
    switch (financialStatus) {
      case 'Critical Status':
        return {
          label: 'Defisit',
          fullLabel: 'Status Defisit',
          icon: AlertCircle,
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-rose-500/10',
        };
      case 'Elevated Spending':
        return {
          label: 'Waspada',
          fullLabel: 'Pengeluaran Waspada',
          icon: AlertTriangle,
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10',
        };
      default:
        return {
          label: 'Sehat',
          fullLabel: 'Cashflow Sehat',
          icon: ShieldCheck,
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <>
      <header className="h-16 px-4 sm:px-6 border-b border-white/[0.07] bg-[#0c101a]/85 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile macOS Icon / Traffic light hint */}
          <div className="md:hidden flex items-center gap-1.5 pr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate flex items-center gap-2">
              <span>{title}</span>
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-300 truncate max-w-[200px] sm:max-w-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Financial Status Pill */}
          <div
            className={clsx(
              'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all',
              statusBadge.color
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.fullLabel}</span>
          </div>

          {/* macOS Style Quick Add Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 border border-emerald-400/40 macos-btn-press"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Catat Transaksi</span>
            <span className="sm:hidden">Catat</span>
          </button>
        </div>
      </header>

      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          if (onTransactionAdded) onTransactionAdded();
        }}
        categories={categories}
      />
    </>
  );
}
