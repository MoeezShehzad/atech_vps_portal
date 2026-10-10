import prisma from '../lib/prisma.js';
import { transporterSupport, escapeHtml } from './emailService.js';

// ==============================================================================
// Service: ticketAutomationService.js
// Purpose: Senior Solutions Architect Automated Ticketing Lifecycle Engine
//          - 10-day countdown clock on "Awaiting User Action"
//          - Day 3 Notification 1 (Gentle reminder)
//          - Day 6 Notification 2 (Urgent reminder)
//          - Day 9 Notification 3 (Final 48-hour warning)
//          - Day 11 Automatic transition to "Closed - Timeout"
// ==============================================================================

const SUPPORT_EMAIL = process.env.SMTP_SUPPORT_USER || 'customer-support@atechconsult.com';
const APP_URL = process.env.FRONTEND_URL || process.env.BACKEND_URL || 'https://vps.atechconsult.com';

/**
 * Calculates dynamic SLA and countdown metrics for a ticket record
 */
export function calculateTicketMetrics(t) {
  const now = Date.now();
  const createdMs = new Date(t.createdAt).getTime();
  const updatedMs = new Date(t.updatedAt || t.createdAt).getTime();

  let idleDays = 0;
  let remainingHours = null;
  let slaState = 'Open';

  if (t.status === 'AWAITING_USER_ACTION') {
    const awaitingMs = t.awaitingActionSince ? new Date(t.awaitingActionSince).getTime() : updatedMs;
    const elapsed = Math.max(0, now - awaitingMs);
    idleDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    remainingHours = Math.max(0, Math.floor((10 * 24 * 60 * 60 * 1000 - elapsed) / (1000 * 60 * 60)));
    slaState = 'Pending Action';
  } else if (t.status === 'REOPENED') {
    slaState = 'Reopened';
    idleDays = Math.floor((now - updatedMs) / (1000 * 60 * 60 * 24));
  } else if (t.status === 'CLOSED_TIMEOUT') {
    slaState = 'Autoclosed';
    idleDays = 11;
    remainingHours = 0;
  } else if (t.status === 'CLOSED') {
    slaState = 'Closed';
    idleDays = Math.floor((now - updatedMs) / (1000 * 60 * 60 * 24));
  } else if (t.status === 'RESOLVED') {
    slaState = 'Resolved';
    idleDays = Math.floor((now - updatedMs) / (1000 * 60 * 60 * 24));
  } else {
    slaState = 'Open';
    idleDays = Math.floor((now - createdMs) / (1000 * 60 * 60 * 24));
  }

  const timelineLabel = `Day ${Math.min(idleDays, 11)}`;

  return {
    ...t,
    timelineDay: idleDays,
    timelineLabel,
    slaState,
    remainingHours,
    isFollowUp: Boolean(t.isFollowUp),
    parentTicketId: t.parentTicketId || null,
    lastAutomatedAction: t.lastAutomatedAction || (t.status === 'OPEN' ? 'Ticket generated. Initial queue validation' : `Status updated to ${t.status}`),
  };
}

/**
 * Runs the automation state machine across all tickets awaiting user action
 */
