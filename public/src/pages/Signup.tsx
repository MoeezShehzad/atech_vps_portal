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
  ArrowLeft,
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Server,
  Calendar,
  LockKeyhole
} from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();

  // Wizard Step: 1 = Account, Country & Password, 2 = 30-Day Free Trial & Card Verification
  const [step, setStep] = useState<1 | 2>(1);

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

  // Credit Card Details for 30-Day Free Trial Verification
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');

  // Terms & Submission States
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch live countries directly from MS SQL Server table [UM].[UM_Countries] on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveCountries() {
      try {
        setLoadingGeo(true);
        const res = await apiCall('/geo/countries');
        if (res && res.countries && res.countries.length > 0 && isMounted) {
          setCountriesList(res.countries);
          // Set default to US or first country in list
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

  // Current Country Object
  const currentCountry = useMemo(() => {
    return countriesList.find((c) => c.code === selectedCountryCode) || countriesList[0] || {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      dialCode: '+1',
    };
  }, [countriesList, selectedCountryCode]);

  // Handle Card Number Formatting (Groups of 4) & Brand Detection
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 19);
    // Detect brand
    if (raw.startsWith('4')) setCardBrand('Visa');
    else if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) setCardBrand('Mastercard');
    else if (/^3[47]/.test(raw)) setCardBrand('American Express');
    else if (/^6(?:011|5)/.test(raw)) setCardBrand('Discover');
    else setCardBrand('Credit Card');

    // Format with spaces
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  // Handle Expiration Date Formatting (MM/YY)
  const handleCardExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Handle CVC Formatting
  const handleCardCvcChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

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

  // Validate Step 1 and proceed to Step 2
  const handleProceedToPayment = (e: React.FormEvent) => {
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

    // Auto-fill cardholder name with fullName if empty
    if (!cardholderName.trim()) {
      setCardholderName(fullName.trim());
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Registration Submission with Card Verification & 30-Day Free Trial
  const handleFinalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      setErrorMsg('Please enter a valid 13-19 digit credit or debit card number.');
      return;
    }

    if (!cardExpiry || cardExpiry.length < 5) {
      setErrorMsg('Please enter a valid card expiration date (MM/YY).');
      return;
    }

    if (!cardCvc || cardCvc.length < 3) {
      setErrorMsg('Please enter a valid 3 or 4 digit security CVC/CVV.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('You must agree to the Terms of Service and Free Trial Policy.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        country: currentCountry.name,
        cardData: {
          cardNumber: cleanCard,
          cardExpiry,
          cardCvc,
          cardholderName: cardholderName.trim() || fullName.trim(),
          cardBrand,
        },
      };

      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Save tokens and session if returned
      const token = data.accessToken || data.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setSuccessMsg(
        data.message || 
        '🎉 30-Day Free Trial Activated! You will now be redirected to your Cloud Dashboard...'
      );

      // Redirect after brief celebration
      setTimeout(() => {
        navigate('/dashboard');
      }, 1600);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      {/* BRAND HEADER */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
        </Link>
        <h2 className="mt-4 text-3xl font-extrabold text-blue-950 font-poppins tracking-tight">
          Create Your Account & Start 30-Day Free Trial
        </h2>
        
        <p className="mt-2 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>

        {/* STEPPER PROGRESS */}
        <div className="mt-6 flex items-center justify-center gap-3 max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-emerald-600 text-white'
            }`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-blue-900' : 'text-slate-600'}`}>
              Account & Country
            </span>
          </div>

          <div className="w-12 h-0.5 bg-slate-300" />

          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </span>
            <span className={`text-xs font-semibold ${step === 2 ? 'text-blue-900' : 'text-slate-500'}`}>
              30-Day Free Trial
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-blue-950/5 border border-slate-200 rounded-3xl sm:px-10">
          
          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Welcome aboard!</p>
                <p className="text-emerald-700 leading-relaxed">{successMsg}</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: ACCOUNT & COUNTRY (FETCHED LIVE FROM MS SQL SERVER)              */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div>
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

              <form className="space-y-4" onSubmit={handleProceedToPayment}>
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
                      className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
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
                      className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
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

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  Continue to 30-Day Free Trial <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: 30-DAY FREE TRIAL & SECURE CARD ON FILE VERIFICATION              */}
          {/* ========================================================================= */}
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleFinalSignup}>
              {/* BACK BUTTON */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Account Details
              </button>

              {/* 30-DAY FREE TRIAL HERO CARD */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      30-Day Free Trial Package
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">$0.00</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-300" />
                    VPS Basic Cloud Instance
                  </h3>
                  <p className="text-xs text-blue-200">
                    Included with your trial: <strong>2 vCPU Cores</strong>, <strong>2 GB RAM</strong>, and <strong>50 GB NVMe Storage</strong>.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-800/80 flex flex-wrap items-center justify-between text-[11px] text-blue-300 gap-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    Trial ends in 30 days
                  </span>
                  <span>Cancel anytime in 1-click • Zero charge today</span>
                </div>
              </div>

              {/* NOTICE ABOUT EMAIL COUNTDOWN & RENEWAL */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  We keep track of your 30-day countdown. <strong>7 days before your trial ends</strong>, we will email you to rate our service and notify you. If you cancel prior to the end date, your card will never be charged.
                </p>
              </div>

              {/* MODERN FLOATING CARD INPUTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800">
                    Credit / Debit Card Details
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <LockKeyhole className="w-3.5 h-3.5 text-emerald-600" />
                    <span>AES-256-GCM Encrypted</span>
                  </div>
                </div>

                {/* CARDHOLDER NAME */}
                <ModernFloatingInput
                  label="Cardholder Name"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                />

                {/* CARD NUMBER */}
                <ModernFloatingInput
                  label="Card Number"
                  required
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  icon={<CreditCard className="h-4 w-4" />}
                  rightElement={
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      {cardBrand}
                    </span>
                  }
                />

                {/* EXPIRY & CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <ModernFloatingInput
                    label="Expiration Date (MM/YY)"
                    required
                    value={cardExpiry}
                    onChange={(e) => handleCardExpiryChange(e.target.value)}
                    className="font-mono text-center"
                  />

                  <ModernFloatingInput
                    label="Security CVC / CVV"
                    type="password"
                    maxLength={4}
                    required
                    value={cardCvc}
                    onChange={(e) => handleCardCvcChange(e.target.value)}
                    className="font-mono text-center"
                  />
                </div>
              </div>

              {/* TERMS CHECKBOX */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  id="trial-terms"
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="trial-terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  I understand that I am receiving a <strong>30-day free trial ($0.00 today)</strong>. After 30 days, the standard monthly rate ($4.99) will be charged to the card above unless cancelled in the portal. I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Trial Policy</a>.
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    'Activating Free Trial...'
                  ) : (
                    <>
                      Start 30-Day Free Trial ($0.00) <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MILITARY GRADE ENCRYPTION BADGE */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Military-Grade AES-256-GCM Encrypted Storage • Zero Plain Text Retention</span>
          </div>
        </div>
      </div>
    </div>
  );
}