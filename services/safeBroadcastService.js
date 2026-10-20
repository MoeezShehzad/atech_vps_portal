// ==============================================================================
// Service: safeBroadcastService.js
// Purpose: Anti-Spam Throttled Broadcast Engine with Mail Server IP Reputation Protection
//          - Batched asynchronous dispatch (20 emails per batch with 2.5s jitter)
//          - RFC-compliant bulk headers (Precedence, List-Unsubscribe, X-Auto-Response-Suppress)
//          - Real-time job lifecycle tracking with progress reporting
//          - Dual-channel delivery: In-App Banner + Safe SMTP Dispatch
// ==============================================================================

import { transporterAlerts } from './emailService.js';
import prisma from '../lib/prisma.js';

// In-memory broadcast ledger for active & historical broadcasts
const broadcastJobs = new Map();

/**
 * Creates and starts a safe throttled broadcast campaign
 */
export async function startBroadcastCampaign({
  title,
  message,
  targetAudience = 'ALL_USERS', // ALL_USERS, ACTIVE_VPS_USERS, SERVICE_PROVIDERS, UNPAID_INVOICES
  channels = { inApp: true, email: true },
  adminEmail = 'admin@atechconsult.com',
}) {
  const jobId = `bcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Resolve target audience recipients
  let userQuery = { isActive: true };

  const audKey = String(targetAudience || 'ALL_USERS').toUpperCase();
  if (audKey === 'ACTIVE_VPS_USERS' || audKey === 'VPS_OWNERS') {
    userQuery.virtualMachines = {
      some: { status: { not: 'TERMINATED' } },
    };
  } else if (audKey === 'SERVICE_PROVIDERS') {
    userQuery.userRoles = {
      some: { role: { roleName: 'Service_Provider' } },
    };
  } else if (audKey === 'UNPAID_INVOICES' || audKey === 'UNPAID') {
    userQuery.invoices = {
      some: { status: 'PENDING' },
    };
  }

  const recipients = await prisma.user.findMany({
    where: userQuery,
    select: {
      userId: true,
      email: true,
      fullName: true,
    },
  });

  const jobRecord = {
    id: jobId,
    jobId,
    title,
    message,
    targetAudience,
    channels,
    createdBy: adminEmail,
    totalRecipients: recipients.length,
    sentCount: 0,
    failedCount: 0,
    status: 'QUEUED',
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
  };

  broadcastJobs.set(jobId, jobRecord);

  // 2. Publish In-App System Announcement immediately if requested
  if (channels.inApp) {
    try {
      await prisma.systemAnnouncement.create({
        data: {
          title,
          message,
          type: 'info',
          isActive: true,
          createdBy: adminEmail,
        },
      });
      try {
        const { apiCache } = await import('./cacheService.js');
        apiCache.del('announcements:public');
      } catch (_) {}
    } catch (err) {
      console.warn('[Broadcast In-App Announcement Error]:', err.message);
    }
  }

  // 3. If Email is enabled, trigger asynchronous throttled queue
  if (channels.email && recipients.length > 0) {
    // Run in background without blocking API response
    executeThrottledEmailDispatch(jobId, recipients, title, message);
  } else {
    jobRecord.status = 'COMPLETED';
    jobRecord.completedAt = new Date().toISOString();
  }

  return {
    success: true,
    jobId,
    id: jobId,
    ...jobRecord,
    totalRecipients: recipients.length,
    status: jobRecord.status,
    message: `Broadcast initialized for ${recipients.length} user(s).`,
  };
}

/**
 * Throttled batch processor ensuring server IP reputation remains clean
 */
async function executeThrottledEmailDispatch(jobId, recipients, title, message) {
  const job = broadcastJobs.get(jobId);
  if (!job) return;

  job.status = 'PROCESSING';

  const BATCH_SIZE = 20;
  const DELAY_MS = 2500; // 2.5 seconds between batches

  console.log(`[SafeBroadcast] Starting dispatch for job ${jobId}: ${recipients.length} recipients in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (recipient) => {
        try {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #0b1120 0%, #1e3a8a 100%); padding: 30px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
                .header p { margin: 6px 0 0; font-size: 12px; color: #93c5fd; }
                .body-content { padding: 32px 30px; line-height: 1.6; font-size: 14px; }
                .announcement-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #166534; }
                .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>ATC Cloud Platform Notification</h1>
                  <p>Enterprise Infrastructure Broadcast</p>
                </div>
                <div class="body-content">
                  <p>Hello <strong>${recipient.fullName || 'Customer'}</strong>,</p>
                  <div class="announcement-box">
                    <h3 style="margin-top: 0; color: #0f172a; font-size: 16px;">${title}</h3>
                    <p style="margin-bottom: 0; white-space: pre-line;">${message}</p>
                  </div>
                  <p>You can manage your instances, subscriptions, and security alerts anytime directly in the <a href="${(process.env.FRONTEND_URL || 'http://localhost:5174').replace(/\/$/, '')}/dashboard" style="color: #2563eb; font-weight: 600;">ATC Cloud Dashboard</a>.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Analytical Technical Consulting (ATC). All rights reserved.</p>
                  <p>This is an automated administrative notification sent to ${recipient.email}.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await transporterAlerts.sendMail({
            from: `"ATC Cloud Platform" <alerts@atechconsult.com>`,
            to: recipient.email,
            subject: `[Notification] ${title}`,
            html: htmlContent,
            headers: {
              'Precedence': 'bulk',
              'List-Unsubscribe': '<mailto:support@atechconsult.com?subject=unsubscribe>',
              'X-Auto-Response-Suppress': 'All',
              'X-Mailer': 'ATC Cloud Safe Broadcaster Engine',
            },
          });

          job.sentCount += 1;
        } catch (err) {
          job.failedCount += 1;
          job.errors.push({ email: recipient.email, error: err.message });
          console.warn(`[SafeBroadcast Error] Failed to send to ${recipient.email}:`, err.message);
        }
      })
    );

    // Sleep between batches to safeguard IP reputation
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  job.status = 'COMPLETED';
  job.completedAt = new Date().toISOString();
  console.log(`[SafeBroadcast] Completed job ${jobId}. Sent: ${job.sentCount}, Failed: ${job.failedCount}`);
}

/**
 * Retrieve status of a specific broadcast job
 */
export function getBroadcastJobStatus(jobId) {
  return broadcastJobs.get(jobId) || null;
}

/**
 * List all recent broadcast jobs
 */
export function listRecentBroadcasts() {
  return Array.from(broadcastJobs.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}
