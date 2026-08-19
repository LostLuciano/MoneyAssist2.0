'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatIDR } from '@/lib/utils/currency';

interface ExpenseChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

const APPLE_PALETTE = [
  '#30d158', // Emerald Mint
  '#0a84ff', // Royal Blue
  '#ff9f0a', // Amber Orange
  '#bf5af2', // Purple
  '#ff453a', // Red
  '#64d2ff', // Cyan
  '#ffd60a', // Yellow
  '#ac8e68', // Brown
];

export default function ExpenseChart({ data }: ExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
        <p className="font-medium text-slate-400">Belum ada data pengeluaran bulan ini.</p>
        <p className="text-slate-600 mt-1">Catat transaksi untuk melihat diagram kategori.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-[#0c101a]/95 backdrop-blur-xl border border-white/15 p-2.5 rounded-xl shadow-macos-dropdown text-xs">
          <p className="font-semibold text-white">{item.name}</p>
          <p className="text-emerald-400 font-bold font-mono mt-0.5">{formatIDR(item.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || APPLE_PALETTE[index % APPLE_PALETTE.length]}
                stroke="#0e1424"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-[11px] font-medium text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
