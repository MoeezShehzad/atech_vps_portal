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

export default router;
