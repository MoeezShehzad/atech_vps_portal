// ==============================================================================
// Service: services/auditLogService.js
// Purpose: Unified, Non-Blocking, Secret-Redacting Enterprise Audit Logger
//          - Extracts true Public IP (Cloudflare / Nginx X-Forwarded-For / X-Real-IP)
//          - Records Date, Time, Actor Role (USER/ADMIN/SYSTEM), Actor Email, Public IP
//          - Writes control-plane audit entries to Prisma (Activity_Logs / Security_Logs)
//          - Mirrors VM-scoped events directly into D:\CUSTOMER-VMS\<VMName>\Logs\
//            (Excel .csv + Column Table .log + .jsonl) via Hyper-V Host Agent
//          - Throttled Disk Guard & Critical Alert notifications via alerts@atechconsult.com
// ==============================================================================

import prisma from '../lib/prisma.js';
import hypervService from './hypervService.js';
import { redactSensitive, buildTimestamps } from '../lib/vmLogger.js';

const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc00:|fe80:)/i;

function normalizeIp(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim().replace(/^::ffff:/i, '');
  return cleaned || null;
}

/**
 * Extract the true Public IP of the user/admin accessing the portal.
 * Priority: CF-Connecting-IP -> True-Client-IP -> first public IP in X-Forwarded-For -> X-Real-IP -> socket IP.
 */
export function extractClientIp(req) {
  if (!req) return null;
  const headers = req.headers || {};

  const cfIp = normalizeIp(headers['cf-connecting-ip']);
  if (cfIp) return cfIp;

  const trueClientIp = normalizeIp(headers['true-client-ip']);
  if (trueClientIp) return trueClientIp;

  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const chain = xff.split(',').map((s) => normalizeIp(s)).filter(Boolean);
    const firstPublic = chain.find((ip) => !PRIVATE_IP_RE.test(ip));
    if (firstPublic) return firstPublic;
    if (chain[0]) return chain[0];
  }

  const realIp = normalizeIp(headers['x-real-ip']);
  if (realIp) return realIp;

  return normalizeIp(req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress);
}

/**
 * Resolve actor identity (USER vs ADMIN, email, and public IP) directly from an Express request.
 */
export function extractActorContext(req, forcedRole = null) {
  const user = req?.user || {};
  const roleStr = String(user.role || user.roles?.[0] || '').toUpperCase();
  const isAdmin = forcedRole === 'ADMIN' || roleStr.includes('ADMIN') || Boolean(user.isAdmin);
  return {
    userId: user.userId || null,
    actorRole: forcedRole || (isAdmin ? 'ADMIN' : (user.userId ? 'USER' : 'SYSTEM')),
    actor: user.email || (user.userId ? `user:${user.userId}` : 'system'),
    actorIp: extractClientIp(req) || 'N/A',
    userAgent: req?.headers?.['user-agent'] ? String(req.headers['user-agent']).slice(0, 200) : null,
  };
}

/**
 * Record a VM-scoped audit event into BOTH:
 * 1) Prisma Activity_Logs (unless skipDb=true, e.g. when controller already inserted a row)
 * 2) D:\CUSTOMER-VMS\<vmName>\Logs\<category>.{csv,log,jsonl} + ALL_EVENTS.csv
 */
