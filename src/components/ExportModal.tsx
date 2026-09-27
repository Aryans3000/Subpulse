import React from 'react';
import { Subscription, User } from '../types';
import { getMonthlyEquivalent } from '../lib/analytics';
import { DEFAULT_CURRENCY, convertCurrency } from '../lib/currencies';
import { X, Download, FileSpreadsheet, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  activeUser: User;
  activeCurrency?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  activeUser,
  activeCurrency = DEFAULT_CURRENCY,
}) => {
  if (!isOpen) return null;

  const userSubs = subscriptions.filter((s) => s.userId === activeUser.id);

  const generateCsvContent = (): string => {
    const headers = [
      'ID',
      'Name',
      'Provider',
      'Category',
      'Amount',
      'Currency',
      `AmountIn_${activeCurrency}`,
      'BillingCycle',
      `MonthlyNormalized_${activeCurrency}`,
      'RenewalDate',
      'IsTrial',
      'TrialEndDate',
      'Status',
      'PaymentMethod',
      'WebsiteUrl',
      'Notes',
    ];

    const rows = userSubs.map((sub) => [
      `"${sub.id}"`,
      `"${sub.name.replace(/"/g, '""')}"`,
      `"${sub.provider.replace(/"/g, '""')}"`,
      `"${sub.category}"`,
      sub.amount.toFixed(2),
      `"${sub.currency}"`,
      convertCurrency(sub.amount, sub.currency || DEFAULT_CURRENCY, activeCurrency).toFixed(2),
      `"${sub.billingCycle}"`,
      getMonthlyEquivalent(sub.amount, sub.billingCycle, sub.currency, activeCurrency).toFixed(2),
      `"${sub.renewalDate}"`,
      sub.isTrial ? 'TRUE' : 'FALSE',
      `"${sub.trialEndDate || ''}"`,
      `"${sub.status}"`,
      `"${sub.paymentMethod.replace(/"/g, '""')}"`,
      `"${(sub.websiteUrl || '').replace(/"/g, '""')}"`,
      `"${(sub.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanOrg = activeUser.organization.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `subpulse_subscriptions_${cleanOrg}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  const csvPreview = generateCsvContent().split('\n').slice(0, 6).join('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Financial Ledger (CSV)</h3>
              <p className="text-[11px] text-slate-400">
                Filtered strictly for {activeUser.organization} ({userSubs.length} records)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Download a standard accounting-compatible CSV file containing all recurring subscriptions, annualized figures, normalized monthly burns, renewal schedules, and payment methods.
          </p>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 block">Preview Output:</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed max-h-40">
              {csvPreview}
              {'\n...'}
            </pre>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between">
            <span className="text-slate-400">Total Rows to Export:</span>
            <span className="font-mono text-white font-semibold">{userSubs.length} subscriptions</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
