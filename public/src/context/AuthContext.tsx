import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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

  // Store the active promise to handle Strict Mode remounts without duplicate calls
  const refreshPromiseRef = useRef<Promise<any> | null>(null);

  /*
   * LOGIN
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
   */
  useEffect(() => {
    let isMounted = true;

    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;

    console.log('[AuthInit] Initializing AuthProvider check...');

    // Catch /auth/callback whether in pathname or full URL
    if (currentPath.includes('/auth/callback') || currentUrl.includes('/auth/callback')) {
      console.log('[AuthInit] OAuth callback route detected! Skipping /auth/refresh.');
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      // Reuse ongoing request if Strict Mode remounts
      if (!refreshPromiseRef.current) {
        console.log('[AuthInit] Sending silent refresh request to /auth/refresh...');
        refreshPromiseRef.current = apiCall('/auth/refresh', { method: 'POST' });
      } else {
        console.log('[AuthInit] Attaching to existing /auth/refresh request...');
      }

      try {
        const data = await refreshPromiseRef.current;

        if (isMounted && data?.accessToken && data?.user) {
          console.log(
            '[AuthInit] Session restored successfully for user:',
            data.user.email || data.user.fullName
          );
          login(data.accessToken, data.user);
        } else if (isMounted) {
          console.warn('[AuthInit] Refresh succeeded but payload missing token/user');
        }
      } catch (err: any) {
        // Quiet expected 401 log when no active session cookie exists
        console.log('[AuthInit] No active session found. User unauthenticated.');

        if (isMounted) {
          setAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          console.log('[AuthInit] Auth initialization complete. Setting loading to false.');
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