export async function logVmEvent({
  userId = null,
  vmId = null,
  vmName = '',
  category = 'activity', // provisioning | lifecycle | console-sessions | anomalies | activity
  level = 'INFO',
  action = 'VM_EVENT',
  status = 'SUCCESS',
  actorRole = 'USER',
  actor = null,
  actorIp = null,
  userAgent = null,
  durationMs = null,
  details = null,
  error = null,
  skipDb = false,
} = {}) {
  const ts = buildTimestamps(new Date());
  const safeDetails = redactSensitive(details);
  const safeError = error ? redactSensitive(String(error)) : null;
  const resolvedRole = String(actorRole || (actor ? 'USER' : 'SYSTEM')).toUpperCase();
  const resolvedActor = actor || (userId ? `user:${userId}` : 'system');
  const resolvedIp = actorIp || 'N/A';

  const tasks = [];

  if (!skipDb) {
    const dbDetailsObj = {
      date: ts.date,
      time: ts.time,
      actorRole: resolvedRole,
      actor: resolvedActor,
      actorIp: resolvedIp,
      ...(typeof safeDetails === 'object' && safeDetails !== null ? safeDetails : { message: safeDetails }),
      ...(userAgent ? { userAgent: String(userAgent).slice(0, 200) } : {}),
      ...(safeError ? { error: safeError } : {}),
    };

    tasks.push(
      prisma.activityLog
        .create({
          data: {
            userId: userId ? Number(userId) : null,
            vmId: vmId ? Number(vmId) : null,
            action: String(action).slice(0, 100),
            status: String(status).slice(0, 20),
            details: JSON.stringify(dbDetailsObj),
          },
        })
        .catch((err) => {
          console.warn('[AUDIT LOG DB WARN]:', err.message);
        })
    );
  }

  if (vmName) {
    tasks.push(
      hypervService
        .appendVmLog({
          vmName,
          category,
          level,
          action,
          status,
          source: 'portal-api',
          actorRole: resolvedRole,
          actor: resolvedActor,
          actorIp: resolvedIp,
          durationMs,
          details: safeDetails,
          error: safeError,
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(tasks);
}

/**
 * Record an authentication / security event into Prisma Security_Logs.
 */
export async function logSecurityEvent({
  userId = null,
  action = 'SECURITY_EVENT',
  ipAddress = null,
  result = 'SUCCESS',
  actorRole = 'USER',
  details = null,
} = {}) {
  try {
    const ts = buildTimestamps(new Date());
    const safeDetails = redactSensitive(details);
    const payload =
      typeof safeDetails === 'object' && safeDetails !== null
        ? { date: ts.date, time: ts.time, actorRole, ...safeDetails }
        : { date: ts.date, time: ts.time, actorRole, message: safeDetails };

    await prisma.securityLog.create({
      data: {
        userId: userId ? Number(userId) : null,
        action: String(action).slice(0, 100),
        ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
        result: String(result).slice(0, 20),
        details: JSON.stringify(payload),
      },
    });
  } catch (err) {
    console.warn('[SECURITY LOG DB WARN]:', err.message);
  }
}

// ==============================================================================
// Proactive Admin Alert Worker (Disk Guard >= 85% via alerts@atechconsult.com)
// ==============================================================================
let lastDiskAlertSentAt = 0;

export function startLogDiskGuardMonitor() {
  const CHECK_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes
  const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // At most 1 email every 6 hours

  const runCheck = async () => {
    try {
      const health = await hypervService.getLogDiskHealth(true);
      const primary = health?.drives?.primary;
      if (!primary?.available) return;

      if (health.warning || health.paused) {
        const now = Date.now();
        if (now - lastDiskAlertSentAt < ALERT_COOLDOWN_MS) return;
        lastDiskAlertSentAt = now;

        console.warn(`[DISK GUARD ALERT] Drive ${primary.path} at ${primary.usedPercent}% (${primary.freeGb} GB free)`);

        await logSecurityEvent({
          action: health.paused ? 'DISK_GUARD_CRITICAL' : 'DISK_GUARD_WARNING',
          result: health.paused ? 'PAUSED' : 'WARNING',
          actorRole: 'SYSTEM',
          details: { drive: primary.path, usedPercent: primary.usedPercent, freeGb: primary.freeGb, totalGb: primary.totalGb },
        });

        try {
          const { sendVmFailureAlertToSupport } = await import('./emailService.js');
          await sendVmFailureAlertToSupport({
            vmName: 'HYPERV-HOST-STORAGE',
            vmId: 0,
            customerEmail: process.env.SMTP_ALERTS_USER || 'alerts@atechconsult.com',
            customerName: 'Atech Infrastructure Monitor',
            action: health.paused ? 'DISK_GUARD_CRITICAL_92PCT' : 'DISK_GUARD_WARNING_85PCT',
            error: `Host drive ${primary.path} is at ${primary.usedPercent}% used (${primary.freeGb} GB free of ${primary.totalGb} GB). ${health.paused ? 'Non-critical file logging paused to protect running VMs.' : 'Please archive/clean storage soon.'}`,
            scriptName: 'vmLogger Disk Guard',
            hostStatus: 'Online',
          });
        } catch (_) {}
      }
    } catch (_) {}
  };

  setTimeout(runCheck, 60 * 1000);
  setInterval(runCheck, CHECK_INTERVAL_MS);
}

export default {
  extractClientIp,
  extractActorContext,
  logVmEvent,
  logSecurityEvent,
  startLogDiskGuardMonitor,
};
