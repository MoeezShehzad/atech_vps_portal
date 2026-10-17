import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff,
  AlertCircle, ShieldCheck, Loader2, Sparkles,
  Server, HardDrive, Zap, Shield, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiCall, setAccessToken, API_BASE_URL } from '../services/api';
import atcLogo from '../assets/ATC_Logo.png';
import {
  ModernFloatingInput,
  ModernCountrySelect,
  type CountryOption
} from '../components/ModernFormControls';

interface AuthProps {
  initialMode?: 'login' | 'signup';
}

const SHOWCASE_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1800&q=85',
    badge: 'Tier-4 Chicago Infrastructure',
    title: 'Bare-Metal Speed. Cloud Flexibility.',
    subtitle: 'Generation-2 Hyper-V virtual machines powered by dual-socket AMD EPYC™ processors and enterprise NVMe storage arrays.',
    statLabel: 'Provisioning Time',
    statValue: '< 10 Seconds',
  },
  {
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85',
    badge: 'Global Carrier Backbone',
    title: 'Ultra-Low Latency Network Fabric.',
    subtitle: 'Redundant 10 Gbps fiber uplinks protected by inline hardware firewall inspection and automated DDoS mitigation.',
    statLabel: 'Network Uptime SLA',
    statValue: '99.99% Guaranteed',
  },
  {
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=85',
    badge: '30-Day Risk-Free Trial',
    title: 'Engineered for Mission-Critical Workloads.',
    subtitle: 'Launch production Linux or Windows Server workloads with full root access, live web console, and instant snapshots.',
    statLabel: 'Starter Trial Spec',
    statValue: '2 vCPU • 2GB RAM • 50GB NVMe',
  },
];

