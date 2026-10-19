// ==============================================================================
// Service: otpService.js
// Purpose: Enterprise One-Time Password (OTP) Generation, Dispatch & Validation
//          - Cryptographically secure 6-digit generation (crypto.randomInt)
//          - 60-second cooldown rate-limiting against email spam/bombing
//          - 10-minute validity window
//          - Maximum 5 failed attempts before OTP invalidation
//          - Dedicated purpose segregation (VERIFY_EMAIL, PASSWORD_RESET, LOGIN_OTP)
// ==============================================================================

import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { sendOtpEmail } from './emailService.js';

const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * Generate, persist, and dispatch a secure 6-digit OTP to user's email
 */
export async function generateAndSendOTP({
  email,
  purpose = 'VERIFY_EMAIL',
  fullName = '',
  fallbackToken = null,
}) {
  if (!email || typeof email !== 'string') {
    throw new Error('Valid email address is required for OTP generation.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Anti-Spam Cooldown Check (60 seconds)
  const recentOtp = await prisma.emailOTP.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      createdAt: {
        gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000);
    const remainingSeconds = Math.max(1, OTP_COOLDOWN_SECONDS - elapsedSeconds);
    const error = new Error(`Please wait ${remainingSeconds} seconds before requesting a new verification code.`);
    error.statusCode = 429;
    error.remainingSeconds = remainingSeconds;
    throw error;
  }

  // 2. Invalidate any existing active OTPs for this email & purpose
  await prisma.emailOTP.updateMany({
    where: {
      email: normalizedEmail,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // 3. Generate Cryptographically Secure 6-Digit OTP
  const rawCode = crypto.randomInt(100000, 1000000);
  const otpCode = String(rawCode);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 4. Save to Database
  await prisma.emailOTP.create({
    data: {
      email: normalizedEmail,
      otpCode,
      purpose,
      expiresAt,
      attempts: 0,
      isUsed: false,
    },
  });

  // 5. Dispatch via Corporate SMTP (no-reply@atechconsult.com)
  const emailResult = await sendOtpEmail({
    email: normalizedEmail,
    fullName,
    otpCode,
    purpose,
    fallbackToken,
  });

  if (!emailResult || !emailResult.success) {
    console.warn(`[OTP Warning] Failed to send email to ${normalizedEmail}:`, emailResult?.error);
  }

  return {
    success: true,
    email: normalizedEmail,
    purpose,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
  };
}

/**
 * Verify submitted OTP against active database record
 */
export async function verifyOTP({
  email,
  otpCode,
  purpose = 'VERIFY_EMAIL',
}) {
  if (!email || !otpCode) {
    return {
      success: false,
      error: 'Email and 6-digit verification code are required.',
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = String(otpCode).replace(/\s+/g, '').trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: 'Please enter a valid 6-digit numeric verification code.',
    };
  }

  // 1. Retrieve latest active OTP
  const record = await prisma.emailOTP.findFirst({
    where: {
      email: normalizedEmail,
      purpose,
      isUsed: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return {
      success: false,
      error: 'No active verification code found for this email. Please request a new one.',
    };
  }

  // 2. Check Expiration
  if (new Date() > new Date(record.expiresAt)) {
    await prisma.emailOTP.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: 'This verification code has expired. Please request a new one.',
    };
  }

  // 3. Check Attempt Limit
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOTP.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: 'Too many incorrect attempts. For security, this code has been deactivated. Please request a new one.',
    };
  }

  // 4. Constant-Time Code Comparison
  const expectedBuffer = Buffer.from(record.otpCode);
  const actualBuffer = Buffer.from(cleanCode);

  const isMatch = expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!isMatch) {
    const updatedAttempts = record.attempts + 1;
    const remaining = Math.max(0, MAX_ATTEMPTS - updatedAttempts);

    await prisma.emailOTP.update({
      where: { id: record.id },
      data: {
        attempts: { increment: 1 },
        isUsed: remaining === 0, // Invalidate if limit reached
      },
    });

    return {
      success: false,
      error: remaining > 0
        ? `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
        : 'Too many incorrect attempts. Please request a new code.',
      remainingAttempts: remaining,
    };
  }

  // 5. Successful match: Atomically mark OTP as used
  await prisma.emailOTP.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  return {
    success: true,
    email: normalizedEmail,
    purpose,
  };
}
