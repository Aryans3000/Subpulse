import React, { useState, useMemo } from 'react';
import { Subscription, SubscriptionCategory, BillingCycle } from '../types';
import { getDaysRemaining, getMonthlyEquivalent } from '../lib/analytics';
import { formatMoney, formatConvertedMoney, DEFAULT_CURRENCY } from '../lib/currencies';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Copy,
  Clock,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (subId: string) => void;
  onTogglePause: (subId: string) => void;
  onDuplicate: (sub: Subscription) => void;
  onOpenAddModal: () => void;
  activeCurrency?: string;
}

type FilterStatus = 'ALL' | 'ACTIVE' | 'PAUSED' | 'TRIAL' | 'EXPIRING_SOON';
type SortField = 'renewalDate' | 'amount' | 'name';

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onTogglePause,
  onDuplicate,
  onOpenAddModal,
  activeCurrency = DEFAULT_CURRENCY,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('renewalDate');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);

  // Extract unique categories in current list
  const uniqueCategories = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.category));
    return Array.from(set).sort();
  }, [subscriptions]);

  // Filter and sort items
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Search
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          sub.name.toLowerCase().includes(query) ||
          sub.provider.toLowerCase().includes(query) ||
          sub.category.toLowerCase().includes(query) ||
          (sub.notes && sub.notes.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        // Category filter
        if (categoryFilter !== 'ALL' && sub.category !== categoryFilter) return false;

        // Status filter
        const daysLeft = getDaysRemaining(sub.renewalDate);
        const trialDaysLeft = sub.isTrial && sub.trialEndDate ? getDaysRemaining(sub.trialEndDate) : 999;

        if (statusFilter === 'ACTIVE') return sub.status === 'ACTIVE';
        if (statusFilter === 'PAUSED') return sub.status === 'PAUSED';
        if (statusFilter === 'TRIAL') return sub.status === 'TRIAL' || sub.isTrial;
        if (statusFilter === 'EXPIRING_SOON') {
          return (
            (sub.status === 'ACTIVE' && daysLeft >= 0 && daysLeft <= 3) ||
            (sub.isTrial && trialDaysLeft >= 0 && trialDaysLeft <= 3)
          );
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortField === 'amount') {
          diff =
            getMonthlyEquivalent(a.amount, a.billingCycle, a.currency, activeCurrency) -
            getMonthlyEquivalent(b.amount, b.billingCycle, b.currency, activeCurrency);
        } else if (sortField === 'renewalDate') {
          diff = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
        }
        return sortAsc ? diff : -diff;
      });
  }, [subscriptions, searchQuery, statusFilter, categoryFilter, sortField, sortAsc, activeCurrency]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/60">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subscriptions, vendors, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
        </div>

        {/* Right: Functional Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status segmented controls */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900/50 rounded-lg border border-slate-800/80">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'ACTIVE', label: 'Active' },
                { id: 'EXPIRING_SOON', label: 'Due ≤ 3d' },
                { id: 'TRIAL', label: 'Trials' },
                { id: 'PAUSED', label: 'Paused' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown (only shown when multiple categories exist) */}
          {uniqueCategories.length > 1 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* High Density Data Table with calm breathing room */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-900/20">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800/60 text-[11px] font-medium text-slate-400 bg-slate-900/40 uppercase tracking-wider">
              <th className="py-3 px-5">
                <button
                  onClick={() => handleSortToggle('name')}
                  className="flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
                >
                  Subscription & Vendor
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-5">Category</th>
              <th className="py-3 px-5 text-right">
                <button
                  onClick={() => handleSortToggle('amount')}
                  className="flex items-center gap-1.5 ml-auto hover:text-slate-200 focus:outline-none"
                >
                  Cost & Cycle
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-5">
                <button
                  onClick={() => handleSortToggle('renewalDate')}
                  className="flex items-center gap-1.5 hover:text-slate-200 focus:outline-none"
                >
                  Next Renewal
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-3 px-5 hidden lg:table-cell">Payment Method</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-medium text-slate-400">No matching subscriptions found</p>
                    <p className="text-[11px] text-slate-500">
                      Try adjusting your search criteria or add your first recurring subscription.
                    </p>
                    <button
                      onClick={onOpenAddModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subscription
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => {
                const daysRemaining = getDaysRemaining(sub.renewalDate);
                const trialDays = sub.isTrial && sub.trialEndDate ? getDaysRemaining(sub.trialEndDate) : null;
                const monthlyBurn = getMonthlyEquivalent(sub.amount, sub.billingCycle, sub.currency, activeCurrency);

                const isNearRenewal = daysRemaining >= 0 && daysRemaining <= 3 && sub.status === 'ACTIVE';
                const isNearTrialEnd = trialDays !== null && trialDays >= 0 && trialDays <= 3;
                const isPaused = sub.status === 'PAUSED';

                return (
                  <tr
                    key={sub.id}
                    className={`group transition-colors hover:bg-slate-800/40 ${
                      isPaused ? 'opacity-60 bg-slate-950/20' : ''
                    }`}
                  >
                    {/* Subscription & Vendor */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center font-medium text-xs text-indigo-300 shrink-0 font-mono">
                          {sub.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200 group-hover:text-white flex items-center gap-1.5 truncate">
                            <span className="truncate">{sub.name}</span>
                            {sub.websiteUrl && (
                              <a
                                href={sub.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-slate-300"
                                title="Visit provider site"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {sub.provider}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category (Zero-Pill clean unboxed text) */}
                    <td className="py-3.5 px-5">
                      <div className="text-slate-300 font-normal">{sub.category}</div>
                      {sub.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={sub.notes}>
                          {sub.notes}
                        </div>
                      )}
                    </td>

                    {/* Cost & Cycle (Tabular Numerals) */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="font-mono tabular-nums font-medium text-white">
                        {formatConvertedMoney(sub.amount, sub.currency, activeCurrency)}
                        <span className="text-[11px] font-normal text-slate-400 ml-1">
                          /{sub.billingCycle.toLowerCase()}
                        </span>
                      </div>
                      {sub.billingCycle !== 'MONTHLY' && (
                        <div className="text-[11px] font-mono tabular-nums text-slate-400">
                          ≈ {formatMoney(monthlyBurn, activeCurrency)}/mo
                        </div>
                      )}
                    </td>

                    {/* Renewal / Trial Date */}
                    <td className="py-3.5 px-5">
                      {isPaused ? (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Pause className="w-3.5 h-3.5" />
                          <span>Paused</span>
                        </div>
                      ) : sub.isTrial ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {trialDays === 0
                                ? 'Trial ends today'
                                : trialDays! < 0
                                ? 'Trial expired'
                                : `Trial: ${trialDays}d left`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Ends {sub.trialEndDate}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div
                            className={`flex items-center gap-1.5 font-medium ${
                              isNearRenewal ? 'text-amber-400' : 'text-slate-300'
                            }`}
                          >
                            <span>
                              {daysRemaining === 0
                                ? 'Renews today'
                                : daysRemaining === 1
                                ? 'Renews tomorrow'
                                : daysRemaining > 0
                                ? `Renews in ${daysRemaining}d`
                                : `Overdue (${Math.abs(daysRemaining)}d)`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {sub.renewalDate}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-5 hidden lg:table-cell">
                      <div className="text-slate-300 truncate max-w-[180px]">
                        {sub.paymentMethod}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                        {/* Pause / Resume */}
                        <button
                          onClick={() => onTogglePause(sub.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isPaused
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                          title={isPaused ? 'Resume subscription' : 'Pause subscription'}
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicate(sub)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Duplicate subscription"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEdit(sub)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Edit subscription"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setSubToDelete(sub)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete subscription"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {subToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Delete Subscription</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{subToDelete.name}</strong> ({formatConvertedMoney(subToDelete.amount, subToDelete.currency, activeCurrency)}/{subToDelete.billingCycle.toLowerCase()})? This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setSubToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(subToDelete.id);
                  setSubToDelete(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
