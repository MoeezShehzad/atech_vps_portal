import prisma from '../lib/prisma.js';

/**
 * 1. GET /api/security/overview
 * Returns current user's security posture, active keys, last login, and risk summary.
 */
export async function getSecurityOverview(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [user, sshKeysCount, vmsCount, recentAlerts, activeTokensCount] = await Promise.all([
      prisma.user.findUnique({
        where: { userId },
        select: {
          email: true,
          fullName: true,
          emailVerified: true,
          provider: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.sSHKey.count({ where: { userId } }),
      prisma.virtualMachine.count({ where: { userId, status: { not: 'TERMINATED' } } }),
      prisma.securityLog.count({
        where: {
          userId,
          result: 'FAILED',
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.refreshToken.count({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate dynamic security health score (0-100)
    let score = 50;
    if (user.emailVerified) score += 20;
    if (sshKeysCount > 0) score += 15;
    if (user.provider === 'GOOGLE' || user.emailVerified) score += 10;
    if (recentAlerts === 0) score += 5;

    return res.json({
      success: true,
      securityScore: score,
      account: {
        email: user.email,
        emailVerified: user.emailVerified,
        authProvider: user.provider,
        memberSince: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      stats: {
        activeSSHKeys: sshKeysCount,
        activeVMs: vmsCount,
        failedAttemptsLast24h: recentAlerts,
        activeSessionsCount: Math.max(1, activeTokensCount),
      },
    });
  } catch (err) {
    console.error('[getSecurityOverview Error]:', err);
    return res.status(500).json({ error: 'Failed to query security posture.' });
  }
}

/**
 * 2. GET /api/security/logs
 * Returns unified chronological timeline of Security Logs & Activity Logs
 */
export async function getAuditLogs(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const category = req.query.category || 'ALL'; // ALL, AUTH, VMS, SECURITY
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const search = (req.query.search || '').trim().toLowerCase();

    // Query Security Logs
    let securityLogs = [];
    if (category === 'ALL' || category === 'AUTH' || category === 'SECURITY') {
      securityLogs = await prisma.securityLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    }

    // Query Activity Logs
    let activityLogs = [];
    if (category === 'ALL' || category === 'VMS') {
      activityLogs = await prisma.activityLog.findMany({
        where: { userId },
        include: {
          vm: {
            select: { vmName: true, hostname: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

/**
 * Sanitizes and formats audit log details into human-friendly text,
 * preventing any raw JSON, gateway internals, or transaction ID leakage.
 */
export function sanitizeAuditDetails(action, rawDetails) {
  if (!rawDetails) return '—';
  let clean = String(rawDetails).trim();

  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      if (action === 'PAYMENT_RECEIVED') {
        const amt = parsed.amount || '';
        const brand = parsed.brand || 'Card';
        const card = parsed.maskedCard || (parsed.last4 ? `•••• ${parsed.last4}` : '');
        const inv = parsed.invoiceNumber ? ` • ${parsed.invoiceNumber}` : '';
        return `Payment of ${amt} processed via ${brand} ${card ? `(${card})` : ''}${inv}`.trim();
      }
      if (action === 'INVOICE_GENERATED') {
        const inv = parsed.invoiceNumber || 'Invoice';
        const amt = parsed.amount ? ` for ${parsed.amount}` : '';
        return `${inv} generated${amt}`;
      }
      // General JSON sanitizer: strip sensitive keys
      const sensitiveKeys = ['transactionid', 'secret', 'token', 'key', 'password', 'gateway', 'sortcode', 'bankaccount', 'accountnumber', 'clientsecret'];
      const safeEntries = Object.entries(parsed)
        .filter(([k]) => !sensitiveKeys.some((sk) => k.toLowerCase().includes(sk)))
        .map(([k, v]) => `${k}: ${v}`);
      return safeEntries.join(' • ') || 'Operation completed successfully';
    } catch {
      // not JSON, fallback
    }
  }

  // Scrub any transaction IDs or keys in raw text
  clean = clean.replace(/pi_[a-zA-Z0-9]{15,}/g, '[REDACTED_TX]');
  clean = clean.replace(/ch_[a-zA-Z0-9]{15,}/g, '[REDACTED_TX]');
  clean = clean.replace(/sk_[a-zA-Z0-9]{15,}/g, '[REDACTED_KEY]');

  return clean;
}

    // Format & unify events
    const unifiedEvents = [];

    securityLogs.forEach((log) => {
      unifiedEvents.push({
        id: `sec-${log.logId.toString()}`,
        type: 'SECURITY',
        action: log.action,
        status: log.result, // SUCCESS or FAILED
        details: sanitizeAuditDetails(log.action, log.details),
        ipAddress: log.ipAddress || 'Internal Network',
        vmName: null,
        timestamp: log.timestamp,
      });
    });

    activityLogs.forEach((act) => {
      unifiedEvents.push({
        id: `act-${act.activityId.toString()}`,
        type: 'VM_OPERATION',
        action: act.action,
        status: act.status, // SUCCESS, PENDING, FAILED
        details: sanitizeAuditDetails(act.action, act.details),
        ipAddress: 'Hyper-V Host Agent',
        vmName: act.vm?.vmName || (act.vmId ? `VM #${act.vmId}` : null),
        timestamp: act.createdAt,
      });
    });

    // Sort descending by timestamp
    unifiedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply text search filter if provided
    let filtered = unifiedEvents;
    if (search) {
      filtered = unifiedEvents.filter((item) =>
        item.action.toLowerCase().includes(search) ||
        item.details.toLowerCase().includes(search) ||
        (item.ipAddress && item.ipAddress.toLowerCase().includes(search)) ||
        (item.vmName && item.vmName.toLowerCase().includes(search))
      );
    }

    return res.json({
      success: true,
      totalCount: filtered.length,
      logs: filtered.slice(0, limit),
    });
  } catch (err) {
    console.error('[getAuditLogs Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
}

/**
 * 3. POST /api/security/revoke-sessions
 * Invalidates all active refresh tokens for the user
 */
export async function revokeAllSessions(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    // Record audit event
    await prisma.securityLog.create({
      data: {
        userId,
        action: 'SESSIONS_REVOKED',
        ipAddress: req.ip || req.socket.remoteAddress,
        result: 'SUCCESS',
        details: `User manually terminated all active refresh sessions (${result.count} revoked).`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'All other active sessions have been terminated.',
      revokedCount: result.count,
    });
  } catch (err) {
    console.error('[revokeAllSessions Error]:', err);
    return res.status(500).json({ error: 'Failed to revoke active sessions.' });
  }
}
