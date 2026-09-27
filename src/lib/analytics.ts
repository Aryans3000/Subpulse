import { Subscription, CategoryBreakdown, MonthlySpendingPoint } from '../types';
import { CATEGORIES } from './constants';
import { getCategoryColor } from './categories';
import { convertCurrency, DEFAULT_CURRENCY } from './currencies';

export function getMonthlyEquivalent(
  amount: number,
  cycle: Subscription['billingCycle'],
  fromCurrency?: string,
  targetCurrency?: string
): number {
  let baseMonthly = 0;
  switch (cycle) {
    case 'WEEKLY':
      baseMonthly = (amount * 52) / 12;
      break;
    case 'MONTHLY':
      baseMonthly = amount;
      break;
    case 'QUARTERLY':
      baseMonthly = amount / 3;
      break;
    case 'YEARLY':
      baseMonthly = amount / 12;
      break;
    default:
      baseMonthly = amount;
  }

  if (fromCurrency && targetCurrency && fromCurrency !== targetCurrency) {
    return convertCurrency(baseMonthly, fromCurrency, targetCurrency);
  }
  return baseMonthly;
}

export function getDaysRemaining(targetDateStr: string, referenceDateStr: string = '2026-09-26'): number {
  const target = new Date(targetDateStr + 'T00:00:00Z');
  const ref = new Date(referenceDateStr + 'T00:00:00Z');
  const diffTime = target.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface MetricSummary {
  monthlyBurn: number;
  annualizedTotal: number;
  activeCount: number;
  pausedCount: number;
  trialsEndingSoonCount: number;
  renewingWithin3DaysCount: number;
  averageCostPerSub: number;
  highestCostSub: Subscription | null;
  currency: string;
}

export function calculateSummaryMetrics(
  subscriptions: Subscription[],
  targetCurrency: string = DEFAULT_CURRENCY
): MetricSummary {
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');
  const pausedSubs = subscriptions.filter((s) => s.status === 'PAUSED');

  let monthlyBurn = 0;
  let renewingWithin3DaysCount = 0;
  let trialsEndingSoonCount = 0;
  let highestCostMonthlyEquiv = 0;
  let highestCostSub: Subscription | null = null;

  activeSubs.forEach((sub) => {
    const monthlyEquiv = getMonthlyEquivalent(
      sub.amount,
      sub.billingCycle,
      sub.currency || DEFAULT_CURRENCY,
      targetCurrency
    );
    monthlyBurn += monthlyEquiv;

    if (monthlyEquiv > highestCostMonthlyEquiv) {
      highestCostMonthlyEquiv = monthlyEquiv;
      highestCostSub = sub;
    }

    const daysUntilRenewal = getDaysRemaining(sub.renewalDate);
    if (daysUntilRenewal >= 0 && daysUntilRenewal <= 3) {
      renewingWithin3DaysCount++;
    }

    if (sub.isTrial && sub.trialEndDate) {
      const daysUntilTrialEnd = getDaysRemaining(sub.trialEndDate);
      if (daysUntilTrialEnd >= 0 && daysUntilTrialEnd <= 3) {
        trialsEndingSoonCount++;
      }
    }
  });

  const annualizedTotal = monthlyBurn * 12;
  const averageCostPerSub = activeSubs.length > 0 ? monthlyBurn / activeSubs.length : 0;

  return {
    monthlyBurn,
    annualizedTotal,
    activeCount: activeSubs.length,
    pausedCount: pausedSubs.length,
    trialsEndingSoonCount,
    renewingWithin3DaysCount,
    averageCostPerSub,
    highestCostSub,
    currency: targetCurrency,
  };
}

export function calculateCategoryBreakdown(
  subscriptions: Subscription[],
  targetCurrency: string = DEFAULT_CURRENCY
): CategoryBreakdown[] {
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');
  const totalBurn = activeSubs.reduce(
    (acc, sub) =>
      acc +
      getMonthlyEquivalent(
        sub.amount,
        sub.billingCycle,
        sub.currency || DEFAULT_CURRENCY,
        targetCurrency
      ),
    0
  );

  const categoryMap = new Map<string, { amount: number; count: number; color: string }>();

  activeSubs.forEach((sub) => {
    const catName = sub.category || 'General';
    const current = categoryMap.get(catName) || {
      amount: 0,
      count: 0,
      color: getCategoryColor(catName),
    };
    const monthlyEquiv = getMonthlyEquivalent(
      sub.amount,
      sub.billingCycle,
      sub.currency || DEFAULT_CURRENCY,
      targetCurrency
    );
    categoryMap.set(catName, {
      amount: current.amount + monthlyEquiv,
      count: current.count + 1,
      color: current.color,
    });
  });

  const breakdown: CategoryBreakdown[] = [];

  categoryMap.forEach((val, catName) => {
    if (val.amount > 0 || val.count > 0) {
      breakdown.push({
        category: catName as any,
        amount: Math.round(val.amount * 100) / 100,
        percentage: totalBurn > 0 ? Math.round((val.amount / totalBurn) * 100) : 0,
        count: val.count,
        color: val.color,
      });
    }
  });

  return breakdown.sort((a, b) => b.amount - a.amount);
}

export function calculate12MonthProjection(
  subscriptions: Subscription[],
  targetCurrency: string = DEFAULT_CURRENCY
): MonthlySpendingPoint[] {
  const monthNames = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const baseBurn = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce(
      (acc, s) =>
        acc +
        getMonthlyEquivalent(
          s.amount,
          s.billingCycle,
          s.currency || DEFAULT_CURRENCY,
          targetCurrency
        ),
      0
    );

  return monthNames.map((month, idx) => {
    let monthTotal = baseBurn;
    // Scaled seasonal adjustments based on base burn
    if (idx === 1) monthTotal += baseBurn * 0.12;
    if (idx === 6) monthTotal += baseBurn * 0.08;
    if (idx === 11) monthTotal -= baseBurn * 0.04;

    return {
      month: `${month} '26`,
      total: Math.round(monthTotal),
      activeCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
    };
  });
}
