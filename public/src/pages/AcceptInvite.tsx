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
  KeyRound,
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [joinedOrg, setJoinedOrg] = useState<{ orgId: number; name: string; role: string } | null>(null);

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
            // Seamlessly redirect to Dashboard after 1.5 seconds
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
              You are now an active team member with the role of{' '}
              <strong className="text-slate-800 dark:text-slate-200 capitalize">
                {ROLE_LABELS[joinedOrg.role]?.label || joinedOrg.role}
              </strong>
              . You now have collaborative access to the organization's cloud servers.
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

  // Invitation Preview Card (for logged-out users)
  const effectiveEmail = invite?.invitedEmail || emailParam;
  const roleInfo = ROLE_LABELS[invite?.role || 'devops'] || {
    label: invite?.role || 'Member',
    desc: 'Access to organization cloud resources.',
  };

  const returnToUrl = `/invite?token=${token}${effectiveEmail ? `&email=${encodeURIComponent(effectiveEmail)}` : ''}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        {/* Org Monogram Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              Workspace Invitation
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              Join {invite?.organization.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{invite?.organization.ownerName}</strong> has invited you to collaborate on ATC Cloud.
            </p>
          </div>
        </div>

        {/* Role & Email Scope Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
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

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">
              Invited as: <strong>{effectiveEmail}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {invite?.userExists ? (
            <>
              <Link
                to={`/login?email=${encodeURIComponent(effectiveEmail)}&returnTo=${encodeURIComponent(returnToUrl)}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Accept & Join</span>
              </Link>
              <p className="text-[11px] text-center text-slate-500">
                An account with this email already exists.{' '}
                <Link
                  to={`/signup?email=${encodeURIComponent(effectiveEmail)}&returnTo=${encodeURIComponent(returnToUrl)}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Create different account
                </Link>
              </p>
            </>
          ) : (
            <>
              <Link
                to={`/signup?email=${encodeURIComponent(effectiveEmail)}&invite=${token}&returnTo=${encodeURIComponent(returnToUrl)}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account & Join Workspace</span>
              </Link>
              <p className="text-[11px] text-center text-slate-500">
                Already registered with this email?{' '}
                <Link
                  to={`/login?email=${encodeURIComponent(effectiveEmail)}&returnTo=${encodeURIComponent(returnToUrl)}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign In instead
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
