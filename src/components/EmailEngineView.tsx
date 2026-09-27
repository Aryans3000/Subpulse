import React, { useState } from 'react';
import { Subscription, User, NotificationLog } from '../types';
import { executeRenewalCronJob, generateRenewalEmailHtml } from '../lib/cron-engine';
import { getDaysRemaining } from '../lib/analytics';
import { formatMoney, formatConvertedMoney, convertCurrency, DEFAULT_CURRENCY } from '../lib/currencies';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  ShieldCheck,
  Eye,
  RefreshCw,
  Terminal,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface EmailEngineViewProps {
  subscriptions: Subscription[];
  activeUser: User;
  logs: NotificationLog[];
  onAddLogs: (newLogs: NotificationLog[]) => void;
  onClearLogs: () => void;
  activeCurrency?: string;
  onPreviewEmail: (emailData: {
    recipientEmail: string;
    subject: string;
    html: string;
    subscriptionName: string;
  }) => void;
}

export const EmailEngineView: React.FC<EmailEngineViewProps> = ({
  subscriptions,
  activeUser,
  logs,
  onAddLogs,
  onClearLogs,
  activeCurrency = DEFAULT_CURRENCY,
  onPreviewEmail,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[2026-09-26T09:00:00.000Z] System standby. Scheduled cron pattern: '0 9 * * *' (Daily 9:00 AM UTC).`,
    `[2026-09-26T09:00:00.000Z] Vercel Cron Endpoint: /api/cron/renewals · Authorization: Bearer CRON_SECRET`,
  ]);

  // Find user's subscriptions that are expiring in <= 3 days
  const userSubs = subscriptions.filter((s) => s.userId === activeUser.id);
  const activeSubs = userSubs.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');

  const upcomingAlertCandidates = activeSubs.filter((s) => {
    const days = getDaysRemaining(s.renewalDate);
    const trialDays = s.isTrial && s.trialEndDate ? getDaysRemaining(s.trialEndDate) : 999;
    return (days >= 0 && days <= 3) || (trialDays >= 0 && trialDays <= 3);
  });

  const handleRunCron = () => {
    setIsRunning(true);
    setTerminalLogs((prev) => [...prev, `--- MANUAL CRON INVOCATION TRIGGERED ---`]);

    setTimeout(() => {
      const { result, newLogs } = executeRenewalCronJob({
        subscriptions,
        user: activeUser,
        existingLogs: logs,
        referenceDateStr: new Date().toISOString().split('T')[0],
        targetCurrency: activeCurrency,
      });

      if (newLogs.length > 0) {
        onAddLogs(newLogs);
      }

      setTerminalLogs((prev) => [...prev, ...result.logs]);
      setLastRunSummary(
        `Sent ${result.emailsSent} alert${result.emailsSent === 1 ? '' : 's'} · Skipped ${result.emailsSkippedDuplicate} duplicate${result.emailsSkippedDuplicate === 1 ? '' : 's'}`
      );
      setIsRunning(false);
    }, 700);
  };

  const handleTestEmailPreview = (sub: Subscription) => {
    const isTrialDue = Boolean(sub.isTrial && sub.trialEndDate);
    const targetDate = isTrialDue ? sub.trialEndDate! : sub.renewalDate;
    const daysLeft = isTrialDue
      ? getDaysRemaining(sub.trialEndDate!)
      : getDaysRemaining(sub.renewalDate);

    const convertedAmount = convertCurrency(
      sub.amount,
      sub.currency || DEFAULT_CURRENCY,
      activeCurrency
    );

    const email = generateRenewalEmailHtml({
      userName: activeUser.name,
      userEmail: activeUser.email,
      subName: sub.name,
      provider: sub.provider,
      amount: convertedAmount,
      currency: activeCurrency,
      billingCycle: sub.billingCycle,
      renewalDate: targetDate,
      daysRemaining: Math.max(0, daysLeft),
      paymentMethod: sub.paymentMethod,
      category: sub.category,
      isTrial: isTrialDue,
    });

    onPreviewEmail({
      recipientEmail: activeUser.email,
      subject: email.subject,
      html: email.html,
      subscriptionName: sub.name,
    });
  };

  // Filter logs for this active user
  const userLogs = logs.filter((l) => l.userId === activeUser.id);

  return (
    <div className="space-y-6">
      {/* Engine Overview & Trigger Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Automated Renewal & Trial Alert Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Vercel Cron Active
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every morning at 09:00 UTC, a serverless Vercel Cron worker verifies <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded font-mono">CRON_SECRET</code>, scans for subscriptions renewing within a 3-day buffer, and fires transactional emails via Resend. Strict idempotency prevents repeated alerts for the same billing cycle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRunCron}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 active:scale-95'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Job...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Renewal Cron Now</span>
                </>
              )}
            </button>

            {userLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-850 transition-colors"
                title="Reset log database to re-test deduplication"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Idempotency Cache</span>
              </button>
            )}
          </div>
        </div>

        {lastRunSummary && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Last Execution Result:</span>
            <span className="text-indigo-300 font-semibold">{lastRunSummary}</span>
          </div>
        )}
      </div>

      {/* Grid: Upcoming Candidates & Live Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidates in 3-day window */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Renewals In Buffer (≤ 3 Days)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {upcomingAlertCandidates.length} targeted
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Subscriptions below match the 3-day notification threshold and will receive a transactional alert unless already logged in the idempotency table.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {upcomingAlertCandidates.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active subscriptions currently within the 3-day renewal window.
              </div>
            ) : (
              upcomingAlertCandidates.map((sub) => {
                const daysLeft = getDaysRemaining(sub.renewalDate);
                const trialDays = sub.isTrial && sub.trialEndDate ? getDaysRemaining(sub.trialEndDate) : null;
                const isTrial = sub.isTrial && trialDays !== null;

                // Check if already sent
                const isSent = userLogs.some(
                  (l) => l.subscriptionId === sub.id && l.renewalCycleDate.includes(sub.renewalDate)
                );

                return (
                  <div
                    key={sub.id}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate flex items-center gap-2">
                        <span>{sub.name}</span>
                        {isTrial ? (
                          <span className="text-[10px] text-amber-400 font-mono">
                            Trial ends in {trialDays}d
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-300 font-mono">
                            Renews in {daysLeft}d
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatConvertedMoney(sub.amount, sub.currency, activeCurrency)} · {sub.provider} · {sub.renewalDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSent ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sent</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-medium">
                          Pending Next Cron
                        </span>
                      )}

                      <button
                        onClick={() => handleTestEmailPreview(sub)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Preview rendered HTML email"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Terminal & Serverless Logs */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col h-80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Serverless Execution Log</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-mono">CRON ROUTE READY</span>
            </div>
          </div>

          <div className="flex-1 bg-black/60 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1.5 border border-slate-900 select-text">
            {terminalLogs.map((log, index) => (
              <div
                key={index}
                className={
                  log.includes('Resend Dispatch')
                    ? 'text-emerald-400'
                    : log.includes('Idempotency Guard')
                    ? 'text-amber-400'
                    : log.includes('TRIGGERED')
                    ? 'text-indigo-400 font-bold'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispatched Notification History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Idempotent Notification Audit Log ({userLogs.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Database Table: <code className="font-mono text-slate-300">NotificationLog</code>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-950/60 uppercase tracking-wider">
                <th className="py-2.5 px-4">Subscription</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Alert Type</th>
                <th className="py-2.5 px-4">Idempotency Key</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Dispatched At</th>
                <th className="py-2.5 px-4 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No notification logs recorded yet for this workspace. Click "Run Renewal Cron Now" above to trigger.
                  </td>
                </tr>
              ) : (
                userLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-200">
                      {log.subscriptionName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.recipientEmail}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] font-medium text-indigo-300">
                        {log.alertType === 'TRIAL_ENDING' ? 'Trial Expiring' : '3-Day Renewal Buffer'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                      {log.renewalCycleDate}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-400 font-mono">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => {
                          const matchedSub = subscriptions.find((s) => s.id === log.subscriptionId);
                          if (matchedSub) {
                            handleTestEmailPreview(matchedSub);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-[11px] transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