export default function Auth({ initialMode }: AuthProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const routeMode = location.pathname.includes('signup') ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode || routeMode);
  const [activeSlide, setActiveSlide] = useState(0);

  // Sync mode when browser back/forward buttons are used
  useEffect(() => {
    if (location.pathname.includes('signup')) {
      setMode('signup');
    } else if (location.pathname.includes('login')) {
      setMode('login');
    }
  }, [location.pathname]);

  // Auto-advance the image showcase carousel every 5.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // -------------------------------------------------------------
  // Sign In States
  // -------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // -------------------------------------------------------------
  // Sign Up States
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Geo Countries list from MS SQL table
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');
  const [loadingGeo, setLoadingGeo] = useState<boolean>(true);

  // Fetch live countries on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveCountries() {
      try {
        setLoadingGeo(true);
        const res = await apiCall('/geo/countries');
        if (res && res.countries && res.countries.length > 0 && isMounted) {
          setCountriesList(res.countries);
          const defaultC = res.countries.find((c: CountryOption) => c.code === 'US') || res.countries[0];
          setSelectedCountryCode(defaultC.code);
        }
      } catch (err) {
        console.warn('[Live Geo Error] Failed to load countries:', err);
      } finally {
        if (isMounted) setLoadingGeo(false);
      }
    }
    loadLiveCountries();
    return () => { isMounted = false; };
  }, []);

  // Cooldown timer for resending verification email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const currentCountry = useMemo(() => {
    return countriesList.find((c) => c.code.toLowerCase() === selectedCountryCode.toLowerCase()) || countriesList[0] || {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      dialCode: '+1',
    };
  }, [countriesList, selectedCountryCode]);

  // Password criteria for sign up
  const hasMinLength = signupPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(signupPassword);
  const hasLowerCase = /[a-z]/.test(signupPassword);
  const hasNumber = /\d/.test(signupPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]/.test(signupPassword);
  const strengthScore = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  // Seamless Mode Switcher
  const switchMode = (newMode: 'login' | 'signup') => {
    if (newMode === mode) return;
    setMode(newMode);
    setLoginError('');
    setSignupError('');
    window.history.pushState(null, '', newMode === 'signup' ? '/signup' : '/login');
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const token = data.accessToken || data.token;
      if (token) {
        setAccessToken(token);
        localStorage.setItem('token', token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      login(token, data.user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError('Server authentication failed. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup Submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (strengthScore < 3) {
      setSignupError('Please create a stronger password meeting at least 3 security criteria.');
      return;
    }
    if (!agreeTerms) {
      setSignupError('You must review and agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setSignupLoading(true);
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          country: currentCountry.name,
          countryCode: currentCountry.code,
        }),
      });

      setVerificationSent(true);
      setResendCooldown(60);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSignupError(err.message);
      } else {
        setSignupError('Account registration failed. Please try again.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    try {
      await apiCall('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: signupEmail.trim().toLowerCase() }),
      });
      setResendCooldown(60);
    } catch (e: unknown) {
      console.warn('Resend error:', e);
    }
  };

  const currentSlide = SHOWCASE_SLIDES[activeSlide];

  return (
    <div className="min-h-screen w-full bg-[#050814] text-slate-900 dark:text-white flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      
      {/* =========================================================================
          AMBIENT BACKGROUND AURORA & CYBER MESH
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Background Tech Image with Deep Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 scale-105 transition-all duration-1000"
          style={{
            backgroundImage: `url('${currentSlide.image}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/90 via-[#070d1f]/85 to-[#050814]/95" />
        {/* Animated Glowing Orbs */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-600/25 blur-[130px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-cyan-500/20 blur-[130px] animate-pulse" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px]" />
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* =========================================================================
          TOP FLOATING NAVIGATION BAR
          ========================================================================= */}
      <header className="relative z-30 w-full max-w-[1220px] mx-auto px-4 sm:px-8 pt-5 pb-2 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md group-hover:bg-white/15 transition-all">
            <img src={atcLogo} alt="ATC Logo" className="h-7 w-auto object-contain brightness-200" />
          </div>
          <div>
            <span className="text-white font-bold font-poppins text-sm sm:text-base block leading-none">
              Analytical Technical Consulting
            </span>
            <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
              Enterprise Cloud Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-medium backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>US-Central Cluster Online</span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold backdrop-blur-md transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </Link>
        </div>
      </header>

      {/* =========================================================================
          MAIN INTERACTIVE SLIDING DUAL-PANEL PORTAL
          ========================================================================= */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-6">
        <div className="w-full max-w-[1160px] bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.85)] border border-white/20 dark:border-slate-800 overflow-hidden relative min-h-[670px] flex flex-col lg:block">

          {/* MOBILE / TABLET MODE SWITCHER BAR (Visible below lg) */}
          <div className="lg:hidden p-4 bg-slate-900 border-b border-slate-800">
            <div className="relative p-1 bg-slate-800 rounded-2xl flex items-center">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md transition-all duration-300 ${
                  mode === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  mode === 'login' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`relative z-10 flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  mode === 'signup' ? 'text-white' : 'text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* =====================================================================
              FORMS LAYER: LEFT = SIGN IN (50%), RIGHT = SIGN UP (50%)
              ===================================================================== */}
          <div className="w-full lg:min-h-[670px] grid grid-cols-1 lg:grid-cols-2">

            {/* -----------------------------------------------------------------
                LEFT SLOT: SIGN IN FORM
                ----------------------------------------------------------------- */}
            <div
              className={`w-full flex flex-col justify-center px-6 sm:px-12 xl:px-14 py-8 sm:py-10 bg-white dark:bg-slate-900 transition-all duration-500 ${
                mode === 'login'
                  ? 'opacity-100 translate-x-0 z-10 block'
                  : 'lg:opacity-0 lg:-translate-x-8 lg:pointer-events-none hidden lg:flex'
              }`}
            >
              <div className="max-w-md w-full mx-auto space-y-5">
                {/* Interactive Pill Switcher inside Desktop Form */}
                <div className="hidden lg:flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-200/60 dark:border-blue-800/60">
                    <ShieldCheck className="w-3.5 h-3.5" /> Console Authentication
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer group"
                  >
                    New user? Create Account
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-poppins tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Sign in to manage your virtual private servers and cloud network.
                  </p>
                </div>

                {/* SSO Federated Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all font-semibold text-xs text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { window.location.href = `${API_BASE_URL}/auth/github`; }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all font-semibold text-xs text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4 fill-slate-900 dark:fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                      Or sign in with email
                    </span>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <ModernFloatingInput
                    id="login-email"
                    name="username"
                    label="Email Address"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    placeholder="name@company.com"
                    autoComplete="username"
                  />

                  <div className="space-y-1.5">
                    <ModernFloatingInput
                      id="current-password"
                      name="password"
                      label="Password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">AES-256 Encrypted Session</span>
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
                    disabled={loginLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In to Cloud Console <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Bottom Dynamic Switch Prompt */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Don't have an ATC Cloud account?</span>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Create Account →
                  </button>
                </div>
              </div>
            </div>

            {/* -----------------------------------------------------------------
                RIGHT SLOT: CREATE ACCOUNT FORM
                ----------------------------------------------------------------- */}
            <div
              className={`w-full flex flex-col justify-center px-6 sm:px-12 xl:px-14 py-8 sm:py-10 bg-white dark:bg-slate-900 transition-all duration-500 ${
                mode === 'signup'
                  ? 'opacity-100 translate-x-0 z-10 block'
                  : 'lg:opacity-0 lg:translate-x-8 lg:pointer-events-none hidden lg:flex'
              }`}
            >
              <div className="max-w-md w-full mx-auto">
                {verificationSent ? (
                  /* VERIFICATION EMAIL SENT SCREEN */
                  <div className="text-center py-6 space-y-5">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                      <Mail className="w-8 h-8 animate-bounce" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-poppins">
                        Check your inbox
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        We sent an activation link to{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{signupEmail}</span>.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl text-xs text-blue-900 dark:text-blue-300 text-left space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-blue-600 shrink-0" /> 30-Day Free Trial Unlocked
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                        Once verified, you can immediately deploy your <strong>2 vCPU / 2 GB RAM / 50 GB NVMe</strong> instance.
                      </p>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationSent(false);
                          switchMode('login');
                        }}
                        className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Continue to Sign In <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="text-xs text-slate-500">
                        Didn't receive the email?{' '}
                        <button
                          type="button"
                          onClick={handleResendEmail}
                          disabled={resendCooldown > 0}
                          className={`font-semibold ${
                            resendCooldown > 0
                              ? 'text-slate-400 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-700 underline cursor-pointer'
                          }`}
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SIGN UP FORM */
                  <div className="space-y-4">
                    <div className="hidden lg:flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold uppercase tracking-wider border border-cyan-200/60 dark:border-cyan-800/60">
                        <Sparkles className="w-3.5 h-3.5" /> 30-Day Free Compute
                      </span>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer group"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Already registered? Sign In
                      </button>
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-poppins tracking-tight">
                        Create your cloud account
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Deploy enterprise NVMe servers in seconds with zero setup fees.
                      </p>
                    </div>

                    {/* Federated SSO */}
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`${API_BASE_URL}/auth/google`}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs text-slate-700 dark:text-slate-200 shadow-2xs"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Google</span>
                      </a>

                      <a
                        href={`${API_BASE_URL}/auth/github`}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs text-slate-700 dark:text-slate-200 shadow-2xs"
                      >
                        <svg className="w-4 h-4 fill-slate-900 dark:fill-white shrink-0" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>GitHub</span>
                      </a>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                        <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                          Or register with work email
                        </span>
                      </div>
                    </div>

                    {signupError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    <form className="space-y-3.5" onSubmit={handleSignupSubmit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ModernFloatingInput
                          id="signup-fullname"
                          name="name"
                          label="Full Legal Name"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          icon={<User className="h-4 w-4" />}
                          placeholder="Jane Doe"
                          autoComplete="name"
                        />

                        <ModernCountrySelect
                          label="Country"
                          countries={countriesList}
                          selectedCode={selectedCountryCode}
                          onSelect={(country) => setSelectedCountryCode(country.code)}
                          loading={loadingGeo}
                        />
                      </div>

                      <ModernFloatingInput
                        id="signup-email"
                        name="username"
                        label="Work Email Address"
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        icon={<Mail className="h-4 w-4" />}
                        placeholder="name@company.com"
                        autoComplete="username"
                      />

                      {/* Single Password input with show/hide toggle and autofill new-password */}
                      <div className="space-y-1.5">
                        <ModernFloatingInput
                          id="new-password"
                          name="new-password"
                          label="Create Password"
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          icon={<Lock className="h-4 w-4" />}
                          placeholder="8+ chars, uppercase, number, symbol"
                          autoComplete="new-password"
                          rightElement={
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                            >
                              {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          }
                        />

                        {signupPassword.length > 0 && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex gap-1 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <div
                                  key={lvl}
                                  className={`flex-1 transition-all duration-300 ${
                                    strengthScore >= lvl
                                      ? strengthScore <= 2
                                        ? 'bg-rose-500'
                                        : strengthScore <= 3
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                      : 'bg-transparent'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-slate-500">
                              <span className={hasMinLength ? 'text-emerald-600 font-semibold' : ''}>✓ 8+ Chars</span>
                              <span className={hasUpperCase ? 'text-emerald-600 font-semibold' : ''}>✓ Uppercase</span>
                              <span className={hasLowerCase ? 'text-emerald-600 font-semibold' : ''}>✓ Lowercase</span>
                              <span className={hasNumber ? 'text-emerald-600 font-semibold' : ''}>✓ Number</span>
                              <span className={hasSpecialChar ? 'text-emerald-600 font-semibold' : ''}>✓ Symbol</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5 pt-1">
                        <input
                          id="agree-terms"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="agree-terms" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          I agree to the Analytical Technical Consulting{' '}
                          <Link to="/terms" className="text-blue-600 font-semibold hover:underline">
                            Terms of Service
                          </Link>
                          ,{' '}
                          <Link to="/privacy" className="text-blue-600 font-semibold hover:underline">
                            Privacy Policy
                          </Link>
                          , and{' '}
                          <Link to="/refund-policy" className="text-blue-600 font-semibold hover:underline">
                            Refund Policy
                          </Link>
                          .
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={signupLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {signupLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Creating Cloud Account...
                          </>
                        ) : (
                          <>
                            Create Account &amp; Claim Trial <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Bottom Dynamic Switch Prompt */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>Already have an ATC account?</span>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        ← Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* =====================================================================
              SLIDING VISUAL SHOWCASE OVERLAY PANEL (GLIDES LEFT <-> RIGHT ON DESKTOP)
              When mode === 'login': sits on RIGHT half (translate-x-full)
              When mode === 'signup': glides to LEFT half (translate-x-0)
              ===================================================================== */}
          <div
            className={`hidden lg:flex lg:w-1/2 absolute top-0 bottom-0 left-0 z-30 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              mode === 'login' ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="relative w-full h-full overflow-hidden bg-slate-950 text-white p-10 xl:p-12 flex flex-col justify-between select-none">
              
              {/* VIVID HIGH-RESOLUTION INTERNET PHOTOGRAPHY CAROUSEL */}
              {SHOWCASE_SLIDES.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out ${
                    activeSlide === idx ? 'opacity-80 scale-105' : 'opacity-0 scale-100 pointer-events-none'
                  }`}
                  style={{ backgroundImage: `url('${slide.image}')` }}
                />
              ))}

              {/* Multi-Stop Gradient Vignette (Preserves image clarity in center while keeping text crisp) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040711] via-[#060c1e]/45 to-[#040711]/80" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-transparent to-cyan-950/30" />

              {/* TOP ROW: LIVE TELEMETRY PILL & CAROUSEL DOTS */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/65 border border-white/20 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  {currentSlide.badge}
                </span>

                {/* Interactive Slide Selector Dots */}
                <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
                  {SHOWCASE_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Show slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeSlide === idx ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* CENTER HERO CAPTION & HARDWARE TELEMETRY */}
              <div className="relative z-10 my-auto space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl xl:text-4xl font-extrabold font-poppins leading-tight tracking-tight text-white drop-shadow-md">
                    {currentSlide.title}
                  </h2>
                  <p className="text-sm text-slate-200 leading-relaxed max-w-md drop-shadow">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Glassmorphic Live Metric Strip */}
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/15 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold">
                      <Server className="w-3.5 h-3.5" /> Compute
                    </div>
                    <p className="text-sm font-extrabold text-white mt-1 font-poppins">AMD EPYC™</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/15 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold">
                      <HardDrive className="w-3.5 h-3.5" /> Storage
                    </div>
                    <p className="text-sm font-extrabold text-white mt-1 font-poppins">Gen4 NVMe</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/15 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                      <Shield className="w-3.5 h-3.5" /> Defense
                    </div>
                    <p className="text-sm font-extrabold text-white mt-1 font-poppins">L3/L4 DDoS</p>
                  </div>
                </div>
              </div>

              {/* BOTTOM INTERACTIVE SWITCH CARD (Triggers the Physical Sliding Panel!) */}
              <div className="relative z-10 p-5 rounded-2xl bg-slate-950/75 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4">
                {mode === 'login' ? (
                  <>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
                        New to Analytical Technical Consulting?
                      </span>
                      <p className="text-sm font-bold text-white">
                        Launch your 30-day free VPS trial today.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-[1.03] cursor-pointer"
                    >
                      Create Account <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                        Already have an ATC Cloud account?
                      </span>
                      <p className="text-sm font-bold text-white">
                        Sign in to your live hypervisor console.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="shrink-0 px-5 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-[1.03] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Sign In
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* =========================================================================
          BOTTOM MINIMAL FOOTER
          ========================================================================= */}
      <footer className="relative z-20 w-full max-w-[1220px] mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Analytical Technical Consulting Inc. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
        </div>
      </footer>

    </div>
  );
}
