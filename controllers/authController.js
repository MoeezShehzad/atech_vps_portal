import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// --- HELPER FUNCTIONS ---

// 1. Generate short-lived Access Token (15 minutes)
const generateAccessToken = (userId, email, roles) => {
  return jwt.sign(
    { userId, email, roles },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret',
    { expiresIn: '15m' }
  );
};

// 2. Generate long-lived Refresh Token (7 days) and save to DB
const createAndStoreRefreshToken = async (userId) => {
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  });

  return refreshToken;
};

// 3. Helper to set HttpOnly Cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// --- REGISTER USER ---
export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const customerRole = await prisma.role.findUnique({
      where: { roleName: 'Customer' },
    });

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          phone: phone || null,
        },
      });

      if (customerRole) {
        await tx.userRole.create({
          data: {
            userId: user.userId,
            roleId: customerRole.roleId,
          },
        });
      }

      return user;
    });

    const roles = customerRole ? [customerRole.roleName] : ['Customer'];

    // Issue short-lived access token and long-lived refresh token
    const accessToken = generateAccessToken(newUser.userId, newUser.email, roles);
    const refreshToken = await createAndStoreRefreshToken(newUser.userId);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        roles,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// --- LOGIN USER ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or account is inactive.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const roles = user.userRoles.map((ur) => ur.role.roleName);

    // Issue short-lived access token and long-lived refresh token
    const accessToken = generateAccessToken(user.userId, user.email, roles);
    const refreshToken = await createAndStoreRefreshToken(user.userId);

    setRefreshTokenCookie(res, refreshToken);

    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// --- REFRESH TOKEN (Silent Refresh & Rotation) ---
export const refreshTokenHandler = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ error: 'Refresh token missing.' });
    }

    // Find token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });

    // Check token validity
    if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
      if (storedToken?.isRevoked) {
        // Reuse breach detection -> Revoke ALL tokens for this user
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { isRevoked: true },
        });
      }
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(403).json({ error: 'Invalid or revoked session.' });
    }

    // Revoke old token (Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Extract roles
    const roles = storedToken.user.userRoles.map((ur) => ur.role.roleName);

    // Create new token pair
    const newAccessToken = generateAccessToken(storedToken.user.userId, storedToken.user.email, roles);
    const newRefreshToken = await createAndStoreRefreshToken(storedToken.user.userId);

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      accessToken: newAccessToken,
      user: {
        userId: storedToken.user.userId,
        fullName: storedToken.user.fullName,
        email: storedToken.user.email,
        phone: storedToken.user.phone,
        roles,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Refresh failed', details: error.message });
  }
};

// --- LOGOUT USER ---
export const logoutHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Revoke token in DB
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }

    // Clear HttpOnly Cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed', details: error.message });
  }
};

// --- GET CURRENT USER PROFILE ---
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: { roleName: true },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const roles = user.userRoles?.map((ur) => ur.role.roleName) || [];

    res.json({
      ...user,
      role: roles[0] || 'Customer',
      roles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile', details: error.message });
  }
};