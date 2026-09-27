import { SubscriptionCategory, User, Subscription } from '../types';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from './currencies';

export const CATEGORIES: { name: SubscriptionCategory; color: string; description: string }[] = [
  { name: 'DevTools & Infra', color: '#3b82f6', description: 'GitHub, Vercel, Docker, Datadog' },
  { name: 'AI & Machine Learning', color: '#8b5cf6', description: 'OpenAI, Anthropic, Midjourney, Cursor' },
  { name: 'Cloud & Hosting', color: '#06b6d4', description: 'AWS, Supabase, Neon, Cloudflare' },
  { name: 'Productivity & Office', color: '#10b981', description: 'Notion, Slack, Linear, Google Workspace' },
  { name: 'Design & Creative', color: '#f59e0b', description: 'Figma, Adobe CC, Framer' },
  { name: 'Marketing & Growth', color: '#ec4899', description: 'PostHog, Customer.io, HubSpot, SEMrush' },
  { name: 'Security & Compliance', color: '#6366f1', description: '1Password, Vanta, Snyk' },
  { name: 'Communication & Sales', color: '#14b8a6', description: 'Loom, Zoom, Apollo.io' },
  { name: 'Finance & Accounting', color: '#84cc16', description: 'QuickBooks, Stripe Billing, Razorpay' },
  { name: 'Entertainment & Media', color: '#f43f5e', description: 'Spotify, Audible, YouTube Premium' },
];

export const CURRENCIES = SUPPORTED_CURRENCIES;

export const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'UPI Autopay',
  'Net Banking',
  'PayPal',
  'Apple Pay / App Store',
  'Google Play Billing',
  'Bank Transfer',
  'Cash / Other',
];

// No default preset/test accounts
export const PRESET_USERS: User[] = [];

// No default test subscriptions
export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

