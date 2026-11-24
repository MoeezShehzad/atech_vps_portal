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

const APP_URL = process.env.FRONTEND_URL || process.env.BACKEND_URL || 'https://www.atechconsult.com';
const ATC_LOGO_URL = 'https://www.atechconsult.com/ATC_Logo.png';
const TERMS_CONTRACT_URL = 'https://www.atechconsult.com/Terms&Conditions';

function formatUSCentralEmailTime(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(d);
}

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
 * Clean, Spacious, Modern ATC Corporate Email Template Wrapper
 * Features official ATC Logo header, refined typography, and executive layout.
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
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
    <div style="background-color:#f8fafc;width:100%;padding:32px 16px;box-sizing:border-box;">
      <div style="max-width:620px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px 32px 28px 32px;box-sizing:border-box;">
        
        <!-- Corporate Brand Header with Official ATC Logo -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;border-bottom:1px solid #e2e8f0;">
          <tr>
            <td align="left" style="vertical-align:middle;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${ATC_LOGO_URL}" alt="ATC Logo" width="54" style="display:block;height:auto;max-height:38px;width:auto;border:0;outline:none;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:16px;font-weight:800;letter-spacing:0.2px;color:#0f172a;line-height:1.2;">
                      Analytical Technical Consulting <span style="color:#2563eb;">(ATC)</span>
                    </div>
                    <div style="font-size:11px;font-weight:600;color:#64748b;letter-spacing:0.3px;margin-top:2px;">
                      Cloud Infrastructure &amp; Enterprise Hosting
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            ${categoryBadge ? `
            <td align="right" style="vertical-align:middle;padding-left:8px;">
              <span style="display:inline-block;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:4px 10px;font-size:10px;font-weight:700;color:#1d4ed8;letter-spacing:0.5px;text-transform:uppercase;white-space:nowrap;">
                ${escapeHtml(categoryBadge)}
              </span>
            </td>` : ''}
          </tr>
        </table>

        <!-- Header Title & Subtitle -->
        <div style="padding-top:26px;padding-bottom:12px;">
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
            ${escapeHtml(title)}
          </h1>
          ${subtitle ? `
          <p style="margin:8px 0 0 0;font-size:14px;color:#64748b;line-height:1.5;">
            ${escapeHtml(subtitle)}
          </p>` : ''}
        </div>

        <!-- Main Body Content -->
        <div style="font-size:15px;line-height:1.65;color:#334155;padding-top:8px;">
          ${contentHtml}

          ${ctaText && ctaUrl ? `
          <div style="margin:28px 0 20px 0;">
            <a href="${ctaUrl}" style="background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:10px;display:inline-block;">
              ${escapeHtml(ctaText)} &rarr;
            </a>
            <p style="margin-top:14px;font-size:12px;color:#94a3b8;line-height:1.5;">
              If the button doesn't work, visit:<br/>
              <a href="${ctaUrl}" style="color:#2563eb;word-break:break-all;">${ctaUrl}</a>
            </p>
          </div>` : ''}
        </div>

        <!-- Clean, Lightweight Footer -->
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.6;">
          <p style="margin:0 0 4px 0;color:#64748b;font-weight:600;">
            Analytical Technical Consulting (ATC) • <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
          <p style="margin:0;">
            ${footerNote || 'This is an automated notification regarding your ATC Cloud account.'}
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
}
}

/**
 * Professional One-Time Password (OTP) Email Dispatcher
 */
