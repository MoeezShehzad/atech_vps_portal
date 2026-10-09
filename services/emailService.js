import nodemailer from 'nodemailer';

// ==============================================================================
// Service: emailService.js
// Purpose: Enterprise Corporate Multi-Mailbox Dispatcher for ATC Cloud
//          Dedicated Transporters:
//          1. no-reply@atechconsult.com       -> Verification, Password Reset, VM Credentials
//          2. customer-support@atechconsult.com -> Ticket Desk, Contact Form, Support Chat
//          3. billing@atechconsult.com        -> Invoices, Receipts, Subscriptions
//          4. alerts@atechconsult.com         -> Infrastructure Alerts, System Monitoring
// ==============================================================================

const SMTP_HOST = process.env.SMTP_HOST || 'mail.atechconsult.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE === 'false' ? false : true;

// Helper to create hardened pooled transporter
function createMailTransporter(user, pass) {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
}

// 1. Dedicated Transporters
export const transporterSupport = createMailTransporter(
  process.env.SMTP_SUPPORT_USER || 'customer-support@atechconsult.com',
  process.env.SMTP_SUPPORT_PASS || 'uTJ5+5CbUG'
);

export const transporterNoReply = createMailTransporter(
  process.env.SMTP_NOREPLY_USER || 'no-reply@atechconsult.com',
  process.env.SMTP_NOREPLY_PASS || 'Q)9zVhm9BQ'
);

export const transporterBilling = createMailTransporter(
  process.env.SMTP_BILLING_USER || 'billing@atechconsult.com',
  process.env.SMTP_BILLING_PASS || '{tSvuZA9Wj'
);

export const transporterAlerts = createMailTransporter(
  process.env.SMTP_ALERTS_USER || 'alerts@atechconsult.com',
  process.env.SMTP_ALERTS_PASS || 'yykFkq[55g'
);

// Mail addresses
const NOREPLY_EMAIL = process.env.SMTP_NOREPLY_USER || 'no-reply@atechconsult.com';
const SUPPORT_EMAIL = process.env.SMTP_SUPPORT_USER || 'customer-support@atechconsult.com';
const BILLING_EMAIL = process.env.SMTP_BILLING_USER || 'billing@atechconsult.com';
const ALERTS_EMAIL = process.env.SMTP_ALERTS_USER || 'alerts@atechconsult.com';

const APP_URL = process.env.FRONTEND_URL || process.env.BACKEND_URL || 'https://vps.atechconsult.com';

// Helper for HTML escaping
export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Clean, Spacious, Modern ATC Email Template Wrapper
 * Avoids claustrophobic narrow cards / compressed invoice look.
 * Natural white background, elegant fluid container, clean typography.
 */
