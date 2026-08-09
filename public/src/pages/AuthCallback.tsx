import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        login(token, userData);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to parse OAuth user data:', err);
        navigate('/login?error=oauth_parse_failed');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <p>Completing Google Sign In...</p>
    </div>
  );
};

export default AuthCallback;