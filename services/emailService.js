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
  process.env.SMTP_SUPPORT_PASS || 'Admin@123'
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
 * Universal ATC Branded Email Template Wrapper
 */
function wrapEmailTemplate({ title, subtitle, contentHtml, ctaText, ctaUrl, categoryBadge = 'PORTAL', footerNote }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:30px 10px;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
            <!-- Header -->
            <tr>
              <td style="background:#0f172a;padding:26px 36px;text-align:left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <span style="font-size:22px;font-weight:800;letter-spacing:1px;color:#ffffff;text-transform:uppercase;">
                        ATC <span style="color:#38bdf8;">Cloud</span>
                      </span>
                      <div style="font-size:12px;color:#94a3b8;margin-top:3px;">Next-Gen VPS Infrastructure & Data Services</div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="background:rgba(56,189,248,0.15);color:#38bdf8;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:4px 10px;border-radius:999px;border:1px solid rgba(56,189,248,0.3);text-transform:uppercase;">
                        ${escapeHtml(categoryBadge)}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Title & Subtitle Banner -->
            <tr>
              <td style="padding:28px 36px 12px 36px;border-bottom:1px solid #f1f5f9;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">${escapeHtml(title)}</h1>
                ${subtitle ? `<p style="margin:6px 0 0 0;font-size:14px;color:#64748b;">${escapeHtml(subtitle)}</p>` : ''}
              </td>
            </tr>

            <!-- Main Body Content -->
            <tr>
              <td style="padding:24px 36px;font-size:14px;line-height:1.6;color:#334155;">
                ${contentHtml}

                ${ctaText && ctaUrl ? `
                <div style="margin:30px 0 20px 0;text-align:center;">
                  <a href="${ctaUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;display:inline-block;box-shadow:0 4px 10px rgba(37,99,235,0.25);">
                    ${escapeHtml(ctaText)} &rarr;
                  </a>
                  <p style="margin-top:12px;font-size:11px;color:#94a3b8;">
                    If the button does not work, copy and paste this link in your browser:<br/>
                    <a href="${ctaUrl}" style="color:#2563eb;word-break:break-all;">${ctaUrl}</a>
                  </p>
                </div>` : ''}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
                <p style="margin:0 0 6px 0;">ATC Consulting & Data Center Portal • <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;text-decoration:none;">${SUPPORT_EMAIL}</a></p>
                <p style="margin:0;font-size:11px;color:#94a3b8;">${footerNote || 'This is an automated message from ATC Cloud Platform.'}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
    title: 'Verify Your Email Address',
    subtitle: `Welcome to ATC Cloud, ${fullName}!`,
    categoryBadge: 'SECURITY',
    contentHtml: `
      <p>Thank you for signing up for an ATC Cloud account. Please confirm your email address to activate your dashboard and deploy virtual machines.</p>
      <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:14px;margin:20px 0;border-radius:4px;">
        <strong style="color:#1e40af;">Security Notice:</strong> This activation link will expire in 24 hours.
      </div>
    `,
    ctaText: 'Activate My Account',
    ctaUrl: verifyUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: 'Activate Your ATC Cloud Account - Verify Email',
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
    title: 'Password Reset Request',
    subtitle: `Hi ${fullName || 'Customer'},`,
    categoryBadge: 'SECURITY',
    contentHtml: `
      <p>We received a request to reset the password for your ATC Cloud Portal account.</p>
      <p>Click the button below to set a new password. If you did not make this request, you can safely ignore this email; your account remains secure.</p>
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px;margin:20px 0;border-radius:4px;">
        <strong style="color:#b45309;">Expires Soon:</strong> For your security, this password reset link will expire in 1 hour.
      </div>
    `,
    ctaText: 'Reset Password',
    ctaUrl: resetUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud Security" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: 'Reset Your ATC Cloud Password',
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
    title: 'Your Virtual Machine is Online!',
    subtitle: `Server "${escapeHtml(vmName)}" is provisioned and ready`,
    categoryBadge: 'CLOUD DEPLOY',
    contentHtml: `
      <p>Hi ${escapeHtml(fullName || 'Customer')},</p>
      <p>Your cloud instance has been successfully deployed on the ATC Data Center Windows Hyper-V cluster with assigned IP connectivity.</p>
      <div style="background:#0f172a;color:#f8fafc;padding:18px;border-radius:10px;margin:20px 0;font-family:monospace;font-size:13px;">
        <div style="color:#38bdf8;font-weight:bold;margin-bottom:8px;font-family:sans-serif;">SERVER CONNECTION CREDENTIALS:</div>
        <div>Hostname: <span style="color:#ffffff;">${escapeHtml(vmName)}</span></div>
        <div>IP Address: <span style="color:#4ade80;">${escapeHtml(ipAddress)}</span></div>
        <div>Operating System: <span style="color:#ffffff;">${escapeHtml(os || 'Linux')}</span></div>
        <div>SSH Username: <span style="color:#ffffff;">${escapeHtml(username || 'root')}</span></div>
        <div>Initial Password: <span style="color:#facc15;">${escapeHtml(password)}</span></div>
        <div style="margin-top:10px;color:#94a3b8;font-size:12px;">Quick SSH Command:<br/><code style="color:#e2e8f0;background:#1e293b;padding:4px 8px;border-radius:4px;display:inline-block;margin-top:4px;">ssh ${escapeHtml(username || 'root')}@${escapeHtml(ipAddress)}</code></div>
      </div>
      <p style="font-size:12px;color:#dc2626;"><strong>Security Tip:</strong> We recommend changing your root password immediately upon your initial login.</p>
    `,
    ctaText: 'Access Server in Dashboard',
    ctaUrl: portalUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud Provisioning" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: `[Ready] Your Server "${vmName}" is Provisioned and Online`,
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
    title: 'New Public Contact Inquiry',
    subtitle: `Inquiry submitted via Landing Page Contact Form`,
    categoryBadge: 'INQUIRY',
    contentHtml: `
      <table width="100%" cellpadding="6" style="border-collapse:collapse;margin-bottom:16px;">
        <tr><td width="120" style="color:#64748b;font-weight:600;">Full Name:</td><td><strong>${safeName}</strong></td></tr>
        <tr><td style="color:#64748b;font-weight:600;">Email:</td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      </table>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-top:12px;">
        <strong style="color:#0f172a;display:block;margin-bottom:8px;">Customer Inquiry Message:</strong>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">${safeMsg}</p>
      </div>
    `,
    ctaText: 'Reply Directly to Visitor',
    ctaUrl: `mailto:${safeEmail}?subject=Re:%20Inquiry%20from%20ATC%20Contact%20Form`,
  });

  await transporterSupport.sendMail({
    from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `[Contact Form] Inquiry from ${safeName} (${safeEmail})`,
    html: teamHtml,
  });

  // B. Auto-acknowledgement to visitor
  const visitorHtml = wrapEmailTemplate({
    title: 'We Received Your Message',
    subtitle: `Hi ${safeName}, thanks for contacting ATC Cloud Support!`,
    categoryBadge: 'SUPPORT',
    contentHtml: `
      <p>This is to confirm that our customer support engineers have received your inquiry. A representative will review your message and respond directly to this email shortly.</p>
      <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
        <strong style="color:#475569;font-size:12px;text-transform:uppercase;">Summary of your request:</strong>
        <p style="margin:6px 0 0 0;font-size:13px;color:#64748b;">${safeMsg}</p>
      </div>
      <p>If your inquiry is urgent, you may also log in to your portal and submit a high-priority ticket in the Ticket Center.</p>
    `,
    ctaText: 'Visit ATC Portal',
    ctaUrl: APP_URL,
  });

  try {
    const info = await transporterSupport.sendMail({
      from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
      to: email,
      subject: 'We Received Your Inquiry - ATC Customer Support',
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
    title: `New Ticket #${ticket.id}: ${safeSubject}`,
    subtitle: `Priority: ${ticket.priority} | Customer: ${escapeHtml(customerName || customerEmail)}`,
    categoryBadge: 'TICKET OPEN',
    contentHtml: `
      <table width="100%" cellpadding="6" style="border-collapse:collapse;margin-bottom:14px;">
        <tr><td width="120" style="color:#64748b;font-weight:600;">Ticket ID:</td><td>#${ticket.id}</td></tr>
        <tr><td style="color:#64748b;font-weight:600;">Customer:</td><td>${escapeHtml(customerName)} (${escapeHtml(customerEmail)})</td></tr>
        <tr><td style="color:#64748b;font-weight:600;">Priority:</td><td><strong style="color:${ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? '#dc2626' : '#2563eb'};">${ticket.priority}</strong></td></tr>
        <tr><td style="color:#64748b;font-weight:600;">Status:</td><td>${ticket.status}</td></tr>
      </table>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;">
        <strong style="color:#0f172a;display:block;margin-bottom:6px;">Initial Issue Description:</strong>
        <p style="margin:0;font-size:14px;color:#334155;">${safeMsg}</p>
      </div>
    `,
    ctaText: 'Open in Admin Ticket Center',
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
    title: `Support Ticket Received [#${ticket.id}]`,
    subtitle: `Subject: ${safeSubject}`,
    categoryBadge: 'HELP DESK',
    contentHtml: `
      <p>Hi ${escapeHtml(customerName || 'Customer')},</p>
      <p>Your support ticket has been received by our engineering desk. An engineer has been assigned and is reviewing your issue.</p>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Ticket Details:</p>
        <p style="margin:0 0 4px 0;font-size:14px;"><strong>Ticket Number:</strong> #${ticket.id}</p>
        <p style="margin:0 0 4px 0;font-size:14px;"><strong>Priority:</strong> ${ticket.priority}</p>
        <p style="margin:0 0 8px 0;font-size:14px;"><strong>Status:</strong> ${ticket.status}</p>
        <div style="border-top:1px dashed #cbd5e1;padding-top:8px;margin-top:8px;">
          <strong style="font-size:13px;color:#475569;">Description:</strong>
          <p style="margin:4px 0 0 0;font-size:13px;color:#64748b;">${safeMsg}</p>
        </div>
      </div>
      <p>You can track updates or reply directly at any time by clicking the button below.</p>
    `,
    ctaText: 'View Ticket in Customer Portal',
    ctaUrl: ticketUrl,
  });

  try {
    const info = await transporterSupport.sendMail({
      from: `"ATC Customer Support" <${SUPPORT_EMAIL}>`,
      to: customerEmail,
      subject: `[Ticket #${ticket.id}] We have received your support request: ${ticket.subject}`,
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
    title: `New Reply on Ticket #${ticket.id}`,
    subtitle: `Subject: ${escapeHtml(ticket.subject)}`,
    categoryBadge: 'SUPPORT REPLY',
    contentHtml: `
      <p><strong>${escapeHtml(senderName)}</strong> posted a new update to this ticket thread:</p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:16px 0;border-radius:4px;">
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">${safeMsg}</p>
      </div>
      <p style="font-size:13px;color:#64748b;">To continue this conversation or view the full thread history, click below to open the ticket console.</p>
    `,
    ctaText: isCustomerRecipient ? 'View Ticket & Reply' : 'Open Ticket in Admin Desk',
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
    title: 'Payment Receipt & Invoice Confirmation',
    subtitle: `Thank you for your business with ATC Cloud, ${fullName || 'Customer'}`,
    categoryBadge: 'BILLING',
    contentHtml: `
      <p>This email confirms that your subscription invoice has been processed successfully.</p>
      <div style="background:#f8fafc;padding:18px;border-radius:10px;border:1px solid #e2e8f0;margin:18px 0;">
        <table width="100%" cellpadding="6" style="border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="color:#64748b;">Invoice Number:</td>
            <td align="right"><strong>${escapeHtml(invoiceNumber)}</strong></td>
          </tr>
          <tr>
            <td style="color:#64748b;">Plan / Service:</td>
            <td align="right">${escapeHtml(planName || 'Cloud VPS Subscription')}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Amount Paid:</td>
            <td align="right" style="color:#16a34a;font-weight:bold;font-size:16px;">$${Number(amount).toFixed(2)} ${escapeHtml(currency)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Status:</td>
            <td align="right"><span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:999px;">PAID</span></td>
          </tr>
        </table>
      </div>
      <p style="font-size:13px;color:#64748b;">You can view and download your full itemized PDF invoice anytime from the Billing & Invoices section of your customer portal.</p>
    `,
    ctaText: 'View Invoices in Portal',
    ctaUrl: invoiceUrl,
    footerNote: 'ATC Cloud Billing Department • For billing questions, reply to this email or contact billing@atechconsult.com',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Billing & Invoicing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Receipt] Invoice ${invoiceNumber} - $${Number(amount).toFixed(2)} ${currency}`,
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
  const badgeColor = isCritical ? '#dc2626' : '#f59e0b';

  const html = wrapEmailTemplate({
    title: `Infrastructure Alert: ${escapeHtml(subject)}`,
    subtitle: `Alert Level: ${alertLevel}`,
    categoryBadge: alertLevel,
    contentHtml: `
      <div style="background:${isCritical ? '#fef2f2' : '#fffbeb'};border-left:4px solid ${badgeColor};padding:16px;border-radius:4px;margin-bottom:16px;">
        <strong style="color:${badgeColor};font-size:14px;">Cluster Telemetry Event Triggered</strong>
        <p style="margin:8px 0 0 0;font-size:13px;color:#334155;line-height:1.6;">${escapeHtml(details)}</p>
      </div>
      <p style="font-size:12px;color:#64748b;">Timestamp: ${new Date().toUTCString()} | Node: Windows Hyper-V Cluster Primary</p>
    `,
    ctaText: 'Open Admin Telemetry',
    ctaUrl: `${APP_URL}/admin?tab=overview`,
    footerNote: 'ATC Cloud Automated Monitoring System • alerts@atechconsult.com',
  });

  try {
    const info = await transporterAlerts.sendMail({
      from: `"ATC Infrastructure Alerts" <${ALERTS_EMAIL}>`,
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
