import React from 'react';
import { User } from '../types';
import { TenantSwitcher } from './TenantSwitcher';
import { CurrencySelector } from './CurrencySelector';
import { Plus, Download, LogOut } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'subscriptions' | 'email-engine';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  users: User[];
  activeUser: User | null;
  onSelectUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onLogout: () => void;
  activeCurrency: string;
  onSelectCurrency: (currency: string) => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  renewingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  users,
  activeUser,
  onSelectUser,
  onAddUser,
  onLogout,
  activeCurrency,
  onSelectCurrency,
  onOpenAddModal,
  onOpenExportModal,
  renewingCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('dashboard')}
            className="text-left group flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/90 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-500/10 text-xs tracking-wider">
              SP
            </div>
            <span className="text-base font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              SubPulse
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean text links with serene states) */}
        {activeUser && (
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`transition-colors py-1 relative ${
                activeTab === 'dashboard'
                  ? 'text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
              {activeTab === 'dashboard' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => onTabChange('subscriptions')}
              className={`transition-colors py-1 relative ${
                activeTab === 'subscriptions'
                  ? 'text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Subscriptions
              {activeTab === 'subscriptions' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => onTabChange('email-engine')}
              className={`flex items-center gap-2 transition-colors py-1 relative ${
                activeTab === 'email-engine'
                  ? 'text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Alerts & Cron</span>
              {renewingCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${renewingCount} renewals soon`} />
              )}
              {activeTab === 'email-engine' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          </nav>
        )}

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Currency Selector (INR ₹ Default) */}
          <CurrencySelector
            activeCurrency={activeCurrency}
            onSelectCurrency={onSelectCurrency}
          />

          {activeUser ? (
            <>
              <button
                onClick={onOpenExportModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-colors"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </button>

              <TenantSwitcher
                users={users}
                activeUser={activeUser}
                onSelectUser={onSelectUser}
                onAddUser={onAddUser}
                onLogout={onLogout}
              />

              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </button>

              <button
                onClick={onLogout}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800/80 transition-colors"
                title="Log out from workspace"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile nav bar */}
      {activeUser && (
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-[#090d16] px-2 py-2 text-xs">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-2 py-1 rounded ${activeTab === 'dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Overview
          </button>
          <button
            onClick={() => onTabChange('subscriptions')}
            className={`px-2 py-1 rounded ${activeTab === 'subscriptions' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => onTabChange('email-engine')}
            className={`px-2 py-1 rounded flex items-center gap-1 ${activeTab === 'email-engine' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            <span>Alerts & Cron</span>
            {renewingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>
          <button
            onClick={onLogout}
            className="px-2 py-1 rounded flex items-center gap-1 text-rose-400 hover:text-rose-300"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </header>
  );
};

