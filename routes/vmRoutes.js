// ==============================================================================
// Routes: vmRoutes.js
// Purpose: API endpoints for VM operations, specs resize, power actions & catalog
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getUserVMs,
  getPlansAndImages,
  deployVM,
  powerAction,
  previewResize,
  resizeVM,
  destroyVM,
  getVMMetrics,
  getConsoleSession,
  getVMSnapshots,
  createVMSnapshot,
  restoreVMSnapshot,
  deleteVMSnapshot,
  resetVMPassword,
  rebuildVMInstance,
} from '../controllers/vmController.js';

const router = express.Router();

// Public / Authenticated catalog endpoint
router.get('/catalog', getPlansAndImages);

// All subsequent routes require user authentication
router.use(authenticateToken);

// 1. List user VMs
router.get('/', getUserVMs);

// 2. Deploy new VM
router.post('/deploy', deployVM);

// 3. Power management (START, STOP, RESTART, FORCE_STOP)
router.post('/:id/power', powerAction);

// 4. Preview price calculation for resize
router.post('/:id/preview-resize', previewResize);

// 5. Apply hardware specs resize (RAM / vCPU)
router.patch('/:id/resize', resizeVM);

// 6. Terminate & destroy VM
router.delete('/:id', destroyVM);

// 7. Live resource telemetry & metrics
router.get('/:id/metrics', getVMMetrics);

// 8. Dynamic Web Console session ticket
router.post('/:vmId/console-session', getConsoleSession);
router.get('/:vmId/console-session', getConsoleSession);

// 9. Checkpoints / Snapshots
router.get('/:id/snapshots', getVMSnapshots);
router.post('/:id/snapshots', createVMSnapshot);
router.post('/:id/snapshots/:snapshotId/restore', restoreVMSnapshot);
router.delete('/:id/snapshots/:snapshotId', deleteVMSnapshot);

// 10. Reset Guest Admin Password
router.post('/:id/reset-password', resetVMPassword);

// 11. Rebuild VM instance
router.post('/:id/rebuild', rebuildVMInstance);

export default router;
