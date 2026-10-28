export const API_BASE_URL = '/api';

let inMemoryAccessToken: string | null = null;

// Prevent multiple refresh requests from running simultaneously.
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

/*
 * Refresh the access token.
 *
 * If a refresh request is already running, return the
 * same Promise instead of creating another refresh request.
 */
const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!refreshResponse.ok) {
        throw new Error('Session expired');
      }

      const refreshData = await refreshResponse.json();

      if (!refreshData.accessToken) {
        throw new Error('Refresh response did not contain an access token');
      }

      // Store access token ONLY in memory.
      setAccessToken(refreshData.accessToken);

      return refreshData.accessToken;
    } finally {
      // Allow future refreshes after this one finishes.
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  // Added /auth/logout to prevent auto-refreshing during logout flow
  const isAuthEndpoint =
    endpoint === '/auth/refresh' ||
    endpoint === '/auth/login' ||
    endpoint === '/auth/register' ||
    endpoint === '/auth/logout';

  const makeRequest = async (token: string | null) => {
    const activeOrgId = localStorage.getItem('atech_active_workspace_org_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',

      ...(token && !isAuthEndpoint
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(activeOrgId && activeOrgId !== 'personal'
        ? {
            'X-Organization-Id': activeOrgId,
          }
        : {}),

      ...(options.headers as Record<string, string>),
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  /*
   * First request
   */
  let response = await makeRequest(getAccessToken());

  /*
   * Access token expired.
   *
   * Don't refresh authentication endpoints themselves.
   */
  if ((response.status === 401 || response.status === 403) && !isAuthEndpoint) {
    try {
      const newAccessToken = await refreshAccessToken();

      /*
       * Retry the original request with the new token.
       */
      response = await makeRequest(newAccessToken);
    } catch (err) {
      setAccessToken(null);
      throw err;
    }
  }

  /*
   * Parse response
   */
  let data: any;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  /*
   * Handle HTTP errors
   */
  if (!response.ok) {
    // Handle 401 for auth check silently
    const rawErrorMessage =
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`;

    const errorMessage = sanitizeClientErrorMessage(rawErrorMessage);

    const error = new Error(errorMessage) as Error & { status?: number; rawMessage?: string };
    error.status = response.status;
    error.rawMessage = rawErrorMessage;
    throw error;
  }

  return data;
};

/**
 * Sanitizes any raw system / hypervisor / powershell traces into
 * clean, reassuring cloud-native messages so customers are never frightened.
 */
export function sanitizeClientErrorMessage(rawMessage: string): string {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'The requested operation could not be completed at this time. Please try again shortly.';
  }

  const lower = rawMessage.toLowerCase();

  // 0. Gateway / Proxy / Service Connectivity
  if (lower.includes('502') || lower.includes('bad gateway')) {
    return 'Cloud API gateway is temporarily synchronizing. Please try again in a few moments.';
  }
  if (lower.includes('503') || lower.includes('service unavailable')) {
    return 'Cloud infrastructure is undergoing momentary routine maintenance. Please retry shortly.';
  }
  if (lower.includes('504') || lower.includes('gateway timeout')) {
    return 'Gateway timed out contacting compute host. Please retry in a moment.';
  }

  if (
    lower.includes('not enough memory') ||
    lower.includes('could not initialize memory') ||
    lower.includes('0x8007000e') ||
    lower.includes('insufficient memory') ||
    lower.includes('ram size') ||
    lower.includes('out of memory')
  ) {
    return 'The host cluster is currently balancing node memory resources. Please wait a moment and try again, or reach out to support if this continues.';
  }

  // 2. Storage / Disk Space / VHDX lock
  if (
    lower.includes('disk full') ||
    lower.includes('no space left') ||
    lower.includes('0x80070070') ||
    lower.includes('vhdx') ||
    lower.includes('virtual hard disk') ||
    lower.includes('process cannot access the file') ||
    lower.includes('sharing violation')
  ) {
    return 'Storage volumes are currently undergoing routine optimization on this node. Please allow a few moments and retry.';
  }

  // 3. CPU / Processor Capacity
  if (
    lower.includes('processor') ||
    lower.includes('exceeded processor limit') ||
    lower.includes('cpu quota')
  ) {
    return 'Compute capacity on this cluster node is temporarily re-balancing. Please try again in a few moments.';
  }

  // 4. Host Agent / Network Communication
  if (
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('host agent') ||
    lower.includes('start_hyperv_agent') ||
    lower.includes(':5050')
  ) {
    return 'Unable to reach the infrastructure hypervisor. Our automated monitors have logged this event. Please try again in 1-2 minutes.';
  }

  // 5. Already Running / Already Stopped states
  if (lower.includes('already running') || lower.includes('state is running')) {
    return 'The virtual machine is already running.';
  }
  if (lower.includes('already stopped') || lower.includes('state is off') || lower.includes('not running')) {
    return 'The virtual machine is already stopped.';
  }

  // 6. Security / Permissions
  if (lower.includes('permission denied') || lower.includes('access is denied') || lower.includes('authorization policy')) {
    return 'Authorization verification in progress on this cluster node. Please try again shortly.';
  }

  // 7. General internal leaks (PowerShell, file paths, hex codes, GUIDs)
  if (
    lower.includes('powershell') ||
    lower.includes('command failed') ||
    lower.includes('.ps1') ||
    lower.includes('write-error') ||
    lower.includes('categoryinfo') ||
    lower.includes('fullyqualifiederrorid') ||
    lower.includes('d:\\') ||
    lower.includes('c:\\') ||
    lower.includes('/scripts/') ||
    lower.includes('0x800')
  ) {
    return 'The requested operation could not be completed due to a temporary node delay. Please wait a moment and try again.';
  }

  return rawMessage;
}