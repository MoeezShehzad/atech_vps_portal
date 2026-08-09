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

    const initializeAuth = async () => {
      try {
        const data = await apiCall('/auth/refresh', {
          method: 'POST',
        });

        if (
          isMounted &&
          data?.accessToken &&
          data?.user
        ) {
          login(data.accessToken, data.user);
        }
      } catch (err: any) {
        /*
         * 401 here simply means:
         *
         * "There is currently no valid login session."
         *
         * This is completely normal for a guest visiting
         * the website for the first time.
         */

        if (err?.message !== 'Session expired') {
          console.debug('No active authentication session.');
        }

        if (isMounted) {
          setAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
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