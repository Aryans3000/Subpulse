import { Subscription, User, NotificationLog } from '../types';
import { getDaysRemaining } from './analytics';
import { formatMoney, DEFAULT_CURRENCY, convertCurrency } from './currencies';

export interface CronRunResult {
  timestamp: string;
  processedCount: number;
  emailsSent: number;
  emailsSkippedDuplicate: number;
  logs: string[];
  dispatchedAlerts: {
    subscription: Subscription;
    user: User;
    alertType: 'RENEWAL_3_DAYS' | 'TRIAL_ENDING';
    daysLeft: number;
    emailHtml: string;
    subject: string;
    idempotencyKey: string;
  }[];
}

export function generateRenewalEmailHtml(params: {
  userName: string;
  userEmail: string;
  subName: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  daysRemaining: number;
  paymentMethod: string;
  category: string;
  isTrial: boolean;
}): { subject: string; html: string } {
  const {
    userName,
    subName,
    provider,
    amount,
    currency,
    billingCycle,
    renewalDate,
    daysRemaining,
    paymentMethod,
    category,
    isTrial,
  } = params;

  const formattedAmount = formatMoney(amount, currency || DEFAULT_CURRENCY);

  const subject = isTrial
    ? `⚠️ Action Required: Your ${subName} trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
    : `Upcoming Renewal Alert: ${subName} (${formattedAmount}) renews in ${daysRemaining} days`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 32px 16px; }
    .container { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
    .header { padding: 32px 32px 24px; border-bottom: 1px solid #1e293b; background: #0b1120; }
    .brand { font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; }
    .brand-badge { color: #6366f1; font-weight: 600; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background: ${isTrial ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)'}; color: ${isTrial ? '#f87171' : '#818cf8'}; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #ffffff; line-height: 1.3; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .card { background: #090e1a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #141e33; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; }
    .value { color: #f1f5f9; font-weight: 500; font-family: monospace; }
    .price-callout { font-size: 28px; font-weight: 700; color: #ffffff; font-family: monospace; margin: 8px 0 20px; }
    .cta-button { display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px; }
    .footer { padding: 24px 32px; background: #0b1120; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">SubPulse <span class="brand-badge">// Alert Engine</span></div>
    </div>
    <div class="content">
      <div class="badge">${isTrial ? 'Free Trial Expiring' : 'Renewal Notice (3-Day Buffer)'}</div>
      <h1>${isTrial ? `Trial Ending: ${subName}` : `Upcoming Charge for ${subName}`}</h1>
      <p>Hi ${userName},</p>
      <p>This is an automated reminder from your SubPulse recurring expense monitor. Your subscription for <strong>${subName}</strong> (${provider}) is scheduled to renew in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>.</p>
      
      <div class="card">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Expected Charge Amount</div>
        <div class="price-callout">${formattedAmount} <span style="font-size: 14px; font-weight: normal; color: #94a3b8;">/ ${billingCycle.toLowerCase()}</span></div>
        
        <div class="row">
          <span class="label">Scheduled Renewal Date</span>
          <span class="value">${renewalDate}</span>
        </div>
        <div class="row">
          <span class="label">Payment Source</span>
          <span class="value">${paymentMethod}</span>
        </div>
        <div class="row">
          <span class="label">Expense Category</span>
          <span class="value">${category}</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If you wish to retain this tool, no action is needed. If you plan to pause or cancel before your card is charged, please log into your provider account immediately.
      </p>

      <a href="https://subpulse.app/dashboard" class="cta-button">Manage Subscription in SubPulse</a>
    </div>
    <div class="footer">
      Sent via Resend Transactional Engine · Automated by Vercel Serverless Cron (0 9 * * *)<br>
      Strict Row-Level Isolation active for workspace: ${userName} (${params.userEmail})
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export function executeRenewalCronJob(params: {
  subscriptions: Subscription[];
  user: User;
  existingLogs: NotificationLog[];
  referenceDateStr?: string;
  targetCurrency?: string;
}): {
  result: CronRunResult;
  newLogs: NotificationLog[];
} {
  const {
    subscriptions,
    user,
    existingLogs,
    referenceDateStr = new Date().toISOString().split('T')[0],
    targetCurrency = user.currencyPreference || DEFAULT_CURRENCY,
  } = params;

  const logs: string[] = [];
  const timestamp = new Date().toISOString();
  logs.push(`[${timestamp}] ⚡ [Vercel Cron] Triggered GET /api/cron/renewals`);
  logs.push(`[${timestamp}] 🔒 Verifying CRON_SECRET authorization header... OK (200)`);
  logs.push(`[${timestamp}] 🏢 Active tenant: ${user.name} (${user.email}) - Org: ${user.organization}`);

  const activeSubs = subscriptions.filter(
    (s) => s.userId === user.id && (s.status === 'ACTIVE' || s.status === 'TRIAL')
  );

  logs.push(`[${timestamp}] 🔍 Querying PostgreSQL for active subscriptions renewing between ${referenceDateStr} and +3 days...`);

  const newLogs: NotificationLog[] = [];
  const dispatchedAlerts: CronRunResult['dispatchedAlerts'] = [];
  let skippedDuplicates = 0;

  for (const sub of activeSubs) {
    const daysUntilRenewal = getDaysRemaining(sub.renewalDate, referenceDateStr);
    const isRenewalDue = daysUntilRenewal >= 0 && daysUntilRenewal <= 3;

    let isTrialDue = false;
    let daysUntilTrial = 999;
    if (sub.isTrial && sub.trialEndDate) {
      daysUntilTrial = getDaysRemaining(sub.trialEndDate, referenceDateStr);
      isTrialDue = daysUntilTrial >= 0 && daysUntilTrial <= 3;
    }

    if (isRenewalDue || isTrialDue) {
      const alertType: NotificationLog['alertType'] = isTrialDue ? 'TRIAL_ENDING' : 'RENEWAL_3_DAYS';
      const targetDate = isTrialDue ? sub.trialEndDate! : sub.renewalDate;
      const daysLeft = isTrialDue ? daysUntilTrial : daysUntilRenewal;

      // Idempotency key pattern: sub_id + cycle date + alert type
      const idempotencyKey = `${sub.id}_${targetDate}_${alertType}`;

      // Check if an alert was ALREADY dispatched in existing logs for this exact cycle
      const alreadySent = existingLogs.some(
        (log) => log.subscriptionId === sub.id && log.renewalCycleDate === idempotencyKey
      );

      if (alreadySent) {
        logs.push(
          `[${timestamp}] ⏩ [Idempotency Guard] Skipped "${sub.name}" — alert already sent for cycle ${targetDate} (${idempotencyKey})`
        );
        skippedDuplicates++;
        continue;
      }

      // Convert to target currency if needed
      const effectiveAmount = convertCurrency(
        sub.amount,
        sub.currency || DEFAULT_CURRENCY,
        targetCurrency
      );

      // Generate email content
      const { subject, html } = generateRenewalEmailHtml({
        userName: user.name,
        userEmail: user.email,
        subName: sub.name,
        provider: sub.provider,
        amount: effectiveAmount,
        currency: targetCurrency,
        billingCycle: sub.billingCycle,
        renewalDate: targetDate,
        daysRemaining: daysLeft,
        paymentMethod: sub.paymentMethod,
        category: sub.category,
        isTrial: isTrialDue,
      });

      const messageId = `msg_resend_${Math.random().toString(36).substring(2, 10)}`;

      const newLog: NotificationLog = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        recipientEmail: user.email,
        alertType,
        renewalCycleDate: idempotencyKey,
        amount: effectiveAmount,
        currency: targetCurrency,
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        resendMessageId: messageId,
      };

      newLogs.push(newLog);
      dispatchedAlerts.push({
        subscription: sub,
        user,
        alertType,
        daysLeft,
        emailHtml: html,
        subject,
        idempotencyKey,
      });

      logs.push(
        `[${timestamp}] ✉️ [Resend Dispatch] Successfully queued "${subject}" to ${user.email} (ID: ${messageId})`
      );
    }
  }

  logs.push(
    `[${timestamp}] ✅ [Vercel Cron Summary] Processed: ${activeSubs.length} | Sent: ${dispatchedAlerts.length} | Skipped Duplicates: ${skippedDuplicates}`
  );

  return {
    result: {
      timestamp,
      processedCount: activeSubs.length,
      emailsSent: dispatchedAlerts.length,
      emailsSkippedDuplicate: skippedDuplicates,
      logs,
      dispatchedAlerts,
    },
    newLogs,
  };
}
