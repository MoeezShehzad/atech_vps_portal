// ==============================================================================
// Service: pricingService.js
// Purpose: Dynamic VPS spec pricing calculator (RAM, vCPU, NVMe storage deltas)
// ==============================================================================

export const SPEC_UNIT_RATES = {
  ramPerGbMonth: 1.50,       // $1.50 / GB / month
  cpuPerCoreMonth: 2.50,     // $2.50 / vCPU core / month
  storagePerGbMonth: 0.10,   // $0.10 / GB NVMe / month
};

/**
 * Calculates new monthly price based on a base plan and customized hardware specs.
 * @param {Object} plan - Base VPSPlan { cpuCores, ramGb, storageGb, monthlyPrice }
 * @param {Object} targetSpecs - { cpuCores, ramGb, storageGb }
 * @returns {Object} { basePrice, ramDeltaPrice, cpuDeltaPrice, storageDeltaPrice, totalMonthlyPrice, diffMonthly }
 */
export function calculateCustomPrice(plan, targetSpecs) {
  const basePrice = Number(plan.monthlyPrice);
  
  const ramDiff = Math.max(0, targetSpecs.ramGb - plan.ramGb);
  const cpuDiff = Math.max(0, targetSpecs.cpuCores - plan.cpuCores);
  const storageDiff = Math.max(0, (targetSpecs.storageGb || plan.storageGb) - plan.storageGb);

  const ramDeltaPrice = Number((ramDiff * SPEC_UNIT_RATES.ramPerGbMonth).toFixed(2));
  const cpuDeltaPrice = Number((cpuDiff * SPEC_UNIT_RATES.cpuPerCoreMonth).toFixed(2));
  const storageDeltaPrice = Number((storageDiff * SPEC_UNIT_RATES.storagePerGbMonth).toFixed(2));

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

  const ramCostDelta = ramDelta * SPEC_UNIT_RATES.ramPerGbMonth;
  const cpuCostDelta = cpuDelta * SPEC_UNIT_RATES.cpuPerCoreMonth;
  const storageCostDelta = Math.max(0, storageDelta) * SPEC_UNIT_RATES.storagePerGbMonth;
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
