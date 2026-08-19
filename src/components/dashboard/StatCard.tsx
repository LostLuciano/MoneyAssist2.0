import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'emerald' | 'blue' | 'rose' | 'amber' | 'purple';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'emerald',
}: StatCardProps) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/25',
    },
    blue: {
      bg: 'bg-sky-500/15',
      text: 'text-sky-400',
      border: 'border-sky-500/25',
    },
    rose: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/25',
    },
    amber: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/25',
    },
    purple: {
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/25',
    },
  };

  const style = colorMap[accentColor] || colorMap.emerald;

  return (
    <div className="p-5 rounded-2xl macos-card macos-card-interactive flex flex-col justify-between select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={clsx('p-2 rounded-xl border', style.bg, style.text, style.border)}>
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-xs">
          {trend.isNeutral ? (
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          ) : trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span
            className={clsx(
              'font-semibold',
              trend.isNeutral
                ? 'text-slate-400'
                : trend.isPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">vs bulan lalu</span>
        </div>
      )}
    </div>
  );
}
