export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'QUARTERLY' | 'WEEKLY';

export type SubscriptionCategory = string;

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'TRIAL' | 'CANCELLED';

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: string; // ISO date string YYYY-MM-DD
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  isTrial: boolean;
  trialEndDate?: string | null; // ISO date string YYYY-MM-DD
  paymentMethod: string; // e.g. "Visa •••• 4242", "Corporate Amex", "PayPal"
  websiteUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  organization: string;
  avatarUrl?: string;
  role?: string;
  currencyPreference: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  recipientEmail: string;
  alertType: 'RENEWAL_3_DAYS' | 'TRIAL_ENDING';
  renewalCycleDate: string; // Key for idempotency (e.g. "sub_123_2026-09-29")
  amount: number;
  currency: string;
  sentAt: string;
  status: 'DELIVERED' | 'FAILED' | 'SIMULATED';
  resendMessageId?: string;
}

export interface SubscriptionFormData {
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: string;
  category: SubscriptionCategory;
  isTrial: boolean;
  trialEndDate?: string;
  paymentMethod: string;
  websiteUrl?: string;
  notes?: string;
  status: SubscriptionStatus;
}

export interface MonthlySpendingPoint {
  month: string;
  total: number;
  activeCount: number;
}

export interface CategoryBreakdown {
  category: SubscriptionCategory;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}
