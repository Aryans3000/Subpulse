/**
 * Smart category detector & dynamic color resolver for subscriptions
 */

const PALETTE = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#84cc16', // Lime
];

export function getCategoryColor(categoryName: string): string {
  if (!categoryName) return '#64748b';
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function detectCategory(subscriptionName: string): string {
  if (!subscriptionName) return 'General';
  const lower = subscriptionName.toLowerCase();

  if (/netflix|spotify|prime|hotstar|disney|hulu|youtube|hbo|apple tv|audible|crunchyroll|peacock|paramount/i.test(lower)) {
    return 'Entertainment';
  }
  if (/chatgpt|openai|claude|cursor|midjourney|anthropic|copilot|gemini|perplexity|elevenlabs/i.test(lower)) {
    return 'AI & Software';
  }
  if (/aws|gcp|google cloud|azure|vercel|github|gitlab|neon|supabase|cloudflare|digitalocean|heroku|render/i.test(lower)) {
    return 'Cloud & Hosting';
  }
  if (/gym|cult|fitness|health|whoop|strava|headspace|calm|myfitnesspal/i.test(lower)) {
    return 'Health & Fitness';
  }
  if (/notion|slack|zoom|linear|asana|jira|workspace|trello|figma|canva|adobe|office|dropbox/i.test(lower)) {
    return 'Productivity & Office';
  }
  if (/swiggy|zomato|uber|ola|blinkit|zepto|instamart/i.test(lower)) {
    return 'Food & Delivery';
  }
  if (/broadband|airtel|jio|wifi|electricity|water|utility/i.test(lower)) {
    return 'Utilities';
  }

  return 'General';
}
