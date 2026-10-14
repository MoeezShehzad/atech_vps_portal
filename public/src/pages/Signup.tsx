import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall, API_BASE_URL } from '../services/api';
import atcLogo from '../assets/ATC_Logo.png';
import {
  ModernFloatingInput,
  ModernCountrySelect,
  type CountryOption,
} from '../components/ModernFormControls';

import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();

  // Live Geo API States (Querying MS SQL Server [UM].[UM_Countries])
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');
  const [loadingGeo, setLoadingGeo] = useState<boolean>(true);

  // User Credentials & Country
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Password & Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Terms & Submission States
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 1. Fetch live countries directly from MS SQL Server table [UM].[UM_Countries] on mount
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
        console.warn('[Live Geo Error] Failed to load countries from database:', err);
      } finally {
        if (isMounted) setLoadingGeo(false);
      }
    }
    loadLiveCountries();
    return () => { isMounted = false; };
  }, []);

  // Cooldown timer for resend verification
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Current Country Object
  const currentCountry = useMemo(() => {
    return countriesList.find((c) => c.code.toLowerCase() === selectedCountryCode.toLowerCase()) || countriesList[0] || {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      dialCode: '+1',
    };
  }, [countriesList, selectedCountryCode]);

  // Strict 5-point password validation criteria
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Calculate password strength score (0 to 5)
  const strengthScore = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  const isPasswordValid = strengthScore === 5;

  // Handle Signup Submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Please ensure your password meets all 5 security requirements (8+ characters, uppercase, lowercase, number, symbol).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        country: currentCountry.name,
      };

      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // If user is already verified or auto-verified
      if (data.user?.emailVerified) {
        const token = data.accessToken || data.token;
        if (token) localStorage.setItem('token', token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
        return;
      }

      // Display clean verification sent state
      setVerificationSent(true);
      setResendCooldown(60);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Server error during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    try {
      await apiCall('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setResendCooldown(60);
    } catch (e: unknown) {
      console.warn('Resend error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      {/* BRAND HEADER */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
        </Link>
        <h2 className="mt-4 text-3xl font-extrabold text-blue-950 font-poppins tracking-tight">
          Create your account
        </h2>
        
        <p className="mt-2 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-blue-950/5 border border-slate-200 rounded-3xl sm:px-10">
          
          {/* VERIFICATION SENT SCREEN */}
          {verificationSent ? (
            <div className="text-center py-4 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-200 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                <Mail className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 font-poppins">
                  Verify your email
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  We sent a verification link to <span className="font-bold text-slate-900">{email}</span>. Click the link in that email to confirm your account.
                </p>
              </div>

              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 text-left space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" /> Next Step: Claim Your Free Trial
                </p>
                <p className="text-blue-700 leading-relaxed">
                  Once verified and logged into your dashboard, you can claim your <strong>30-Day Free VPS (2 vCPU, 2 GB RAM, 50 GB NVMe)</strong> immediately.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </Link>

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
            <div>
              {/* ERROR ALERT */}
              {errorMsg && (
                <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* GOOGLE SIGN UP OPTION */}
              <a
                href={`${API_BASE_URL}/auth/google`}
                className="w-full py-3 px-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-medium text-slate-700 text-sm flex items-center justify-center gap-3 shadow-xs mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign up with Google
              </a>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">Or complete registration form</span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSignup}>
                {/* FULL LEGAL NAME */}
                <ModernFloatingInput
                  label="Full Legal Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                />

                {/* EMAIL ADDRESS */}
                <ModernFloatingInput
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                />

                {/* COUNTRY (SEARCHABLE COMBOBOX WITH RECTANGULAR FLAGS LIVE FROM MS SQL SERVER) */}
                <ModernCountrySelect
                  label="Country"
                  countries={countriesList}
                  selectedCode={selectedCountryCode}
                  onSelect={(c) => setSelectedCountryCode(c.code)}
                  loading={loadingGeo}
                />

                {/* PASSWORD */}
                <ModernFloatingInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {/* CONFIRM PASSWORD */}
                <ModernFloatingInput
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {/* PASSWORD STRENGTH METRICS (5-POINT CRITERIA) */}
                {password.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Password Strength</span>
                      <span className={
                        strengthScore === 5 ? 'text-emerald-600 font-bold' : strengthScore >= 3 ? 'text-amber-600' : 'text-rose-500'
                      }>
                        {strengthScore === 5 ? 'Strong (Ready)' : strengthScore >= 3 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                    
                    {/* 5-segment Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 transition-all ${strengthScore >= 1 ? (strengthScore <= 2 ? 'bg-rose-500' : strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 transition-all ${strengthScore >= 2 ? (strengthScore <= 2 ? 'bg-rose-500' : strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 transition-all ${strengthScore >= 3 ? (strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 transition-all ${strengthScore >= 4 ? (strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 transition-all ${strengthScore === 5 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </div>

                    {/* 5-point Checklist */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[10px]">
                      <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {hasMinLength ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-rose-400 shrink-0" />}
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {hasUpperCase ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-rose-400 shrink-0" />}
                        <span>1+ Capital (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {hasLowerCase ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-rose-400 shrink-0" />}
                        <span>1+ Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {hasNumber ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-rose-400 shrink-0" />}
                        <span>1+ Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {hasSpecialChar ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <X className="w-3 h-3 text-rose-400 shrink-0" />}
                        <span>1+ Symbol (!@#$)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TERMS CHECKBOX */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-snug">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-600 hover:underline font-medium">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* SECURITY BADGE */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Enterprise AES-256 Cloud Infrastructure • GDPR Compliant</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}