function wrapEmailTemplate({ title, subtitle, contentHtml, ctaText, ctaUrl, categoryBadge, footerNote }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
    <div style="background-color:#ffffff;width:100%;padding:32px 16px;">
      <div style="max-width:620px;margin:0 auto;">
        
        <!-- Minimal Brand Header -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
          <tr>
            <td align="left" style="vertical-align:middle;">
              <span style="font-size:20px;font-weight:800;letter-spacing:0.5px;color:#0f172a;text-transform:uppercase;">
                ATC <span style="color:#2563eb;">Cloud</span>
              </span>
            </td>
            ${categoryBadge ? `
            <td align="right" style="vertical-align:middle;">
              <span style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">
                ${escapeHtml(categoryBadge)}
              </span>
            </td>` : ''}
          </tr>
        </table>

        <!-- Header Title & Subtitle -->
        <div style="padding-top:28px;padding-bottom:12px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
            ${escapeHtml(title)}
          </h1>
          ${subtitle ? `
          <p style="margin:8px 0 0 0;font-size:15px;color:#64748b;line-height:1.5;">
            ${escapeHtml(subtitle)}
          </p>` : ''}
        </div>

        <!-- Main Body Content -->
        <div style="font-size:15px;line-height:1.65;color:#334155;padding-top:8px;">
          ${contentHtml}

          ${ctaText && ctaUrl ? `
          <div style="margin:32px 0 24px 0;">
            <a href="${ctaUrl}" style="background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 26px;border-radius:8px;display:inline-block;">
              ${escapeHtml(ctaText)} &rarr;
            </a>
            <p style="margin-top:14px;font-size:12px;color:#94a3b8;line-height:1.5;">
              If the button doesn't work, visit:<br/>
              <a href="${ctaUrl}" style="color:#2563eb;word-break:break-all;">${ctaUrl}</a>
            </p>
          </div>` : ''}
        </div>

        <!-- Clean, Lightweight Footer -->
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.6;">
          <p style="margin:0 0 4px 0;">
            ATC Cloud & Infrastructure Services • <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748b;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
          <p style="margin:0;">
            ${footerNote || 'This is an automated notification regarding your account.'}
          </p>
        </div>

      </div>
    </div>
  </body>
  </html>
  `;
}

// ==============================================================================
// 1. NO-REPLY TRANSMISSIONS (no-reply@atechconsult.com)
// ==============================================================================

/**
 * Account Email Verification Link
 */
export async function sendVerificationEmail(email, fullName, token) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const html = wrapEmailTemplate({
    title: 'Verify your email address',
    subtitle: `Welcome to ATC Cloud, ${fullName}!`,
    categoryBadge: 'Verification',
    contentHtml: `
      <p style="margin-top:0;">Thanks for signing up for an ATC Cloud account. Please confirm your email address to activate your portal and deploy your virtual machines.</p>
      <p style="font-size:13px;color:#64748b;margin-bottom:0;">This verification link will remain active for 24 hours.</p>
    `,
    ctaText: 'Verify Email Address',
    ctaUrl: verifyUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: 'Verify your ATC Cloud account',
      html,
    });
    console.log(`[No-Reply] Verification email sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[No-Reply Error] Verification failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Password Reset Link
 */
export async function sendPasswordResetEmail(email, fullName, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = wrapEmailTemplate({
    title: 'Reset your password',
    subtitle: `Hi ${fullName || 'there'},`,
    categoryBadge: 'Security',
    contentHtml: `
      <p style="margin-top:0;">We received a request to reset your password for your ATC Cloud account.</p>
      <p>Click the button below to choose a new password. If you didn't request a password reset, you can safely ignore this email.</p>
      <p style="font-size:13px;color:#64748b;margin-bottom:0;">For your security, this link is valid for 1 hour.</p>
    `,
    ctaText: 'Reset Password',
    ctaUrl: resetUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: 'Reset your ATC Cloud password',
      html,
    });
    console.log(`[No-Reply] Password reset email sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[No-Reply Error] Password reset failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * VM Provisioned & Credentials Ready Notification
 */
export async function sendVmProvisionedEmail({ email, fullName, vmName, ipAddress, username, password, os }) {
  const portalUrl = `${APP_URL}/dashboard`;
  const html = wrapEmailTemplate({
    title: `Your server "${escapeHtml(vmName)}" is ready`,
    subtitle: `Hi ${escapeHtml(fullName || 'Customer')}, your virtual machine is deployed and online.`,
    categoryBadge: 'Cloud Compute',
    contentHtml: `
      <p style="margin-top:0;">Your new cloud instance has been successfully allocated on the ATC infrastructure with dedicated resources.</p>
      
      <div style="background-color:#0f172a;color:#f8fafc;padding:18px 22px;border-radius:10px;margin:22px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.7;">
        <div style="color:#38bdf8;font-weight:700;font-family:-apple-system,sans-serif;font-size:12px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Access Credentials</div>
        <div>Hostname: <span style="color:#ffffff;">${escapeHtml(vmName)}</span></div>
        <div>Public IP: <span style="color:#4ade80;font-weight:600;">${escapeHtml(ipAddress)}</span></div>
        <div>OS: <span style="color:#ffffff;">${escapeHtml(os || 'Linux')}</span></div>
        <div>Username: <span style="color:#ffffff;">${escapeHtml(username || 'root')}</span></div>
        <div>Initial Password: <span style="color:#facc15;">${escapeHtml(password)}</span></div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #1e293b;color:#94a3b8;font-size:12px;">
          Quick Connect:<br/>
          <code style="color:#38bdf8;">ssh ${escapeHtml(username || 'root')}@${escapeHtml(ipAddress)}</code>
        </div>
      </div>

      <p style="font-size:13px;color:#64748b;margin-bottom:0;">You can manage power, snapshots, and web console directly from your dashboard.</p>
    `,
    ctaText: 'Open Cloud Console',
    ctaUrl: portalUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: `Your server "${vmName}" is ready to connect`,
      html,
    });
    console.log(`[No-Reply] VM provision email sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[No-Reply Error] VM provision email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// 2. CUSTOMER SUPPORT TRANSMISSIONS (customer-support@atechconsult.com)
// ==============================================================================

/**
 * Public Contact Form Submission (Support Team Alert + Auto-Ack to Visitor)
 */
export async function sendContactFormNotification({ fullName, email, message }) {
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeMsg = escapeHtml(message).replace(/\n/g, '<br/>');

  // A. Alert Support Desk
  const teamHtml = wrapEmailTemplate({
    title: `Inquiry from ${safeName}`,
    subtitle: `Submitted via website contact form`,
    categoryBadge: 'New Lead',
    contentHtml: `
      <p style="margin-top:0;"><strong>Sender:</strong> ${safeName} (<a href="mailto:${safeEmail}" style="color:#2563eb;">${safeEmail}</a>)</p>
      <div style="background-color:#f8fafc;padding:16px 20px;border-radius:8px;border-left:3px solid #2563eb;margin:18px 0;font-size:14px;color:#1e293b;line-height:1.6;">
        ${safeMsg}
      </div>
    `,
    ctaText: 'Reply via Email',
    ctaUrl: `mailto:${safeEmail}?subject=Re:%20Inquiry%20from%20ATC%20Contact%20Form`,
  });

  await transporterSupport.sendMail({
    from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `[Contact Form] Inquiry from ${safeName}`,
    html: teamHtml,
  });

  // B. Auto-acknowledgement to visitor
  const visitorHtml = wrapEmailTemplate({
    title: 'We received your message',
    subtitle: `Hi ${safeName}, thanks for reaching out.`,
    categoryBadge: 'Customer Support',
    contentHtml: `
      <p style="margin-top:0;">Our support team has received your inquiry and is reviewing your message. One of our engineers will follow up with you directly shortly.</p>
      <div style="background-color:#f8fafc;padding:14px 18px;border-radius:8px;margin:18px 0;font-size:13px;color:#475569;line-height:1.6;">
        <strong style="color:#0f172a;">Your Message:</strong><br/>
        ${safeMsg}
      </div>
    `,
    ctaText: 'Visit ATC Cloud',
    ctaUrl: APP_URL,
  });

  try {
    const info = await transporterSupport.sendMail({
      from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
      to: email,
      subject: 'We received your message - ATC Customer Support',
      html: visitorHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Support Error] Contact ack failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Support Ticket Created (Alerts Support + Receipts Customer)
 */
export async function sendTicketCreatedNotification({ ticket, customerEmail, customerName }) {
  const safeSubject = escapeHtml(ticket.subject);
  const safeMsg = escapeHtml(ticket.message).replace(/\n/g, '<br/>');
  const ticketUrl = `${APP_URL}/dashboard?tab=support&ticketId=${ticket.id}`;

  // A. Notify Support Desk
  const adminHtml = wrapEmailTemplate({
    title: `Ticket #${ticket.id}: ${safeSubject}`,
    subtitle: `From: ${escapeHtml(customerName || customerEmail)} • Priority: ${ticket.priority}`,
    categoryBadge: 'Support Desk',
    contentHtml: `
      <p style="margin-top:0;">A customer has submitted a new support request.</p>
      <div style="background-color:#f8fafc;padding:16px 20px;border-radius:8px;border-left:3px solid #2563eb;margin:18px 0;font-size:14px;color:#1e293b;line-height:1.6;">
        ${safeMsg}
      </div>
    `,
    ctaText: 'View in Admin Helpdesk',
    ctaUrl: `${APP_URL}/admin?tab=tickets&ticketId=${ticket.id}`,
  });

  await transporterSupport.sendMail({
    from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
    to: SUPPORT_EMAIL,
    replyTo: customerEmail,
    subject: `[Ticket #${ticket.id}] [${ticket.priority}] ${ticket.subject}`,
    html: adminHtml,
  });

  // B. Customer Confirmation Receipt
  const customerHtml = wrapEmailTemplate({
    title: `Support Request Received [#${ticket.id}]`,
    subtitle: `Hi ${escapeHtml(customerName || 'Customer')}, we're on it.`,
    categoryBadge: 'Helpdesk',
    contentHtml: `
      <p style="margin-top:0;">Your support ticket <strong>#${ticket.id}</strong> has been logged into our queue. A member of our technical team will review it and reply as soon as possible.</p>
      
      <div style="background-color:#f8fafc;padding:14px 18px;border-radius:8px;margin:18px 0;font-size:13px;line-height:1.6;">
        <div><strong>Subject:</strong> ${safeSubject}</div>
        <div><strong>Priority:</strong> ${ticket.priority}</div>
        <div style="margin-top:8px;color:#475569;">${safeMsg}</div>
      </div>

      <p style="font-size:13px;color:#64748b;margin-bottom:0;">You can check status or reply anytime in the Ticket Center.</p>
    `,
    ctaText: 'View Ticket Thread',
    ctaUrl: ticketUrl,
  });

  try {
    const info = await transporterSupport.sendMail({
      from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
      to: customerEmail,
      subject: `[Ticket #${ticket.id}] We received your support request: ${ticket.subject}`,
      html: customerHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Support Error] Ticket confirmation failed for ${customerEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Support Ticket Reply (Dispatches to Customer or Support Team)
 */
export async function sendTicketReplyNotification({
  ticket,
  senderName,
  message,
  recipientEmail,
  isCustomerRecipient,
}) {
  const safeMsg = escapeHtml(message).replace(/\n/g, '<br/>');
  const targetUrl = isCustomerRecipient
    ? `${APP_URL}/dashboard?tab=support&ticketId=${ticket.id}`
    : `${APP_URL}/admin?tab=tickets&ticketId=${ticket.id}`;

  const html = wrapEmailTemplate({
    title: `New update on Ticket #${ticket.id}`,
    subtitle: `${escapeHtml(senderName)} posted a response`,
    categoryBadge: 'Ticket Reply',
    contentHtml: `
      <div style="background-color:#f8fafc;padding:16px 20px;border-radius:8px;border-left:3px solid #16a34a;margin:16px 0;font-size:14px;color:#1e293b;line-height:1.65;">
        ${safeMsg}
      </div>
      <p style="font-size:13px;color:#64748b;margin-bottom:0;">Click the button below to view the conversation or reply directly.</p>
    `,
    ctaText: isCustomerRecipient ? 'Reply to Ticket' : 'Open in Admin Desk',
    ctaUrl: targetUrl,
  });

  try {
    const info = await transporterSupport.sendMail({
      from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
      to: recipientEmail,
      subject: `[Update] Ticket #${ticket.id}: ${ticket.subject}`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Support Error] Ticket reply notification failed for ${recipientEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// 3. BILLING & INVOICING TRANSMISSIONS (billing@atechconsult.com)
// ==============================================================================

/**
 * Invoice Generated & Payment Receipt
 */
export async function sendInvoiceReceiptEmail({ email, fullName, invoiceNumber, amount, planName, currency = 'USD' }) {
  const invoiceUrl = `${APP_URL}/dashboard?tab=billing`;
  const html = wrapEmailTemplate({
    title: `Payment Receipt: ${escapeHtml(invoiceNumber)}`,
    subtitle: `Hi ${escapeHtml(fullName || 'Customer')}, here is your payment receipt.`,
    categoryBadge: 'Billing',
    contentHtml: `
      <p style="margin-top:0;">Thank you for your payment. Your cloud service has been activated.</p>
      
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:20px 0;">
        <table width="100%" cellpadding="12" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
          <tr style="background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;font-size:13px;font-weight:600;">Description</td>
            <td align="right" style="color:#64748b;font-size:13px;font-weight:600;">Amount</td>
          </tr>
          <tr>
            <td>
              <strong>${escapeHtml(planName || 'Cloud VPS Compute Plan')}</strong><br/>
              <span style="font-size:12px;color:#64748b;">Invoice ${escapeHtml(invoiceNumber)} • Paid</span>
            </td>
            <td align="right" style="font-size:16px;font-weight:700;color:#0f172a;">
              $${Number(amount).toFixed(2)} ${escapeHtml(currency)}
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:#64748b;margin-bottom:0;">You can view and download your full printable PDF invoice anytime from the Billing & Invoices section.</p>
    `,
    ctaText: 'View Invoices in Portal',
    ctaUrl: invoiceUrl,
    footerNote: 'ATC Cloud Billing • For billing inquiries, reply to this email or contact billing@atechconsult.com',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Billing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Receipt] Invoice ${invoiceNumber} ($${Number(amount).toFixed(2)} ${currency})`,
      html,
    });
    console.log(`[Billing] Receipt sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Billing Error] Invoice receipt failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// 4. INFRASTRUCTURE & SECURITY ALERTS (alerts@atechconsult.com)
// ==============================================================================

/**
 * Infrastructure & Security Alert Dispatcher
 */
export async function sendSystemAlertEmail({ subject, alertLevel = 'WARNING', details, targetEmail }) {
  const destEmail = targetEmail || ALERTS_EMAIL;
  const isCritical = alertLevel === 'CRITICAL' || alertLevel === 'DANGER';

  const html = wrapEmailTemplate({
    title: subject,
    subtitle: `Alert Level: ${alertLevel}`,
    categoryBadge: alertLevel,
    contentHtml: `
      <div style="background-color:#f8fafc;padding:16px 20px;border-radius:8px;border-left:3px solid ${isCritical ? '#dc2626' : '#f59e0b'};margin:16px 0;font-size:14px;color:#1e293b;line-height:1.6;">
        ${escapeHtml(details)}
      </div>
      <p style="font-size:12px;color:#94a3b8;margin-bottom:0;">Timestamp: ${new Date().toUTCString()} • Source: Hyper-V Cluster Node</p>
    `,
    ctaText: 'Open System Telemetry',
    ctaUrl: `${APP_URL}/admin?tab=overview`,
    footerNote: 'ATC Cloud Automated Monitoring System',
  });

  try {
    const info = await transporterAlerts.sendMail({
      from: `"ATC Alerts" <${ALERTS_EMAIL}>`,
      to: destEmail,
      subject: `[${alertLevel}] ${subject}`,
      html,
    });
    console.log(`[Alerts] Alert sent to ${destEmail} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Alerts Error] Alert dispatch failed:`, err.message);
    return { success: false, error: err.message };
  }
}

export default {
  transporterSupport,
  transporterNoReply,
  transporterBilling,
  transporterAlerts,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVmProvisionedEmail,
  sendContactFormNotification,
  sendTicketCreatedNotification,
  sendTicketReplyNotification,
  sendInvoiceReceiptEmail,
  sendSystemAlertEmail,
};
