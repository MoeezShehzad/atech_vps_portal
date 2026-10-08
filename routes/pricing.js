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
    storageType: 'NVMe',
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
    storageType: 'NVMe',
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
    storageType: 'NVMe',
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

// POST /api/pricing/validate-coupon
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, planId, amount } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: String(code).trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return res.status(404).json({ error: 'Invalid or inactive promo code' });
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This promo code has expired' });
    }

    if (promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ error: 'This promo code has reached its maximum usage limit' });
    }

    // Check plan restriction if applicable
    if (promo.applicablePlanId && planId && Number(promo.applicablePlanId) !== Number(planId)) {
      return res.status(400).json({
        error: `This coupon is only valid for plan #${promo.applicablePlanId}`,
      });
    }

    const originalPrice = Number(amount) || 0;
    let discountAmount = 0;

    if (promo.discountType === 'PERCENT') {
      discountAmount = Number(((originalPrice * promo.discountValue) / 100).toFixed(2));
    } else {
      // FIXED discount in USD
      discountAmount = Number(promo.discountValue);
    }

    if (discountAmount > originalPrice) {
      discountAmount = originalPrice;
    }

    const finalPrice = Math.max(0, Number((originalPrice - discountAmount).toFixed(2)));

    return res.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      applicablePlanId: promo.applicablePlanId,
      originalPrice,
      discountAmount,
      finalPrice,
      message: `Promo code ${promo.code} applied successfully!`,
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

export default router;
