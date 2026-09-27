import React, { useState } from 'react';
import { MonthlySpendingPoint } from '../types';
import { formatMoney, DEFAULT_CURRENCY } from '../lib/currencies';

interface MonthlyTrendBarChartProps {
  data: MonthlySpendingPoint[];
  currency?: string;
}

export const MonthlyTrendBarChart: React.FC<MonthlyTrendBarChartProps> = ({
  data,
  currency = DEFAULT_CURRENCY,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.total), 100);
  const chartHeight = 160;

  return (
    <div className="relative pt-4 pb-2">
      {/* Tooltip display */}
      <div className="h-6 flex items-center justify-between text-xs mb-2 text-slate-400">
        <span>12-Month Cashflow Projection</span>
        {hoveredIndex !== null ? (
          <span className="font-mono text-indigo-300 font-medium">
            {data[hoveredIndex].month}: {formatMoney(data[hoveredIndex].total, currency, { maximumFractionDigits: 0 })} ({data[hoveredIndex].activeCount} services)
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Hover bar to inspect monthly forecast</span>
        )}
      </div>

      {/* SVG Bar Chart */}
      <div className="w-full flex items-end justify-between gap-1.5 sm:gap-2 h-40 pt-2 border-b border-slate-800">
        {data.map((point, idx) => {
          const heightPercent = Math.max(12, Math.round((point.total / maxVal) * 100));
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={point.month}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
            >
              <div
                className={`w-full max-w-[28px] rounded-t transition-all duration-150 ${
                  isHovered
                    ? 'bg-indigo-400 shadow-lg shadow-indigo-500/25'
                    : 'bg-indigo-600/70 hover:bg-indigo-500/90'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
              <span className="text-[10px] text-slate-400 font-mono mt-2 truncate w-full text-center group-hover:text-slate-200">
                {point.month.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
        <span>Baseline spend</span>
        <span>Includes periodic annual amortizations</span>
      </div>
    </div>
  );
};
