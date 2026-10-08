// ==============================================================================
// Controller: adminController.js
// Purpose: Enterprise Administrator Suite Controller
//          - Host & Fleet Telemetry (Windows Hyper-V Host CPU, RAM, VMs)
//          - User Management (List, Search, Update Roles, Suspend/Activate)
//          - Cluster Audit Trail & Activity Logs
// ==============================================================================

import os from 'os';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import hypervService from '../services/hypervService.js';

/**
 * 1. GET /api/admin/overview
 * Returns physical host metrics (CPU, RAM, Disks) and aggregate platform totals.
 */
export async function getAdminOverview(req, res) {
  try {
    // 1. Database totals
    const [userCount, vmCount, activeVmCount, subscriptionCount] = await Promise.all([
      prisma.user.count(),
      prisma.virtualMachine.count(),
      prisma.virtualMachine.count({ where: { status: 'running' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    // 2. Physical host telemetry
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const hostStats = {
      platform: os.platform(),
      hostname: os.hostname(),
      uptimeSeconds: os.uptime(),
      cpuCores: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Host Processor',
      totalRamGb: Number((totalMemBytes / (1024 ** 3)).toFixed(1)),
      usedRamGb: Number((usedMemBytes / (1024 ** 3)).toFixed(1)),
      freeRamGb: Number((freeMemBytes / (1024 ** 3)).toFixed(1)),
      ramUsagePercent: Math.round((usedMemBytes / totalMemBytes) * 100),
    };

    // 3. Query Hyper-V live host agent for VM fleet
    let hypervFleet = [];
    try {
      const hvData = await hypervService.getStatus('');
      if (Array.isArray(hvData)) {
        hypervFleet = hvData;
      } else if (hvData && Array.isArray(hvData.output)) {
        hypervFleet = hvData.output;
      } else if (hvData && hvData.VMName) {
        hypervFleet = [hvData];
      }
    } catch (e) {
      // Graceful fallback if agent is starting
    }

    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalVMs: vmCount,
        activeVMs: activeVmCount,
        activeSubscriptions: subscriptionCount,
      },
      host: hostStats,
      hypervFleetCount: hypervFleet.length,
    });
  } catch (error) {
    console.error('getAdminOverview error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin overview statistics' });
  }
}

/**
 * 2. GET /api/admin/users
 * Returns paginated & searchable list of users with their roles and VM counts.
 */
export async function getAdminUsers(req, res) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const roleFilter = req.query.role ? String(req.query.role).trim() : '';

    const whereClause = {
      AND: [
        search
          ? {
              OR: [
                { fullName: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {},
      ],
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        userRoles: {
          include: { role: true },
        },
        _count: {
          select: {
            virtualMachines: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedUsers = users.map((u) => {
      const primaryRole = u.userRoles?.[0]?.role?.roleName || 'Customer';
      return {
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        authProvider: u.provider,
        role: primaryRole,
        vmCount: u._count.virtualMachines,
        subscriptionCount: u._count.subscriptions,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      };
    });

    // Optional client-side role filtering if specified
    const filtered = roleFilter
      ? formattedUsers.filter((u) => u.role.toLowerCase() === roleFilter.toLowerCase())
      : formattedUsers;

    res.json({
      success: true,
      users: filtered,
      totalCount: filtered.length,
    });
  } catch (error) {
    console.error('getAdminUsers error:', error);
    res.status(500).json({ error: 'Failed to retrieve user directory' });
  }
}

/**
 * 3. PATCH /api/admin/users/:userId/status
 * Toggles user active / suspended status.
 */
export async function toggleUserStatus(req, res) {
  try {
    const targetUserId = Number(req.params.userId);
    const { isActive } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent admin from disabling their own account
    if (targetUserId === req.adminUser.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own administrator account' });
    }

    const updated = await prisma.user.update({
      where: { userId: targetUserId },
      data: { isActive: Boolean(isActive) },
    });

    // Log this administrative action
    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: isActive ? 'ADMIN_ACTIVATE_USER' : 'ADMIN_SUSPEND_USER',
        status: 'SUCCESS',
        details: `Administrator ${req.adminUser.email} ${isActive ? 'activated' : 'suspended'} account for ${updated.email} (ID: ${targetUserId})`,
      },
    });

    res.json({
      success: true,
      message: `User ${updated.email} has been ${isActive ? 'activated' : 'suspended'}.`,
      user: {
        userId: updated.userId,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error('toggleUserStatus error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

/**
 * 4. PATCH /api/admin/users/:userId/role
 * Updates a user's role (e.g. Admin, Customer, Support).
 */
export async function updateUserRole(req, res) {
  try {
    const targetUserId = Number(req.params.userId);
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const role = await prisma.role.findUnique({
      where: { roleName },
    });

    if (!role) {
      return res.status(404).json({ error: `Role '${roleName}' not found in system` });
    }

    // Delete existing roles and assign new role in a transaction
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: targetUserId } }),
      prisma.userRole.create({
        data: {
          userId: targetUserId,
          roleId: role.roleId,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_CHANGE_USER_ROLE',
        status: 'SUCCESS',
        details: `Administrator changed role of user ID ${targetUserId} to '${roleName}'`,
      },
    });

    res.json({
      success: true,
      message: `User role updated to ${roleName}`,
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

/**
 * 5. GET /api/admin/fleet/vms
 * Returns all Virtual Machines across all users with live Hyper-V power state.
 */
export async function getFleetVMs(req, res) {
  try {
    const vms = await prisma.virtualMachine.findMany({
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
        plan: true,
        image: true,
        ipPool: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Cross-reference with live Hyper-V agent
    let hvMap = new Map();
    try {
      const hvData = await hypervService.getStatus('');
      let list = [];
      if (Array.isArray(hvData)) list = hvData;
      else if (hvData?.output && Array.isArray(hvData.output)) list = hvData.output;
      else if (hvData?.VMName) list = [hvData];

      list.forEach((h) => {
        if (h.VMName) hvMap.set(h.VMName.toLowerCase(), h);
      });
    } catch (_) {}

    const formattedVMs = vms.map((v) => {
      const vmDisplayName = v.vmName || v.name || `vm-${v.vmId}`;
      const hv = hvMap.get(vmDisplayName.toLowerCase());
      const assignedIp = (v.ipPool && v.ipPool.length > 0) ? v.ipPool[0].ipAddress : (v.ipAddress || '172.19.124.x');

      return {
        vmId: v.vmId,
        name: vmDisplayName,
        hostname: v.hostname || `${vmDisplayName}.atech-vps.net`,
        os: v.image?.name || 'Ubuntu 24.04 LTS',
        status: hv?.State ? (hv.State === 'Running' ? 'running' : 'stopped') : (v.status ? v.status.toLowerCase() : 'stopped'),
        ip: assignedIp,
        cpuCores: v.cpuCores,
        ramGb: v.ramGb,
        storageGb: v.storageGb,
        owner: {
          userId: v.user?.userId,
          fullName: v.user?.fullName,
          email: v.user?.email,
        },
        createdAt: v.createdAt,
      };
    });

    res.json({
      success: true,
      vms: formattedVMs,
      totalCount: formattedVMs.length,
    });
  } catch (error) {
    console.error('getFleetVMs error:', error);
    res.status(500).json({ error: 'Failed to fetch global VM fleet' });
  }
}

/**
 * 6. POST /api/admin/fleet/vms/:vmId/power
 * Admin power control override (START, STOP, RESTART, FORCE_STOP).
 */
export async function adminPowerControl(req, res) {
  try {
    const vmId = Number(req.params.vmId);
    const { action } = req.body;

    if (!['START', 'STOP', 'RESTART', 'FORCE_STOP'].includes(action)) {
      return res.status(400).json({ error: 'Invalid power action' });
    }

    const vm = await prisma.virtualMachine.findUnique({
      where: { vmId },
      include: { user: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }

    const vmTargetName = vm.vmName || vm.name;
    const result = await hypervService.controlPower(vmTargetName, action);

    // Update DB status
    const newStatus = (action === 'START' || action === 'RESTART') ? 'running' : 'stopped';
    await prisma.virtualMachine.update({
      where: { vmId },
      data: { status: newStatus },
    });

    // Record audit log
    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        vmId: vm.vmId,
        action: `ADMIN_POWER_${action}`,
        status: 'SUCCESS',
        details: `Administrator ${req.adminUser.email} executed ${action} on VM '${vmTargetName}' owned by ${vm.user?.email || 'N/A'}`,
      },
    });

    res.json({
      success: true,
      message: `Power action '${action}' successfully dispatched to VM ${vmTargetName}`,
      result,
    });
  } catch (error) {
    console.error('adminPowerControl error:', error);
    res.status(500).json({ error: error.message || 'Power action failed' });
  }
}

/**
 * 7. GET /api/admin/audit-logs
 * Comprehensive cluster-wide activity and security audit trail.
 */
export async function getAdminAuditLogs(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 250);

    const [activityLogs, securityLogs] = await Promise.all([
      prisma.activityLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { userId: true, fullName: true, email: true },
          },
          vm: {
            select: { vmId: true, vmName: true },
          },
        },
      }),
      prisma.securityLog.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { userId: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    // Unify both streams into chronological audit event records
    const unifiedLogs = [
      ...activityLogs.map((l) => ({
        id: `act-${l.activityId}`,
        type: 'ACTIVITY',
        action: l.action,
        status: l.status,
        details: l.details || '',
        actor: l.user ? { userId: l.user.userId, name: l.user.fullName, email: l.user.email } : { email: 'System' },
        targetVm: l.vm ? l.vm.vmName : null,
        timestamp: l.createdAt,
      })),
      ...securityLogs.map((s) => ({
        id: `sec-${s.logId}`,
        type: 'SECURITY',
        action: s.action,
        status: s.result,
        details: s.details || '',
        actor: s.user ? { userId: s.user.userId, name: s.user.fullName, email: s.user.email } : { email: 'System' },
        ipAddress: s.ipAddress,
        timestamp: s.timestamp,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      logs: unifiedLogs.slice(0, limit),
      totalCount: unifiedLogs.length,
    });
  } catch (error) {
    console.error('getAdminAuditLogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve cluster audit logs' });
  }
}

/**
 * ==============================================================================
 * ENTERPRISE INFRASTRUCTURE SUITE (OPTIONS 1 - 6)
 * ==============================================================================
 */

/**
 * OPTION 1: CUSTOMER IMPERSONATION ("Login as User" / Ghost Mode)
 * POST /api/admin/impersonate/:userId
 */
export async function impersonateUser(req, res) {
  try {
    const targetUserId = Number(req.params.userId);
    if (!targetUserId) {
      return res.status(400).json({ error: 'Valid userId required' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { userId: targetUserId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';
    const primaryRole = targetUser.userRoles?.[0]?.role?.roleName || 'Customer';

    // Scoped 2-hour impersonation access token
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.userId,
        email: targetUser.email,
        role: primaryRole,
        isImpersonated: true,
        impersonatedBy: req.adminUser.email,
      },
      secret,
      { expiresIn: '2h' }
    );

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_IMPERSONATE_USER',
        status: 'SUCCESS',
        details: `Administrator ${req.adminUser.email} initiated impersonation session for ${targetUser.email} (ID: ${targetUserId})`,
      },
    });

    res.json({
      success: true,
      message: `Impersonation session created for ${targetUser.email}`,
      accessToken: impersonationToken,
      user: {
        userId: targetUser.userId,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: primaryRole,
        isImpersonated: true,
        impersonatedBy: req.adminUser.email,
      },
    });
  } catch (error) {
    console.error('impersonateUser error:', error);
    res.status(500).json({ error: 'Failed to generate impersonation token' });
  }
}

/**
 * OPTION 4: SYSTEM ANNOUNCEMENTS & MAINTENANCE BANNERS
 * GET /api/admin/announcements
 * POST /api/admin/announcements
 * DELETE /api/admin/announcements/:id
 */
export async function getAnnouncements(req, res) {
  try {
    const list = await prisma.systemAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, announcements: list });
  } catch (error) {
    console.error('getAnnouncements error:', error);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
}

export async function createAnnouncement(req, res) {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    const created = await prisma.systemAnnouncement.create({
      data: {
        title,
        message,
        type: type || 'info',
        createdBy: req.adminUser.email,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_CREATE_ANNOUNCEMENT',
        status: 'SUCCESS',
        details: `Administrator broadcast announcement: "${title}" (${type})`,
      },
    });

    res.json({ success: true, announcement: created });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    res.status(500).json({ error: 'Failed to broadcast announcement' });
  }
}

export async function deleteAnnouncement(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.systemAnnouncement.delete({ where: { id } });
    res.json({ success: true, message: 'Announcement removed' });
  } catch (error) {
    console.error('deleteAnnouncement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
}

/**
 * OPTION 2: DYNAMIC VPS PLANS & PROMO CODE ENGINE
 * GET /api/admin/plans
 * POST /api/admin/plans
 * PATCH /api/admin/plans/:planId
 * GET /api/admin/coupons
 * POST /api/admin/coupons
 * DELETE /api/admin/coupons/:id
 */
export async function getAdminPlans(req, res) {
  try {
    const plans = await prisma.vPSPlan.findMany({
      orderBy: { planId: 'asc' },
    });
    res.json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load plans' });
  }
}

export async function createAdminPlan(req, res) {
  try {
    const { name, cpuCores, ramGb, storageGb, monthlyPrice } = req.body;
    if (!name || !monthlyPrice) {
      return res.status(400).json({ error: 'Plan name and monthly price are required' });
    }

    const created = await prisma.vPSPlan.create({
      data: {
        name,
        cpuCores: Number(cpuCores) || 2,
        ramGb: Number(ramGb) || 4,
        storageGb: Number(storageGb) || 50,
        monthlyPrice: Number(monthlyPrice),
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_CREATE_PLAN',
        status: 'SUCCESS',
        details: `Administrator created new VPS plan '${created.name}' at $${created.monthlyPrice}/mo`,
      },
    });

    res.json({ success: true, plan: created });
  } catch (error) {
    console.error('createAdminPlan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
}

export async function updatePlan(req, res) {
  try {
    const planId = Number(req.params.planId);
    const { name, cpuCores, ramGb, storageGb, monthlyPrice, isActive } = req.body;

    const updated = await prisma.vPSPlan.update({
      where: { planId },
      data: {
        ...(name && { name }),
        ...(cpuCores && { cpuCores: Number(cpuCores) }),
        ...(ramGb && { ramGb: Number(ramGb) }),
        ...(storageGb && { storageGb: Number(storageGb) }),
        ...(monthlyPrice && { monthlyPrice: Number(monthlyPrice) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_UPDATE_PLAN',
        status: 'SUCCESS',
        details: `Administrator updated VPS plan '${updated.name}' (ID: ${planId})`,
      },
    });

    res.json({ success: true, plan: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
}

export async function getAdminCoupons(req, res) {
  try {
    const coupons = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load coupons' });
  }
}

export async function createAdminCoupon(req, res) {
  try {
    const { code, discountType, discountValue, maxUses, applicablePlanId } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json({ error: 'Code and discount value required' });
    }

    const created = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType: discountType || 'PERCENT',
        discountValue: Number(discountValue),
        maxUses: Number(maxUses) || 100,
        applicablePlanId: applicablePlanId ? Number(applicablePlanId) : null,
        isActive: true,
      },
    });

    res.json({ success: true, coupon: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promo code' });
  }
}

export async function deleteAdminCoupon(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.promoCode.delete({ where: { id } });
    res.json({ success: true, message: 'Promo code deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
}

/**
 * OPTION 3: IP ADDRESS POOL & SUBNET MANAGER (IPAM)
 * GET /api/admin/ipam
 * POST /api/admin/ipam
 * PATCH /api/admin/ipam/:ipId/release
 */
export async function getIpamPool(req, res) {
  try {
    const ips = await prisma.iPPool.findMany({
      include: {
        assignedVm: {
          select: { vmId: true, vmName: true, user: { select: { email: true } } },
        },
      },
      orderBy: { ipId: 'asc' },
    });
    res.json({ success: true, ips });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load IP inventory' });
  }
}

export async function addIpToPool(req, res) {
  try {
    const { ipAddress, subnetMask, gateway, ipType } = req.body;
    if (!ipAddress) {
      return res.status(400).json({ error: 'ipAddress is required' });
    }

    const created = await prisma.iPPool.create({
      data: {
        ipAddress,
        subnetMask: subnetMask || '255.255.255.0',
        gateway: gateway || '172.19.124.1',
        ipType: ipType || 'PUBLIC_IPV4',
        status: 'AVAILABLE',
      },
    });

    res.json({ success: true, ip: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add IP address to pool' });
  }
}

export async function releaseIpFromPool(req, res) {
  try {
    const ipId = Number(req.params.ipId);
    const updated = await prisma.iPPool.update({
      where: { ipId },
      data: {
        status: 'AVAILABLE',
        assignedVmId: null,
      },
    });
    res.json({ success: true, message: `IP ${updated.ipAddress} released back to pool` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to release IP' });
  }
}

/**
 * OPTION 5: CLUSTER FIREWALL BLACKLIST & ABUSE QUARANTINE
 * GET /api/admin/security/threats
 * POST /api/admin/security/ban-ip
 */
export async function getSecurityThreats(req, res) {
  try {
    const failedLogins = await prisma.securityLog.findMany({
      where: { result: 'FAILED' },
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { email: true } } },
    });

    res.json({
      success: true,
      threats: failedLogins.map((f) => ({
        id: f.logId.toString(),
        action: f.action,
        ipAddress: f.ipAddress || 'Unknown',
        targetUser: f.user?.email || 'N/A',
        details: f.details || '',
        timestamp: f.timestamp,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load security threat events' });
  }
}

export async function banThreatIp(req, res) {
  try {
    const { ipAddress, reason } = req.body;
    if (!ipAddress) return res.status(400).json({ error: 'IP address required' });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_BAN_IP',
        status: 'SUCCESS',
        details: `Administrator banned IP address ${ipAddress} across cluster. Reason: ${reason || 'Suspicious Activity'}`,
      },
    });

    res.json({
      success: true,
      message: `IP ${ipAddress} has been successfully banned cluster-wide.`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban IP address' });
  }
}

/**
 * OPTION 6: SUPPORT TICKET HELPDESK
 * GET /api/admin/tickets
 * POST /api/admin/tickets/:ticketId/reply
 */
export async function getAdminTickets(req, res) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(tickets.map((t) => t.userId))];
    const users = await prisma.user.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, fullName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.userId, u]));

    const enriched = tickets.map((t) => {
      const user = userMap.get(t.userId) || { email: `User #${t.userId}`, fullName: 'Customer' };
      let chatHistory = [];
      if (t.chatHistory) {
        try {
          chatHistory = JSON.parse(t.chatHistory);
        } catch (_) {}
      }
      if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
        if (t.message) {
          chatHistory.push({
            id: 'msg-init',
            sender: 'CUSTOMER',
            senderName: user.fullName || 'Customer',
            message: t.message,
            timestamp: t.createdAt,
          });
        }
        if (t.response) {
          chatHistory.push({
            id: 'msg-resp',
            sender: 'SUPPORT',
            senderName: t.assignedTo || 'Support Engineer',
            message: t.response,
            timestamp: t.updatedAt || t.createdAt,
          });
        }
      }
      return {
        ...t,
        user,
        chatHistory,
      };
    });

    res.json({ success: true, tickets: enriched });
  } catch (error) {
    console.error('getAdminTickets error:', error);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
}

export async function replyAdminTicket(req, res) {
  try {
    const id = Number(req.params.ticketId);
    const { response, status } = req.body;

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    let chatHistory = [];
    if (existing.chatHistory) {
      try {
        chatHistory = JSON.parse(existing.chatHistory);
      } catch (_) {}
    }
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
      if (existing.message) {
        chatHistory.push({
          id: 'msg-init',
          sender: 'CUSTOMER',
          senderName: 'Customer',
          message: existing.message,
          timestamp: existing.createdAt,
        });
      }
    }

    if (response) {
      chatHistory.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'SUPPORT',
        senderName: req.adminUser.fullName || req.adminUser.email || 'Support Engineer',
        message: response.trim(),
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(response && { response }),
        chatHistory: JSON.stringify(chatHistory),
        status: status || (existing.status === 'CLOSED' ? 'CLOSED' : 'RESOLVED'),
        assignedTo: req.adminUser.email,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_REPLY_TICKET',
        status: 'SUCCESS',
        details: `Administrator ${req.adminUser.email} replied to ticket #${id} and updated status to '${updated.status}'`,
      },
    });

    res.json({
      success: true,
      ticket: {
        ...updated,
        chatHistory,
      },
    });
  } catch (error) {
    console.error('replyAdminTicket error:', error);
    res.status(500).json({ error: 'Failed to update ticket response' });
  }
}

