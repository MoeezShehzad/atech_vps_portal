import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  ArrowRight,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';

interface InviteDetails {
  memberId: number;
  invitedEmail: string;
  role: string;
  status: string;
  organization: {
    orgId: number;
    name: string;
    companySize: string;
    ownerName: string;
  };
  userExists: boolean;
}

const ROLE_LABELS: Record<string, { label: string; desc: string }> = {
  admin: {
    label: 'Administrator',
    desc: 'Full instance provisioning, server operations (reboot, rebuild), firewall configuration, and team management.',
  },
  devops: {
    label: 'DevOps / Engineer',
    desc: 'Operational management: reboot, start/stop, interactive web console & terminal, and snapshot creation.',
  },
  viewer: {
    label: 'Viewer / Auditor',
    desc: 'Read-only monitoring of cloud servers, performance telemetry, and security audit logs.',
  },
  owner: {
    label: 'Owner',
    desc: 'Complete organizational oversight, billing governance, and root-level cloud infrastructure management.',
  },
};

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, login } = useAuth();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [joinedOrg, setJoinedOrg] = useState<{ orgId: number; name: string; role: string } | null>(null);

  // Activation form fields (for new users)
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login form fields (for existing users not logged in yet)
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // 1. If authenticated, attempt to accept the invite immediately
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function handleInviteFlow() {
      // If user is authenticated, accept directly
      if (isAuthenticated && user) {
        setAccepting(true);
        try {
          const res = await apiCall('/company/invite/accept', {
            method: 'POST',
            body: JSON.stringify({ token }),
          });

          if (!isMounted) return;

          if (res?.success) {
            setSuccess(res.message || 'You have successfully joined the organization workspace!');
            setJoinedOrg(res.organization);
            if (res.organization?.orgId) {
              localStorage.setItem('atech_active_workspace_org_id', String(res.organization.orgId));
            }
            setTimeout(() => {
              navigate('/dashboard');
            }, 1800);
          } else {
            setError(res?.error || 'Failed to accept invitation.');
          }
        } catch (err: unknown) {
          if (!isMounted) return;
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Failed to accept invitation.');
          }
        } finally {
          if (isMounted) {
            setAccepting(false);
            setLoading(false);
          }
        }
        return;
      }

      // If not authenticated, fetch invitation preview details
      if (token) {
        try {
          const res = await apiCall(`/company/invite/${token}`);
          if (!isMounted) return;

          if (res?.valid && res?.invite) {
            setInvite(res.invite);
          } else {
            setError(res?.error || 'This invitation link is invalid or has expired.');
          }
        } catch (err: unknown) {
          if (!isMounted) return;
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Failed to retrieve invitation details.');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        setError('No invitation token was provided.');
        setLoading(false);
      }
    }

    handleInviteFlow();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated, user, authLoading, navigate]);

  // Handle Account Activation (For unauthenticated new users)
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter your full legal name.');
      return;
    }

    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiCall('/company/invite/activate', {
        method: 'POST',
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          password,
        }),
      });

      if (res?.success && res?.accessToken && res?.user) {
        // Log in user immediately
        login(res.accessToken, res.user);

        // Store active organization workspace
        if (res.organization?.orgId) {
          localStorage.setItem('atech_active_workspace_org_id', String(res.organization.orgId));
        }

        setJoinedOrg(res.organization);
        setSuccess(res.message || 'Account activated successfully!');

        setTimeout(() => {
          navigate('/dashboard');
        }, 1800);
      } else {
        setFormError(res?.error || 'Failed to activate account. Please try again.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Network or server error during account activation.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Inline Sign In & Accept (For existing users)
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const targetEmail = invite?.invitedEmail || emailParam;
    if (!loginPassword) {
      setLoginError('Please enter your account password.');
      return;
    }

    setLoggingIn(true);
    try {
      const loginRes = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail,
          password: loginPassword,
        }),
      });

      if (!loginRes?.accessToken || !loginRes?.user) {
        setLoginError(loginRes?.error || 'Invalid email or password.');
        setLoggingIn(false);
        return;
      }

      // Log in to AuthContext
      login(loginRes.accessToken, loginRes.user);

      // Now accept the invitation
      const acceptRes = await apiCall('/company/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (acceptRes?.success) {
        if (acceptRes.organization?.orgId) {
          localStorage.setItem('atech_active_workspace_org_id', String(acceptRes.organization.orgId));
        }
        setJoinedOrg(acceptRes.organization);
        setSuccess(acceptRes.message || 'Successfully joined organization!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Fallback: navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError('Failed to sign in. Please verify your password.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  if (authLoading || loading || accepting) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {accepting ? 'Connecting to organization workspace...' : 'Verifying workspace invitation...'}
        </p>
      </div>
    );
  }

  // Success State
  if (success && joinedOrg) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome to {joinedOrg.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your account is active and connected as an authorized{' '}
              <strong className="text-slate-800 dark:text-slate-200 capitalize">
                {ROLE_LABELS[joinedOrg.role]?.label || joinedOrg.role}
              </strong>
              . You can now collaborate and manage cloud servers under this organization.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Go to Workspace Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Unable to Accept Invitation
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Sign In with Another Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveEmail = invite?.invitedEmail || emailParam;
  const roleInfo = ROLE_LABELS[invite?.role || 'devops'] || {
    label: invite?.role || 'Member',
    desc: 'Access to organization cloud resources.',
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Org Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              Workspace Invitation
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">
              Join {invite?.organization.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{invite?.organization.ownerName}</strong> has invited you to collaborate on ATC Cloud.
            </p>
          </div>
        </div>

        {/* Role & Email Scope Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Assigned Role: {roleInfo.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {roleInfo.desc}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium">{effectiveEmail}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
              <UserCheck className="w-3 h-3" />
              Verified Email
            </span>
          </div>
        </div>

        {/* Dynamic Branch: Activate New Account OR Log In to Existing */}
        {!invite?.userExists ? (
          // ================= NEW USER ACCOUNT ACTIVATION =================
          <form onSubmit={handleActivateAccount} className="space-y-4 pt-1">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Create Your Permanent Account
              </h2>
              <p className="text-[11px] text-slate-500">
                Choose your password to activate your account. You will use this to sign in anytime.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Full Legal Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Moeez Shahzad"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Address (Locked) */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Address (Locked by Invitation)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={effectiveEmail}
                  className="w-full text-xs px-3 py-2 pl-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Choose Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full text-xs px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Activate Account & Join Organization</span>
                </>
              )}
            </button>
          </form>
        ) : (
          // ================= EXISTING USER LOGIN =================
          <form onSubmit={handleInlineLogin} className="space-y-4 pt-1">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Account Recognized
              </h2>
              <p className="text-[11px] text-slate-500">
                You already have an ATC Cloud account. Enter your password to sign in and link this organization workspace.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={effectiveEmail}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to={`/forgot-password?email=${encodeURIComponent(effectiveEmail)}`}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-xs px-3 py-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In & Linking...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Join Workspace</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
