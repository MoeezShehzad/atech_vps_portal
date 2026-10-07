import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getSecurityOverview,
  getAuditLogs,
  revokeAllSessions,
} from '../controllers/securityController.js';

const router = express.Router();

// All security routes require user authentication
router.use(authenticateToken);

router.get('/overview', getSecurityOverview);
router.get('/logs', getAuditLogs);
router.post('/revoke-sessions', revokeAllSessions);

export default router;
