import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  refreshTokenHandler, 
  logoutHandler 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logoutHandler);

// Protected User Routes
router.get('/me', authenticateToken, getProfile);

export default router;