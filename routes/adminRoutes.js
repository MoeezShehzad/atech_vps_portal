// ==============================================================================
// Routes: adminRoutes.js
// Purpose: Administrator suite routes protected by authentication & requireAdmin
// ==============================================================================

import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getAdminOverview,
  getAdminUsers,
  toggleUserStatus,
  updateUserRole,
  getFleetVMs,
  adminPowerControl,
  getAdminAuditLogs,
  impersonateUser,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAdminPlans,
  createAdminPlan,
  updatePlan,
  deletePlan,
  getAdminCoupons,
  createAdminCoupon,
  deleteAdminCoupon,
  getIpamPool,
  addIpToPool,
  releaseIpFromPool,
  getSecurityThreats,
  banThreatIp,
  getAdminTickets,
  replyAdminTicket,
} from '../controllers/adminController.js';

const router = express.Router();

// All routes here strictly require valid JWT and Admin role in database
router.use(authenticateToken);
router.use(requireAdmin);

// 1. Host Telemetry & Fleet Overview
router.get('/overview', getAdminOverview);

// 2. User & Account Management
router.get('/users', getAdminUsers);
router.patch('/users/:userId/status', toggleUserStatus);
router.patch('/users/:userId/role', updateUserRole);

// Option 1: Customer Impersonation
router.post('/impersonate/:userId', impersonateUser);

// 3. Fleet VMs & Emergency Power Control
router.get('/fleet/vms', getFleetVMs);
router.post('/fleet/vms/:vmId/power', adminPowerControl);

// 4. Cluster Audit Trail
router.get('/audit-logs', getAdminAuditLogs);

// Option 4: System Announcements & Broadcast Banners
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Option 2: Dynamic VPS Plans & Coupons
router.get('/plans', getAdminPlans);
router.post('/plans', createAdminPlan);
router.patch('/plans/:planId', updatePlan);
router.delete('/plans/:planId', deletePlan);
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.delete('/coupons/:id', deleteAdminCoupon);

// Option 3: IP Address Pool & Subnet Manager (IPAM)
router.get('/ipam', getIpamPool);
router.post('/ipam', addIpToPool);
router.patch('/ipam/:ipId/release', releaseIpFromPool);

// Option 5: Security Threats & Cluster IP Bans
router.get('/security/threats', getSecurityThreats);
router.post('/security/ban-ip', banThreatIp);

// Option 6: Support Tickets Helpdesk
router.get('/tickets', getAdminTickets);
router.post('/tickets/:ticketId/reply', replyAdminTicket);

export default router;
