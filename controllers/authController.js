// This file defines the authentication controller functions for the API, including user registration, login, profile retrieval, token refresh, logout, and Google OAuth authentication. It uses bcryptjs for password hashing, jsonwebtoken for token generation, and Prisma Client for database interactions with MariaDB. The controller functions handle requests from clients, perform necessary validations and operations, and return appropriate responses.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { setupUserTrial } from '../services/trialService.js';
import { generateAndSendOTP, verifyOTP } from '../services/otpService.js';

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

    // Otherwise standard email verification flow with 6-digit OTP
    const verificationToken = jwt.sign(
      { userId: newUser.userId, email: newUser.email },
      JWT_VERIFY_SECRET,
      { expiresIn: '24h' }
    );

    let otpDispatched = false;
    let otpSessionToken = null;
    try {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      const clientUa = req.headers['user-agent'];
      const otpRes = await generateAndSendOTP({
        email: newUser.email,
        purpose: 'VERIFY_EMAIL',
        fullName: newUser.fullName,
        ipAddress: clientIp,
        userAgent: clientUa,
        userId: newUser.userId,
        fallbackToken: verificationToken,
      });
      otpDispatched = true;
      otpSessionToken = otpRes?.sessionToken;
      if (otpSessionToken) {
        res.cookie('atc_otp_session', otpSessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 5 * 60 * 1000,
        });
      }
    } catch (mailErr) {
      console.warn('[Registration OTP Dispatch Warning]:', mailErr.message);
    }

    if (!otpDispatched) {
      // Auto-verify if mail system is offline
      await prisma.user.update({
        where: { userId: newUser.userId },
        data: { emailVerified: true },
      });
      return res.status(201).json({
        message: 'Account created successfully! You can now log in with your credentials.',
        requiresOtp: false,
        user: {
          userId: newUser.userId,
          fullName: newUser.fullName,
          email: newUser.email,
          emailVerified: true,
        },
      });
    }

    return res.status(201).json({
      success: true,
      requiresOtp: true,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.',
      email: newUser.email,
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

    const result = await generateAndSendOTP({
      email: user.email,
      purpose: 'VERIFY_EMAIL',
      fullName: user.fullName,
      fallbackToken: verificationToken,
    });

    return res.json({ success: true, message: 'A 6-digit verification code has been sent to your email.' });
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({ error: error.message, remainingSeconds: error.remainingSeconds });
    }
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

    // Generate fallback short-lived reset token (1 hour)
    const resetToken = jwt.sign(
      { userId: user.userId, email: user.email, purpose: 'pwd_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const clientUa = req.headers['user-agent'];
    const otpRes = await generateAndSendOTP({
      email: user.email,
      purpose: 'PASSWORD_RESET',
      fullName: user.fullName,
      ipAddress: clientIp,
      userAgent: clientUa,
      userId: user.userId,
      fallbackToken: resetToken,
    });

    if (otpRes?.sessionToken) {
      res.cookie('atc_otp_session', otpRes.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000,
      });
    }

    return res.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      sessionToken: otpRes?.sessionToken,
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

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
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

// ==============================================================================
// OTP CONTROLLER HANDLERS
// ==============================================================================

/**
 * POST /api/auth/send-otp
 * Generates and sends a 6-digit OTP code to the provided email address
 * Enforces 60-second cooldown, hourly velocity limiting, context binding, and salted hashing
 */
export const sendOtpHandler = async (req, res) => {
  try {
    const { email, purpose = 'VERIFY_EMAIL' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (purpose === 'VERIFY_EMAIL' && user?.emailVerified) {
      return res.status(400).json({ error: 'This account email is already verified. Please sign in.' });
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const clientUa = req.headers['user-agent'];

    let fallbackToken = null;
    if (user) {
      if (purpose === 'VERIFY_EMAIL') {
        fallbackToken = jwt.sign(
          { userId: user.userId, email: user.email },
          JWT_VERIFY_SECRET,
          { expiresIn: '24h' }
        );
      } else if (purpose === 'PASSWORD_RESET') {
        fallbackToken = jwt.sign(
          { userId: user.userId, email: user.email, purpose: 'pwd_reset' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
      }
    }

    const result = await generateAndSendOTP({
      email: normalizedEmail,
      purpose,
      fullName: user?.fullName || '',
      ipAddress: clientIp,
      userAgent: clientUa,
      userId: user?.userId || null,
      fallbackToken,
    });

    if (result.sessionToken) {
      res.cookie('atc_otp_session', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000,
      });
    }

    return res.json(result);
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({ error: error.message, remainingSeconds: error.remainingSeconds });
    }
    console.error('[sendOtpHandler Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch verification code.' });
  }
};

/**
 * POST /api/auth/verify-otp
 * Validates the 6-digit OTP code against salted hash with timing-safe equality,
 * device session verification, and single-use destruction.
 */
export const verifyOtpHandler = async (req, res) => {
  try {
    const { email, otp, purpose = 'VERIFY_EMAIL', sessionToken } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const effectiveSessionToken =
      sessionToken ||
      req.cookies?.atc_otp_session ||
      req.headers['x-otp-session'];

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const otpResult = await verifyOTP({
      email: normalizedEmail,
      otpCode: otp,
      purpose,
      sessionToken: effectiveSessionToken,
      ipAddress: clientIp,
    });

    if (!otpResult.success) {
      return res.status(400).json({
        error: otpResult.error,
        remainingAttempts: otpResult.remainingAttempts,
      });
    }

    // Clean up OTP session cookie upon successful verification
    res.clearCookie('atc_otp_session');

    // 1. If verifying registration email -> Mark verified and log user in immediately
    if (purpose === 'VERIFY_EMAIL') {
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Account not found for this email address.' });
      }

      user = await prisma.user.update({
        where: { userId: user.userId },
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

      const roles = user.userRoles.map((ur) => ur.role.roleName);
      const accessToken = generateAccessToken(user.userId, user.email, roles);
      const refreshToken = await createAndStoreRefreshToken(user.userId);
      setRefreshTokenCookie(res, refreshToken);

      return res.json({
        success: true,
        verified: true,
        message: 'Email verified successfully! Welcome to ATC Cloud.',
        accessToken,
        token: accessToken,
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          roles,
          emailVerified: true,
        },
      });
    }

    // 2. If verifying for password reset -> Return short-lived token
    if (purpose === 'PASSWORD_RESET') {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(404).json({ error: 'Account not found for this email address.' });
      }

      const resetToken = jwt.sign(
        { userId: user.userId, email: user.email, purpose: 'pwd_reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        message: 'Verification code confirmed. You may now set your new password.',
        resetToken,
      });
    }

    return res.json({
      success: true,
      message: 'Verification code confirmed successfully.',
    });
  } catch (error) {
    console.error('[verifyOtpHandler Error]:', error);
    return res.status(500).json({ error: 'Failed to verify code.', details: error.message });
  }
};

/**
 * POST /api/auth/reset-password-otp
 * Atomically verifies 6-digit OTP and sets new password in a single secure step
 */
export const resetPasswordOtpHandler = async (req, res) => {
  try {
    const { email, otp, newPassword, sessionToken } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const effectiveSessionToken =
      sessionToken ||
      req.cookies?.atc_otp_session ||
      req.headers['x-otp-session'];

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    // Verify OTP with Salted Hash and Device Session
    const otpResult = await verifyOTP({
      email: normalizedEmail,
      otpCode: otp,
      purpose: 'PASSWORD_RESET',
      sessionToken: effectiveSessionToken,
      ipAddress: clientIp,
    });

    if (!otpResult.success) {
      return res.status(400).json({
        error: otpResult.error,
        remainingAttempts: otpResult.remainingAttempts,
      });
    }

    res.clearCookie('atc_otp_session');

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        passwordHash,
        emailVerified: true,
      },
    });

    // Revoke old refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: user.userId },
    });

    return res.json({
      success: true,
      message: 'Your password has been successfully updated. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[resetPasswordOtpHandler Error]:', error);
    return res.status(500).json({ error: 'Failed to reset password.', details: error.message });
  }
};

