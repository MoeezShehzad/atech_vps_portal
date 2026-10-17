import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X,
  AlertCircle, CheckCircle2, ShieldCheck, Loader2, Sparkles,
  Server, Cpu, HardDrive, Globe, Activity, Terminal, Zap, Shield, RefreshCw
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

export default function Auth({ initialMode }: AuthProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Determine active mode from prop or URL pathname
  const routeMode = location.pathname.includes('signup') ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode || routeMode);

  // Sync mode if route changes
  useEffect(() => {
    if (location.pathname.includes('signup')) {
      setMode('signup');
    } else if (location.pathname.includes('login')) {
      setMode('login');
    }
  }, [location.pathname]);

  // Retrieve route user was attempting to visit
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Geo Countries list from MS SQL table
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');
  const [loadingGeo, setLoadingGeo] = useState<boolean>(true);

  // Live Simulated Latency Pings for the showcase panel
  const [latencies, setLatencies] = useState({
    chicago: 1,
    newyork: 14,
    dallas: 19,
    frankfurt: 82,
  });

  // Ticking jitter for authentic datacenter feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencies({
        chicago: Math.max(1, Math.floor(1 + Math.random() * 2)),
        newyork: Math.max(12, Math.floor(13 + Math.random() * 3)),
        dallas: Math.max(18, Math.floor(19 + Math.random() * 3)),
        frankfurt: Math.max(79, Math.floor(81 + Math.random() * 4)),
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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

  // Current Country selection
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
  const passwordsMatch = signupPassword.length > 0 && signupPassword === confirmPassword;
  const strengthScore = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  // -------------------------------------------------------------
  // Mode Switcher (Seamless transition, updates URL history)
  // -------------------------------------------------------------
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
      setSignupError('Please create a stronger password meeting the security criteria.');
      return;
    }
    if (!passwordsMatch) {
      setSignupError('Passwords do not match.');
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

  return (
    <div className="min-h-screen flex font-sans bg-slate-50 dark:bg-slate-950">
      
      {/* =========================================================================
          LEFT: ULTRA-PREMIUM DYNAMIC SHOWCASE PANEL WITH DATACENTER IMAGERY
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 text-white p-12 flex-col justify-between select-none">
        
        {/* Real High-Resolution Enterprise Datacenter Imagery with Dark Ambient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        
        {/* Layered Cyber-Gradients & Radial Glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/90 to-slate-950/95 backdrop-blur-[2px]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:36px_36px]" />
        
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-cyan-500/25 rounded-full blur-3xl animate-pulse" />

        {/* TOP BRAND HEADER */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img 
              src={atcLogo} 
              alt="ATC Logo" 
              className="h-10 w-auto object-contain brightness-200 transition-transform group-hover:scale-105" 
            />
            <div className="text-left">
              <span className="font-bold font-poppins text-lg block leading-tight">Analytical Technical Consulting</span>
              <span className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase">Cloud Hypervisor Platform</span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Core Cluster Active
          </span>
        </div>

        {/* MIDDLE DYNAMIC SHOWCASE (Changes smoothly based on active mode) */}
        <div className="relative z-10 my-auto py-8 space-y-7">
          
          {mode === 'login' ? (
            /* LOGIN SHOWCASE */
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Enterprise Hyper-V Infrastructure
              </div>

              <div>
                <h1 className="text-4xl xl:text-5xl font-extrabold font-poppins leading-tight tracking-tight">
                  Welcome back to your<br />
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                    high-performance cloud.
                  </span>
                </h1>
                <p className="mt-3.5 text-slate-300 max-w-md text-sm leading-relaxed">
                  Manage dedicated virtual machines, monitor live telemetry, execute instant snapshots, and control networking from one unified engineering console.
                </p>
              </div>

              {/* Interactive Terminal Mockup */}
              <div className="rounded-2xl bg-slate-950/85 border border-slate-700/70 shadow-2xl backdrop-blur-md max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-3 text-[11px] text-slate-400 font-mono">cluster-node-01 • hyperv</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">100% NVMe Health</span>
                </div>
                <div className="p-4 font-mono text-xs space-y-1.5 text-slate-200">
                  <p><span className="text-emerald-400">$</span> atc-cluster status --verbose</p>
                  <p className="text-slate-400">→ Hypervisor: Windows Server 2025 Gen2</p>
                  <p className="text-slate-400">→ NVMe Array: 0.12ms random write latency</p>
                  <p className="text-emerald-400">✓ Security Perimeter: Cisco &amp; Sophos active</p>
                  <p><span className="text-emerald-400">$</span> <span className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse align-middle" /></p>
                </div>
              </div>

              {/* Infrastructure SLA Metrics */}
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-xs">
                  <p className="text-2xl font-bold font-poppins text-white">99.9%</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Uptime SLA</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-xs">
                  <p className="text-2xl font-bold font-poppins text-cyan-300">&lt;10s</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Provision Time</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-xs">
                  <p className="text-2xl font-bold font-poppins text-emerald-400">24/7</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Data Center Ops</p>
                </div>
              </div>
            </div>
          ) : (
            /* SIGNUP SHOWCASE */
            <div className="space-y-6 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> 30-Day Risk-Free Compute Included
              </div>

              <div>
                <h1 className="text-4xl xl:text-5xl font-extrabold font-poppins leading-tight tracking-tight">
                  Deploy production VPS<br />
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-300 bg-clip-text text-transparent">
                    with zero hassle.
                  </span>
                </h1>
                <p className="mt-3.5 text-slate-300 max-w-md text-sm leading-relaxed">
                  Join hundreds of engineers, development agencies, and businesses hosting their mission-critical workloads on our low-latency infrastructure.
                </p>
              </div>

              {/* Value Advantages List */}
              <div className="space-y-3 max-w-md">
                {[
                  { icon: <Zap className="w-4 h-4 text-cyan-400" />, title: 'Free 30-Day Starter Machine', desc: 'Deploy 2 vCPU, 2 GB RAM, and 50 GB NVMe with zero credit commitment.' },
                  { icon: <HardDrive className="w-4 h-4 text-blue-400" />, title: 'Pure Enterprise NVMe Arrays', desc: 'Dedicated high-IOPS storage guaranteeing blistering database speed.' },
                  { icon: <Shield className="w-4 h-4 text-emerald-400" />, title: 'Hardware Firewall Defense', desc: 'Multi-layer perimeter filtering deflecting volumetric DDoS attacks.' },
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-white/10 shrink-0 mt-0.5">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-poppins">{feat.title}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Latency Ping Barometer */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 max-w-md">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Chicago Data Hub Latency
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Sync</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">Local</p>
                    <p className="text-xs font-bold text-emerald-400">{latencies.chicago}ms</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">New York</p>
                    <p className="text-xs font-bold text-cyan-300">{latencies.newyork}ms</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">Dallas</p>
                    <p className="text-xs font-bold text-cyan-300">{latencies.dallas}ms</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400">Frankfurt</p>
                    <p className="text-xs font-bold text-blue-300">{latencies.frankfurt}ms</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM FOOTER */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80">
          <p>© {new Date().getFullYear()} Analytical Technical Consulting Inc.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
        </div>

      </div>

      {/* =========================================================================
          RIGHT: DYNAMIC INTERACTIVE FORM CONTAINER (SIGN IN <-> SIGN UP SLIDER)
          ========================================================================= */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-12 xl:px-16 overflow-y-auto">
        
        {/* MOBILE BRAND LOGO (Hidden on desktop) */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center lg:hidden mb-6">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          
          {/* TOP SLIDING SEGMENTED SWITCHER (Sign In <-> Create Account) */}
          <div className="p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl flex items-center mb-6 shadow-inner border border-slate-300/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-950 dark:text-white shadow-md shadow-slate-950/5 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-blue-950 dark:text-white shadow-md shadow-slate-950/5 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* MAIN CARD */}
          <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl shadow-blue-950/5 border border-slate-200 dark:border-slate-800 rounded-3xl transition-all duration-300">
            
            {/* -------------------------------------------------------------
                MODE A: SIGN IN FORM
                ------------------------------------------------------------- */}
            {mode === 'login' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-left mb-6">
                  <h2 className="text-2xl font-extrabold text-blue-950 dark:text-white font-poppins">
                    Sign in to console
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your authorized credentials to access your cloud cluster.
                  </p>
                </div>

                {/* SOCIAL SSO BUTTONS */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
                    className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-xs sm:text-sm text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-slate-900 dark:fill-white" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    Sign in with GitHub
                  </button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">Or with email</span>
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
                    label="Email Address"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    placeholder="name@company.com"
                    autoComplete="email"
                  />

                  <div className="space-y-1.5">
                    <ModernFloatingInput
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
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500">
                  New to ATC Cloud?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Create an account here
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                MODE B: SIGN UP FORM
                ------------------------------------------------------------- */}
            {mode === 'signup' && (
              verificationSent ? (
                /* VERIFICATION SENT SCREEN */
                <div className="text-center py-4 space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-200 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                    <Mail className="w-8 h-8 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-poppins">
                      Verify your email
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                      We sent a verification link to <span className="font-bold text-slate-900 dark:text-white">{signupEmail}</span>. Click the link in that email to confirm your account.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl text-xs text-blue-900 dark:text-blue-300 text-left space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" /> Free Trial Ready
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                      Once verified and signed in, you can deploy your <strong>30-Day Starter Machine (2 vCPU, 2 GB RAM, 50 GB NVMe)</strong> immediately.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => { setVerificationSent(false); switchMode('login'); }}
                      className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Proceed to Sign In <ArrowRight className="w-4 h-4" />
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
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Click here to resend'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* REGISTRATION INPUTS */
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-left mb-4">
                    <h2 className="text-2xl font-extrabold text-blue-950 dark:text-white font-poppins">
                      Create cloud account
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Start your 30-day trial with instant Hyper-V access.
                    </p>
                  </div>

                  {/* GOOGLE SSO */}
                  <a
                    href={`${API_BASE_URL}/auth/google`}
                    className="w-full py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign up with Google
                  </a>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">Or with email</span>
                    </div>
                  </div>

                  {signupError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{signupError}</span>
                    </div>
                  )}

                  <form className="space-y-3.5" onSubmit={handleSignupSubmit}>
                    <ModernFloatingInput
                      label="Full Legal Name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      icon={<User className="h-4 w-4" />}
                      placeholder="Jane Doe"
                    />

                    {/* DYNAMIC MS SQL COUNTRY SELECTOR */}
                    <ModernCountrySelect
                      label="Country of Residence"
                      countries={countriesList}
                      selectedCode={selectedCountryCode}
                      onSelect={(country) => setSelectedCountryCode(country.code)}
                      loading={loadingGeo}
                    />

                    <ModernFloatingInput
                      label="Work Email Address"
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      icon={<Mail className="h-4 w-4" />}
                      placeholder="name@company.com"
                    />

                    {/* PASSWORD WITH REAL-TIME STRENGTH METER */}
                    <div className="space-y-1.5">
                      <ModernFloatingInput
                        label="Password"
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        icon={<Lock className="h-4 w-4" />}
                        placeholder="••••••••••••"
                        rightElement={
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                          >
                            {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />

                      {/* Password strength bar */}
                      {signupPassword.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex gap-1 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <div
                                key={lvl}
                                className={`h-full flex-1 transition-all ${
                                  strengthScore >= lvl
                                    ? strengthScore <= 2
                                      ? 'bg-rose-500'
                                      : strengthScore <= 4
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                    : 'bg-transparent'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500 text-right">
                            {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Moderate' : 'Strong'}
                          </p>
                        </div>
                      )}
                    </div>

                    <ModernFloatingInput
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      placeholder="••••••••••••"
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />

                    {/* TERMS AGREEMENT CHECKBOX */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          I agree to the{' '}
                          <Link to="/terms" target="_blank" className="font-semibold text-blue-600 hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" target="_blank" className="font-semibold text-blue-600 hover:underline">
                            Privacy Policy
                          </Link>.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {signupLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Account...
                        </>
                      ) : (
                        <>
                          Create Account <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-1 text-center text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign in to your account
                    </button>
                  </div>
                </div>
              )
            )}

            {/* SECURITY BADGE */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Enterprise AES-256 Cloud Infrastructure • GDPR &amp; CCPA Protected</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
