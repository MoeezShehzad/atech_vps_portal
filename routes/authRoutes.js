import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  refreshTokenHandler, 
  logoutHandler,
  googleAuth,
  googleAuthCallback,
  verifyEmailHandler,
  resendVerificationHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- PUBLIC AUTHENTICATION ROUTES ---
router.post('/register', register);
router.post('/login', login);
router.post('/resend-verification', resendVerificationHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);

// --- SESSION MANAGEMENT ROUTES ---
router.post('/refresh', refreshTokenHandler);
router.post('/refresh-token', refreshTokenHandler); // Alias for compatibility
router.post('/logout', logoutHandler);

// --- GOOGLE OAUTH ROUTES ---
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// --- PROTECTED USER ROUTES ---
router.get('/me', authenticateToken, getProfile);
router.get('/verify-email', verifyEmailHandler);

export default router;
