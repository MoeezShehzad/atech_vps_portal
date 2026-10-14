// This file defines the authentication controller functions for the API, including user registration, login, profile retrieval, token refresh, logout, and Google OAuth authentication. It uses bcryptjs for password hashing, jsonwebtoken for token generation, and Prisma Client for database interactions with MariaDB. The controller functions handle requests from clients, perform necessary validations and operations, and return appropriate responses.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { setupUserTrial } from '../services/trialService.js';

// --- CENTRALIZED AUTH CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'atech_vps_default_jwt_secret_must_change';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_VERIFY_SECRET = process.env.JWT_VERIFY_SECRET || JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://172.23.28.242';
const BACKEND_URL = process.env.BACKEND_URL || process.env.SERVER_URL || 'http://172.23.28.242';
// Google OAuth strictly forbids private IP addresses (RFC 1918). It requires localhost or a public FQDN domain.
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

// --- HELPER FUNCTIONS ---

// 1. Generate short-lived Access Token (15 minutes)
const generateAccessToken = (userId, email, roles) => {
  return jwt.sign(
    { userId, email, roles },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

// 2. Generate long-lived Refresh Token (7 days) and save to DB
const createAndStoreRefreshToken = async (userId) => {
  const refreshToken = jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
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
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// --- GOOGLE OAUTH: STEP 1 (REDIRECT TO GOOGLE WITH CSRF STATE) ---
export const googleAuth = (req, res) => {
  // Generate cryptographically secure state parameter to prevent OAuth Login CSRF
  const state = crypto.randomBytes(32).toString('hex');
  
  // Dynamically capture originating frontend URL (port 80 IP, dev port, or domain)
  let returnTo = FRONTEND_URL;
  if (req.headers.referer) {
    try {
      const refUrl = new URL(req.headers.referer);
      returnTo = `${refUrl.protocol}//${refUrl.host}`;
    } catch (_) {}
  }

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  res.cookie('oauth_return_to', returnTo, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: GOOGLE_CALLBACK_URL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    state: state,
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const queryString = new URLSearchParams(options).toString();
  return res.redirect(`${rootUrl}?${queryString}`);
};

// --- GOOGLE OAUTH: STEP 2 (CALLBACK & ACCOUNT LINKING) ---
export const googleAuthCallback = async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;
  const returnTo = req.cookies?.oauth_return_to || FRONTEND_URL;

  // Clear state and return cookies immediately
  res.clearCookie('oauth_state');
  res.clearCookie('oauth_return_to');

  // Verify OAuth CSRF state
  if (!state || !storedState || state !== storedState) {
    console.error('OAuth CSRF Error: State parameter mismatch or missing.');
    return res.redirect(`${returnTo}/login?error=oauth_csrf_detected`);
  }

  if (!code) {
    return res.redirect(`${returnTo}/login?error=no_code`);
  }

  try {
    // 1. Exchange code for Google access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google Token Exchange Error:', tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    // 2. Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // 3. Search for existing user by Google ID or Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: normalizedEmail }
        ]
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (user) {
      // LINK ACCOUNT STRATEGY: Update existing manual user with googleId & provider status
      const updatedProvider = user.passwordHash ? 'BOTH' : 'GOOGLE';
      user = await prisma.user.update({
        where: { userId: user.userId },
        data: {
          googleId: googleUser.id,
          emailVerified: true,
          provider: updatedProvider,
          avatar_url: user.avatar_url || googleUser.picture || null,
        },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
    } else {
      // Create new user via Google
      const customerRole = await prisma.role.findUnique({
        where: { roleName: 'Customer' },
      });

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            fullName: googleUser.name || 'Google User',
            email: normalizedEmail,
            googleId: googleUser.id,
            avatar_url: googleUser.picture || null,
            emailVerified: true,
            provider: 'GOOGLE',
          },
        });

        if (customerRole) {
          await tx.userRole.create({
            data: {
              userId: newUser.userId,
              roleId: customerRole.roleId,
            },
          });
        }

        return newUser;
      });

      user = await prisma.user.findUnique({
        where: { userId: user.userId },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });
    }

    // 4. Issue Refresh Token in HttpOnly cookie
    const refreshToken = await createAndStoreRefreshToken(user.userId);
    setRefreshTokenCookie(res, refreshToken);

    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });

    // 5. Redirect back to Vite frontend securely WITHOUT tokens or PII in URL.
    // The HttpOnly cookie will safely restore the session via /api/auth/refresh.
    return res.redirect(`${returnTo}/auth/callback`);
  } catch (error) {
    console.error('Google Callback Processing Error:', error);
    return res.redirect(`${returnTo}/login?error=oauth_failed`);
  }
};

