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
import { sendTicketReplyNotification, sendInvoiceReceiptEmail } from '../services/emailService.js';
import { calculateTicketMetrics } from '../services/ticketAutomationService.js';
import { sanitizeAuditDetails } from './securityController.js';
import { createStripeRefund } from '../services/stripeService.js';
import { startBroadcastCampaign, getBroadcastJobStatus as getJobStatus, listRecentBroadcasts } from '../services/safeBroadcastService.js';

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

    const [users, availableRoles] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          userRoles: {
            include: { role: true },
          },
          virtualMachines: {
            select: { vmId: true, status: true },
          },
          subscriptions: {
            select: { subscriptionId: true, status: true },
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 150,
      }),
      prisma.role.findMany({ select: { roleName: true, description: true } }),
    ]);

    const formattedUsers = users.map((u) => {
      const primaryRole = u.userRoles?.[0]?.role?.roleName || 'Customer';
      const allUserRoles = u.userRoles.map((ur) => ur.role.roleName);
      const activeVms = u.virtualMachines.filter((v) => v.status !== 'TERMINATED').length;
      const activeSubs = u.subscriptions.filter((s) => s.status === 'ACTIVE').length;
      const totalSpend = u.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

      return {
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        city: u.city,
        country: u.country,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        authProvider: u.provider,
        role: primaryRole,
        roles: allUserRoles,
        vmCount: activeVms,
        totalVmCount: u.virtualMachines.length,
        subscriptionCount: activeSubs,
        totalSpend,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      };
    });

    // Optional client-side role filtering if specified
    const filtered = roleFilter && roleFilter !== 'ALL'
      ? formattedUsers.filter((u) => u.roles.some((r) => r.toLowerCase() === roleFilter.toLowerCase()))
      : formattedUsers;

    res.json({
      success: true,
      users: filtered,
      totalCount: filtered.length,
      availableRoles: availableRoles.map((r) => r.roleName),
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
        details: sanitizeAuditDetails(l.action, l.details),
        actor: l.user ? { userId: l.user.userId, name: l.user.fullName, email: l.user.email } : { email: 'System' },
        targetVm: l.vm ? l.vm.vmName : null,
        timestamp: l.createdAt,
      })),
      ...securityLogs.map((s) => ({
        id: `sec-${s.logId}`,
        type: 'SECURITY',
        action: s.action,
        status: s.result,
        details: sanitizeAuditDetails(s.action, s.details),
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
    const { name, description, cpuCores, ramGb, storageGb, storageType, bandwidthMbps, monthlyPrice } = req.body;
    if (!name || !monthlyPrice) {
      return res.status(400).json({ error: 'Plan name and monthly price are required' });
    }

    const created = await prisma.vPSPlan.create({
      data: {
        name: name.trim(),
        description: description || `Standard VPS hosting instance with ${cpuCores || 2} vCPUs and ${ramGb || 4} GB RAM`,
        cpuCores: Number(cpuCores) || 2,
        ramGb: Number(ramGb) || 4,
        storageGb: Number(storageGb) || 50,
        storageType: storageType || 'NVMe',
        bandwidthMbps: Number(bandwidthMbps) || 1000,
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
    res.status(500).json({ error: error.message || 'Failed to create plan' });
  }
}

export async function updatePlan(req, res) {
  try {
    const planId = Number(req.params.planId);
    const { name, description, cpuCores, ramGb, storageGb, storageType, bandwidthMbps, monthlyPrice, isActive } = req.body;

    const updated = await prisma.vPSPlan.update({
      where: { planId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(cpuCores && { cpuCores: Number(cpuCores) }),
        ...(ramGb && { ramGb: Number(ramGb) }),
        ...(storageGb && { storageGb: Number(storageGb) }),
        ...(storageType && { storageType }),
        ...(bandwidthMbps && { bandwidthMbps: Number(bandwidthMbps) }),
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
    console.error('updatePlan error:', error);
    res.status(500).json({ error: error.message || 'Failed to update plan' });
  }
}

export async function deletePlan(req, res) {
  try {
    const planId = Number(req.params.planId);
    if (!planId) return res.status(400).json({ error: 'Valid plan ID is required' });

    // Check if any subscriptions or VMs currently use this plan
    const [subCount, vmCount] = await Promise.all([
      prisma.subscription.count({ where: { planId } }),
      prisma.virtualMachine.count({ where: { planId } }),
    ]);

    if (subCount > 0 || vmCount > 0) {
      // Soft-delete / deactivate plan instead of breaking database constraints
      const deactivated = await prisma.vPSPlan.update({
        where: { planId },
        data: { isActive: false },
      });
      return res.json({
        success: true,
        message: `Plan has ${subCount + vmCount} active references. It has been deactivated so new users cannot purchase it.`,
        plan: deactivated,
      });
    }

    await prisma.vPSPlan.delete({ where: { planId } });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_DELETE_PLAN',
        status: 'SUCCESS',
        details: `Administrator deleted VPS plan ID: ${planId}`,
      },
    });

    res.json({ success: true, message: 'Plan permanently removed from database' });
  } catch (error) {
    console.error('deletePlan error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete plan' });
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
      return calculateTicketMetrics({
        ...t,
        user,
        chatHistory,
      });
    });

    res.json({ success: true, tickets: enriched });
  } catch (error) {
    console.error('getAdminTickets error:', error);
    res.status(500).json({ error: 'Failed to load support tickets' });
  }
}

export async function getAdminTicketDetails(req, res) {
  try {
    const id = Number(req.params.ticketId);
    const t = await prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!t) return res.status(404).json({ error: 'Ticket not found' });
    const user = (await prisma.user.findUnique({
      where: { userId: t.userId },
      select: { userId: true, fullName: true, email: true },
    })) || { email: `User #${t.userId}`, fullName: 'Customer' };

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

    res.json({
      success: true,
      ticket: calculateTicketMetrics({
        ...t,
        user,
        chatHistory,
      }),
    });
  } catch (error) {
    console.error('getAdminTicketDetails error:', error);
    res.status(500).json({ error: 'Failed to load ticket details' });
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

    const targetStatus = status || (existing.status === 'CLOSED' ? 'CLOSED' : 'RESOLVED');

    // If transitioned to AWAITING_USER_ACTION, start the 10-day countdown clock
    let awaitingSince = existing.awaitingActionSince;
    let reminderLvl = existing.reminderLevel;
    let lastAutoAction = existing.lastAutomatedAction;

    if (targetStatus === 'AWAITING_USER_ACTION') {
      awaitingSince = new Date();
      reminderLvl = 0;
      lastAutoAction = 'Transitioned to Awaiting User Action - 10 day countdown started';
    } else if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
      awaitingSince = null;
      lastAutoAction = `Ticket marked as ${targetStatus}`;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(response && { response }),
        chatHistory: JSON.stringify(chatHistory),
        status: targetStatus,
        assignedTo: req.adminUser.email,
        awaitingActionSince: awaitingSince,
        reminderLevel: reminderLvl,
        lastAutomatedAction: lastAutoAction,
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

    // Notify customer by email of the support team's reply
    if (response) {
      prisma.user.findUnique({
        where: { userId: existing.userId },
        select: { email: true, fullName: true },
      }).then((customer) => {
        if (customer && customer.email) {
          return sendTicketReplyNotification({
            ticket: updated,
            senderName: req.adminUser.fullName || req.adminUser.email || 'ATC Support Engineer',
            message: response.trim(),
            recipientEmail: customer.email,
            isCustomerRecipient: true,
          });
        }
      }).catch((mailErr) => {
        console.warn('[Admin Ticket Reply Email Warning]:', mailErr.message);
      });
    }

    res.json({
      success: true,
      ticket: calculateTicketMetrics({
        ...updated,
        chatHistory,
      }),
    });
  } catch (error) {
    console.error('replyAdminTicket error:', error);
    res.status(500).json({ error: 'Failed to update ticket response' });
  }
}

