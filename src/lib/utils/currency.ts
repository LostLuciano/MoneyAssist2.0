import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Formats a number to Indonesian Rupiah (IDR) format.
 * Example: 150000 -> "Rp 150.000"
 */
export function formatIDR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

/**
 * Format compact IDR for charts/cards
 * Example: 1500000 -> "Rp 1,5 jt"
 */
export function formatCompactIDR(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${amount}`;
}

/**
 * Formats date string to Indonesian localized format
 */
export function formatDateID(dateString: string, pattern: string = 'dd MMMM yyyy'): string {
  try {
    const parsed = parseISO(dateString);
    return format(parsed, pattern, { locale: id });
  } catch {
    return dateString;
  }
}

/**
 * Evaluate financial health status based on expense ratio to income
 */
export function evaluateFinancialHealth(
  income: number,
  expense: number
): {
  status: 'Controlled Spending' | 'Elevated Spending' | 'Critical Status';
  score: number;
  message: string;
  badgeColor: string;
} {
  if (income <= 0) {
    if (expense > 0) {
      return {
        status: 'Critical Status',
        score: 20,
        message: 'Pengeluaran aktif tanpa adanya catatan pemasukan tercatat.',
        badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20',
      };
    }
    return {
      status: 'Controlled Spending',
      score: 75,
      message: 'Belum ada data pemasukan & pengeluaran untuk periode ini.',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };
  }

  const ratio = (expense / income) * 100;

  if (ratio > 100) {
    return {
      status: 'Critical Status',
      score: Math.max(10, Math.round(100 - (ratio - 100))),
      message: `Pengeluaranmu (${ratio.toFixed(0)}%) melebihi total pemasukan bulanan! Defisit keuangan terdeteksi.`,
      badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };
  }

  if (ratio > 70) {
    return {
      status: 'Elevated Spending',
      score: Math.round(100 - (ratio - 50)),
      message: `Pengeluaran mencapai ${ratio.toFixed(0)}% dari pemasukan. Kurangi pos pengeluaran non-primer.`,
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    };
  }

  return {
    status: 'Controlled Spending',
    score: Math.min(100, Math.round(100 - ratio * 0.3)),
    message: `Keuangan sangat sehat! Pengeluaran (${ratio.toFixed(0)}%) terkendali dan memiliki ruang tabungan ideal.`,
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
}
