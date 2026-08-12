// This file defines the authentication-related routes for the API, including user registration, login, profile retrieval, token refresh, logout, and Google OAuth authentication. It uses Express.js for routing and imports controller functions to handle the logic for each route. Some routes are protected by an authentication middleware that verifies JWT tokens.

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

// --- PUBLIC AUTHENTICATION ROUTES ---
router.post('/register', register);
router.post('/login', login);

// --- SESSION MANAGEMENT ROUTES ---
router.post('/refresh', refreshTokenHandler);
router.post('/refresh-token', refreshTokenHandler); // Alias for compatibility
router.post('/logout', logoutHandler);

// --- GOOGLE OAUTH ROUTES ---
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// --- PROTECTED USER ROUTES ---
router.get('/me', authenticateToken, getProfile);

export default router;