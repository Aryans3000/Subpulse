import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_CURRENCIES, CurrencyConfig, getCurrencyInfo } from '../lib/currencies';
import { ChevronDown, Coins, Check, ArrowRightLeft } from 'lucide-react';

interface CurrencySelectorProps {
  activeCurrency: string;
  onSelectCurrency: (currencyCode: string) => void;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  activeCurrency,
  onSelectCurrency,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentInfo = getCurrencyInfo(activeCurrency);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs font-mono"
        title="Select display & default currency (Default: INR ₹)"
      >
        <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
          {currentInfo.symbol}
        </div>
        <span className="font-semibold text-slate-200">{currentInfo.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              Currency Settings
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Default is <strong className="text-emerald-300">Indian Rupees (INR ₹)</strong>. Switches dashboard metrics and new subscriptions.
            </p>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto pr-0.5">
            {SUPPORTED_CURRENCIES.map((curr) => {
              const isSelected = curr.code.toUpperCase() === activeCurrency.toUpperCase();
              return (
                <button
                  key={curr.code}
                  onClick={() => {
                    onSelectCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
                      : 'hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 font-mono">
                      {curr.symbol}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5 truncate">
                        <span>{curr.name}</span>
                        {curr.code === 'INR' && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {curr.code} ({curr.symbol})
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
