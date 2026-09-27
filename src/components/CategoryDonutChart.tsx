import React, { useState } from 'react';
import { CategoryBreakdown } from '../types';
import { formatMoney, DEFAULT_CURRENCY } from '../lib/currencies';

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
  totalBurn: number;
  currency?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  totalBurn,
  currency = DEFAULT_CURRENCY,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0 || totalBurn === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
        <p>No active subscriptions in this workspace.</p>
        <span className="text-[11px] text-slate-600 mt-1">Add a recurring expense to see category distribution.</span>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 200;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const slices = data.map((item, index) => {
    const fraction = totalBurn > 0 ? item.amount / totalBurn : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">
      {/* Donut graphic */}
      <div className="relative shrink-0 w-[200px] h-[200px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.index;
            return (
              <circle
                key={slice.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            {activeItem ? activeItem.category : 'Monthly Burn'}
          </span>
          <span className="text-xl font-bold text-white font-mono tabular-nums leading-tight">
            {formatMoney(activeItem ? activeItem.amount : totalBurn, currency, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-400">
            {activeItem ? `${activeItem.percentage}% of total` : '/ month'}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.category}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                isHovered ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-900/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-slate-200 font-medium">{item.category}</span>
                <span className="text-[11px] text-slate-400 font-mono">({item.count})</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2 font-mono tabular-nums">
                <span className="font-semibold text-white">
                  {formatMoney(item.amount, currency, { maximumFractionDigits: 0 })}/mo
                </span>
                <span className="text-[11px] text-slate-400 w-8 text-right">{item.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
