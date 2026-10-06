import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall, setAccessToken } from '../services/api';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;

    const handleAuth = async () => {
      processed.current = true;

      // 1. Legacy query parameters fallback (if present in cached browser links)
      const token = searchParams.get('token') || searchParams.get('accessToken');
      const userParam = searchParams.get('user');

      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          setAccessToken(token);
          login(token, userData);
          navigate('/dashboard', { replace: true });
          return;
        } catch (e) {
          console.error('[AuthCallback] Failed parsing legacy user payload:', e);
        }
      }

      // 2. Primary Secure Flow: Restore session using HttpOnly refreshToken cookie
      try {
        const data = await apiCall('/auth/refresh', { method: 'POST' });
        if (data?.accessToken && data?.user) {
          setAccessToken(data.accessToken);
          login(data.accessToken, data.user);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        console.error('[AuthCallback] Session exchange failed:', error);
      }

      // If both methods failed
      setAccessToken(null);
      setErrorMessage('Authentication session could not be established.');
      setTimeout(() => {
        navigate('/login?error=auth_failed', { replace: true });
      }, 2000);
    };

    handleAuth();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-sans">
      <div className="text-center space-y-3">
        {errorMessage ? (
          <div className="text-red-400 space-y-2">
            <p className="text-base font-semibold">{errorMessage}</p>
            <p className="text-xs text-slate-400">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            <p className="text-sm font-medium text-slate-300">Completing Sign In...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;