// ==============================================================================
// Service: pricingService.js
// Purpose: Dynamic VPS spec pricing calculator (RAM, vCPU, SSD storage deltas)
// ==============================================================================

// Per-plan customized unit rates based on plan volume tier
export const PLAN_SPEC_RATES = {
  // Plan 1: VPS Basic ($6.99/mo: 2 Cores @ $2.00 = $4.00, 4GB RAM @ $0.7225 = $2.89, 120GB SSD = $0.10)
  1: {
    cpuPerCoreMonth: 2.00,
    ramPerGbMonth: 0.7225,
    storagePerGbMonth: 0.02,
    maxSnapshots: 1,
  },
  'VPS Basic': {
    cpuPerCoreMonth: 2.00,
    ramPerGbMonth: 0.7225,
    storagePerGbMonth: 0.02,
    maxSnapshots: 1,
  },
  // Plan 2: VPS Pro ($14.98/mo: 4 Cores @ $1.05 = $4.20, 8GB RAM @ $0.5975 = $4.78, 250GB SSD @ $0.024 = $6.00)
  2: {
    cpuPerCoreMonth: 1.05,
    ramPerGbMonth: 0.5975,
    storagePerGbMonth: 0.024,
    maxSnapshots: 2,
  },
  'VPS Pro': {
    cpuPerCoreMonth: 1.05,
    ramPerGbMonth: 0.5975,
    storagePerGbMonth: 0.024,
    maxSnapshots: 2,
  },
  // Plan 3: VPS Enterprise ($29.99/mo: 8 Cores @ $1.00 = $8.00, 16GB RAM @ $0.59375 = $9.50, 250GB SSD @ $0.04996 = $12.49)
  3: {
    cpuPerCoreMonth: 1.00,
    ramPerGbMonth: 0.59375,
    storagePerGbMonth: 0.04996,
    maxSnapshots: 5,
  },
  'VPS Enterprise': {
    cpuPerCoreMonth: 1.00,
    ramPerGbMonth: 0.59375,
    storagePerGbMonth: 0.04996,
    maxSnapshots: 5,
  },
  // Plan 4: VPS Ultra Compute ($59.99/mo: 16 Cores @ $0.95 = $15.20, 32GB RAM @ $0.5871875 = $18.79, 500GB SSD @ $0.052 = $26.00)
  4: {
    cpuPerCoreMonth: 0.95,
    ramPerGbMonth: 0.5871875,
    storagePerGbMonth: 0.052,
    maxSnapshots: 7,
  },
  'VPS Ultra Compute': {
    cpuPerCoreMonth: 0.95,
    ramPerGbMonth: 0.5871875,
    storagePerGbMonth: 0.052,
    maxSnapshots: 7,
  },
};

export const SPEC_UNIT_RATES = {
  ramPerGbMonth: 0.7225,
  cpuPerCoreMonth: 2.00,
  storagePerGbMonth: 0.02,
};

export function getRatesForPlan(planOrId) {
  if (!planOrId) return SPEC_UNIT_RATES;
  if (typeof planOrId === 'number' || typeof planOrId === 'string') {
    return PLAN_SPEC_RATES[planOrId] || SPEC_UNIT_RATES;
  }
  const byId = planOrId.planId ? PLAN_SPEC_RATES[planOrId.planId] : null;
  const byName = planOrId.name ? PLAN_SPEC_RATES[planOrId.name] : null;
  return byId || byName || SPEC_UNIT_RATES;
}

/**
 * Calculates new monthly price based on a base plan and customized hardware specs.
 * @param {Object} plan - Base VPSPlan { cpuCores, ramGb, storageGb, monthlyPrice }
 * @param {Object} targetSpecs - { cpuCores, ramGb, storageGb }
 * @returns {Object} { basePrice, ramDeltaPrice, cpuDeltaPrice, storageDeltaPrice, totalMonthlyPrice, diffMonthly }
 */
