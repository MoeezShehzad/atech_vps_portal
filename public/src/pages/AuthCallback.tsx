import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setAccessToken } from '../services/api';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
  const handleOAuth = async () => {
    console.log('=== GOOGLE CALLBACK START ===');

    const token = searchParams.get('token') || searchParams.get('accessToken');
    const userParam = searchParams.get('user');

    console.log('TOKEN EXISTS:', !!token);
    console.log('USER PARAM EXISTS:', !!userParam);

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));

        console.log('GOOGLE USER:', userData);

        // Set access token + React auth state
        login(token, userData);

        console.log('LOGIN STATE SET');

        navigate('/dashboard', { replace: true });

        console.log('NAVIGATING TO DASHBOARD');

        return;
      } catch (error) {
        console.error('GOOGLE CALLBACK ERROR:', error);
      }
    }

    console.error('GOOGLE CALLBACK: TOKEN OR USER MISSING');

    setErrorMessage('Google Authentication failed.');

    setTimeout(() => {
      navigate('/login?error=oauth_failed', { replace: true });
    }, 2000);
  };

  handleOAuth();
}, [searchParams, navigate, login]);
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-sans">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <p className="text-sm font-medium text-slate-300">Completing Google Sign In...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

function setErrorMessage(arg0: string) {
  throw new Error('Function not implemented.');
}
