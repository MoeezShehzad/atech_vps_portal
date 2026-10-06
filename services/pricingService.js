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
 * Calculates price change between current VM specs and proposed new specs.
 */
export function calculateResizePrice(currentVm, newCpuCores, newRamGb) {
  const currentRam = currentVm.ramGb;
  const currentCpu = currentVm.cpuCores;
  const currentPrice = Number(currentVm.subscription?.monthlyPrice || currentVm.plan?.monthlyPrice || 0);

  const ramDelta = newRamGb - currentRam;
  const cpuDelta = newCpuCores - currentCpu;

  const ramCostDelta = ramDelta * SPEC_UNIT_RATES.ramPerGbMonth;
  const cpuCostDelta = cpuDelta * SPEC_UNIT_RATES.cpuPerCoreMonth;
  const totalDelta = Number((ramCostDelta + cpuCostDelta).toFixed(2));

  const newPrice = Math.max(4.99, Number((currentPrice + totalDelta).toFixed(2)));

  return {
    currentPrice,
    newPrice,
    priceDelta: totalDelta,
    ramDelta,
    cpuDelta,
    currency: 'USD',
  };
}
