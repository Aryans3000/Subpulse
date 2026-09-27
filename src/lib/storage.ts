import { Subscription, User, NotificationLog } from '../types';
import { DEFAULT_CURRENCY } from './currencies';

const STORAGE_KEYS = {
  USERS: 'subpulse_users_v4',
  ACTIVE_USER_ID: 'subpulse_active_user_id_v4',
  SUBSCRIPTIONS: 'subpulse_subscriptions_v4',
  NOTIFICATION_LOGS: 'subpulse_notification_logs_v4',
};

const LEGACY_TEST_USER_IDS = new Set([
  'user_sarah_founder',
  'user_alex_freelancer',
  'user_david_agency',
]);

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      return [];
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure no legacy test users remain
    const filtered = parsed.filter((u) => !LEGACY_TEST_USER_IDS.has(u.id));
    return filtered.map((u) => ({
      ...u,
      currencyPreference: u.currencyPreference || DEFAULT_CURRENCY,
    }));
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

export function loadActiveUserId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    if (!raw || raw === 'logged_out' || LEGACY_TEST_USER_IDS.has(raw)) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export function saveActiveUserId(userId: string | null): void {
  try {
    if (!userId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, 'logged_out');
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
    }
  } catch (e) {
    console.error('Failed to save active user id', e);
  }
}

export function loadAllSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) {
      return [];
    }
    const parsed: Subscription[] = JSON.parse(raw);
    return parsed.filter((s) => !LEGACY_TEST_USER_IDS.has(s.userId));
  } catch {
    return [];
  }
}

export function saveAllSubscriptions(subscriptions: Subscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('Failed to save subscriptions', e);
  }
}

export function loadNotificationLogs(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_LOGS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveNotificationLogs(logs: NotificationLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save notification logs', e);
  }
}
