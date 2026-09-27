/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Subscription,
  User,
  NotificationLog,
  SubscriptionFormData,
} from './types';
import {
  loadUsers,
  saveUsers,
  loadActiveUserId,
  saveActiveUserId,
  loadAllSubscriptions,
  saveAllSubscriptions,
  loadNotificationLogs,
  saveNotificationLogs,
} from './lib/storage';
import {
  calculateSummaryMetrics,
  calculateCategoryBreakdown,
  calculate12MonthProjection,
  getMonthlyEquivalent,
  getDaysRemaining,
} from './lib/analytics';
import { DEFAULT_CURRENCY, formatMoney, getCurrencyInfo, formatConvertedMoney } from './lib/currencies';
import { Navbar, ActiveTab } from './components/Navbar';
import { MetricCard } from './components/MetricCard';
import { CategoryDonutChart } from './components/CategoryDonutChart';
import { MonthlyTrendBarChart } from './components/MonthlyTrendBarChart';
import { SubscriptionTable } from './components/SubscriptionTable';
import { SubscriptionModal } from './components/SubscriptionModal';
import { EmailEngineView } from './components/EmailEngineView';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { ExportModal } from './components/ExportModal';
import { LoginView } from './components/LoginView';
import {
  Calendar,
  AlertTriangle,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Mail,
  ShieldCheck,
  Coins,
  Clock,
  Pause,
  Play,
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [users, setUsers] = useState<User[]>(() => loadUsers());
  const [activeUserId, setActiveUserId] = useState<string | null>(() => loadActiveUserId());
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>(() => loadAllSubscriptions());
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => loadNotificationLogs());

  // Global / active currency state (Defaults to Indian Rupees: INR ₹)
  const [activeCurrency, setActiveCurrency] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('subpulse_active_currency_v2') || localStorage.getItem('subpulse_active_currency_v1');
      return saved || DEFAULT_CURRENCY;
    } catch {
      return DEFAULT_CURRENCY;
    }
  });

  // Analytics chart toggle view for calm, uncluttered presentation
  const [analyticsView, setAnalyticsView] = useState<'category' | 'projection'>('category');

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  const [emailPreviewData, setEmailPreviewData] = useState<{
    recipientEmail: string;
    subject: string;
    html: string;
    subscriptionName: string;
  } | null>(null);

  // Active User object (nullable for logged out state)
  const activeUser: User | null = useMemo(() => {
    if (!activeUserId) return null;
    return users.find((u) => u.id === activeUserId) || null;
  }, [users, activeUserId]);

  // Sync active user change to storage
  const handleSelectUser = (user: User) => {
    setActiveUserId(user.id);
    saveActiveUserId(user.id);
    if (user.currencyPreference) {
      setActiveCurrency(user.currencyPreference);
    }
  };

  const handleLogin = (user: User) => {
    const userWithCurrency = {
      ...user,
      currencyPreference: user.currencyPreference || activeCurrency || DEFAULT_CURRENCY,
    };
    const exists = users.some((u) => u.id === user.id);
    const updated = exists
      ? users.map((u) => (u.id === user.id ? userWithCurrency : u))
      : [...users, userWithCurrency];
    setUsers(updated);
    saveUsers(updated);
    setActiveUserId(user.id);
    saveActiveUserId(user.id);
    if (user.currencyPreference) {
      setActiveCurrency(user.currencyPreference);
    }
  };

  const handleLogout = () => {
    setActiveUserId(null);
    saveActiveUserId(null);
  };

  const handleSelectCurrency = (currencyCode: string) => {
    setActiveCurrency(currencyCode);
    try {
      localStorage.setItem('subpulse_active_currency_v2', currencyCode);
      if (activeUser) {
        const updatedUsers = users.map((u) =>
          u.id === activeUser.id ? { ...u, currencyPreference: currencyCode } : u
        );
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUser = (newUser: User) => {
    handleLogin(newUser);
  };

  // STRICT ROW-LEVEL USER ISOLATION
  // Subscriptions belonging strictly to the currently selected tenant
  const userSubscriptions = useMemo(() => {
    if (!activeUser) return [];
    return allSubscriptions.filter((s) => s.userId === activeUser.id);
  }, [allSubscriptions, activeUser]);

  // Derived Analytics for this tenant normalized to activeCurrency
  const summaryMetrics = useMemo(() => {
    return calculateSummaryMetrics(userSubscriptions, activeCurrency);
  }, [userSubscriptions, activeCurrency]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(userSubscriptions, activeCurrency);
  }, [userSubscriptions, activeCurrency]);

  const projectionData = useMemo(() => {
    return calculate12MonthProjection(userSubscriptions, activeCurrency);
  }, [userSubscriptions, activeCurrency]);

  // Curated upcoming subscriptions for the calm dashboard overview
  const upcomingRenewals = useMemo(() => {
    return [...userSubscriptions]
      .filter((s) => s.status !== 'PAUSED')
      .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
      .slice(0, 5);
  }, [userSubscriptions]);

  // Handlers for Subscription CRUD
  const handleSaveSubscription = (formData: SubscriptionFormData, editId?: string) => {
    if (!activeUser) return;
    const now = new Date().toISOString();

    if (editId) {
      // Update
      const updated = allSubscriptions.map((sub) => {
        if (sub.id === editId) {
          return {
            ...sub,
            ...formData,
            updatedAt: now,
          };
        }
        return sub;
      });
      setAllSubscriptions(updated);
      saveAllSubscriptions(updated);
    } else {
      // Create new
      const newSub: Subscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: activeUser.id,
        name: formData.name,
        provider: formData.provider,
        amount: Number(formData.amount),
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        renewalDate: formData.renewalDate,
        category: formData.category,
        status: formData.isTrial ? 'TRIAL' : formData.status || 'ACTIVE',
        isTrial: formData.isTrial,
        trialEndDate: formData.isTrial ? formData.trialEndDate : null,
        paymentMethod: formData.paymentMethod,
        websiteUrl: formData.websiteUrl,
        notes: formData.notes,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newSub, ...allSubscriptions];
      setAllSubscriptions(updated);
      saveAllSubscriptions(updated);
    }
  };

  const handleEditSubscription = (sub: Subscription) => {
    setSubscriptionToEdit(sub);
    setIsAddModalOpen(true);
  };

  const handleDeleteSubscription = (subId: string) => {
    const updated = allSubscriptions.filter((s) => s.id !== subId);
    setAllSubscriptions(updated);
    saveAllSubscriptions(updated);
  };

  const handleTogglePause = (subId: string) => {
    const updated = allSubscriptions.map((s) => {
      if (s.id === subId) {
        const nextStatus: Subscription['status'] = s.status === 'PAUSED' ? (s.isTrial ? 'TRIAL' : 'ACTIVE') : 'PAUSED';
        return { ...s, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    setAllSubscriptions(updated);
    saveAllSubscriptions(updated);
  };

  const handleDuplicate = (sub: Subscription) => {
    const copySub: Subscription = {
      ...sub,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${sub.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [copySub, ...allSubscriptions];
    setAllSubscriptions(updated);
    saveAllSubscriptions(updated);
  };

  // Cron & Notification Log Handlers
  const handleAddLogs = (newLogs: NotificationLog[]) => {
    const updated = [...newLogs, ...notificationLogs];
    setNotificationLogs(updated);
    saveNotificationLogs(updated);
  };

  const handleClearLogs = () => {
    setNotificationLogs([]);
    saveNotificationLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Clean Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        users={users}
        activeUser={activeUser}
        onSelectUser={handleSelectUser}
        onAddUser={handleAddUser}
        onLogout={handleLogout}
        activeCurrency={activeCurrency}
        onSelectCurrency={handleSelectCurrency}
        onOpenAddModal={() => {
          setSubscriptionToEdit(null);
          setIsAddModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        renewingCount={summaryMetrics.renewingWithin3DaysCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeUser ? (
          <LoginView
            users={users}
            onLogin={handleLogin}
          />
        ) : (
          <>
            {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Header: Clean & Quiet */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/50">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Subscription Overview
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Recurring expenses, renewals, and cashflow for {activeUser.organization}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('email-engine')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Renewal Alerts</span>
                  {summaryMetrics.renewingWithin3DaysCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setSubscriptionToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* Empty State Banner if no subscriptions yet */}
            {userSubscriptions.length === 0 && (
              <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Welcome to your workspace, {activeUser.name}!
                  </h3>
                  <p className="text-xs text-slate-400">
                    You have no active subscriptions tracked yet. Add your first recurring expense to start tracking renewals and alerts.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setSubscriptionToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense</span>
                  </button>
                </div>
              </div>
            )}

            {/* Calm 3-Card Metric Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <MetricCard
                label="Monthly Burn Rate"
                value={formatMoney(summaryMetrics.monthlyBurn, activeCurrency)}
                subValue="/ month"
                trendText={`Annualized: ${formatMoney(summaryMetrics.annualizedTotal, activeCurrency, { maximumFractionDigits: 0 })}/yr`}
                trendType="neutral"
                icon={<Coins className="w-4 h-4 text-emerald-400" />}
              />
              <MetricCard
                label="Active Subscriptions"
                value={`${summaryMetrics.activeCount}`}
                subValue={summaryMetrics.pausedCount > 0 ? `· ${summaryMetrics.pausedCount} paused` : '· all active'}
                trendText={`Avg ${formatMoney(summaryMetrics.averageCostPerSub, activeCurrency, { maximumFractionDigits: 0 })} per service`}
                trendType="info"
                icon={<Layers className="w-4 h-4 text-indigo-400" />}
              />
              <MetricCard
                label="Upcoming Renewals"
                value={`${summaryMetrics.renewingWithin3DaysCount}`}
                subValue="Due in ≤ 3 days"
                trendText={
                  summaryMetrics.renewingWithin3DaysCount > 0
                    ? `${summaryMetrics.renewingWithin3DaysCount} renewal alerts scheduled`
                    : 'No renewals due this week'
                }
                trendType={summaryMetrics.renewingWithin3DaysCount > 0 ? 'warning' : 'positive'}
                icon={<Clock className="w-4 h-4 text-amber-400" />}
              />
            </div>

            {/* Visual Spending Insights with Calm View Switcher */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/30 border border-slate-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/40">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">Spending Insights</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Explore distributions across categories and future cashflow.</p>
                </div>
                <div className="flex items-center gap-1 p-0.5 bg-slate-900/80 rounded-lg border border-slate-800/80 self-start sm:self-auto">
                  <button
                    onClick={() => setAnalyticsView('category')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      analyticsView === 'category' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    By Category
                  </button>
                  <button
                    onClick={() => setAnalyticsView('projection')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      analyticsView === 'projection' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    12-Month Projection
                  </button>
                </div>
              </div>

              {analyticsView === 'category' ? (
                <CategoryDonutChart
                  data={categoryBreakdown}
                  totalBurn={summaryMetrics.monthlyBurn}
                  currency={activeCurrency}
                />
              ) : (
                <MonthlyTrendBarChart data={projectionData} currency={activeCurrency} />
              )}
            </div>

            {/* Curated Upcoming Renewals & Recent Subscriptions */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/30 border border-slate-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Upcoming Renewals
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Next services scheduled for billing cycle renewal.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>View all subscriptions ({userSubscriptions.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {upcomingRenewals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active subscriptions found. Add your first recurring service above.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/40">
                  {upcomingRenewals.map((sub) => {
                    const daysRemaining = getDaysRemaining(sub.renewalDate);
                    const isDueSoon = daysRemaining >= 0 && daysRemaining <= 3;

                    return (
                      <div
                        key={sub.id}
                        className="py-3.5 flex items-center justify-between gap-4 group transition-colors hover:bg-slate-900/20 rounded-lg px-2 -mx-2"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center font-medium text-xs text-indigo-300 shrink-0 font-mono">
                            {sub.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-200 group-hover:text-white truncate">
                              {sub.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>{sub.provider}</span>
                              <span aria-hidden="true">·</span>
                              <span>{sub.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 text-right">
                          <div className="hidden sm:block">
                            <div
                              className={`text-xs font-medium ${
                                isDueSoon ? 'text-amber-400' : 'text-slate-300'
                              }`}
                            >
                              {daysRemaining === 0
                                ? 'Renews today'
                                : daysRemaining === 1
                                ? 'Renews tomorrow'
                                : daysRemaining > 0
                                ? `Renews in ${daysRemaining}d`
                                : `Overdue (${Math.abs(daysRemaining)}d)`}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {sub.renewalDate}
                            </div>
                          </div>

                          <div className="font-mono tabular-nums">
                            <div className="font-medium text-sm text-white">
                              {formatConvertedMoney(sub.amount, sub.currency, activeCurrency)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              /{sub.billingCycle.toLowerCase()}
                            </div>
                          </div>

                          {/* Subtle hover actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => handleEditSubscription(sub)}
                              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                              title="Edit subscription"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/50">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Subscription Inventory
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Manage, pause, duplicate, and track recurring expenses with row-level data isolation.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-colors"
                >
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => {
                    setSubscriptionToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subscription</span>
                </button>
              </div>
            </div>

            <SubscriptionTable
              subscriptions={userSubscriptions}
              onEdit={handleEditSubscription}
              onDelete={handleDeleteSubscription}
              onTogglePause={handleTogglePause}
              onDuplicate={handleDuplicate}
              activeCurrency={activeCurrency}
              onOpenAddModal={() => {
                setSubscriptionToEdit(null);
                setIsAddModalOpen(true);
              }}
            />
          </div>
        )}

        {/* EMAIL ENGINE & CRON TAB */}
        {activeTab === 'email-engine' && (
          <div className="space-y-6">
            <div className="pb-6 border-b border-slate-800/50">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Automated Email Engine & Vercel Cron
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Simulates the daily 3-day renewal scanner, idempotency deduplication check, and Resend transactional email pipeline.
              </p>
            </div>

            <EmailEngineView
              subscriptions={allSubscriptions}
              activeUser={activeUser}
              logs={notificationLogs}
              onAddLogs={handleAddLogs}
              onClearLogs={handleClearLogs}
              activeCurrency={activeCurrency}
              onPreviewEmail={(email) => setEmailPreviewData(email)}
            />
          </div>
        )}
          </>
        )}
      </main>

      {/* Zero-slop clean footer */}
      <footer className="mt-auto border-t border-slate-800/40 py-8 text-xs text-slate-400 bg-[#090d16]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">SubPulse</span>
            <span aria-hidden="true">·</span>
            <span>Recurring Expense Tracker</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Default: INR (₹)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Serverless Vercel Cron</span>
            <span aria-hidden="true">·</span>
            <span>Strict Tenant Row Isolation</span>
          </div>
        </div>
      </footer>

      {/* Subscription Add / Edit Modal */}
      {activeUser && (
        <SubscriptionModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSubscriptionToEdit(null);
          }}
          onSave={handleSaveSubscription}
          subscriptionToEdit={subscriptionToEdit}
          defaultCurrency={activeCurrency}
        />
      )}

      {/* CSV Export Modal */}
      {activeUser && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          subscriptions={allSubscriptions}
          activeUser={activeUser}
          activeCurrency={activeCurrency}
        />
      )}

      {/* Resend Email Preview Modal */}
      <EmailPreviewModal
        isOpen={Boolean(emailPreviewData)}
        onClose={() => setEmailPreviewData(null)}
        emailData={emailPreviewData}
      />
    </div>
  );
}
