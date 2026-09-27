import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ChevronDown, ShieldCheck, UserCheck, Plus, Building2, LogOut } from 'lucide-react';

interface TenantSwitcherProps {
  users: User[];
  activeUser: User;
  onSelectUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onLogout: () => void;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  users,
  activeUser,
  onSelectUser,
  onAddUser,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      organization: newOrgName.trim() || `${newUserName.trim()}'s Workspace`,
      role: 'Founder',
      currencyPreference: 'INR',
    };

    onAddUser(newUser);
    onSelectUser(newUser);
    setNewUserName('');
    setNewUserEmail('');
    setNewOrgName('');
    setShowAddForm(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        title="Switch multi-tenant isolated account"
      >
        <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
          {activeUser.name.charAt(0)}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-medium text-slate-200 leading-tight flex items-center gap-1.5">
            <span className="truncate max-w-[120px]">{activeUser.organization}</span>
            <span title="Row-Level Isolation Active" className="inline-flex">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-[130px] font-mono">
            {activeUser.email}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-slate-200 backdrop-blur-xl">
          <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Workspaces & Profiles
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Row-level isolated workspace session. Each profile maintains its own expense inventory and alert logs.
            </p>
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto">
            {users.map((u) => {
              const isSelected = u.id === activeUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200'
                      : 'hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0 font-mono">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5 truncate">
                        <span>{u.name}</span>
                        {u.role && <span className="text-[10px] text-slate-400">· {u.role}</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{u.organization}</div>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Account
            </button>
          ) : (
            <form onSubmit={handleCreateUser} className="mt-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="text-[11px] font-medium text-slate-300">Quick Account Setup</div>
              <input
                type="email"
                placeholder="Email Address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Name (Optional)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-1.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Create & Switch
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Log out option */}
          <div className="pt-2 mt-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Log out from workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