export async function runTicketAutomationCycle() {
  const now = new Date();
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { status: 'AWAITING_USER_ACTION' },
    });

    for (const t of tickets) {
      const awaitingSince = t.awaitingActionSince || t.updatedAt || t.createdAt;
      const elapsedMs = now.getTime() - new Date(awaitingSince).getTime();
      const idleDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

      // Fetch customer email
      const user = await prisma.user.findUnique({
        where: { userId: t.userId },
        select: { email: true, fullName: true },
      });

      if (!user || !user.email) continue;

      // 1. DAY 11: AUTO-CLOSE TIMEOUT
      if (idleDays >= 11) {
        await prisma.supportTicket.update({
          where: { id: t.id },
          data: {
            status: 'CLOSED_TIMEOUT',
            lastAutomatedAction: 'Closed automatically on day 11 (Timeout)',
          },
        });

        await prisma.activityLog.create({
          data: {
            userId: t.userId,
            action: 'TICKET_AUTO_CLOSE_TIMEOUT',
            status: 'SUCCESS',
            details: `Ticket #${t.id} was automatically transitioned to 'Closed - Timeout' after 11 days of inactivity.`,
          },
        });

        // Send timeout notice to customer
        transporterSupport.sendMail({
          from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
          to: user.email,
          subject: `[Closed - Timeout] Ticket #${t.id}: ${t.subject}`,
          html: `
            <div style="font-family:sans-serif;color:#1e293b;padding:24px;max-width:600px;margin:auto;">
              <h2 style="color:#0f172a;margin-top:0;">Support Ticket #${t.id} Closed (Inactivity Timeout)</h2>
              <p>Hi ${escapeHtml(user.fullName || 'Customer')},</p>
              <p>Because we have not received a reply within 10 days, this ticket has been automatically closed.</p>
              <p style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;font-size:14px;">
                <strong>Subject:</strong> ${escapeHtml(t.subject)}
              </p>
              <p style="font-size:13px;color:#64748b;">If you still need assistance, you can submit a follow-up response directly from your customer portal and a linked follow-up ticket will be automatically created.</p>
              <a href="${APP_URL}/dashboard?tab=support" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:14px;">Visit Ticket Center</a>
            </div>
          `,
        }).catch((e) => console.warn('[Auto-close mail error]:', e.message));

        console.log(`[Automation] Ticket #${t.id} auto-closed due to timeout.`);
      }

      // 2. DAY 9: COURTEOUS FINAL FOLLOW-UP (Notification 3)
      else if (idleDays >= 9 && t.reminderLevel < 3) {
        await prisma.supportTicket.update({
          where: { id: t.id },
          data: {
            reminderLevel: 3,
            lastAutomatedAction: 'Notification 3 sent (Gentle final reminder)',
          },
        });

        transporterSupport.sendMail({
          from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
          to: user.email,
          subject: `[Friendly Check-in] Following up on Ticket #${t.id}: ${t.subject}`,
          html: `
            <div style="font-family:sans-serif;color:#1e293b;padding:24px;max-width:600px;margin:auto;">
              <h2 style="color:#2563eb;margin-top:0;">Just Checking In: Ticket #${t.id}</h2>
              <p>Hi ${escapeHtml(user.fullName || 'Customer')},</p>
              <p>We wanted to gently follow up on your ticket <strong>#${t.id}</strong> to ensure everything is running smoothly for you.</p>
              <p>If you still need assistance, please feel free to reply at your earliest convenience. If everything is already working as expected, no action is needed — this ticket will gracefully close in 48 hours to keep your queue organized.</p>
              <p style="background:#f8fafc;border-left:4px solid #3b82f6;padding:14px;border-radius:4px;color:#1e293b;font-size:14px;">
                <strong>Subject:</strong> ${escapeHtml(t.subject)}
              </p>
              <a href="${APP_URL}/dashboard?tab=support&ticketId=${t.id}" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:14px;">View Ticket & Reply</a>
              <p style="font-size:12px;color:#64748b;margin-top:18px;">We are always here to help whenever you need us!</p>
            </div>
          `,
        }).catch((e) => console.warn('[Day 9 mail error]:', e.message));

        console.log(`[Automation] Ticket #${t.id} sent Day 9 gentle check-in.`);
      }

      // 3. DAY 6: COURTEOUS FOLLOW-UP (Notification 2)
      else if (idleDays >= 6 && t.reminderLevel < 2) {
        await prisma.supportTicket.update({
          where: { id: t.id },
          data: {
            reminderLevel: 2,
            lastAutomatedAction: 'Notification 2 sent (Gentle progress check)',
          },
        });

        transporterSupport.sendMail({
          from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
          to: user.email,
          subject: `[Gentle Reminder] Update on Ticket #${t.id}: ${t.subject}`,
          html: `
            <div style="font-family:sans-serif;color:#1e293b;padding:24px;max-width:600px;margin:auto;">
              <h2 style="color:#2563eb;margin-top:0;">Gentle Follow-up: Ticket #${t.id}</h2>
              <p>Hi ${escapeHtml(user.fullName || 'Customer')},</p>
              <p>We hope you are having a great week! Our support team is following up on your request regarding <strong>#${t.id}</strong> to see if you had a chance to test our previous recommendations.</p>
              <p>Please let us know if you need any additional help or have questions — we are happy to assist further.</p>
              <p style="background:#f8fafc;border-left:4px solid #3b82f6;padding:14px;border-radius:4px;color:#1e293b;font-size:14px;">
                <strong>Subject:</strong> ${escapeHtml(t.subject)}
              </p>
              <a href="${APP_URL}/dashboard?tab=support&ticketId=${t.id}" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:14px;">View Ticket & Reply</a>
            </div>
          `,
        }).catch((e) => console.warn('[Day 6 mail error]:', e.message));

        console.log(`[Automation] Ticket #${t.id} sent Day 6 gentle follow-up.`);
      }

      // 4. DAY 3: GENTLE REMINDER (Notification 1)
      else if (idleDays >= 3 && t.reminderLevel < 1) {
        await prisma.supportTicket.update({
          where: { id: t.id },
          data: {
            reminderLevel: 1,
            lastAutomatedAction: 'Notification 1 sent (Gentle initial reminder)',
          },
        });

        transporterSupport.sendMail({
          from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
          to: user.email,
          subject: `[Friendly Reminder] Update on Ticket #${t.id}: ${t.subject}`,
          html: `
            <div style="font-family:sans-serif;color:#1e293b;padding:24px;max-width:600px;margin:auto;">
              <h2 style="color:#2563eb;margin-top:0;">Friendly Reminder: Ticket #${t.id}</h2>
              <p>Hi ${escapeHtml(user.fullName || 'Customer')},</p>
              <p>Our team previously provided a response on ticket <strong>#${t.id}</strong>. Please let us know if our guidance resolved your issue or if you need additional help.</p>
              <p style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;font-size:14px;">
                <strong>Subject:</strong> ${escapeHtml(t.subject)}
              </p>
              <a href="${APP_URL}/dashboard?tab=support&ticketId=${t.id}" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:14px;">Open Ticket Thread</a>
            </div>
          `,
        }).catch((e) => console.warn('[Day 3 mail error]:', e.message));

        console.log(`[Automation] Ticket #${t.id} sent Day 3 reminder.`);
      }
    }
  } catch (err) {
    console.error('[Ticket Automation Engine Error]:', err.message);
  }
}

/**
 * Starts the periodic cron worker in server.js
 */
export function startTicketAutomationWorker() {
  console.log('[Automation Worker] Ticketing state machine daemon started (runs hourly).');
  // Run on startup
  runTicketAutomationCycle().catch(() => {});
  // Run every 60 minutes
  setInterval(runTicketAutomationCycle, 60 * 60 * 1000);
}
