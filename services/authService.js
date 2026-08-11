import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

/**
 * Register local user with hashed password
 */
export const registerUser = async (userData) => {
  const normalizedEmail = userData.email.toLowerCase().trim();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(userData.password, salt);

  const user = await prisma.user.create({
    data: {
      fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.fullName,
      email: normalizedEmail,
      passwordHash,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      postalCode: userData.postalCode,
      country: userData.country || 'Pakistan',
      provider: 'LOCAL',
    },
  });

  const token = generateToken(user);
  delete user.passwordHash;

  return { user, token };
};

/**
 * Google OAuth Strategy & Automatic Account Linking
 */
export const handleGoogleAuth = async ({ googleId, email, firstName, lastName }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user exists by Google ID
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (user) {
    const token = generateToken(user);
    delete user.passwordHash;
    return { user, token };
  }

  // 2. Check if user registered manually earlier using the same email
  user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user) {
    // LINK Google OAuth ID to existing manual account
    user = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        googleId,
        emailVerified: true,
        provider: user.passwordHash ? 'BOTH' : 'GOOGLE',
      },
    });

    const token = generateToken(user);
    delete user.passwordHash;
    return { user, token };
  }

  // 3. New User created entirely via Google
  user = await prisma.user.create({
    data: {
      googleId,
      email: normalizedEmail,
      fullName: `${firstName || ''} ${lastName || ''}`.trim() || 'Google User',
      emailVerified: true,
      provider: 'GOOGLE',
    },
  });

  const token = generateToken(user);
  delete user.passwordHash;
  return { user, token };
};

/**
 * Generate JWT Access Token
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET || 'access-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}