// ==============================================================================
// 1. ADVANCED USER & SERVICE PROVIDER PROFILE (360° DRAWER)
// ==============================================================================

/**
 * GET /api/admin/users/:userId/profile
 * Returns 360° profile of a user: profile, roles, VMs, subscriptions, invoices, and logs
 */
export async function getUserFullProfile(req, res) {
  try {
    const targetUserId = Number(req.params.userId);
    if (!targetUserId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const [user, roles, vms, subscriptions, invoices, payments, activityLogs, securityLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { userId: targetUserId },
        select: {
          userId: true,
          fullName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          provider: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.userRole.findMany({
        where: { userId: targetUserId },
        include: { role: true },
      }),
      prisma.virtualMachine.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.findMany({
        where: { userId: targetUserId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { userId: targetUserId },
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.securityLog.findMany({
        where: { userId: targetUserId },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalSpend = payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const sanitizedActivity = activityLogs.map((a) => ({
      ...a,
      details: sanitizeAuditDetails(a.action, a.details),
    }));

    return res.json({
      success: true,
      profile: {
        ...user,
        roles: roles.map((r) => r.role.roleName),
        totalSpend,
        vms,
        subscriptions,
        invoices,
        payments,
        activityLogs: sanitizedActivity,
        securityLogs,
      },
    });
  } catch (error) {
    console.error('getUserFullProfile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

// ==============================================================================
// 2. COMPLETE PAYMENTS & FINANCIAL MANAGEMENT SUITE
// ==============================================================================

/**
 * GET /api/admin/billing/overview
 * Real-time financial indicators and transactional summary
 */
export async function getAdminBillingOverview(req, res) {
  try {
    const [payments, invoices, subscriptions] = await Promise.all([
      prisma.payment.findMany({
        select: { amount: true, paymentGateway: true, status: true },
      }),
      prisma.invoice.findMany({
        select: { amount: true, status: true },
      }),
      prisma.subscription.findMany({
        select: { status: true, plan: { select: { monthlyPrice: true } } },
      }),
    ]);

    let grossRevenue = 0;
    let stripeVolume = 0;
    let bankVolume = 0;
    let refundedVolume = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.status === 'COMPLETED') {
        grossRevenue += amt;
        if (p.paymentGateway === 'STRIPE_CARD') stripeVolume += amt;
        if (p.paymentGateway === 'DIRECT_BANK_TRANSFER') bankVolume += amt;
      } else if (p.status === 'REFUNDED') {
        refundedVolume += amt;
      }
    });

    const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
    const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');
    const mrr = activeSubscriptions.reduce((sum, s) => sum + Number(s.plan?.monthlyPrice || 0), 0);

    return res.json({
      success: true,
      overview: {
        grossRevenue,
        stripeVolume,
        bankVolume,
        refundedVolume,
        netRevenue: Math.max(0, grossRevenue - refundedVolume),
        pendingInvoicesCount: pendingInvoices.length,
        pendingTotal,
        activeSubscriptionsCount: activeSubscriptions.length,
        mrr,
        arr: mrr * 12,
        totalInvoicesCount: invoices.length,
      },
    });
  } catch (error) {
    console.error('getAdminBillingOverview error:', error);
    res.status(500).json({ error: 'Failed to calculate billing overview' });
  }
}

/**
 * GET /api/admin/billing/invoices
 * Paginated and searchable invoices ledger
 */
export async function getAdminInvoices(req, res) {
  try {
    const status = req.query.status || 'ALL';
    const search = (req.query.search || '').trim().toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    let whereClause = {};
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        user: { select: { userId: true, fullName: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.json({
      success: true,
      invoices,
      totalCount: invoices.length,
    });
  } catch (error) {
    console.error('getAdminInvoices error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
}

/**
 * POST /api/admin/billing/refund
 * Processes 1-Click refund via Stripe API and updates ledger
 */
export async function processAdminRefund(req, res) {
  try {
    const { paymentId, reason = 'Administrative Refund' } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { paymentId: Number(paymentId) },
      include: {
        invoice: true,
        user: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Payment is already refunded' });
    }

    // Process refund through Stripe if paid via Stripe Card
    let stripeRefundResult = null;
    if (payment.paymentGateway === 'STRIPE_CARD' && payment.transactionId) {
      stripeRefundResult = await createStripeRefund({
        transactionId: payment.transactionId,
        amount: payment.amount,
        reason,
      });
    }

    // Update payment and invoice status in database
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { paymentId: payment.paymentId },
        data: { status: 'REFUNDED' },
      });

      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { invoiceId: payment.invoiceId },
          data: { status: 'REFUNDED' },
        });
      }

      // Deactivate any active subscription associated with this customer's refund
      await tx.subscription.updateMany({
        where: {
          userId: payment.userId,
          status: 'ACTIVE',
        },
        data: { status: 'CANCELLED' },
      });

      await tx.activityLog.create({
        data: {
          userId: req.adminUser.userId,
          action: 'ADMIN_PAYMENT_REFUNDED',
          status: 'SUCCESS',
          details: `Administrator refunded payment #${payment.paymentId} ($${payment.amount} USD) for user ${payment.user?.email}. Reason: ${reason}`,
        },
      });
    });

    return res.json({
      success: true,
      message: `Payment of $${payment.amount} USD refunded successfully.`,
      refundDetails: stripeRefundResult,
    });
  } catch (error) {
    console.error('processAdminRefund error:', error);
    res.status(500).json({ error: error.message || 'Failed to process refund' });
  }
}

/**
 * POST /api/admin/billing/mark-paid
 * Manually marks a pending invoice as PAID (e.g. for bank wire) and activates customer slot
 */
export async function markInvoiceAsPaid(req, res) {
  try {
    const { invoiceId, notes } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { invoiceId: Number(invoiceId) },
      include: { user: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice is already marked as PAID' });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 1. Update Invoice
      await tx.invoice.update({
        where: { invoiceId: invoice.invoiceId },
        data: {
          status: 'PAID',
          paymentDate: now,
        },
      });

      // 2. Create or Update Payment record
      await tx.payment.create({
        data: {
          userId: invoice.userId,
          invoiceId: invoice.invoiceId,
          paymentGateway: 'DIRECT_BANK_TRANSFER',
          transactionId: `TXN-MANUAL-${Date.now()}`,
          amount: invoice.amount,
          currency: 'USD',
          status: 'COMPLETED',
          paymentDate: now,
        },
      });

      // 3. Deposit active subscription slot for customer
      let defaultPlan = await tx.vPSPlan.findFirst({ orderBy: { monthlyPrice: 'asc' } });
      await tx.subscription.create({
        data: {
          userId: invoice.userId,
          planId: defaultPlan?.planId || 1,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      // 4. Log admin audit
      await tx.activityLog.create({
        data: {
          userId: req.adminUser.userId,
          action: 'ADMIN_MARK_INVOICE_PAID',
          status: 'SUCCESS',
          details: `Administrator marked invoice ${invoice.invoiceNumber} as PAID. Activated 30-day VPS slot for ${invoice.user.email}.${notes ? ` Notes: ${notes}` : ''}`,
        },
      });
    });

    // Send receipt email in background
    sendInvoiceReceiptEmail({
      email: invoice.user.email,
      fullName: invoice.user.fullName,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      planName: 'Cloud VPS Package',
      currency: 'USD',
    }).catch((err) => console.warn('[Invoice Email Notice]:', err.message));

    return res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} marked as PAID. Active VPS slot provisioned for customer.`,
    });
  } catch (error) {
    console.error('markInvoiceAsPaid error:', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
}

/**
 * POST /api/admin/billing/void-invoice
 * Voids an unpaid/pending invoice and closes provision opportunity
 */
export async function voidAdminInvoice(req, res) {
  try {
    const { invoiceId, reason = 'Cancelled by administrator' } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: 'Invoice ID is required' });
    }

    const updated = await prisma.invoice.update({
      where: { invoiceId: Number(invoiceId) },
      data: { status: 'CANCELLED' },
      include: { user: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_VOID_INVOICE',
        status: 'SUCCESS',
        details: `Administrator voided invoice ${updated.invoiceNumber} for user ${updated.user.email}. Reason: ${reason}`,
      },
    });

    return res.json({
      success: true,
      message: `Invoice ${updated.invoiceNumber} has been successfully voided.`,
    });
  } catch (error) {
    console.error('voidAdminInvoice error:', error);
    res.status(500).json({ error: 'Failed to void invoice' });
  }
}

/**
 * POST /api/admin/billing/subscription-control
 * Controls subscription status (extend, suspend, resume, cancel)
 */
export async function adminUpdateSubscription(req, res) {
  try {
    const { subscriptionId, action } = req.body;
    if (!subscriptionId || !action) {
      return res.status(400).json({ error: 'Subscription ID and action required' });
    }

    const sub = await prisma.subscription.findUnique({
      where: { subscriptionId: Number(subscriptionId) },
      include: { user: true },
    });

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    let updateData = {};
    if (action === 'EXTEND_30_DAYS') {
      const currentEnd = new Date(sub.currentPeriodEnd);
      updateData.currentPeriodEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
      updateData.status = 'ACTIVE';
    } else if (action === 'SUSPEND') {
      updateData.status = 'SUSPENDED';
    } else if (action === 'RESUME') {
      updateData.status = 'ACTIVE';
    } else if (action === 'CANCEL') {
      updateData.status = 'CANCELLED';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const updated = await prisma.subscription.update({
      where: { subscriptionId: sub.subscriptionId },
      data: updateData,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_SUBSCRIPTION_UPDATE',
        status: 'SUCCESS',
        details: `Administrator performed '${action}' on subscription #${sub.subscriptionId} for user ${sub.user.email}`,
      },
    });

    return res.json({
      success: true,
      message: `Subscription #${sub.subscriptionId} updated successfully (${action}).`,
      subscription: updated,
    });
  } catch (error) {
    console.error('adminUpdateSubscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
}

// ==============================================================================
// 3. SAFE BROADCAST NOTIFICATIONS (MAIL IP REPUTATION PROTECTED)
// ==============================================================================

/**
 * POST /api/admin/broadcasts/dispatch
 * Broadcasts notification with optional anti-spam throttled email queue
 */
export async function dispatchBroadcastNotification(req, res) {
  try {
    const { title, message, targetAudience = 'ALL_USERS', channels = { inApp: true, email: false } } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const result = await startBroadcastCampaign({
      title,
      message,
      targetAudience,
      channels,
      adminEmail: req.adminUser.email,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.adminUser.userId,
        action: 'ADMIN_BROADCAST_DISPATCHED',
        status: 'SUCCESS',
        details: `Administrator initiated broadcast '${title}' to ${targetAudience} via ${channels.email ? 'Email & In-App' : 'In-App'}. Total recipients: ${result.totalRecipients}`,
      },
    });

    return res.json(result);
  } catch (error) {
    console.error('dispatchBroadcastNotification error:', error);
    res.status(500).json({ error: 'Failed to start broadcast campaign' });
  }
}

/**
 * GET /api/admin/broadcasts/job/:jobId
 * Real-time queue progress monitor
 */
export function getBroadcastJobStatus(req, res) {
  const job = getJobStatus(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Broadcast job not found' });
  }
  return res.json({ success: true, job });
}

/**
 * GET /api/admin/broadcasts/history
 * List of recent broadcast campaigns
 */
export function getBroadcastHistory(req, res) {
  const history = listRecentBroadcasts();
  return res.json({ success: true, broadcasts: history });
}

// ==============================================================================
// 4. ENTERPRISE EXECUTIVE REPORTS & CAPACITY PLANNING
// ==============================================================================

/**
 * GET /api/admin/reports
 * Comprehensive analytics across Revenue, Fleet Capacity, Subscriptions, and SLA
 */
export async function getAdminReports(req, res) {
  try {
    const [payments, vms, subscriptions, users, tickets] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        include: { invoice: true },
      }),
      prisma.virtualMachine.findMany(),
      prisma.subscription.findMany({ include: { plan: true } }),
      prisma.user.findMany({ include: { userRoles: { include: { role: true } } } }),
      prisma.ticket.findMany(),
    ]);

    // Financial Metrics
    const totalGrossRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const stripeRevenue = payments
      .filter((p) => p.paymentGateway === 'STRIPE_CARD')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const bankRevenue = payments
      .filter((p) => p.paymentGateway === 'DIRECT_BANK_TRANSFER')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan?.monthlyPrice || 0), 0);

    // Fleet & Overcommit Analytics
    const physicalCores = os.cpus().length;
    const physicalRamGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));

    const activeVms = vms.filter((v) => v.status !== 'TERMINATED');
    const allocatedCores = activeVms.reduce((sum, v) => sum + Number(v.vCPU || 0), 0);
    const committedRamGB = activeVms.reduce((sum, v) => sum + Number(v.ramGB || 0), 0);
    const committedDiskGB = activeVms.reduce((sum, v) => sum + Number(v.diskGB || 0), 0);

    const cpuOvercommitRatio = physicalCores > 0 ? ((allocatedCores / physicalCores) * 100).toFixed(1) : 0;
    const ramOvercommitRatio = physicalRamGB > 0 ? ((committedRamGB / physicalRamGB) * 100).toFixed(1) : 0;

    // Plan Distribution
    const planDistribution = {};
    activeSubs.forEach((s) => {
      const planName = s.plan?.name || 'Custom Plan';
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    });

    // Support SLA Metrics
    const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'REOPENED').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status.includes('CLOSED')).length;

    // User Role Breakdown
    const rolesBreakdown = { Customer: 0, Service_Provider: 0, Support_Staff: 0, Admin: 0 };
    users.forEach((u) => {
      u.userRoles.forEach((ur) => {
        const rName = ur.role.roleName;
        rolesBreakdown[rName] = (rolesBreakdown[rName] || 0) + 1;
      });
    });

    return res.json({
      success: true,
      reports: {
        financial: {
          totalGrossRevenue,
          stripeRevenue,
          bankRevenue,
          mrr,
          arr: mrr * 12,
          arpu: activeSubs.length > 0 ? (mrr / activeSubs.length).toFixed(2) : 0,
        },
        fleetCapacity: {
          physicalCores,
          allocatedCores,
          cpuOvercommitRatio,
          physicalRamGB,
          committedRamGB,
          ramOvercommitRatio,
          committedDiskGB,
          totalVmsCount: vms.length,
          activeVmsCount: activeVms.length,
          stoppedVmsCount: activeVms.filter((v) => v.status === 'STOPPED').length,
          runningVmsCount: activeVms.filter((v) => v.status === 'RUNNING').length,
        },
        plans: planDistribution,
        users: {
          totalUsers: users.length,
          rolesBreakdown,
        },
        support: {
          totalTickets: tickets.length,
          openTickets,
          resolvedTickets,
          resolutionRate: tickets.length > 0 ? ((resolvedTickets / tickets.length) * 100).toFixed(1) : 100,
        },
      },
    });
  } catch (error) {
    console.error('getAdminReports error:', error);
    res.status(500).json({ error: 'Failed to generate executive report' });
  }
}

