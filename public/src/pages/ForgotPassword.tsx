import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Mail, Lock, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle,
  Loader2, Eye, EyeOff, RefreshCw, KeyRound
} from 'lucide-react';
import atcLogo from '../assets/ATC_Logo.png';
import OtpInput from '../components/OtpInput';
import { ModernFloatingInput } from '../components/ModernFormControls';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Step state: 'email' | 'otp' | 'token'
  const [step, setStep] = useState<'email' | 'otp' | 'token'>(token ? 'token' : 'email');

  // Inputs
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionToken, setOtpSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // 1. Submit Email to request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset code.');
      }
      if (data.sessionToken) {
        setOtpSessionToken(data.sessionToken);
      }
      setStep('otp');
      setResendCooldown(60);
      setSuccessMessage(data.message || 'A 6-digit verification code has been dispatched to your email.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code.');
      }
      if (data.sessionToken) {
        setOtpSessionToken(data.sessionToken);
      }
      setResendCooldown(60);
      setSuccessMessage('A fresh 6-digit code has been sent to your email.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to resend verification code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit OTP + New Password
  const handleOtpResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      setErrorMessage(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (otpSessionToken) {
        headers['X-OTP-Session'] = otpSessionToken;
      }
      const res = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpCode.trim(),
          newPassword,
          sessionToken: otpSessionToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setResetSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to reset password. Please verify your code and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Token-based fallback reset
  const handleTokenResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      setErrorMessage(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setResetSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to reset password. The link may have expired.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* LEFT: SECURITY SHOWCASE PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold font-poppins text-lg">Analytical Technical Consulting (ATC)</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8 my-auto py-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Account Protection
            </span>
            <h1 className="mt-5 text-4xl xl:text-5xl font-extrabold font-poppins leading-tight">
              Secure Credential<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Recovery System.</span>
            </h1>
            <p className="mt-4 text-slate-300 max-w-md text-sm leading-relaxed">
              We employ cryptographically generated 6-digit one-time security codes and rate-limited dispatch to protect your cloud instances against unauthorized takeover.
            </p>
          </div>

          <div className="space-y-3.5 max-w-md">
            {[
              { title: 'Cryptographic OTP Security', desc: 'Secure 6-digit codes with 5-minute expiry, strict attempt caps, and single-use consumption.' },
              { title: 'Instant Dedicated SMTP', desc: 'Delivered directly through our dedicated mail cluster at mail.atechconsult.com with SSL encryption.' },
              { title: 'Bcrypt Hash Architecture', desc: 'Raw passwords are never stored or transmitted in plain text across our infrastructure.' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-poppins">{item.title}</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Analytical Technical Consulting (ATC). All rights reserved.</p>
      </div>

      {/* RIGHT: RESET FORM */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-3 lg:hidden mb-4">
            <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-poppins">
            {step === 'token' ? 'Set New Password' : step === 'otp' ? 'Enter One-Time Security Code' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {step === 'token'
              ? 'Enter your new credentials below to update your account.'
              : step === 'otp'
              ? `Enter the 6-digit one-time security code sent to ${email} and choose your new password.`
              : 'Enter your account email address to receive a 6-digit one-time security code.'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200 dark:border-slate-800 rounded-2xl sm:px-10">

            {/* SUCCESS SCREEN */}
            {resetSuccess ? (
              <div className="text-center space-y-4 py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-2 shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-poppins">Password Updated!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your account password has been successfully reset. You can now access your cloud console.
                </p>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25"
                  >
                    Sign In with New Password
                  </Link>
                </div>
              </div>
            ) : step === 'token' ? (
              /* TOKEN-BASED RESET FORM */
              <form className="space-y-4" onSubmit={handleTokenResetSubmit}>
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <ModernFloatingInput
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••••••"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <ModernFloatingInput
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••••••"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            ) : step === 'otp' ? (
              /* OTP + NEW PASSWORD FORM */
              <form className="space-y-5" onSubmit={handleOtpResetSubmit}>
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      6-Digit One-Time Security Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setOtpCode('');
                        setErrorMessage('');
                      }}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Edit Email
                    </button>
                  </div>
                  <OtpInput
                    length={6}
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val);
                      setErrorMessage('');
                    }}
                    disabled={isSubmitting}
                    autoFocus={true}
                    hasError={Boolean(errorMessage && otpCode.length < 6)}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Valid for 5 minutes</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isSubmitting}
                      className={`font-semibold flex items-center gap-1 ${
                        resendCooldown > 0 || isSubmitting
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <ModernFloatingInput
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    placeholder="••••••••••••"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <ModernFloatingInput
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    placeholder="••••••••••••"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6 || !newPassword || !confirmPassword}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" /> Update Account Password
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            ) : (
              /* INITIAL EMAIL REQUEST FORM */
              <form className="space-y-4" onSubmit={handleRequestOtp}>
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <ModernFloatingInput
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="name@company.com"
                  autoComplete="email"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Security Code...
                    </>
                  ) : (
                    'Send One-Time Security Code'
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Enterprise 256-Bit Cryptographic Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}