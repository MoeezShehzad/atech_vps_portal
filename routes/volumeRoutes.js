// ==============================================================================
// Routes: volumeRoutes.js
// Purpose: API endpoints for Secondary Synology NAS (iSCSI) Storage Volumes
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getUserVolumes,
  createVolume,
  attachVolume,
  detachVolume,
  resizeVolume,
  cloneVolume,
  deleteVolume,
} from '../controllers/volumeController.js';

const router = express.Router();

router.use(authenticateToken);

// 1. List user's secondary NAS volumes + live usage + threshold alerts
router.get('/', getUserVolumes);

// 2. Create a new secondary NAS volume (custom size from NAS quota pool)
router.post('/', createVolume);

// 3. Hot-attach volume to a VM (with Auto-Mount or Manual mode + custom mount path)
router.post('/:id/attach', attachVolume);

// 4. Safely unmount & detach volume from a VM (preserves data on E:\)
router.post('/:id/detach', detachVolume);

// 5. Expand secondary volume size (+ auto-expand guest filesystem)
router.patch('/:id/resize', resizeVolume);

// 6. 1-Click Clone / Backup a secondary NAS volume on E:\STORAGE-VOLUMES
router.post('/:id/clone', cloneVolume);

// 7. Permanently delete an unattached volume
router.delete('/:id', deleteVolume);

export default router;
