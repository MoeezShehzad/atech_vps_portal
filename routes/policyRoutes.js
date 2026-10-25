// ==============================================================================
// Routes: policyRoutes.js
// Purpose: Legal Policy management & retrieval (Public & Admin)
// ==============================================================================

import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getPublicPolicy,
  getPolicyVersions,
  getPolicyVersionDetail,
  getAdminPolicies,
  createAdminPolicyVersion,
  updateAdminPolicyVersion,
  publishAdminPolicyVersion,
  deleteAdminPolicyVersion,
  broadcastPolicyUpdate,
} from '../controllers/policyController.js';

const router = express.Router();

// ------------------------------------------------------------------------------
// Admin Routes (Strict Authentication & Database-verified Admin Role Guard)
// ------------------------------------------------------------------------------
router.get('/admin/all', authenticateToken, requireAdmin, getAdminPolicies);
router.post('/admin', authenticateToken, requireAdmin, createAdminPolicyVersion);
router.put('/admin/:id', authenticateToken, requireAdmin, updateAdminPolicyVersion);
router.post('/admin/:id/publish', authenticateToken, requireAdmin, publishAdminPolicyVersion);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteAdminPolicyVersion);
router.post('/admin/:id/broadcast', authenticateToken, requireAdmin, broadcastPolicyUpdate);

// ------------------------------------------------------------------------------
// Public Retrieval Routes
// ------------------------------------------------------------------------------
router.get('/:policyType/versions/:version', getPolicyVersionDetail);
router.get('/:policyType/versions', getPolicyVersions);
router.get('/:policyType', getPublicPolicy);

export default router;
