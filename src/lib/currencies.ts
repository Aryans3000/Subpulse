export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  name: string;
  locale: string;
  rateToUSD: number; // e.g. 1 USD = 86.5 INR => rateToUSD = 86.5
}

export const DEFAULT_CURRENCY = 'INR';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'INR',
    symbol: '₹',
    label: 'INR (₹)',
    name: 'Indian Rupee',
    locale: 'en-IN',
    rateToUSD: 86.5,
  },
  {
    code: 'USD',
    symbol: '$',
    label: 'USD ($)',
    name: 'US Dollar',
    locale: 'en-US',
    rateToUSD: 1.0,
  },
  {
    code: 'EUR',
    symbol: '€',
    label: 'EUR (€)',
    name: 'Euro',
    locale: 'de-DE',
    rateToUSD: 0.92,
  },
  {
    code: 'GBP',
    symbol: '£',
    label: 'GBP (£)',
    name: 'British Pound',
    locale: 'en-GB',
    rateToUSD: 0.78,
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    label: 'CAD ($)',
    name: 'Canadian Dollar',
    locale: 'en-CA',
    rateToUSD: 1.38,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    label: 'AUD ($)',
    name: 'Australian Dollar',
    locale: 'en-AU',
    rateToUSD: 1.54,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    label: 'SGD ($)',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    rateToUSD: 1.34,
  },
  {
    code: 'AED',
    symbol: 'AED',
    label: 'AED (د.إ)',
    name: 'UAE Dirham',
    locale: 'ar-AE',
    rateToUSD: 3.67,
  },
  {
    code: 'JPY',
    symbol: '¥',
    label: 'JPY (¥)',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    rateToUSD: 154.0,
  },
];

export function getCurrencyInfo(code: string): CurrencyConfig {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || SUPPORTED_CURRENCIES[0]; // Defaults to INR
}

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (fromCode.toUpperCase() === toCode.toUpperCase()) {
    return amount;
  }
  const fromInfo = getCurrencyInfo(fromCode);
  const toInfo = getCurrencyInfo(toCode);

  // Convert to USD first, then to target currency
  const inUSD = amount / fromInfo.rateToUSD;
  return inUSD * toInfo.rateToUSD;
}

export function formatMoney(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: {
    compact?: boolean;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
): string {
  const info = getCurrencyInfo(currencyCode);
  const maxDigits = options?.maximumFractionDigits ?? (amount % 1 === 0 ? 0 : 2);
  const minDigits = options?.minimumFractionDigits ?? 0;

  try {
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: minDigits,
    }).format(amount);
  } catch {
    return `${info.symbol}${amount.toLocaleString(undefined, {
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: minDigits,
    })}`;
  }
}

/**
 * Converts an amount from its source currency to the target currency and formats it.
 * Guarantees amounts are always presented in the currently selected currency.
 */
export function formatConvertedMoney(
  amount: number,
  fromCurrencyCode: string = DEFAULT_CURRENCY,
  targetCurrencyCode: string = DEFAULT_CURRENCY,
  options?: {
    compact?: boolean;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
): string {
  const converted = convertCurrency(amount, fromCurrencyCode || DEFAULT_CURRENCY, targetCurrencyCode || DEFAULT_CURRENCY);
  return formatMoney(converted, targetCurrencyCode || DEFAULT_CURRENCY, options);
}

