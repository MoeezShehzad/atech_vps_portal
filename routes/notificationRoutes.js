// ==============================================================================
// Routes: notificationRoutes.js
// Purpose: API endpoints for in-app alert notifications and activity feed
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { 
  getNotifications, 
  markAllNotificationsRead, 
  clearNotifications 
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/mark-read', markAllNotificationsRead);
router.post('/clear', clearNotifications);

export default router;
