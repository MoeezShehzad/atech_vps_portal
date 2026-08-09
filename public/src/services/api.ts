const API_BASE_URL = 'http://localhost:5000/api';

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
      const refreshResponse = await fetch(
        `${API_BASE_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!refreshResponse.ok) {
        throw new Error('Session expired');
      }

      const refreshData = await refreshResponse.json();

      if (!refreshData.accessToken) {
        throw new Error(
          'Refresh response did not contain an access token'
        );
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
  const isAuthEndpoint =
    endpoint === '/auth/refresh' ||
    endpoint === '/auth/login' ||
    endpoint === '/auth/register';

  const makeRequest = async (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',

      ...(token && !isAuthEndpoint
        ? {
            Authorization: `Bearer ${token}`,
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
  if (response.status === 401 && !isAuthEndpoint) {
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
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};