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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src={atcLogo} alt="ATC Logo" className="h-10 w-auto object-contain" />
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-blue-950 font-poppins">
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
  );
}