import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

const defaultPlans = [
  {
    planId: 1,
    name: 'VPS Basic',
    description: 'Ideal for small apps and web hosting',
    cpuCores: 2,
    ramGb: 4,
    storageGb: 50,
    storageType: 'SSD',
    bandwidthMbps: 1000,
    ipv4Addresses: 1,
    backupEnabled: false,
    snapshotEnabled: true,
    monthlyPrice: 6.99,
    currency: 'USD',
  },
  {
    planId: 2,
    name: 'VPS Pro',
    description: 'Optimized for high-traffic servers & databases',
    cpuCores: 4,
    ramGb: 8,
    storageGb: 120,
    storageType: 'SSD',
    bandwidthMbps: 2000,
    ipv4Addresses: 1,
    backupEnabled: true,
    snapshotEnabled: true,
    monthlyPrice: 14.99,
    currency: 'USD',
  },
  {
    planId: 3,
    name: 'VPS Enterprise',
    description: 'Heavy compute power with maximum throughput',
    cpuCores: 8,
    ramGb: 16,
    storageGb: 250,
    storageType: 'SSD',
    bandwidthMbps: 5000,
    ipv4Addresses: 2,
    backupEnabled: true,
    snapshotEnabled: true,
    monthlyPrice: 29.99,
    currency: 'USD',
  },
];

// GET /api/pricing/plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.vPSPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });

    if (plans && plans.length > 0) {
      return res.json(plans);
    }

    return res.json(defaultPlans);
  } catch (error) {
    console.warn('[PRICING] Database connection offline or unreachable. Returning fallback plans.');
    return res.json(defaultPlans);
  }
});

import jwt from 'jsonwebtoken';

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// POST /api/pricing/validate-coupon
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, planId, amount, monthlyBaseRate, term = '1m', isUpgrade = false, userId } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: String(code).trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return res.status(404).json({ error: 'Invalid or inactive promo code' });
    }

    const now = new Date();

    // 1. Automatic Timing: Check Start Date (validFrom)
    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return res.status(400).json({
        error: `This promo code offer is not active yet. Offer starts on ${formatDate(promo.validFrom)}.`,
        validFrom: promo.validFrom,
        expiresAt: promo.expiresAt,
      });
    }

    // 2. Automatic Timing: Check End Date (expiresAt)
    // "The offer was from this date to this date"
    if (promo.expiresAt && new Date(promo.expiresAt) < now) {
      const fromStr = promo.validFrom ? formatDate(promo.validFrom) : formatDate(promo.createdAt);
      const toStr = formatDate(promo.expiresAt);
      return res.status(400).json({
        error: `This promo code has expired. The offer was from ${fromStr} to ${toStr}.`,
        validFrom: promo.validFrom,
        expiresAt: promo.expiresAt,
      });
    }

    // 3. Usage limit check (timesUsed vs maxUses)
    if (promo.timesUsed >= promo.maxUses) {
      return res.status(400).json({ error: 'This promo code has reached its maximum usage limit' });
    }

    // 4. Existing User vs Upgrade Restriction:
    // "no coupon on the existing user but if upgrading the package then he/she can apply the coupon."
    let targetUserId = userId ? Number(userId) : null;
    if (!targetUserId && req.headers['authorization']) {
      try {
        const token = req.headers['authorization'].split(' ')[1];
        const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';
        const decoded = jwt.verify(token, secret);
        targetUserId = Number(decoded.userId || decoded.id);
      } catch (_) {}
    }

    if (targetUserId) {
      const [vmCount, subCount] = await Promise.all([
        prisma.virtualMachine.count({ where: { userId: targetUserId } }),
        prisma.subscription.count({ where: { userId: targetUserId, status: { not: 'CANCELLED' } } }),
      ]);
      const isExistingUser = vmCount > 0 || subCount > 0;
      if (isExistingUser && !Boolean(isUpgrade)) {
        return res.status(400).json({
          error: 'Coupon codes are exclusively valid for new customers or package upgrades. Existing users cannot apply this coupon unless upgrading an existing package.',
          isExistingUser: true,
        });
      }
    }

    // 5. Check plan restriction if applicable
    if (promo.applicablePlanId && planId && Number(promo.applicablePlanId) !== Number(planId)) {
      return res.status(400).json({
        error: `This coupon is only valid for plan #${promo.applicablePlanId}`,
      });
    }

    // 6. Pricing & Duration Calculation:
    // "take yearly payment full for year"
    // "the coupon code only applies for only one month not on complete year and then prices go back to normal after completing the period one month."
    // "Yearly Pricing logic -> non refundable"
    const isYearly = term === '12m' || term === 'yearly';
    const termMonths = isYearly ? 12 : (term === '24m' ? 24 : 1);

    const baseMonthly = Number(monthlyBaseRate || (isYearly ? (Number(amount) / 12) : Number(amount))) || 0;
    const fullTermSubtotal = Number((baseMonthly * termMonths).toFixed(2));

    // Calculate month 1 discount ONLY
    let month1Discount = 0;
    if (promo.discountType === 'PERCENT') {
      month1Discount = Number(((baseMonthly * Number(promo.discountValue)) / 100).toFixed(2));
    } else {
      month1Discount = Number(promo.discountValue);
    }
    if (month1Discount > baseMonthly) {
      month1Discount = baseMonthly;
    }

    // The discount applies ONLY to one month, even on 12-month or multi-month plans!
    const totalDiscount = month1Discount;
    const finalPrice = Math.max(0, Number((fullTermSubtotal - totalDiscount).toFixed(2)));

    const offerPeriodText = promo.validFrom && promo.expiresAt
      ? `The offer is valid from ${formatDate(promo.validFrom)} to ${formatDate(promo.expiresAt)}`
      : promo.expiresAt
        ? `The offer expires on ${formatDate(promo.expiresAt)}`
        : null;

    return res.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      applicablePlanId: promo.applicablePlanId,
      validFrom: promo.validFrom,
      expiresAt: promo.expiresAt,
      offerPeriodText,
      term,
      termMonths,
      isYearly,
      isNonRefundable: isYearly,
      monthlyRate: baseMonthly,
      month1Discount,
      discountAmount: totalDiscount,
      originalPrice: fullTermSubtotal,
      finalPrice,
      renewalPrice: fullTermSubtotal,
      message: isYearly
        ? `Promo code ${promo.code} applied! 1-month introductory discount of $${totalDiscount.toFixed(2)} applied. Full annual payment charged upfront (non-refundable). Regular price resumes thereafter.`
        : `Promo code ${promo.code} applied! 1-month discount of $${totalDiscount.toFixed(2)} applied. Price returns to normal ($${baseMonthly.toFixed(2)}/mo) after 1 month.`,
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

export default router;
