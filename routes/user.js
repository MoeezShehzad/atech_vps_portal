import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { getMe, updateMe, updatePassword, uploadAvatar, deleteAvatar } from '../controllers/userController.js';
import { handleAvatarUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// 1. Fetch current logged-in user profile (GET /api/users/me)
router.get('/me', authenticateToken, getMe);

// 2. Update Profile Details (PATCH & PUT /api/users/me)
router.patch('/me', authenticateToken, updateMe);
router.put('/me', authenticateToken, updateMe);

// 3. User Avatar Upload & Deletion (POST & DELETE /api/users/me/avatar)
router.post('/me/avatar', authenticateToken, handleAvatarUpload, uploadAvatar);
router.delete('/me/avatar', authenticateToken, deleteAvatar);

// 4. Set or Update Password (PATCH /api/users/me/password)
router.patch('/me/password', authenticateToken, updatePassword);
router.put('/me/password', authenticateToken, updatePassword);

export default router;
