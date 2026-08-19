'use client';

import Link from 'next/link';
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
      <div className="p-8 text-center text-slate-500 text-sm">
        <p>Belum ada transaksi tercatat.</p>
        <p className="text-xs text-slate-600 mt-1">Mulai catat transaksi pertama Anda dengan tombol di atas.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const categoryIconName = tx.categories?.icon || (isIncome ? 'Wallet' : 'ShoppingBag');
        const Icon = iconMap[categoryIconName] || (isIncome ? ArrowDownRight : ArrowUpRight);
        const categoryColor = tx.categories?.color || (isIncome ? '#10b981' : '#ef4444');

        return (
          <div
            key={tx.id}
            className="py-3.5 px-2 flex items-center justify-between hover:bg-slate-800/30 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  borderColor: `${categoryColor}30`,
                  color: categoryColor,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span>{tx.categories?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formatDateID(tx.transaction_date, 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div
                className={`text-sm font-bold ${
                  isIncome ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isIncome ? '+' : '-'} {formatIDR(tx.amount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{tx.payment_method || 'Cash'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
