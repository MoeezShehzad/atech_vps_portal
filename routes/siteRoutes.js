// ==============================================================================
// Routes: siteRoutes.js
// Purpose: API endpoints for ATC Native Managed Websites & In-Portal File Manager
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  listSites,
  getSite,
  createSite,
  powerSite,
  deleteSite,
  listFiles,
  getFileContent,
  saveFileContent,
  createFileOrFolder,
  deleteFileOrFolder,
  updateDomain,
} from '../controllers/siteController.js';

const router = express.Router();

// Apply auth to all routes
router.use(authenticateToken);

// Core Website Lifecycle
router.get('/', listSites);
router.post('/', createSite);
router.get('/:id', getSite);
router.post('/:id/power', powerSite);
router.delete('/:id', deleteSite);
router.post('/:id/domain', updateDomain);

// In-Portal File Manager & Code Editor
router.get('/:id/files', listFiles);
router.get('/:id/files/content', getFileContent);
router.put('/:id/files/content', saveFileContent);
router.post('/:id/files/create', createFileOrFolder);
router.delete('/:id/files', deleteFileOrFolder);

export default router;
