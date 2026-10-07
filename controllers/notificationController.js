// ==============================================================================
// Controller: notificationController.js
// Purpose: Aggregates real-time infrastructure alerts, billing updates & audit events
// ==============================================================================

import prisma from '../lib/prisma.js';

// In-memory read tracking store per user session (fallback if no dedicated read table)
const userReadTimestamps = new Map();

/**
 * 1. GET /api/notifications - Fetch user notifications and system alerts
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const lastReadAt = userReadTimestamps.get(userId) || new Date(0);

    // 1. Fetch recent security logs for user
    const securityLogs = await prisma.securityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 15,
    });

    // 2. Fetch recent invoices for user
    const recentInvoices = await prisma.invoice.findMany({
      where: { userId },
      include: { subscription: { include: { plan: true } } },
      orderBy: { issueDate: 'desc' },
      take: 5,
    });

    // 3. Fetch user VMs
    const vms = await prisma.virtualMachine.findMany({
      where: { userId, status: { not: 'TERMINATED' } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const items = [];

    // Map security and VM events
    securityLogs.forEach((log) => {
      let type = 'info';
      let title = 'Security Activity';
      let category = 'system';

      if (log.action.includes('LOGIN')) {
        title = 'User Login Recorded';
        type = log.result === 'SUCCESS' ? 'success' : 'warning';
        category = 'security';
      } else if (log.action.includes('SNAPSHOT')) {
        title = 'Snapshot Operation';
        type = 'success';
        category = 'infrastructure';
      } else if (log.action.includes('REBUILD')) {
        title = 'VM Rebuilt Successfully';
        type = 'warning';
        category = 'infrastructure';
      } else if (log.action.includes('CONSOLE')) {
        title = 'Web Terminal Session';
        type = 'info';
        category = 'security';
      } else if (log.action.includes('PASSWORD')) {
        title = 'Root Password Changed';
        type = 'warning';
        category = 'security';
      }

      items.push({
        id: `sec-${log.logId}`,
        title,
        message: log.details || `Action ${log.action} executed.`,
        type,
        category,
        timestamp: log.timestamp,
        isRead: new Date(log.timestamp) <= lastReadAt,
      });
    });

    // Map Invoices
    recentInvoices.forEach((inv) => {
      items.push({
        id: `inv-${inv.invoiceId}`,
        title: `Invoice ${inv.invoiceNumber} Generated`,
        message: `Monthly subscription invoice of $${Number(inv.total).toFixed(2)} USD paid in full.`,
        type: 'success',
        category: 'billing',
        timestamp: inv.issueDate,
        isRead: new Date(inv.issueDate) <= lastReadAt,
      });
    });

    // Sort all chronologically descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute unread count
    const unreadCount = items.filter((i) => !i.isRead).length;

    return res.json({
      success: true,
      unreadCount,
      notifications: items.slice(0, 20),
    });
  } catch (err) {
    console.error('[getNotifications Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

/**
 * 2. POST /api/notifications/mark-read - Mark all notifications as read
 */
export async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    userReadTimestamps.set(userId, new Date());
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[markAllNotificationsRead Error]:', err);
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
}

/**
 * 3. POST /api/notifications/clear - Clear user read log
 */
export async function clearNotifications(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    userReadTimestamps.set(userId, new Date(Date.now() + 10000));
    return res.json({ success: true, message: 'Notifications cleared' });
  } catch (err) {
    console.error('[clearNotifications Error]:', err);
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
}
