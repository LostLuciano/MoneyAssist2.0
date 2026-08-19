'use client';

import { useState } from 'react';
import { Plus, Sparkles, Bell, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
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
          fullLabel: 'Critical Status (Defisit)',
          icon: AlertCircle,
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      case 'Elevated Spending':
        return {
          label: 'Waspada',
          fullLabel: 'Elevated Spending (Waspada)',
          icon: AlertTriangle,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      default:
        return {
          label: 'Sehat',
          fullLabel: 'Controlled Spending (Sehat)',
          icon: ShieldCheck,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <>
      <header className="h-16 px-4 sm:px-6 border-b border-white/5 bg-[#090d16]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="md:hidden w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Financial status pill */}
          <div
            className={clsx(
              'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              statusBadge.color
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.fullLabel}</span>
          </div>

          {/* Quick Add Transaction Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
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
