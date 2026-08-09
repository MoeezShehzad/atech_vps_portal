import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Fetch current logged-in user profile (GET /api/users/me)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId || req.user.id);

    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        avatar_url: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    res.json({
      id: user.userId,
      fullName: user.fullName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      avatarUrl: user.avatar_url || null,
      hasPassword: Boolean(user.passwordHash),
      isActive: user.isActive,
    });
  } catch (err) {
    console.error('[GET PROFILE ERROR]:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// 2. Update Profile Details (PATCH /api/users/me)
router.patch('/me', authenticateToken, async (req, res) => {
  const { fullName, phone, address, city, country, avatarUrl } = req.body;
  const userId = Number(req.user.userId || req.user.id);

  try {
    console.log(`[UPDATE PROFILE] Updating userId: ${userId} with:`, req.body);

    const updatedUser = await prisma.user.update({
      where: { userId: userId },
      data: {
        fullName,
        phone,
        address,
        city,
        country,
        avatar_url: avatarUrl,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.userId,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        country: updatedUser.country,
        avatarUrl: updatedUser.avatar_url,
        hasPassword: Boolean(updatedUser.passwordHash),
      },
    });
  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]:', err);
    res.status(500).json({ message: 'Failed to update profile details', error: err.message });
  }
});

// 3. Set or Update Password (PATCH /api/users/me/password)
router.patch('/me/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = Number(req.user.userId || req.user.id);

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify existing password if set
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { userId: userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password set successfully! You can now log in using email/password.' });
  } catch (err) {
    console.error('[UPDATE PASSWORD ERROR]:', err);
    res.status(500).json({ message: 'Failed to update password', error: err.message });
  }
});

export default router;