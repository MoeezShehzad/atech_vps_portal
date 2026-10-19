import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract 'Bearer <TOKEN>'

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'atc_cloud_default_jwt_secret_must_change';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const rolesArray = Array.isArray(decoded.roles)
      ? decoded.roles
      : decoded.role
      ? [decoded.role]
      : ['Customer'];

    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id || decoded.sub,
      roles: rolesArray,
      role: rolesArray.some((r) => String(r).toLowerCase() === 'admin' || String(r).toLowerCase() === 'superuser')
        ? 'Admin'
        : rolesArray[0] || 'Customer',
    };
    next();
  });
};

/**
 * Strict Admin Guard: verifies user's active role directly against database
 * to prevent token spoofing or revoked privileges.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Account inactive or suspended' });
    }

    const hasAdminRole = user.userRoles?.some(
      (ur) => ur.role?.roleName?.toLowerCase() === 'admin' || ur.role?.roleName?.toLowerCase() === 'superuser'
    );

    if (!hasAdminRole) {
      return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    return res.status(500).json({ error: 'Internal privilege verification error' });
  }
};