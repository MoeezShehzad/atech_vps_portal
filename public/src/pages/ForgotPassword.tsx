import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import atcLogo from '../assets/ATC_Logo.png';
import { ModernFloatingInput } from '../components/ModernFormControls';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Request Reset Link state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Reset Password (with token) state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // 1. Submit email to request password reset link
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setRequestError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setRequestError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit new password using the received token
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setResetError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* LEFT: SECURITY SHOWCASE PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold font-poppins text-lg">Analytical Technical Consulting</span>
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
              We employ cryptographic verification tokens and hardware rate-limiting to protect your cloud infrastructure against unauthorized access.
            </p>
          </div>

          <div className="space-y-3.5 max-w-md">
            {[
              { title: 'Time-Limited Tokenization', desc: 'Password reset links expire automatically within 1 hour for security.' },
              { title: 'Instant SMTP Dispatch', desc: 'Delivered instantly through our dedicated mail cluster at mail.atechconsult.com.' },
              { title: 'Bcrypt Hash Architecture', desc: 'Raw passwords are never stored or transmitted in plain text on our servers.' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
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

        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Analytical Technical Consulting Inc. All rights reserved.</p>
      </div>

      {/* RIGHT: RESET FORM */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-3 lg:hidden mb-4">
            <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
          </Link>
          <h2 className="text-3xl font-extrabold text-blue-950 font-poppins">
            {token ? 'Set New Password' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {token
              ? 'Enter your new password below to update your account credentials.'
              : 'Enter your email address to receive password reset instructions.'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl shadow-blue-950/5 border border-slate-200 rounded-2xl sm:px-10">

          {/* TOKEN MODE: SET NEW PASSWORD */}
          {token ? (
            resetSuccess ? (
              <div className="text-center space-y-4 py-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Password Updated!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your account password has been successfully reset. You can now log in with your new credentials.
                </p>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                  >
                    Proceed to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleResetSubmit}>
                {resetError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <ModernFloatingInput
                  label="New Password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••••••"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <ModernFloatingInput
                  label="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••••••"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
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
                    className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )
          ) : (
            /* EMAIL REQUEST MODE */
            submitted ? (
              <div className="text-center space-y-4 py-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Reset Link Sent</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We've sent password reset instructions to <span className="font-semibold text-slate-700">{email}</span> if an account exists.
                </p>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-500"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleRequestSubmit}>
                {requestError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{requestError}</span>
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
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )
          )}

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