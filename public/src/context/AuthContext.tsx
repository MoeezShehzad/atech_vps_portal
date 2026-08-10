import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { apiCall, setAccessToken } from '../services/api.ts';

interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  /*
   * LOGIN
   *
   * Access token stays ONLY in memory.
   * Refresh token is handled by the HttpOnly cookie.
   */
  const login = useCallback(
    (accessToken: string, userData: User) => {
      setAccessToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
    },
    []
  );

  /*
   * LOGOUT
   *
   * Backend:
   * - Revokes refresh token/session
   * - Clears HttpOnly refresh cookie
   *
   * Frontend:
   * - Clears in-memory access token
   * - Clears React authentication state
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);

      window.location.href = '/login';
    }
  }, []);

  /*
   * INITIAL AUTHENTICATION
   *
   * When the application starts:
   *
   * 1. Ask backend to validate the HttpOnly refresh cookie.
   * 2. If valid -> receive a new access token.
   * 3. If no cookie / expired cookie -> 401 is normal.
   * 4. User remains logged out.
   */
  useEffect(() => {
  let isMounted = true;

  const currentUrl = window.location.href;
const currentPath = window.location.pathname;

console.log('[AuthInit] Initializing AuthProvider check...');
console.log('[AuthInit] Current Pathname:', currentPath);
console.log('[AuthInit] Current Full URL:', currentUrl);

// Catch /auth/callback whether in pathname or full URL
if (currentPath.includes('/auth/callback') || currentUrl.includes('/auth/callback')) {
  console.log('[AuthInit] OAuth callback route detected! Skipping /auth/refresh.');
  setLoading(false);
  return;
}

  const initializeAuth = async () => {
    console.log('[AuthInit] Sending silent refresh request to /auth/refresh...');

    try {
      const data = await apiCall('/auth/refresh', {
        method: 'POST',
      });

      console.log('[AuthInit] /auth/refresh Response Received:', data);

      if (isMounted && data?.accessToken && data?.user) {
        console.log('[AuthInit] Session restored successfully for user:', data.user.email || data.user.fullName);
        login(data.accessToken, data.user);
      } else {
        console.warn('[AuthInit] Refresh succeeded but payload missing token or user data:', data);
      }
    } catch (err: any) {
      console.warn('[AuthInit] Session restore failed or no active session found.');
      console.error('[AuthInit] Refresh Error Details:', err?.message || err);

      if (isMounted) {
        console.log('[AuthInit] Resetting auth state to unauthenticated...');
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (isMounted) {
        console.log('[AuthInit] Authentication initialization complete. Setting loading to false.');
        setLoading(false);
      }
    }
  };

  initializeAuth();

  return () => {
    console.log('[AuthInit] Cleaning up AuthProvider useEffect (unmounted).');
    isMounted = false;
  };
}, [login]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          Loading session...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};