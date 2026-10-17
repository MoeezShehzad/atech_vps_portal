import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiCall, setAccessToken, API_BASE_URL } from '../services/api';
import atcLogo from '../assets/ATC_Logo.png';
import { ModernFloatingInput } from '../components/ModernFormControls';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve route user was attempting to visit
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const token = data.accessToken || data.token;

      // 1. Store access token into memory immediately
      if (token) {
        setAccessToken(token);
        localStorage.setItem('token', token);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // 2. Pass accessToken and user object required by AuthContext
      login(token, data.user);

      // 3. Navigate to requested route
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* LEFT: SHOWCASE PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain brightness-200" />
            <span className="font-bold font-poppins text-lg">Analytical Technical Consulting</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> All systems operational
            </span>
            <h1 className="mt-5 text-4xl xl:text-5xl font-extrabold font-poppins leading-tight">
              Deploy cloud servers<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">in seconds.</span>
            </h1>
            <p className="mt-4 text-slate-300 max-w-md text-sm leading-relaxed">
              Enterprise Hyper-V virtual machines on NVMe storage, managed from one powerful dashboard.
            </p>
          </div>

          {/* Terminal mockup */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-700/60 shadow-2xl backdrop-blur max-w-md overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-3 text-[11px] text-slate-500 font-mono">root@atc-vps</span>
            </div>
            <div className="p-4 font-mono text-xs space-y-1.5">
              <p><span className="text-emerald-400">$</span> atc deploy --plan pro --os ubuntu-24.04</p>
              <p className="text-slate-400">→ Allocating 4 vCPU / 8 GB RAM / 120 GB NVMe</p>
              <p className="text-slate-400">→ Assigning public IPv4...</p>
              <p className="text-emerald-400">✓ Server online in 9.4s</p>
              <p><span className="text-emerald-400">$</span> <span className="inline-block w-2 h-3.5 bg-slate-300 animate-pulse align-middle" /></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[['99.9%', 'Uptime SLA'], ['<10s', 'Provisioning'], ['24/7', 'Support']].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-xl font-bold font-poppins">{v}</p>
                <p className="text-[11px] text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Analytical Technical Consulting Inc.</p>
      </div>

      {/* RIGHT: FORM */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 lg:hidden">
          <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-blue-950 font-poppins">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-blue-950/5 border border-slate-200 rounded-2xl sm:px-10">

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-700"
            >
              {/* Google SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => { window.location.href = `${API_BASE_URL}/auth/github`; }}
              className="w-full py-2.5 px-4 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">Or login with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <ModernFloatingInput
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              placeholder="name@company.com"
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <ModernFloatingInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                placeholder="••••••••••••"
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Enterprise Data Protection</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}