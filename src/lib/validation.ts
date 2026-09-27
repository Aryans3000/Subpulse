import { BillingCycle, SubscriptionCategory, SubscriptionFormData } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSubscriptionForm(data: Partial<SubscriptionFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Please write the name of the subscription';
  }

  if (data.amount === undefined || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!data.billingCycle) {
    errors.billingCycle = 'Please select a valid billing cycle';
  }

  if (!data.renewalDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.renewalDate)) {
    errors.renewalDate = 'Please select a valid renewal date (YYYY-MM-DD)';
  }

  if (data.isTrial) {
    if (!data.trialEndDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.trialEndDate)) {
      errors.trialEndDate = 'Trial end date is required when marked as Free Trial';
    }
  }

  if (data.websiteUrl && data.websiteUrl.trim() !== '') {
    try {
      new URL(data.websiteUrl);
    } catch {
      errors.websiteUrl = 'Please provide a valid URL (e.g., https://example.com)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
