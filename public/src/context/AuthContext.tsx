import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall, setAccessToken } from '../services/api';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Set memory access token and React auth state
  const login = (accessToken: string, userData: User) => {
    setAccessToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Revoke session in DB & clear HttpOnly cookie via backend
  const logout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed on server:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  // Silent Refresh on Initial Application Load / Mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const data = await apiCall('/auth/refresh', { method: 'POST' });
        if (data.accessToken && data.user) {
          login(data.accessToken, data.user);
        }
      } catch (err) {
        // No active session cookie or token revoked
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
          <p>Loading session...</p>
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