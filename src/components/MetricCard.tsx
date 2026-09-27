import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trendText?: string;
  trendType?: 'positive' | 'warning' | 'neutral' | 'info';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  trendText,
  trendType = 'neutral',
  icon,
}) => {
  const getTrendColor = () => {
    switch (trendType) {
      case 'warning':
        return 'text-amber-400';
      case 'positive':
        return 'text-emerald-400';
      case 'info':
        return 'text-indigo-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/60 transition-all duration-200">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span className="font-medium tracking-wide uppercase text-[11px] text-slate-400">{label}</span>
        {icon && <div className="text-slate-400/80">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
          {value}
        </div>
        {subValue && (
          <span className="text-xs text-slate-400 font-normal">{subValue}</span>
        )}
      </div>

      {trendText && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={`text-[12px] font-medium ${getTrendColor()}`}>
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
};

