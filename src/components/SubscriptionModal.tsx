import React, { useState, useEffect } from 'react';
import { Subscription, SubscriptionFormData, BillingCycle, SubscriptionCategory } from '../types';
import { CURRENCIES, PAYMENT_METHODS } from '../lib/constants';
import { getCurrencyInfo, formatMoney, DEFAULT_CURRENCY } from '../lib/currencies';
import { validateSubscriptionForm } from '../lib/validation';
import { getMonthlyEquivalent } from '../lib/analytics';
import { detectCategory } from '../lib/categories';
import { X, Calendar, DollarSign, ExternalLink, ShieldAlert, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubscriptionFormData, editId?: string) => void;
  subscriptionToEdit?: Subscription | null;
  defaultCurrency?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subscriptionToEdit,
  defaultCurrency = DEFAULT_CURRENCY,
}) => {
  const isEditing = Boolean(subscriptionToEdit);

  // Form State
  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    provider: '',
    amount: defaultCurrency === 'INR' ? 1999 : 25,
    currency: defaultCurrency,
    billingCycle: 'MONTHLY',
    renewalDate: new Date('2026-09-26T12:00:00Z').toISOString().split('T')[0],
    category: '',
    isTrial: false,
    trialEndDate: '',
    paymentMethod: PAYMENT_METHODS[0],
    websiteUrl: '',
    notes: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (subscriptionToEdit) {
      setFormData({
        name: subscriptionToEdit.name,
        provider: subscriptionToEdit.provider,
        amount: subscriptionToEdit.amount,
        currency: subscriptionToEdit.currency || defaultCurrency,
        billingCycle: subscriptionToEdit.billingCycle,
        renewalDate: subscriptionToEdit.renewalDate,
        category: subscriptionToEdit.category,
        isTrial: subscriptionToEdit.isTrial,
        trialEndDate: subscriptionToEdit.trialEndDate || '',
        paymentMethod: subscriptionToEdit.paymentMethod,
        websiteUrl: subscriptionToEdit.websiteUrl || '',
        notes: subscriptionToEdit.notes || '',
        status: subscriptionToEdit.status,
      });
      setErrors({});
      setTouched({});
    } else {
      // Default new subscription date is 14 days from now
      const defaultDate = new Date('2026-09-26T12:00:00Z');
      defaultDate.setDate(defaultDate.getDate() + 14);

      setFormData({
        name: '',
        provider: '',
        amount: defaultCurrency === 'INR' ? 2499 : 29,
        currency: defaultCurrency,
        billingCycle: 'MONTHLY',
        renewalDate: defaultDate.toISOString().split('T')[0],
        category: '',
        isTrial: false,
        trialEndDate: '',
        paymentMethod: PAYMENT_METHODS[0],
        websiteUrl: '',
        notes: '',
        status: 'ACTIVE',
      });
      setErrors({});
      setTouched({});
    }
  }, [subscriptionToEdit, isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const currencyInfo = getCurrencyInfo(formData.currency || defaultCurrency);

  const handleChange = (field: keyof SubscriptionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Inline validation check
    const validation = validateSubscriptionForm({ ...formData, [field]: value });
    setErrors(validation.errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    const cleanProvider = formData.provider.trim() || cleanName;
    const cleanCategory = formData.category.trim() || detectCategory(cleanName);

    const submissionData: SubscriptionFormData = {
      ...formData,
      name: cleanName,
      provider: cleanProvider,
      category: cleanCategory,
    };

    const validation = validateSubscriptionForm(submissionData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({
        name: true,
        amount: true,
        billingCycle: true,
        renewalDate: true,
        trialEndDate: true,
      });
      return;
    }

    onSave(submissionData, subscriptionToEdit?.id);
    onClose();
  };

  const monthlyEquiv = getMonthlyEquivalent(Number(formData.amount) || 0, formData.billingCycle);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {isEditing ? `Edit ${subscriptionToEdit?.name}` : 'Add Recurring Subscription'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strict multi-tenant isolation will assign this to the active workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subscription Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Subscription Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Write the name of the subscription (e.g. Netflix, Spotify, ChatGPT, Amazon Prime, Gym...)"
              value={formData.name}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('name', val);
                if (!touched.provider || !formData.provider) {
                  setFormData((prev) => ({ ...prev, name: val, provider: val }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
                errors.name && touched.name
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-indigo-500'
              }`}
            />
            {errors.name && touched.name && (
              <span className="text-[11px] text-rose-400 mt-1 block">{errors.name}</span>
            )}
          </div>

          {/* Amount, Currency & Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Amount <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                  {currencyInfo.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={formData.currency === 'INR' ? '1999.00' : '20.00'}
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border text-xs text-slate-200 font-mono tabular-nums focus:outline-none transition-colors ${
                    errors.amount && touched.amount
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.amount && touched.amount && (
                <span className="text-[11px] text-rose-400 mt-1 block">{errors.amount}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} {c.code === 'INR' ? '★ Default' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Billing Cycle <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => handleChange('billingCycle', e.target.value as BillingCycle)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
          </div>

          {/* Normalized calculation callout */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Normalized Burn Rate:</span>
            <span className="font-mono tabular-nums font-semibold text-indigo-300">
              ≈ {formatMoney(monthlyEquiv, formData.currency)} / month
              {formData.billingCycle !== 'MONTHLY' && (
                <span className="text-slate-500 text-[11px] ml-1">
                  ({formatMoney(Number(formData.amount) || 0, formData.currency)} billed {formData.billingCycle.toLowerCase()})
                </span>
              )}
            </span>
          </div>

          {/* Renewal Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Next Renewal Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.renewalDate}
                onChange={(e) => handleChange('renewalDate', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg bg-slate-950 border text-xs text-slate-200 focus:outline-none transition-colors ${
                  errors.renewalDate && touched.renewalDate
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
              {errors.renewalDate && touched.renewalDate && (
                <span className="text-[11px] text-rose-400 mt-1 block">{errors.renewalDate}</span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Category / Tag
                </label>
                <span className="text-[10px] text-slate-500">Optional</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Entertainment, Software, Health"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Free Trial Toggle */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Active Free Trial?</span>
                <span className="text-[11px] text-slate-400">
                  Enable to trigger automated email alert before the trial ends and card is charged.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.isTrial}
                onChange={(e) => handleChange('isTrial', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {formData.isTrial && (
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-medium text-amber-300 mb-1">
                  Trial Expiration Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.trialEndDate}
                  onChange={(e) => handleChange('trialEndDate', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-xs text-slate-200 focus:outline-none transition-colors ${
                    errors.trialEndDate && touched.trialEndDate
                      ? 'border-rose-500'
                      : 'border-slate-700 focus:border-amber-400'
                  }`}
                />
                {errors.trialEndDate && touched.trialEndDate && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{errors.trialEndDate}</span>
                )}
              </div>
            )}
          </div>

          {/* Payment Method & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Website URL</label>
              <input
                type="url"
                placeholder="https://provider.com/billing"
                value={formData.websiteUrl}
                onChange={(e) => handleChange('websiteUrl', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Purpose</label>
            <textarea
              rows={2}
              placeholder="e.g. 5 team seats, used for backend logging and alerts..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