/**
 * POST /api/auth/sudo/request-otp
 * Step-Up Authentication: Generates and dispatches an OTP for destructive/privileged actions
 */
export const requestSudoOtpHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required for privileged action.' });
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const clientUa = req.headers['user-agent'];

    const result = await generateAndSendOTP({
      email: user.email,
      purpose: 'SUDO_ACTION',
      fullName: user.fullName,
      ipAddress: clientIp,
      userAgent: clientUa,
      userId: user.userId,
    });

    if (result.sessionToken) {
      res.cookie('atc_otp_session', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 5 * 60 * 1000,
      });
    }

    return res.json({
      success: true,
      message: `A privileged action authorization code has been dispatched to ${user.email}.`,
      expiresInMinutes: 5,
      cooldownSeconds: 60,
    });
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({ error: error.message, remainingSeconds: error.remainingSeconds });
    }
    console.error('[requestSudoOtpHandler Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to request privileged authorization code.' });
  }
};

/**
 * POST /api/auth/sudo/verify-otp
 * Step-Up Authentication: Verifies SUDO OTP and grants a 15-minute privileged session window
 */
export const verifySudoOtpHandler = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { otp, sessionToken } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!otp) {
      return res.status(400).json({ error: '6-digit authorization code is required.' });
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const effectiveSessionToken =
      sessionToken ||
      req.cookies?.atc_otp_session ||
      req.headers['x-otp-session'];

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    const otpResult = await verifyOTP({
      email: user.email,
      otpCode: otp,
      purpose: 'SUDO_ACTION',
      sessionToken: effectiveSessionToken,
      ipAddress: clientIp,
      userId: user.userId,
    });

    if (!otpResult.success) {
      return res.status(400).json({
        error: otpResult.error,
        remainingAttempts: otpResult.remainingAttempts,
      });
    }

    res.clearCookie('atc_otp_session');

    // Issue 15-minute privileged SUDO token
    const sudoToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        sudo: true,
        scope: 'PRIVILEGED_OPS',
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('atc_sudo_token', sudoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15-minute stateful window
    });

    return res.json({
      success: true,
      message: 'Privileged administrative session granted for 15 minutes.',
      sudoToken,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error('[verifySudoOtpHandler Error]:', error);
    return res.status(500).json({ error: 'Failed to verify privileged authorization code.' });
  }
};
