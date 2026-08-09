import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall, setAccessToken } from '../services/api';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuth = async () => {
      // 1. Extract token passed from backend redirect URL (e.g., /oauth/callback?token=XYZ)
      const token = searchParams.get('token') || searchParams.get('accessToken');

      if (!token) {
        // Fallback: If backend uses HttpOnly cookies, trigger refresh
        try {
          const data = await apiCall('/auth/refresh', { method: 'POST' });
          if (data.accessToken && data.user) {
            login(data.accessToken, data.user);
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch {
          setError('Failed to complete social login.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
      }

      if (token) {
        setAccessToken(token);
        localStorage.setItem('token', token);

        try {
          // Fetch user details using the newly stored token
          const user = await apiCall('/auth/me', { method: 'GET' });
          login(token, user);
          navigate('/dashboard', { replace: true });
        } catch {
          // Fallback if /auth/me endpoint is not explicitly configured
          login(token, { userId: 0, fullName: 'OAuth User', email: '', roles: [] });
          navigate('/dashboard', { replace: true });
        }
      }
    };

    handleOAuth();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center max-w-sm w-full">
        {error ? (
          <p className="text-sm font-semibold text-rose-600">{error}</p>
        ) : (
          <div className="space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-700">Completing Google Authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
}