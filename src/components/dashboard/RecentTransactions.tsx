'use client';

import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Store,
  Gift,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { Transaction } from '@/lib/types/database';
import { formatIDR, formatDateID } from '@/lib/utils/currency';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const iconMap: Record<string, any> = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Store,
  Gift,
  Coins,
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        <p className="font-medium text-slate-400">Belum ada transaksi tercatat.</p>
        <p className="text-slate-600 mt-1">Mulai catat transaksi pertama Anda dengan tombol Catat di atas.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const categoryIconName = tx.categories?.icon || (isIncome ? 'Wallet' : 'ShoppingBag');
        const Icon = iconMap[categoryIconName] || (isIncome ? ArrowDownRight : ArrowUpRight);
        const categoryColor = tx.categories?.color || (isIncome ? '#30d158' : '#ff453a');

        return (
          <div
            key={tx.id}
            className="py-3 px-2.5 flex items-center justify-between hover:bg-white/[0.04] rounded-xl transition-all select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  borderColor: `${categoryColor}30`,
                  color: categoryColor,
                }}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                  <span className="truncate">{tx.categories?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formatDateID(tx.transaction_date, 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <div
                className={`text-xs sm:text-sm font-bold font-mono tracking-tight ${
                  isIncome ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{tx.payment_method || 'Cash'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
