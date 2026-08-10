import { apiCall } from './api';

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