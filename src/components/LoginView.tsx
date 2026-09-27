import React, { useState } from 'react';
import { User } from '../types';
import { Mail, ArrowRight, ShieldCheck, UserCheck, Plus, Sparkles } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showNewAccountForm, setShowNewAccountForm] = useState(users.length === 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    // Check if user already exists
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (name.trim() && name.trim() !== existing.name) {
        onLogin({ ...existing, name: name.trim() });
      } else {
        onLogin(existing);
      }
      return;
    }

    // Auto-derive clean display name if not specified
    const derivedName =
      name.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: derivedName,
      email: cleanEmail,
      organization: `${derivedName}'s Workspace`,
      role: 'Owner',
      currencyPreference: 'INR',
    };

    onLogin(newUser);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-600/20 mb-1">
            SP
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Sign In to SubPulse
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Recurring subscription intelligence & automated renewal alerts
          </p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-5">
          {/* If there are existing saved accounts on this device and user hasn't toggled new form */}
          {users.length > 0 && !showNewAccountForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                <span className="font-medium text-slate-300">Saved Accounts</span>
                <span className="text-[11px] text-slate-500 font-mono">1-click access</span>
              </div>

              <div className="space-y-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onLogin(u)}
                    className="w-full p-3.5 rounded-xl text-left bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all group flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-medium text-xs text-indigo-300 shrink-0 font-mono">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-200 group-hover:text-white truncate">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAccountForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use another email address</span>
                </button>
              </div>
            </div>
          ) : (
            /* Minimal single-step login form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Your Name
                  </label>
                  <span className="text-[11px] text-slate-500">Optional</span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aryan Singh"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!email.trim()}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to SubPulse</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAccountForm(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 pt-1 transition-colors"
                >
                  ← Back to saved accounts
                </button>
              )}
            </form>
          )}

          {/* Clean trust badge */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Passwordless & Private</span>
            </div>
            <span className="text-slate-400 font-mono">INR ₹ default</span>
          </div>
        </div>
      </div>
    </div>
  );
};
