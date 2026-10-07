// ==============================================================================
// Controller: adminController.js
// Purpose: Enterprise Administrator Suite Controller
//          - Host & Fleet Telemetry (Windows Hyper-V Host CPU, RAM, VMs)
//          - User Management (List, Search, Update Roles, Suspend/Activate)
//          - Cluster Audit Trail & Activity Logs
// ==============================================================================

import os from 'os';
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
      const hv = hvMap.get(v.name.toLowerCase());
      return {
        vmId: v.vmId,
        name: v.name,
        hostname: v.hostname,
        os: v.image?.name || 'Ubuntu 24.04 LTS',
        status: hv?.State ? (hv.State === 'Running' ? 'running' : 'stopped') : v.status,
        ip: v.ipPool?.ipAddress || v.ipAddress || '172.19.124.x',
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

    const result = await hypervService.controlPower(vm.name, action);

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
        details: `Administrator ${req.adminUser.email} executed ${action} on VM '${vm.name}' owned by ${vm.user?.email}`,
      },
    });

    res.json({
      success: true,
      message: `Power action '${action}' successfully dispatched to VM ${vm.name}`,
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
            select: { vmId: true, name: true },
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
        targetVm: l.vm ? l.vm.name : null,
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
