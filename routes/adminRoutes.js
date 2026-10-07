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

// 3. Fleet VMs & Emergency Power Control
router.get('/fleet/vms', getFleetVMs);
router.post('/fleet/vms/:vmId/power', adminPowerControl);

// 4. Cluster Audit Trail
router.get('/audit-logs', getAdminAuditLogs);

export default router;
