import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  refreshTokenHandler, 
  logoutHandler,
  googleAuth,
  googleAuthCallback
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', logoutHandler);

// Google OAuth Routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Protected User Routes
router.get('/me', authenticateToken, getProfile);

export default router;