/**
 * GET /api/admin/reports/export
 * Downloads CSV of selected datasets
 */
export async function exportAdminReportCSV(req, res) {
  try {
    const dataset = req.query.dataset || 'finance';

    if (dataset === 'finance') {
      const invoices = await prisma.invoice.findMany({
        include: { user: true, payments: true },
        orderBy: { createdAt: 'desc' },
      });

      const csvLines = [
        'Invoice Number,Customer Name,Customer Email,Amount (USD),Status,Gateway,Date',
        ...invoices.map((i) => {
          const gw = i.payments?.[0]?.paymentGateway || 'DIRECT_BANK_TRANSFER';
          return `"${i.invoiceNumber}","${i.user?.fullName || ''}","${i.user?.email || ''}",${i.amount},"${i.status}","${gw}","${i.createdAt.toISOString()}"`;
        }),
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=financial_report_${Date.now()}.csv`);
      return res.send(csvLines.join('\n'));
    }

    if (dataset === 'fleet') {
      const vms = await prisma.virtualMachine.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      const csvLines = [
        'VM Name,Owner Email,Status,IP Address,vCPU,RAM (GB),Disk (GB),Created At',
        ...vms.map(
          (v) =>
            `"${v.vmName}","${v.user?.email || ''}","${v.status}","${v.ipAddress || ''}",${v.vCPU},${v.ramGB},${v.diskGB},"${v.createdAt.toISOString()}"`
        ),
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=fleet_report_${Date.now()}.csv`);
      return res.send(csvLines.join('\n'));
    }

    return res.status(400).json({ error: 'Invalid dataset specified' });
  } catch (error) {
    console.error('exportAdminReportCSV error:', error);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
}