export function calculateCustomPrice(plan, targetSpecs) {
  const basePrice = Number(plan.monthlyPrice);
  const rates = getRatesForPlan(plan);
  
  const ramDiff = Math.max(0, targetSpecs.ramGb - plan.ramGb);
  const cpuDiff = Math.max(0, targetSpecs.cpuCores - plan.cpuCores);
  const storageDiff = Math.max(0, (targetSpecs.storageGb || plan.storageGb) - plan.storageGb);

  const ramDeltaPrice = Number((ramDiff * rates.ramPerGbMonth).toFixed(2));
  const cpuDeltaPrice = Number((cpuDiff * rates.cpuPerCoreMonth).toFixed(2));
  const storageDeltaPrice = Number((storageDiff * rates.storagePerGbMonth).toFixed(2));

  const totalMonthlyPrice = Number((basePrice + ramDeltaPrice + cpuDeltaPrice + storageDeltaPrice).toFixed(2));
  const diffMonthly = Number((totalMonthlyPrice - basePrice).toFixed(2));

  return {
    basePrice,
    ramDeltaPrice,
    cpuDeltaPrice,
    storageDeltaPrice,
    totalMonthlyPrice,
    diffMonthly,
    currency: plan.currency || 'USD',
  };
}

/**
 * Calculates price change between current VM specs and proposed new specs
 * including enterprise Google-style billing cycle proration.
 */
export function calculateResizePrice(currentVm, newCpuCores, newRamGb, newStorageGb) {
  const currentRam = currentVm.ramGb;
  const currentCpu = currentVm.cpuCores;
  const currentStorage = currentVm.storageGb;
  const currentPrice = Number(currentVm.subscription?.monthlyPrice || currentVm.plan?.monthlyPrice || 0);

  const ramDelta = newRamGb - currentRam;
  const cpuDelta = newCpuCores - currentCpu;
  const storageDelta = (newStorageGb ? Number(newStorageGb) : currentStorage) - currentStorage;

  const rates = getRatesForPlan(currentVm.plan || currentVm.subscription?.plan || currentVm.planId);
  const ramCostDelta = ramDelta * rates.ramPerGbMonth;
  const cpuCostDelta = cpuDelta * rates.cpuPerCoreMonth;
  const storageCostDelta = Math.max(0, storageDelta) * rates.storagePerGbMonth;
  const totalDelta = Number((ramCostDelta + cpuCostDelta + storageCostDelta).toFixed(2));

  const newPrice = Math.max(4.99, Number((currentPrice + totalDelta).toFixed(2)));

  // ============================================================================
  // ENTERPRISE PRORATION LOGIC (Billing Cycle Synchronization)
  // ============================================================================
  const now = new Date();
  const sub = currentVm.subscription;
  let totalDays = 30;
  let daysRemaining = 15;
  let nextBillingDate = null;

  if (sub && sub.nextBillingDate) {
    const nextDate = new Date(sub.nextBillingDate);
    const startDate = sub.startDate ? new Date(sub.startDate) : new Date(now.getTime() - 15 * 86400000);
    nextBillingDate = sub.nextBillingDate;

    if (nextDate > now) {
      const msDiff = nextDate.getTime() - startDate.getTime();
      const calcTotalDays = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)));
      totalDays = calcTotalDays > 0 ? calcTotalDays : 30;

      const msRemaining = nextDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    } else {
      // Past due or renewing today
      totalDays = 30;
      daysRemaining = 30;
    }
  } else {
    // If no explicit subscription cycle recorded, assume 30-day window with 15 days default
    totalDays = 30;
    daysRemaining = 15;
    const futureDate = new Date(now.getTime() + 15 * 86400000);
    nextBillingDate = futureDate.toISOString();
  }

  // Ratio of billing period remaining (clamped between 0 and 1)
  const prorationRatio = Math.min(1, Math.max(0, daysRemaining / totalDays));

  // Prorated figures
  const unusedOldCredit = Number((currentPrice * prorationRatio).toFixed(2));
  const proratedNewCost = Number((newPrice * prorationRatio).toFixed(2));
  
  // Amount due today: exactly the difference between new prorated cost and unused credit
  // Or priceDelta * prorationRatio
  const dueTodayRaw = totalDelta * prorationRatio;
  const dueToday = Number(Math.max(0, dueTodayRaw).toFixed(2));
  const accountCredit = Number(Math.max(0, -dueTodayRaw).toFixed(2));

  // Hourly equivalent rate (~720 hours in a month)
  const hourlyRate = Number((Math.max(0, totalDelta) / 720).toFixed(4));

  return {
    currentPrice,
    newPrice,
    priceDelta: totalDelta,
    ramDelta,
    cpuDelta,
    storageDelta,
    totalDays,
    daysRemaining,
    prorationRatio: Number(prorationRatio.toFixed(4)),
    unusedOldCredit,
    proratedNewCost,
    dueToday,
    accountCredit,
    hourlyRate,
    nextBillingDate,
    currency: 'USD',
  };
}
