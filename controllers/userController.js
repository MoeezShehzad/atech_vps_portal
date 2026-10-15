import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

// 1. Fetch current logged-in user profile
export const getMe = async (req, res) => {
  try {
    const userId = Number(req.user.id || req.user.userId);

    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database.' });
    }

    const primaryRole = user.userRoles?.[0]?.role?.roleName || 'Customer';

    res.json({
      id: user.userId,
      fullName: user.fullName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postalCode: user.postalCode || '',
      country: user.country || '',
      role: primaryRole,
      avatarUrl: user.avatar_url || null,
      hasPassword: Boolean(user.passwordHash),
      authProvider: user.provider || 'LOCAL',
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

// 2. Update profile details
export const updateMe = async (req, res) => {
  try {
    const userId = Number(req.user.id || req.user.userId);
    const { fullName, phone, address, city, state, postalCode, postal_code, country, avatarUrl } = req.body;
    const valueForPostalCode = postalCode ?? postal_code ?? null;

    // Validate avatar string length if present to prevent MySQL @db.Text overflow (64KB max)
    if (avatarUrl && avatarUrl.length > 65000) {
      return res.status(400).json({ error: 'Avatar image is too large. Please upload an image under 50KB or use an image URL.' });
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        ...(fullName !== undefined && { fullName: String(fullName).trim().slice(0, 100) }),
        ...(phone !== undefined && { phone: String(phone).trim().slice(0, 30) }),
        ...(address !== undefined && { address: String(address).trim().slice(0, 255) }),
        ...(city !== undefined && { city: String(city).trim().slice(0, 100) }),
        ...(state !== undefined && { state: String(state).trim().slice(0, 100) }),
        ...(valueForPostalCode !== undefined && { postalCode: String(valueForPostalCode).trim().slice(0, 20) }),
        ...(country !== undefined && { country: String(country).trim().slice(0, 100) }),
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const primaryRole = updatedUser.userRoles?.[0]?.role?.roleName || 'Customer';

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.userId,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state || '',
        postalCode: updatedUser.postalCode || '',
        country: updatedUser.country,
        role: primaryRole,
        avatarUrl: updatedUser.avatar_url,
        hasPassword: Boolean(updatedUser.passwordHash),
        authProvider: updatedUser.provider || 'LOCAL',
      },
    });
  } catch (error) {
    console.error('[UPDATE PROFILE ERROR]:', error);
    res.status(500).json({ error: 'Failed to update profile details' });
  }
};

// 3. Update or set password
export const updatePassword = async (req, res) => {
  try {
    const userId = Number(req.user.id || req.user.userId);
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[PASSWORD UPDATE ERROR]:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};