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

    // 3. Fetch active system announcements
    const announcements = await prisma.systemAnnouncement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. Fetch recent support ticket updates for user
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
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

    // Map System Announcements
    announcements.forEach((ann) => {
      items.push({
        id: `ann-${ann.id}`,
        title: `Announcement: ${ann.title}`,
        message: ann.message,
        type: ann.type === 'danger' ? 'danger' : ann.type === 'warning' ? 'warning' : 'info',
        category: 'system',
        timestamp: ann.createdAt,
        isRead: new Date(ann.createdAt) <= lastReadAt,
      });
    });

    // Map Tickets Updates
    tickets.forEach((t) => {
      if (t.response || t.status === 'RESOLVED' || t.status === 'IN_PROGRESS') {
        items.push({
          id: `tkt-${t.id}-${new Date(t.updatedAt).getTime()}`,
          title: `Ticket #${t.id}: ${t.status}`,
          message: t.response ? `Admin replied: "${t.response.slice(0, 80)}..."` : `Ticket "${t.subject}" status updated to ${t.status}`,
          type: t.status === 'RESOLVED' ? 'success' : 'info',
          category: 'support',
          timestamp: t.updatedAt,
          isRead: new Date(t.updatedAt) <= lastReadAt,
        });
      }
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
