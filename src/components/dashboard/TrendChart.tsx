'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCompactIDR, formatIDR } from '@/lib/utils/currency';

interface TrendChartProps {
  data: {
    month: string;
    income: number;
    expense: number;
  }[];
}

export default function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
        <p className="font-medium text-slate-400">Belum ada riwayat tren bulanan.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0c101a]/95 backdrop-blur-xl border border-white/15 p-3 rounded-xl shadow-macos-dropdown text-xs space-y-1.5 min-w-[140px]">
          <p className="font-semibold text-white border-b border-white/10 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-slate-400 capitalize">{entry.name}:</span>
              <span
                className={`font-bold font-mono ${
                  entry.name === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatIDR(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickFormatter={(val) => formatCompactIDR(val)}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(value) => <span className="text-[11px] font-medium text-slate-300">{value}</span>}
          />
          <Bar dataKey="income" name="Pemasukan" fill="#30d158" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Pengeluaran" fill="#ff453a" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
