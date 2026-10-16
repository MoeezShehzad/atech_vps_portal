// ==============================================================================
// File: routes/appStoreRoutes.js
// Purpose: Routes for 1-Click Apps catalog & installation
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getApps,
  getCategories,
  getInstalledApps,
  getVMJobs,
  installApp,
  uninstallApp,
} from '../controllers/appStoreController.js';

const router = express.Router();

// Catalog routes (browsable publicly or authenticated)
router.get('/', getApps);
router.get('/categories', getCategories);

// VM App Management (requires authentication)
router.get('/vms/:vmId/installed', authenticateToken, getInstalledApps);
router.get('/vms/:vmId/jobs', authenticateToken, getVMJobs);
router.post('/vms/:vmId/install', authenticateToken, installApp);
router.delete('/vms/:vmId/installed/:appId', authenticateToken, uninstallApp);

export default router;
