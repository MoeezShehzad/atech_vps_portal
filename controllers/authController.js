import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// --- REGISTER USER ---
export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Fetch default 'Customer' role
    const customerRole = await prisma.role.findUnique({
      where: { roleName: 'Customer' },
    });

    // Create user and attach Customer role inside a transaction
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

    // Generate JWT token upon registration so user can immediately view/edit settings
    const roles = customerRole ? [customerRole.roleName] : [];
    const token = jwt.sign(
      {
        userId: newUser.userId,
        email: newUser.email,
        roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone, // <-- Explicitly included phone in response
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
    // Find user with their assigned roles
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

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Extract role names
    const roles = user.userRoles.map((ur) => ur.role.roleName);

    // Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last_login_at timestamp
    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone, // <-- Included phone on login response
        roles,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
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

    // Format roles array cleanly for frontend consume
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