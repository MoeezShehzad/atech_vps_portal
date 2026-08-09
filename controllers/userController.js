const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// 1. Fetch current logged-in user profile
exports.getMe = async (req, res) => {
  try {
    // Read user ID from JWT payload
    const userId = Number(req.user.id || req.user.userId);

    const user = await prisma.user.findUnique({
      where: { userId: userId },
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

    // Determine primary role name (e.g. 'ADMIN', 'USER')
    const primaryRole = user.userRoles?.[0]?.role?.roleName || 'USER';

    res.json({
      id: user.userId,
      fullName: user.fullName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      role: primaryRole,
      avatarUrl: user.avatar_url || null,
      hasPassword: Boolean(user.passwordHash),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

// 2. Update profile details in MariaDB
exports.updateMe = async (req, res) => {
  try {
    const userId = Number(req.user.id || req.user.userId);
    const { fullName, phone, address, city, country, avatarUrl } = req.body;

    console.log(`[UPDATE PROFILE] Updating userId: ${userId}`);

    const updatedUser = await prisma.user.update({
      where: { userId: userId },
      data: {
        fullName: fullName,
        phone: phone,
        address: address,
        city: city,
        country: country,
        avatar_url: avatarUrl,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const primaryRole = updatedUser.userRoles?.[0]?.role?.roleName || 'USER';

    console.log('[UPDATE PROFILE SUCCESS] Updated DB Record:', updatedUser);

    res.json({
      id: updatedUser.userId,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      country: updatedUser.country,
      role: primaryRole,
      avatarUrl: updatedUser.avatar_url,
      hasPassword: Boolean(updatedUser.passwordHash),
    });
  } catch (error) {
    console.error('[UPDATE PROFILE ERROR]:', error);
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
};

// 3. Update or set password in MariaDB
exports.updatePassword = async (req, res) => {
  try {
    const userId = Number(req.user.id || req.user.userId);
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify existing password if set
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    }

    // Hash new password and save to passwordHash field
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { userId: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[PASSWORD UPDATE ERROR]:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};