// --- REGISTER USER (WITH OPTIONAL 30-DAY TRIAL & EMAIL VERIFICATION) ---
export const register = async (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    address,
    city,
    state,
    postalCode,
    country,
    cardData,
  } = req.body;

  // Validation Guard
  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: 'Validation failed. Full name, email and password are required.',
    });
  }

  // Server-side Password Strength Guard (Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character)
  const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]).{8,}$/;
  if (!passwordComplexityRegex.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
          email: normalizedEmail,
          passwordHash,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          postalCode: postalCode || null,
          country: country || null,
          emailVerified: !!cardData, // Verified automatically if card is securely provided for trial
          provider: 'LOCAL',
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

    let trialResult = null;
    if (cardData && cardData.cardNumber) {
      try {
        trialResult = await setupUserTrial({
          userId: newUser.userId,
          cardData,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
        });
      } catch (trialErr) {
        console.error('[Trial Setup Warning during Registration]:', trialErr.message);
        // If card fails validation, return clear error
        return res.status(400).json({
          error: `Failed to activate free trial: ${trialErr.message}`,
        });
      }
    }

    // If card provided for 30-day trial, immediately issue login session
    if (cardData && cardData.cardNumber) {
      const roles = ['Customer'];
      const accessToken = generateAccessToken(newUser.userId, newUser.email, roles);
      const refreshToken = await createAndStoreRefreshToken(newUser.userId);
      setRefreshTokenCookie(res, refreshToken);

      await prisma.user.update({
        where: { userId: newUser.userId },
        data: { lastLoginAt: new Date() },
      });

      return res.status(201).json({
        message: 'Registration successful! Your 30-Day Free Trial has been activated.',
        accessToken,
        token: accessToken,
        user: {
          userId: newUser.userId,
          fullName: newUser.fullName,
          email: newUser.email,
          roles,
          emailVerified: true,
        },
        trial: trialResult ? {
          subscriptionId: trialResult.subscription?.subscriptionId,
          trialEndsAt: trialResult.trialEndsAt,
          daysLeft: trialResult.daysLeft,
          cardLast4: trialResult.cardLast4,
          cardBrand: trialResult.cardBrand,
        } : null,
      });
    }

    // Otherwise standard email verification flow
    const verificationToken = jwt.sign(
      { userId: newUser.userId, email: newUser.email },
      JWT_VERIFY_SECRET,
      { expiresIn: '24h' }
    );

    let emailSent = false;
    try {
      const mailResult = await sendVerificationEmail(newUser.email, newUser.fullName, verificationToken);
      if (mailResult && mailResult.success) {
        emailSent = true;
      }
    } catch (mailErr) {
      console.warn('[Registration Email Dispatch Warning]:', mailErr.message);
    }

    if (!emailSent) {
      // Auto-verify if mail offline
      await prisma.user.update({
        where: { userId: newUser.userId },
        data: { emailVerified: true },
      });
      return res.status(201).json({
        message: 'Account created successfully! You can now log in with your credentials.',
        user: {
          userId: newUser.userId,
          fullName: newUser.fullName,
          email: newUser.email,
          emailVerified: true,
        },
      });
    }

    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        emailVerified: false,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// --- EMAIL VERIFICATION HANDLER ---
export const verifyEmailHandler = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect(`${FRONTEND_URL}/login?error=missing_token`);
  }

  try {
    // 1. Verify token signature
    const decoded = jwt.verify(token, JWT_VERIFY_SECRET);

    // 2. Mark emailVerified as true in MariaDB
    let user = await prisma.user.update({
      where: { userId: decoded.userId },
      data: { 
        emailVerified: true,
        lastLoginAt: new Date(),
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    // 3. Issue Refresh Token in HttpOnly cookie
    const refreshToken = await createAndStoreRefreshToken(user.userId);
    setRefreshTokenCookie(res, refreshToken);

    // 4. Redirect directly to frontend auth callback (cookie will authenticate session)
    return res.redirect(`${FRONTEND_URL}/auth/callback?verified=true`);
  } catch (error) {
    console.error('Email Verification Error:', error);
    return res.redirect(`${FRONTEND_URL}/login?error=invalid_or_expired_token`);
  }
};

// --- RESEND EMAIL VERIFICATION HANDLER ---
export const resendVerificationHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a verification email has been sent.' });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Account is already verified.' });
    }

    const verificationToken = jwt.sign(
      { userId: user.userId, email: user.email },
      JWT_VERIFY_SECRET,
      { expiresIn: '24h' }
    );

    await sendVerificationEmail(user.email, user.fullName, verificationToken);
    return res.json({ success: true, message: 'Verification email sent successfully.' });
  } catch (error) {
    console.error('[resendVerificationHandler Error]:', error);
    return res.status(500).json({ error: 'Failed to resend verification email.' });
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
      where: { email: email.toLowerCase().trim() },
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

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error: 'This account was created via Google Sign-In. Please sign in with Google.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await prisma.securityLog.create({
        data: {
          userId: user.userId,
          action: 'FAILED_LOGIN_ATTEMPT',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          result: 'FAILED',
          details: `Failed password authentication attempt for user ${user.email}`,
        },
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const roles = user.userRoles.map((ur) => ur.role.roleName);

    const accessToken = generateAccessToken(user.userId, user.email, roles);
    const refreshToken = await createAndStoreRefreshToken(user.userId);

    setRefreshTokenCookie(res, refreshToken);

    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });

    // Record successful login in security audit trail
    await prisma.securityLog.create({
      data: {
        userId: user.userId,
        action: 'USER_LOGIN',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        result: 'SUCCESS',
        details: `Successful web authentication session initialized (${req.headers['user-agent'] || 'Modern Web Browser'})`,
      },
    }).catch(() => {});

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode,
        country: user.country,
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
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ error: 'Refresh token missing.' });
    }

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

    if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
      if (storedToken?.isRevoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { isRevoked: true },
        });
      }
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
      });
      return res.status(401).json({ error: 'Invalid or revoked session.' });
    }

    // Revoke old token for rotation
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const roles = storedToken.user.userRoles.map((ur) => ur.role.roleName);

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
        address: storedToken.user.address,
        city: storedToken.user.city,
        postalCode: storedToken.user.postalCode,
        country: storedToken.user.country,
        roles,
      },
    });
  } catch (error) {
    console.error('Refresh Token Handler Error:', error);
    return res.status(401).json({ error: 'Refresh failed', details: error.message });
  }
};

// --- LOGOUT USER ---
export const logoutHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
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
        address: true,
        city: true,
        postalCode: true,
        country: true,
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

// --- FORGOT PASSWORD HANDLER ---
export const forgotPasswordHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Return generic success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been sent.',
      });
    }

    // Generate short-lived reset token (1 hour)
    const resetToken = jwt.sign(
      { userId: user.userId, email: user.email, purpose: 'pwd_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendPasswordResetEmail(user.email, user.fullName, resetToken);

    return res.json({
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    });
  } catch (error) {
    console.error('forgotPasswordHandler error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
};

// --- RESET PASSWORD HANDLER ---
export const resetPasswordHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired password reset link. Please request a new one.' });
    }

    if (decoded.purpose !== 'pwd_reset') {
      return res.status(400).json({ error: 'Invalid reset token purpose.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { userId: decoded.userId },
      data: {
        passwordHash,
        emailVerified: true,
      },
    });

    // Revoke old refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: decoded.userId },
    });

    return res.json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in.',
    });
  } catch (error) {
    console.error('resetPasswordHandler error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
};