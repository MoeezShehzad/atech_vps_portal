import { apiCall } from './api';

// Per-plan customized unit rates based on plan volume tier
export const PLAN_SPEC_RATES: Record<number | string, {
  cpuPerCoreMonth: number;
  ramPerGbMonth: number;
  storagePerGbMonth: number;
  maxSnapshots: number;
}> = {
  1: { cpuPerCoreMonth: 2.00, ramPerGbMonth: 0.7225, storagePerGbMonth: 0.02, maxSnapshots: 1 },
  'VPS Basic': { cpuPerCoreMonth: 2.00, ramPerGbMonth: 0.7225, storagePerGbMonth: 0.02, maxSnapshots: 1 },
  2: { cpuPerCoreMonth: 1.05, ramPerGbMonth: 0.598, storagePerGbMonth: 0.05, maxSnapshots: 2 },
  'VPS Pro': { cpuPerCoreMonth: 1.05, ramPerGbMonth: 0.598, storagePerGbMonth: 0.05, maxSnapshots: 2 },
  3: { cpuPerCoreMonth: 1.00, ramPerGbMonth: 0.594, storagePerGbMonth: 0.05, maxSnapshots: 5 },
  'VPS Enterprise': { cpuPerCoreMonth: 1.00, ramPerGbMonth: 0.594, storagePerGbMonth: 0.05, maxSnapshots: 5 },
  4: { cpuPerCoreMonth: 0.95, ramPerGbMonth: 0.587, storagePerGbMonth: 0.052, maxSnapshots: 7 },
  'VPS Ultra Compute': { cpuPerCoreMonth: 0.95, ramPerGbMonth: 0.587, storagePerGbMonth: 0.052, maxSnapshots: 7 },
};

export const DEFAULT_SPEC_RATES = {
  cpuPerCoreMonth: 2.00,
  ramPerGbMonth: 0.7225,
  storagePerGbMonth: 0.02,
  maxSnapshots: 1,
};

export interface BasePlanSpecs {
  planId?: number;
  name?: string;
  monthlyPrice: string | number;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
}

export function getRatesForPlan(planOrId?: number | string | Partial<VPSPlan> | null) {
  if (!planOrId) return DEFAULT_SPEC_RATES;
  if (typeof planOrId === 'number' || typeof planOrId === 'string') {
    return PLAN_SPEC_RATES[planOrId] || DEFAULT_SPEC_RATES;
  }
  const byId = planOrId.planId ? PLAN_SPEC_RATES[planOrId.planId] : null;
  const byName = planOrId.name ? PLAN_SPEC_RATES[planOrId.name] : null;
  return byId || byName || DEFAULT_SPEC_RATES;
}

/**
 * Calculates customized plan price based on the selected base plan's specific rates.
 */
export function calculatePlanCustomPrice(
  plan: BasePlanSpecs,
  targetSpecs: { cpuCores: number; ramGb: number; storageGb: number }
) {
  const basePrice = Number(plan.monthlyPrice) || 0;
  const rates = getRatesForPlan(plan);

  const cpuDiff = Math.max(0, targetSpecs.cpuCores - plan.cpuCores);
  const ramDiff = Math.max(0, targetSpecs.ramGb - plan.ramGb);
  const storageDiff = Math.max(0, targetSpecs.storageGb - plan.storageGb);

  const cpuDeltaPrice = Number((cpuDiff * rates.cpuPerCoreMonth).toFixed(2));
  const ramDeltaPrice = Number((ramDiff * rates.ramPerGbMonth).toFixed(2));
  const storageDeltaPrice = Number((storageDiff * rates.storagePerGbMonth).toFixed(2));

  const totalMonthlyPrice = Number((basePrice + cpuDeltaPrice + ramDeltaPrice + storageDeltaPrice).toFixed(2));
  const diffMonthly = Number((totalMonthlyPrice - basePrice).toFixed(2));

  return {
    basePrice,
    cpuDeltaPrice,
    ramDeltaPrice,
    storageDeltaPrice,
    totalMonthlyPrice,
    diffMonthly,
    rates,
  };
}

export interface VPSPlan {
  planId: number;
  name: string;
  description?: string | null;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  storageType: string;
  bandwidthMbps: number;
  ipv4Addresses: number;
  backupEnabled: boolean;
  snapshotEnabled: boolean;
  maxSnapshots?: number | null;
  monthlyPrice: string | number;
  currency: string;
  isActive?: boolean;
}

/**
 * Fetch active VPS pricing plans from the server.
 */
export async function fetchVpsPlans(): Promise<VPSPlan[]> {
  try {
    const response = await apiCall('/pricing/plans');

    // Handle array directly or wrapped responses
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    }

    console.warn('API returned non-array pricing data:', response);
    return [];
  } catch (error) {
    console.error('Error in fetchVpsPlans:', error);
    throw error;
  }
}