export async function sendOtpEmail({
  email,
  fullName,
  otpCode,
  purpose = 'VERIFY_EMAIL',
  fallbackToken = null,
  clientMeta = {},
}) {
  let title = 'Your Security Verification Code';
  let subtitle = `Welcome to ATC Cloud, ${fullName || 'there'}!`;
  let categoryBadge = 'One-Time Passcode';
  let subject = `${otpCode} is your ATC Cloud verification code`;
  let instruction = 'Enter the following 6-digit code in the portal to verify your email address and activate your cloud account:';

  if (purpose === 'PASSWORD_RESET') {
    title = 'Password Reset Security Code';
    subtitle = `Hi ${fullName || 'there'},`;
    categoryBadge = 'Account Security';
    subject = `${otpCode} is your ATC Cloud password recovery code`;
    instruction = 'We received a request to reset your portal password. Enter the 6-digit code below to set new account credentials:';
  } else if (purpose === 'LOGIN_OTP' || purpose === 'LOGIN_2FA') {
    title = 'Sign-In Authentication Code';
    subtitle = `Hi ${fullName || 'there'},`;
    categoryBadge = 'Two-Factor Authentication';
    subject = `${otpCode} is your ATC Cloud sign-in code`;
    instruction = 'A login attempt requires step-up verification. Enter this code to authorize your session:';
  } else if (purpose === 'SUDO_ACTION') {
    title = 'Privileged Action Verification (SUDO)';
    subtitle = `Hi ${fullName || 'there'},`;
    categoryBadge = 'Step-Up Authentication';
    subject = `${otpCode} is your privileged action authorization code`;
    instruction = 'A sensitive infrastructure operation requires administrative authorization. Enter this code to proceed:';
  }

  // Format code with wide spacing for maximum visual clarity
  const formattedCode = String(otpCode).split('').join(' ');
  const fallbackUrl = fallbackToken 
    ? (purpose === 'PASSWORD_RESET' ? `${APP_URL}/reset-password?token=${fallbackToken}` : `${APP_URL}/api/auth/verify-email?token=${fallbackToken}`)
    : null;

  const reqIp = clientMeta.ip || 'Undisclosed';
  const reqTime = clientMeta.timestamp || new Date().toUTCString();
  const reqAgent = clientMeta.userAgent ? String(clientMeta.userAgent).slice(0, 100) : 'Standard Web Browser';

  const contentHtml = `
    <p style="margin-top:0;font-size:15px;color:#334155;line-height:1.6;">
      ${instruction}
    </p>

    <!-- Prominent OTP Code Container -->
    <div style="text-align:center;margin:28px 0;padding:26px 20px;background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">
        ${purpose === 'PASSWORD_RESET' || purpose === 'SUDO_ACTION' ? 'ONE-TIME SECURITY CODE' : 'ONE-TIME PASSCODE'}
      </div>
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:38px;font-weight:800;letter-spacing:14px;color:#38bdf8;padding:8px 0;">
        ${formattedCode}
      </div>
      <p style="margin:8px 0 0 0;font-size:12px;color:#cbd5e1;line-height:1.5;">
        ⏱️ This security code is valid for <strong>5 minutes</strong> only.
      </p>
    </div>

    <!-- Context & Anti-Phishing Details -->
    <div style="margin:24px 0;padding:16px 18px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:12px;color:#475569;line-height:1.7;">
      <div style="font-weight:700;color:#1e293b;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;font-size:11px;">
        🛡️ Request Security Details
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr>
          <td style="color:#64748b;padding:3px 0;width:120px;">Request Time:</td>
          <td style="color:#0f172a;font-weight:600;padding:3px 0;">${escapeHtml(reqTime)}</td>
        </tr>
        <tr>
          <td style="color:#64748b;padding:3px 0;">Client Agent:</td>
          <td style="color:#0f172a;padding:3px 0;">${escapeHtml(reqAgent)}</td>
        </tr>
      </table>
      <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #cbd5e1;color:#b91c1c;font-size:11.5px;line-height:1.5;">
        <strong>⚠️ Security Warning:</strong> If you did not initiate this request, someone may be attempting to access your cloud resources. Immediately change your password and revoke all active sessions. Analytical Technical Consulting (ATC) engineers will <em>never</em> ask for this code.
      </div>
    </div>

    ${fallbackUrl ? `
    <div style="margin:24px 0 16px 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
      <p style="margin:0 0 8px 0;">Prefer direct link verification?</p>
      <a href="${fallbackUrl}" style="color:#2563eb;font-weight:600;text-decoration:underline;word-break:break-all;">
        Click here to ${purpose === 'PASSWORD_RESET' ? 'reset your password directly' : 'verify your account in one click'} &rarr;
      </a>
    </div>
    ` : ''}
  `;

  const html = wrapEmailTemplate({
    title,
    subtitle,
    categoryBadge,
    contentHtml,
    footerNote: 'ATC Cloud Identity & Access Protection • Automated Security Dispatch',
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud Security" <${NOREPLY_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    console.log(`[No-Reply OTP] Code sent to ${email} (Purpose: ${purpose}, Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[No-Reply OTP Error] Failed to send code to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}


/**
 * VM Provisioned & Credentials Ready Notification
 */
export async function sendVmProvisionedEmail({ email, fullName, vmName, ipAddress, username, password, os }) {
  const portalUrl = `${APP_URL}/dashboard`;
  const isWindows = (os && os.toLowerCase().includes('windows')) || (username && username.toLowerCase() === 'administrator');

  const connectionBlock = isWindows
    ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #1e293b;color:#94a3b8;font-size:12px;">
          Quick Connect (RDP & Web Desktop):<br/>
          <div style="margin-top:4px;">• <strong>In-Browser Web Desktop:</strong> Click <em>"Desktop"</em> on your VM in the ATC Dashboard.</div>
          <div>• <strong>Native Remote Desktop:</strong> Connect via Microsoft Remote Desktop to <code>${escapeHtml(ipAddress)}:3389</code></div>
        </div>
      `
    : `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #1e293b;color:#94a3b8;font-size:12px;">
          Quick Connect:<br/>
          <code style="color:#38bdf8;">ssh ${escapeHtml(username || 'ubuntu')}@${escapeHtml(ipAddress)}</code>
        </div>
      `;

  const html = wrapEmailTemplate({
    title: `Your server "${escapeHtml(vmName)}" is ready`,
    subtitle: `Hi ${escapeHtml(fullName || 'Customer')}, your virtual machine is deployed and online.`,
    categoryBadge: isWindows ? 'Windows Cloud' : 'Cloud Compute',
    contentHtml: `
      <p style="margin-top:0;">Your new cloud instance has been successfully allocated on the ATC infrastructure with dedicated resources.</p>
      
      <div style="background-color:#0f172a;color:#f8fafc;padding:18px 22px;border-radius:10px;margin:22px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.7;">
        <div style="color:#38bdf8;font-weight:700;font-family:-apple-system,sans-serif;font-size:12px;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Access Credentials</div>
        <div>Hostname: <span style="color:#ffffff;">${escapeHtml(vmName)}</span></div>
        <div>Public / Gateway IP: <span style="color:#4ade80;font-weight:600;">${escapeHtml(ipAddress)}</span></div>
        <div>OS: <span style="color:#ffffff;">${escapeHtml(os || (isWindows ? 'Windows 10 Pro' : 'Linux'))}</span></div>
        <div>Username: <span style="color:#ffffff;">${escapeHtml(username || (isWindows ? 'Administrator' : 'ubuntu'))}</span></div>
        <div>Initial Password: <span style="color:#facc15;">${escapeHtml(password)}</span></div>
        ${connectionBlock}
      </div>

      <p style="font-size:13px;color:#64748b;margin-bottom:0;">You can manage power, snapshots, and web ${isWindows ? 'desktop' : 'console'} directly from your dashboard.</p>
    `,
    ctaText: isWindows ? 'Open Web Desktop' : 'Open Cloud Console',
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
export async function sendInvoiceReceiptEmail({ email, fullName, invoiceNumber, amount, subtotal, processingFee = 0, tax = 0, planName, currency = 'USD' }) {
  const invoiceUrl = `${APP_URL}/dashboard?tab=billing`;
  const orderSubtotal = subtotal ? Number(subtotal) : Number(amount) - Number(processingFee || 0);
  const feeAmount = Number(processingFee || 0);

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
            <td align="right" style="font-size:15px;font-weight:600;color:#0f172a;">
              $${orderSubtotal.toFixed(2)} ${escapeHtml(currency)}
            </td>
          </tr>
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="color:#64748b;font-size:13px;">Taxes (0%)</td>
            <td align="right" style="color:#0f172a;font-size:13px;font-weight:500;">$0.00 ${escapeHtml(currency)}</td>
          </tr>
          ${feeAmount > 0 ? `
          <tr style="border-top:1px solid #f1f5f9;">
            <td style="color:#64748b;font-size:13px;">Credit Card Processing Fee (1.5%)</td>
            <td align="right" style="color:#0f172a;font-size:13px;font-weight:500;">+$${feeAmount.toFixed(2)} ${escapeHtml(currency)}</td>
          </tr>` : ''}
          <tr style="border-top:2px solid #e2e8f0;background-color:#f8fafc;">
            <td style="font-weight:700;color:#0f172a;">Total Paid</td>
            <td align="right" style="font-size:16px;font-weight:700;color:#10b981;">
              $${Number(amount).toFixed(2)} ${escapeHtml(currency)}
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:#64748b;margin-bottom:8px;">You can view and download your full printable PDF invoice anytime from the Billing & Invoices section.</p>
      <p style="font-size:12px;color:#334155;margin-bottom:0;"><strong>Link to Terms of Contract:</strong> <a href="https://www.atechconsult.com/Terms&Conditions" style="color:#2563eb;text-decoration:underline;">https://www.atechconsult.com/Terms&Conditions</a></p>
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

/**
 * Specification Adjustment & Storage Expansion Receipt Email (Enterprise Prorated)
 */
export async function sendSpecificationResizeReceiptEmail({
  email,
  fullName,
  invoiceNumber,
  vmName,
  previousSpecs,
  newSpecs,
  daysRemaining,
  totalDays,
  unusedCredit,
  proratedCost,
  amountCharged,
  newMonthlyPrice,
  nextBillingDate,
  currency = 'USD',
}) {
  const invoiceUrl = `${APP_URL}/dashboard?tab=billing`;
  const formattedNextDate = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Next Cycle';

  const contentHtml = `
    <p style="margin-top:0;font-size:15px;color:#334155;line-height:1.6;">
      Hi ${escapeHtml(fullName || 'Valued Customer')},
    </p>
    <p style="font-size:14px;color:#334155;line-height:1.6;">
      Your cloud server <strong>${escapeHtml(vmName)}</strong> has been upgraded with expanded specifications. 
      In accordance with our fair-use billing policy, your invoice has been automatically prorated for the remaining 
      <strong>${daysRemaining} days</strong> of your billing cycle.
    </p>

    <!-- SPECIFICATION COMPARISON TABLE -->
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:22px 0;background-color:#f8fafc;">
      <div style="background-color:#0f172a;color:#ffffff;padding:12px 18px;font-size:13px;font-weight:700;letter-spacing:0.3px;">
        SPECIFICATION ADJUSTMENT SUMMARY
      </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:14px 18px;font-size:13px;color:#1e293b;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 0;color:#64748b;">Virtual Server:</td>
          <td align="right" style="padding:8px 0;font-weight:700;font-family:monospace;">${escapeHtml(vmName)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 0;color:#64748b;">Previous Allocation:</td>
          <td align="right" style="padding:8px 0;font-family:monospace;">${escapeHtml(previousSpecs)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 0;color:#64748b;font-weight:600;">Upgraded Allocation:</td>
          <td align="right" style="padding:8px 0;font-weight:700;color:#2563eb;font-family:monospace;">${escapeHtml(newSpecs)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;">Billing Cycle Remaining:</td>
          <td align="right" style="padding:8px 0;font-weight:600;">${daysRemaining} of ${totalDays} days</td>
        </tr>
      </table>
    </div>

    <!-- PRORATED FINANCIAL RECEIPT -->
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:22px 0;">
      <div style="background-color:#f1f5f9;padding:12px 18px;font-size:13px;font-weight:700;color:#334155;">
        INVOICE RECEIPT #${escapeHtml(invoiceNumber)}
      </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:14px 18px;font-size:13px;color:#1e293b;">
        <tr>
          <td style="padding:6px 0;color:#64748b;">Unused Previous Plan Credit (${daysRemaining}d):</td>
          <td align="right" style="padding:6px 0;font-weight:600;color:#16a34a;">-$${Number(unusedCredit).toFixed(2)} ${escapeHtml(currency)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;">Prorated Upgraded Specification (${daysRemaining}d):</td>
          <td align="right" style="padding:6px 0;font-weight:600;color:#0f172a;">+$${Number(proratedCost).toFixed(2)} ${escapeHtml(currency)}</td>
        </tr>
        <tr style="border-top:1px solid #cbd5e1;">
          <td style="padding:10px 0;font-weight:700;font-size:14px;color:#0f172a;">Amount Charged Today:</td>
          <td align="right" style="padding:10px 0;font-weight:800;font-size:16px;color:#2563eb;">
            $${Number(amountCharged).toFixed(2)} ${escapeHtml(currency)}
          </td>
        </tr>
        <tr style="border-top:1px dashed #e2e8f0;">
          <td style="padding:8px 0;font-size:12px;color:#64748b;">Next Recurring Monthly Bill (Starting ${formattedNextDate}):</td>
          <td align="right" style="padding:8px 0;font-weight:700;font-size:13px;color:#334155;">
            $${Number(newMonthlyPrice).toFixed(2)} /mo
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size:12px;color:#64748b;line-height:1.5;">
      Your next monthly invoice will be unified automatically into a single renewal on ${formattedNextDate}. 
      You can review and download the official PDF receipt from your customer billing portal.
    </p>
    <p style="font-size:12px;color:#334155;line-height:1.5;margin-top:8px;">
      <strong>Link to Terms of Contract:</strong> <a href="https://www.atechconsult.com/Terms&Conditions" style="color:#2563eb;text-decoration:underline;">https://www.atechconsult.com/Terms&Conditions</a>
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `Payment Receipt: Invoice ${invoiceNumber}`,
    subtitle: `Specification Upgrade • ${vmName}`,
    categoryBadge: 'Billing',
    contentHtml,
    ctaText: 'View Invoices in Portal',
    ctaUrl: invoiceUrl,
    footerNote: 'ATC Cloud Billing • For questions regarding your invoice, reply to billing@atechconsult.com',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Billing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Receipt] Invoice ${invoiceNumber} - Hardware Upgrade ($${Number(amountCharged).toFixed(2)} ${currency})`,
      html,
    });
    console.log(`[Billing] Upgrade receipt sent to ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Billing Error] Upgrade receipt dispatch failed for ${email}:`, err.message);
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

/**
 * Dispatch Urgent Failure Alert to Customer Support when VM action or Hyper-V script fails
 */
export async function sendVmFailureAlertToSupport({
  vmName,
  vmId,
  customerEmail,
  customerName,
  action,
  error,
  scriptName = 'Power-VPS.ps1',
  hostStatus = 'Online'
}) {
  const subject = `[URGENT SUPPORT ALERT] VM Operation Failure: ${vmName || 'Unknown VM'} (${action})`;
  const isHostDown = error && (error.includes('offline') || error.includes('unreachable') || error.includes('ECONNREFUSED'));

  const contentHtml = `
    <div style="background-color:#fff1f2;padding:16px 20px;border-radius:12px;border:1px solid #fecdd3;margin:16px 0;">
      <h3 style="margin-top:0;color:#9f1239;font-size:16px;">⚠️ Virtual Machine Infrastructure Alert</h3>
      <p style="margin:0 0 12px 0;font-size:14px;color:#881337;">
        An automated system alert was triggered during execution of action <strong>${escapeHtml(action)}</strong>.
      </p>
      <table style="width:100%;font-size:13px;color:#334155;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-weight:bold;width:140px;">VM Name:</td><td>${escapeHtml(vmName || 'N/A')} (ID: ${vmId || 'N/A'})</td></tr>
        <tr><td style="padding:6px 0;font-weight:bold;">Customer:</td><td>${escapeHtml(customerName || 'N/A')} &lt;${escapeHtml(customerEmail || 'N/A')}&gt;</td></tr>
        <tr><td style="padding:6px 0;font-weight:bold;">Action Attempted:</td><td><span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:4px;font-family:monospace;font-weight:bold;">${escapeHtml(action)}</span></td></tr>
        <tr><td style="padding:6px 0;font-weight:bold;">Hyper-V Script:</td><td><code>${escapeHtml(scriptName)}</code></td></tr>
        <tr><td style="padding:6px 0;font-weight:bold;">Host Status:</td><td><span style="color:${isHostDown ? '#e11d48' : '#059669'};font-weight:bold;">${escapeHtml(hostStatus)}</span></td></tr>
        <tr><td style="padding:6px 0;font-weight:bold;vertical-align:top;">Failure Details:</td><td style="color:#b91c1c;font-family:monospace;background:#fee2e2;padding:8px;border-radius:6px;word-break:break-all;">${escapeHtml(error || 'Unknown infrastructure exception')}</td></tr>
      </table>
    </div>
    <p style="font-size:12px;color:#64748b;margin-bottom:0;">
      Timestamp: ${new Date().toUTCString()} • Host Node Gateway: 172.18.240.1:5050
    </p>
  `;

  const html = wrapEmailTemplate({
    title: `VM Action Failure: ${action}`,
    subtitle: `Automated Notification for Customer Support Team`,
    categoryBadge: 'Critical Infrastructure Alert',
    contentHtml,
    ctaText: 'Open Hyper-V Admin Console',
    ctaUrl: `${APP_URL}/admin?tab=overview`,
    footerNote: 'ATC Cloud Reliability & Incident Automation Engine',
  });

  try {
    const info = await transporterSupport.sendMail({
      from: `"ATC Cloud Alerts" <${SUPPORT_EMAIL}>`,
      to: [SUPPORT_EMAIL, 'info@atechconsult.com'],
      subject,
      html,
    });
    console.log(`[Support Alert Dispatched] Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Support Alert Error] Failed to send alert email:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 30-Day Free Trial Welcome Email
 */
export async function sendTrialStartedEmail({ email, fullName, planName, trialEndsDate, cardLast4 }) {
  const endsStr = new Date(trialEndsDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const html = wrapEmailTemplate({
    title: 'Your 30-Day Free Trial is Active!',
    subtitle: `Welcome to ATC Cloud • ${planName}`,
    categoryBadge: '30-Day Free Trial',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;margin-bottom:20px;">
        Welcome to ATC Cloud! Your <strong>30-Day Free Trial</strong> has officially started. You now have full access to deploy and run your virtual machine with high-performance SSD storage, dedicated compute, and 1 Gbps networking.
      </p>
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.8;">
          <tr>
            <td style="color:#64748b;padding-bottom:6px;">Trial Package:</td>
            <td align="right" style="color:#0f172a;font-weight:700;padding-bottom:6px;">${escapeHtml(planName)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-bottom:6px;">Specs:</td>
            <td align="right" style="color:#0f172a;font-weight:600;padding-bottom:6px;">2 vCPU Cores • 2 GB RAM • 120 GB SSD</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-bottom:6px;">Amount Charged Today:</td>
            <td align="right" style="color:#10b981;font-weight:700;padding-bottom:6px;">$0.00 USD (Free)</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-bottom:6px;">Payment Method on File:</td>
            <td align="right" style="color:#0f172a;font-weight:600;padding-bottom:6px;">Card ending in ${escapeHtml(cardLast4)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Trial Expiration Date:</td>
            <td align="right" style="color:#2563eb;font-weight:700;">${endsStr}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin-bottom:8px;">
        💡 <strong>Zero Commitment:</strong> You can cancel your trial anytime directly from your dashboard before ${endsStr} with one click, and your card will never be charged.
      </p>
    `,
    ctaText: 'Launch Your Trial VM',
    ctaUrl: `${APP_URL}/dashboard`,
    footerNote: 'Thank you for choosing Analytical Technical Consulting (ATC) Cloud Services.',
  });

  return await transporterNoReply.sendMail({
    from: `"ATC Cloud" <${NOREPLY_EMAIL}>`,
    to: email,
    subject: `Your 30-Day Free Trial is Ready! (${planName})`,
    html,
  });
}

/**
 * 30-Day Free Trial Expiration Warning & Rating Request Email (~7 Days Remaining)
 */
export async function sendTrialWarningEmail({ email, fullName, daysRemaining, trialEndsDate, planName, monthlyPrice }) {
  const endsStr = new Date(trialEndsDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const html = wrapEmailTemplate({
    title: `Your Free Trial Ends in ${daysRemaining} Days`,
    subtitle: `Rate our service & manage your subscription`,
    categoryBadge: 'Trial Ending Soon',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hi <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;margin-bottom:20px;">
        You have <strong>${daysRemaining} days remaining</strong> on your 30-Day Free Trial for <strong>${escapeHtml(planName)}</strong>, concluding on <strong>${endsStr}</strong>.
      </p>

      <!-- Feedback / Rating Prompt -->
      <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <h4 style="margin:0 0 8px 0;font-size:15px;color:#1e40af;font-weight:700;">How are your virtual workloads performing?</h4>
        <p style="margin:0 0 16px 0;font-size:13px;color:#3b82f6;">Help us improve by rating your cloud experience so far:</p>
        <div style="font-size:24px;letter-spacing:6px;margin-bottom:8px;">
          ⭐⭐⭐⭐⭐
        </div>
        <p style="margin:0;font-size:12px;color:#60a5fa;">Click below to leave us a quick feedback rating</p>
      </div>

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:20px;font-size:13px;color:#475569;line-height:1.6;">
        <p style="margin:0 0 8px 0;font-weight:700;color:#0f172a;">What happens next?</p>
        <ul style="margin:0;padding-left:20px;">
          <li><strong>Keep your server running:</strong> Do nothing! On ${endsStr}, your subscription will seamlessly renew at $${Number(monthlyPrice || 4.99).toFixed(2)}/mo to ensure zero downtime.</li>
          <li><strong>Cancel anytime:</strong> If you do not wish to continue, you can cancel your trial with 1-click in your account dashboard before ${endsStr} and your card will not be charged.</li>
        </ul>
      </div>
    `,
    ctaText: 'Rate Service & Manage Trial',
    ctaUrl: `${APP_URL}/dashboard?tab=billing`,
    footerNote: 'Analytical Technical Consulting (ATC) • Automated Trial Lifecycle Engine',
  });

  return await transporterBilling.sendMail({
    from: `"ATC Billing & Feedback" <${BILLING_EMAIL}>`,
    to: email,
    subject: `[Notice] Your 30-Day Free Trial ends in ${daysRemaining} days (${endsStr})`,
    html,
  });
}

/**
 * 30-Day Trial Converted to Paid Subscription Email
 */
export async function sendTrialConvertedPaidEmail({ email, fullName, invoiceNumber, amount, cardLast4, nextRenewalDate, planName }) {
  const nextDateStr = new Date(nextRenewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const html = wrapEmailTemplate({
    title: 'Trial Concluded — Subscription Active',
    subtitle: `Invoice #${invoiceNumber} Successfully Settled`,
    categoryBadge: 'Paid Subscription',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Dear <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;margin-bottom:20px;">
        Your 30-day free trial has concluded, and your <strong>${escapeHtml(planName)}</strong> package has officially transitioned to an active monthly subscription. Your server remains 100% online with zero interruption.
      </p>
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.8;">
          <tr>
            <td style="color:#64748b;">Invoice Reference:</td>
            <td align="right" style="color:#0f172a;font-weight:700;">#${escapeHtml(invoiceNumber)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Amount Paid:</td>
            <td align="right" style="color:#10b981;font-weight:700;">$${Number(amount).toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Payment Method:</td>
            <td align="right" style="color:#0f172a;font-weight:600;">Card ending in •••• ${escapeHtml(cardLast4)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Next Renewal Date:</td>
            <td align="right" style="color:#2563eb;font-weight:700;">${nextDateStr}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin-bottom:8px;">
        Your official tax invoice receipt has been generated and is available for download in your portal.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;">
        <strong>Link to Terms of Contract:</strong> <a href="https://www.atechconsult.com/Terms&Conditions" style="color:#2563eb;text-decoration:underline;">https://www.atechconsult.com/Terms&Conditions</a>
      </p>
    `,
    ctaText: 'View Invoice & Server Dashboard',
    ctaUrl: `${APP_URL}/dashboard?tab=billing`,
    footerNote: 'Thank you for your ongoing partnership with Analytical Technical Consulting (ATC).',
  });

  return await transporterBilling.sendMail({
    from: `"ATC Billing" <${BILLING_EMAIL}>`,
    to: email,
    subject: `[Invoice Paid] ${planName} Subscription Active (#${invoiceNumber})`,
    html,
  });
}

/**
 * Free Trial Cancelled Confirmation Email (Warm, Zero-Pressure Offboarding)
 */
export async function sendTrialCancelledEmail({ email, fullName, planName }) {
  const html = wrapEmailTemplate({
    title: 'Parting on Good Terms — Free Trial Cancelled',
    subtitle: 'Zero charges applied • Thank you for taking ATC Cloud for a spin',
    categoryBadge: 'Trial Cancelled',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.65;color:#334155;margin-bottom:20px;">
        We have completed your cancellation request for your 30-day free trial of <strong>${escapeHtml(planName || 'Cloud VPS')}</strong>. While we are sorry to see you step away for now, we appreciate you testing your workloads on ATC Cloud infrastructure.
      </p>
      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px;margin-bottom:22px;font-size:13px;color:#166534;line-height:1.6;">
        <strong>✓ Zero Financial Obligation:</strong> Your payment method on file was never charged, your trial virtual resources have been cleanly released, and no future recurring charges will ever occur from this trial.
      </div>
      <p style="font-size:13px;line-height:1.65;color:#475569;margin-bottom:14px;">
        Whenever your next project, client deployment, or production workload needs dedicated NVMe/SSD compute and 1 Gbps connectivity, your account remains ready — spin up a fresh instance in under 60 seconds anytime.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:0;">
        <strong>Link to Terms of Contract:</strong> <a href="${TERMS_CONTRACT_URL}" style="color:#2563eb;text-decoration:underline;">${TERMS_CONTRACT_URL}</a>
      </p>
    `,
    ctaText: 'Explore ATC Cloud Plans Anytime',
    ctaUrl: `${APP_URL}/pricing`,
    footerNote: 'Analytical Technical Consulting (ATC) • Cloud Customer Success Team',
  });

  return await transporterBilling.sendMail({
    from: `"ATC Cloud Billing" <${BILLING_EMAIL}>`,
    to: email,
    subject: `Confirmation: Your ATC Cloud Free Trial Has Been Cancelled ($0.00 Charged)`,
    html,
  });
}


/**
 * 14. Billing Overdue Suspension Notice (90-Day Safe-Vault Data Preservation Model)
 */
export async function sendBillingSuspendedEmail({ email, fullName, vmName, planName, overdueAmount = 0, retentionDays = 90 }) {
  const reactivateUrl = `${APP_URL}/dashboard?tab=billing`;
  const html = wrapEmailTemplate({
    title: 'Compute Paused — Your Data Is Safe in Our 90-Day Vault',
    subtitle: `Action required to bring ${vmName || 'your virtual server'} back online`,
    categoryBadge: 'Service Paused',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.65;color:#334155;margin-bottom:18px;">
        We noticed an unsettled renewal balance of <strong>$${Number(overdueAmount).toFixed(2)} USD</strong> on your <strong>${escapeHtml(planName || 'Cloud VPS')}</strong> subscription. To protect your account from unexpected charges while keeping your work intact, we have gracefully powered down instance <strong>${escapeHtml(vmName || 'Virtual Machine')}</strong>.
      </p>

      <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;padding:16px 18px;margin-bottom:20px;font-size:13px;color:#1e3a8a;line-height:1.6;">
        <strong>🛡️ Nothing Has Been Deleted:</strong> Every file, database, operating system configuration, and disk volume attached to <strong>${escapeHtml(vmName || 'your server')}</strong> is locked safely inside ATC's complimentary <strong>${retentionDays}-Day Data Preservation Vault</strong>.
      </div>

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:22px;font-size:13px;color:#475569;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Protected Instance:</td>
            <td align="right" style="font-weight:700;color:#0f172a;font-family:monospace;">${escapeHtml(vmName || 'VPS Instance')}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Balance Required to Resume:</td>
            <td align="right" style="font-weight:700;color:#dc2626;">$${Number(overdueAmount).toFixed(2)} USD</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Storage &amp; Disk Integrity:</td>
            <td align="right" style="font-weight:700;color:#059669;">100% Preserved &amp; Encrypted</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Safe-Hold Window Remaining:</td>
            <td align="right" style="font-weight:700;color:#d97706;">${retentionDays} Days</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;line-height:1.65;color:#475569;margin-bottom:14px;">
        Ready to pick up right where you left off? Settle your balance in one click from your billing portal and your server controls, SSH/RDP access, and web console will unlock immediately.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:0;">
        <strong>Link to Terms of Contract:</strong> <a href="${TERMS_CONTRACT_URL}" style="color:#2563eb;text-decoration:underline;">${TERMS_CONTRACT_URL}</a>
      </p>
    `,
    ctaText: 'Unlock & Reactivate Server Now',
    ctaUrl: reactivateUrl,
    footerNote: 'ATC Cloud Billing & Continuity • Reply to this email or contact billing@atechconsult.com if you need assistance.',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Billing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Service Paused] ${vmName || 'Your VPS'} Is Safely Preserved — Action Required to Resume`,
      html,
    });
    console.log(`[Billing Suspension] Email dispatched to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Billing Suspension Error] Email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 15. Retention Expiration Warning (Day 60, 30, 14, 7, 3, 1 Reminders for Inactive/Paused Users)
 */
export async function sendRetentionWarningEmail({ email, fullName, vmName, planName, daysRemaining, overdueAmount = 0 }) {
  const reactivateUrl = `${APP_URL}/dashboard?tab=billing`;
  const isFinalCountdown = Number(daysRemaining) <= 7;

  const html = wrapEmailTemplate({
    title: isFinalCountdown
      ? `Final Call: ${daysRemaining} ${Number(daysRemaining) === 1 ? 'Day' : 'Days'} Before Permanent Data Purge`
      : `Your Cloud Vault Still Holds ${vmName || 'Your Server'} — ${daysRemaining} Days Remaining`,
    subtitle: isFinalCountdown
      ? `Immediate action required to rescue your virtual disks and configurations`
      : `Scheduled 90-day data preservation update for ${planName || 'Cloud VPS'}`,
    categoryBadge: isFinalCountdown ? 'Final Data Notice' : 'Data Preservation Notice',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.65;color:#334155;margin-bottom:18px;">
        ${isFinalCountdown
          ? `We are reaching out one more time before our automated lifecycle engine permanently decommissions your paused server <strong>${escapeHtml(vmName || 'Virtual Machine')}</strong> (${escapeHtml(planName || 'Cloud VPS')}).`
          : `Even though your <strong>${escapeHtml(planName || 'Cloud VPS')}</strong> subscription is currently paused, we have continued safeguarding your server <strong>${escapeHtml(vmName || 'Virtual Machine')}</strong> inside our 90-day preservation vault.`}
      </p>

      <div style="background-color:${isFinalCountdown ? '#fef2f2' : '#fffbeb'};border:1px solid ${isFinalCountdown ? '#fecaca' : '#fde68a'};border-left:4px solid ${isFinalCountdown ? '#dc2626' : '#d97706'};border-radius:10px;padding:18px;margin-bottom:22px;">
        <h4 style="margin:0 0 8px 0;color:${isFinalCountdown ? '#991b1b' : '#92400e'};font-size:14px;font-weight:800;">
          ⏳ ${daysRemaining} ${Number(daysRemaining) === 1 ? 'Day' : 'Days'} Until Permanent Cryptographic Erasure
        </h4>
        <p style="margin:0;font-size:13px;line-height:1.6;color:${isFinalCountdown ? '#b91c1c' : '#b45309'};">
          In <strong>${daysRemaining} ${Number(daysRemaining) === 1 ? 'day' : 'days'}</strong>, our 90-day complimentary storage hold concludes. Unless your balance of <strong>$${Number(overdueAmount).toFixed(2)} USD</strong> is settled before the timer reaches zero, all virtual NVMe/SSD disks, databases, snapshots, and custom configurations on <strong>${escapeHtml(vmName || 'your instance')}</strong> will be permanently and irreversibly purged.
        </p>
      </div>

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:20px;font-size:13px;color:#475569;line-height:1.6;">
        <strong style="color:#0f172a;">Want to bring your server back in 60 seconds?</strong><br/>
        Click below to clear the overdue balance ($${Number(overdueAmount).toFixed(2)} USD) — your exact OS state, files, and credentials will unlock immediately with zero re-installation needed. If you no longer need this data, no action is required and no further charges will be billed.
      </div>

      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:0;">
        <strong>Link to Terms of Contract:</strong> <a href="${TERMS_CONTRACT_URL}" style="color:#2563eb;text-decoration:underline;">${TERMS_CONTRACT_URL}</a>
      </p>
    `,
    ctaText: 'Rescue My Data & Reactivate Server',
    ctaUrl: reactivateUrl,
    footerNote: 'Analytical Technical Consulting (ATC) • Automated Data Lifecycle & Continuity Desk',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Continuity" <${BILLING_EMAIL}>`,
      to: email,
      subject: isFinalCountdown
        ? `[Final Notice: ${daysRemaining}d Left] Permanent Data Deletion Scheduled for ${vmName || 'Your VPS'}`
        : `[Data Vault Notice] ${daysRemaining} Days Remaining to Restore ${vmName || 'Your ATC Cloud Server'}`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Retention Warning Error] Email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 16. Service Reactivated Notice
 */
export async function sendReactivationSuccessEmail({ email, fullName, vmName, planName, amountPaid = 0, nextRenewalDate }) {
  const dashboardUrl = `${APP_URL}/dashboard`;
  const formattedRenewal = nextRenewalDate ? new Date(nextRenewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '30 days from today';
  const html = wrapEmailTemplate({
    title: 'Service Reactivated Successfully! 🎉',
    subtitle: `Your subscription has been restored`,
    categoryBadge: 'Service Reactivated',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.6;color:#334155;margin-bottom:20px;">
        We have received your payment of <strong>$${Number(amountPaid).toFixed(2)} USD</strong>. Your cloud compute subscription for <strong>${escapeHtml(planName || 'Cloud VPS')}</strong> has been successfully reactivated!
      </p>

      

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;font-size:13px;color:#475569;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
          <tr>
            <td style="color:#64748b;">Instance Name:</td>
            <td style="font-weight:600;color:#0f172a;">${escapeHtml(vmName || 'VPS Instance')}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Payment Settled:</td>
            <td style="font-weight:700;color:#16a34a;">$${Number(amountPaid).toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Next Renewal Date:</td>
            <td style="font-weight:600;color:#0f172a;">${formattedRenewal}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Instance State:</td>
            <td style="font-weight:600;color:#2563eb;">Ready to Power On</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;line-height:1.6;color:#64748b;margin-bottom:10px;">
        You can now power on your instance and launch the Web Terminal console from your dashboard:
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:20px;">
        <strong>Link to Terms of Contract:</strong> <a href="https://www.atechconsult.com/Terms&Conditions" style="color:#2563eb;text-decoration:underline;">https://www.atechconsult.com/Terms&Conditions</a>
      </p>
    `,
    ctaText: 'Open VPS Dashboard',
    ctaUrl: dashboardUrl,
    footerNote: 'Analytical Technical Consulting (ATC) Cloud Infrastructure',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Billing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `Service Reactivated: ${vmName || 'VPS'} Ready`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Reactivation Email Error] Email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}


/**
 * 17. Refund Confirmation & Service Closure Email
 */
export async function sendRefundConfirmationEmail({
  email,
  fullName,
  invoiceNumber,
  refundAmount,
  currency = 'USD',
  planName,
  reason = 'Customer / Administrative Refund',
}) {
  const billingUrl = `${APP_URL}/dashboard?tab=billing`;
  const processedAtStr = formatUSCentralEmailTime(new Date());

  const html = wrapEmailTemplate({
    title: `Refund Issued: $${Number(refundAmount).toFixed(2)} ${escapeHtml(currency)}`,
    subtitle: `Official refund confirmation for Invoice ${invoiceNumber || 'Receipt'}`,
    categoryBadge: 'Refund Processed',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.65;color:#334155;margin-bottom:20px;">
        This email confirms that a refund of <strong>$${Number(refundAmount).toFixed(2)} ${escapeHtml(currency)}</strong> has been approved and issued back to your original payment method${planName ? ` for <strong>${escapeHtml(planName)}</strong>` : ''}.
      </p>

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:22px;font-size:13px;color:#475569;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
          ${invoiceNumber ? `
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Invoice Reference:</td>
            <td align="right" style="font-weight:700;color:#0f172a;font-family:monospace;">${escapeHtml(invoiceNumber)}</td>
          </tr>` : ''}
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Refund Amount:</td>
            <td align="right" style="font-weight:800;color:#059669;font-size:15px;">$${Number(refundAmount).toFixed(2)} ${escapeHtml(currency)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Processed Timestamp (US Central):</td>
            <td align="right" style="font-weight:600;color:#0f172a;">${escapeHtml(processedAtStr)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Reason / Note:</td>
            <td align="right" style="font-weight:600;color:#334155;">${escapeHtml(reason)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Estimated Bank Settlement:</td>
            <td align="right" style="font-weight:700;color:#2563eb;">5–10 Business Days</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;line-height:1.65;color:#475569;margin-bottom:14px;">
        Please note that while ATC Cloud has released the funds immediately, card networks and issuing banks typically take <strong>5 to 10 business days</strong> to post the credit to your statement. Any subscription slot tied to this refunded invoice has been cleanly closed so no future charges occur.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:0;">
        <strong>Link to Terms of Contract:</strong> <a href="${TERMS_CONTRACT_URL}" style="color:#2563eb;text-decoration:underline;">${TERMS_CONTRACT_URL}</a>
      </p>
    `,
    ctaText: 'View Billing History',
    ctaUrl: billingUrl,
    footerNote: 'Analytical Technical Consulting (ATC) Billing • Questions? Reply to billing@atechconsult.com',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Billing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Refund Issued] $${Number(refundAmount).toFixed(2)} ${currency}${invoiceNumber ? ` for Invoice ${invoiceNumber}` : ''}`,
      html,
    });
    console.log(`[Billing Refund] Confirmation sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Billing Refund Error] Email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 18. Payment Declined / Failed Notice (Action Required)
 */
export async function sendPaymentFailedEmail({
  email,
  fullName,
  amount,
  currency = 'USD',
  planName,
  invoiceNumber,
  failureReason,
}) {
  const billingUrl = `${APP_URL}/dashboard?tab=billing`;
  const attemptedAtStr = formatUSCentralEmailTime(new Date());

  const html = wrapEmailTemplate({
    title: 'Payment Could Not Be Completed',
    subtitle: `Action required to complete your ${planName || 'ATC Cloud'} payment`,
    categoryBadge: 'Payment Notice',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.65;color:#334155;margin-bottom:18px;">
        We were unable to process a payment${amount ? ` of <strong>$${Number(amount).toFixed(2)} ${escapeHtml(currency)}</strong>` : ''} for <strong>${escapeHtml(planName || 'your ATC Cloud service')}</strong>. No funds were captured from your account for this declined attempt.
      </p>

      <div style="background-color:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:10px;padding:16px 18px;margin-bottom:22px;font-size:13px;color:#991b1b;line-height:1.6;">
        <strong>Why did this happen?</strong><br/>
        ${escapeHtml(failureReason || 'Your card issuer declined the authorization (common causes include insufficient funds, international/online transaction limits, or 3D Secure verification timeout).')}
        <div style="margin-top:8px;font-size:12px;color:#b91c1c;">Attempted: ${escapeHtml(attemptedAtStr)}${invoiceNumber ? ` • Ref: ${escapeHtml(invoiceNumber)}` : ''}</div>
      </div>

      <p style="font-size:13px;line-height:1.65;color:#475569;margin-bottom:14px;">
        You can update your payment method or retry checkout anytime from your ATC Cloud Billing Portal, or choose Direct Bank Wire Transfer for corporate accounts.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:0;">
        <strong>Link to Terms of Contract:</strong> <a href="${TERMS_CONTRACT_URL}" style="color:#2563eb;text-decoration:underline;">${TERMS_CONTRACT_URL}</a>
      </p>
    `,
    ctaText: 'Update Payment Method & Retry',
    ctaUrl: billingUrl,
    footerNote: 'ATC Cloud Billing • Need help completing your order? Contact billing@atechconsult.com',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Billing" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Action Required] Payment Unsuccessful for ${planName || 'ATC Cloud Service'}`,
      html,
    });
    console.log(`[Billing Failed Notice] Sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Billing Failed Notice Error] Email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 19. Final Day-90 Decommission & Permanent Data Erasure Notice
 * Creative, dignified, and professional offboarding after 90-day safe-hold expires.
 */
export async function sendFinalTerminationEmail({
  email,
  fullName,
  vmName,
  planName,
  retentionDays = 90,
}) {
  const pricingUrl = `${APP_URL}/pricing`;
  const decommissionedAtStr = formatUSCentralEmailTime(new Date());

  const html = wrapEmailTemplate({
    title: 'Final Decommission Complete — Thank You for Building With Us',
    subtitle: `${retentionDays}-day data preservation window concluded for ${vmName || 'your virtual server'}`,
    categoryBadge: 'Service Terminated',
    contentHtml: `
      <p style="font-size:15px;line-height:1.6;color:#1e293b;margin-bottom:16px;">
        Hello <strong>${escapeHtml(fullName || 'Valued Customer')}</strong>,
      </p>
      <p style="font-size:14px;line-height:1.65;color:#334155;margin-bottom:18px;">
        After safeguarding your suspended server <strong>${escapeHtml(vmName || 'Virtual Machine')}</strong> (${escapeHtml(planName || 'Cloud VPS')}) in our complimentary <strong>${retentionDays}-day preservation vault</strong>, the retention period has officially concluded and the instance has now been permanently decommissioned.
      </p>

      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:22px;font-size:13px;color:#475569;">
        <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
          Decommission Certificate Summary
        </div>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Decommissioned Instance:</td>
            <td align="right" style="font-weight:700;color:#0f172a;font-family:monospace;">${escapeHtml(vmName || 'VPS Instance')}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Completed Timestamp (US Central):</td>
            <td align="right" style="font-weight:600;color:#0f172a;">${escapeHtml(decommissionedAtStr)}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="color:#64748b;">Storage &amp; Disk Sanitization:</td>
            <td align="right" style="font-weight:700;color:#dc2626;">Permanently Purged &amp; Wiped</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Future Recurring Billing:</td>
            <td align="right" style="font-weight:700;color:#059669;">Closed ($0.00 Ongoing)</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;line-height:1.65;color:#475569;margin-bottom:14px;">
        In accordance with ATC Cloud's security and privacy standards, all virtual storage blocks associated with this instance have been securely wiped so your historical data can never be accessed by future tenants.
      </p>
      <p style="font-size:13px;line-height:1.65;color:#475569;margin-bottom:16px;">
        <strong>The door is always open:</strong> Your ATC Cloud portal account remains active. Whenever your next venture, application, or team needs dedicated high-speed cloud infrastructure, you can launch a brand-new server in seconds.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:0;">
        <strong>Link to Terms of Contract:</strong> <a href="${TERMS_CONTRACT_URL}" style="color:#2563eb;text-decoration:underline;">${TERMS_CONTRACT_URL}</a>
      </p>
    `,
    ctaText: 'Deploy a Fresh Server Anytime',
    ctaUrl: pricingUrl,
    footerNote: 'Analytical Technical Consulting (ATC) • Thank you for having been part of ATC Cloud.',
  });

  try {
    const info = await transporterBilling.sendMail({
      from: `"ATC Cloud Infrastructure" <${BILLING_EMAIL}>`,
      to: email,
      subject: `[Decommission Complete] ${vmName || 'Your ATC Cloud Server'} Has Been Permanently Closed`,
      html,
    });
    console.log(`[Final Termination] Notice sent to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Final Termination Error] Email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}


/**
 * Team Member Organization Invitation Email
 */
export async function sendTeamInvitationEmail({
  email,
  inviterName,
  companyName,
  role,
  inviteToken,
  isExistingUser,
}) {
  const inviteUrl = `${APP_URL}/invite?token=${inviteToken}&email=${encodeURIComponent(email)}`;
  const targetUrl = inviteUrl;

  const roleLabels = {
    admin: 'Administrator (Full Access)',
    devops: 'DevOps / Engineer (Operations & SSH)',
    viewer: 'Viewer / Auditor (Read Only)',
    billing: 'Billing Specialist (Finance & Invoices)',
  };
  const roleDisplay = roleLabels[role] || role;

  const html = wrapEmailTemplate({
    title: `You have been invited to join ${escapeHtml(companyName)}`,
    subtitle: `Hi there,`,
    categoryBadge: 'Team Invitation',
    contentHtml: `
      <p style="margin-top:0;"><strong>${escapeHtml(inviterName)}</strong> has invited you to join the <strong>${escapeHtml(companyName)}</strong> organization on the ATC Cloud Platform.</p>
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Assigned Role</p>
        <p style="margin:0;font-size:15px;color:#0f172a;font-weight:bold;">${escapeHtml(roleDisplay)}</p>
      </div>
      <p>${isExistingUser ? "You can sign in with your existing ATC Cloud credentials to access company servers and collaborative resources." : "Click below to complete your registration and join your team on ATC Cloud."}</p>
      <p style="font-size:13px;color:#64748b;margin-bottom:0;">If you were not expecting this invitation, you can safely ignore this email.</p>
    `,
    ctaText: 'Accept Invitation & Join Workspace',
    ctaUrl: targetUrl,
  });

  try {
    const info = await transporterNoReply.sendMail({
      from: `"ATC Cloud Teams" <${NOREPLY_EMAIL}>`,
      to: email,
      subject: `Invitation: Join ${companyName} on ATC Cloud`,
      html,
    });
    console.log(`[No-Reply] Team invitation email dispatched to ${email} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[No-Reply Error] Team invitation email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

export default {
  transporterSupport,
  transporterNoReply,
  transporterBilling,
  transporterAlerts,
  sendVerificationEmail,
  sendTeamInvitationEmail,
  sendPasswordResetEmail,
  sendVmProvisionedEmail,
  sendContactFormNotification,
  sendTicketCreatedNotification,
  sendTicketReplyNotification,
  sendInvoiceReceiptEmail,
  sendSpecificationResizeReceiptEmail,
  sendSystemAlertEmail,
  sendVmFailureAlertToSupport,
  sendTrialStartedEmail,
  sendTrialWarningEmail,
  sendTrialConvertedPaidEmail,
  sendTrialCancelledEmail,
  sendBillingSuspendedEmail,
  sendRetentionWarningEmail,
  sendReactivationSuccessEmail,
  sendRefundConfirmationEmail,
  sendPaymentFailedEmail,
  sendFinalTerminationEmail,
};
