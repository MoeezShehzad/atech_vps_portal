import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  KeyRound,
  Trash2,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Eye,
  X,
  Loader2,
  Info,
  Lock,
} from 'lucide-react';
import { apiCall } from '../services/api';

export interface CompanyMember {
  memberId: number;
  userId: number | null;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'devops' | 'viewer';
  status: 'active' | 'invited' | 'revoked';
  invitedAt: string;
  joinedAt: string | null;
  isOwner: boolean;
}

export interface CompanyProfile {
  orgId: number;
  name: string;
  companySize: string;
  billingEmail: string;
  taxId: string | null;
  createdAt: string;
  owner: {
    userId: number;
    fullName: string;
    email: string;
    companyName: string | null;
    avatar_url: string | null;
  };
  totalMembers: number;
  pendingInvites: number;
  currentUserRole: string;
  isOwner: boolean;
}

const ROLE_DEFINITIONS = [
  {
    id: 'owner',
    label: 'Owner',
    scope: 'Governance & Billing',
    icon: KeyRound,
    description: 'Complete administrative oversight, billing management, workspace governance, and full server lifecycle control.',
  },
  {
    id: 'admin',
    label: 'Admin',
    scope: 'Full Management',
    icon: Shield,
    description: 'Full instance provisioning, server operations (reboot, rebuild, resize), firewall security, and team member management.',
  },
  {
    id: 'devops',
    label: 'DevOps / Engineer',
    scope: 'Operations',
    icon: Terminal,
    description: 'Operational control: start, stop, restart, snapshot creation, and interactive web console / SSH & RDP access.',
  },
  {
    id: 'viewer',
    label: 'Viewer / Auditor',
    scope: 'Read Only (CIA)',
    icon: Eye,
    description: 'Read-only monitoring of cloud servers, performance metrics, and audit logs. All operational and destructive actions are restricted.',
  },
];

export default function TeamManagement() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'devops' | 'viewer'>('devops');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Remove confirmation
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Load profile and members
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, membersRes] = await Promise.all([
        apiCall('/company/profile'),
        apiCall('/company/members'),
      ]);

      if (profileRes?.organization) {
        setProfile(profileRes.organization);
      }
      if (membersRes?.members) {
        setMembers(membersRes.members);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load organization team details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Send Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteError('Please enter a valid business email address.');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await apiCall('/company/members/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      setActionSuccess(res?.message || 'Team invitation dispatched successfully.');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('devops');
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setInviteError(err.message);
      } else {
        setInviteError('Failed to invite member.');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (memberId: number, newRole: string) => {
    try {
      await apiCall(`/company/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setActionSuccess('Member access role updated successfully.');
      setMembers((prev) =>
        prev.map((m) => (m.memberId === memberId ? { ...m, role: newRole as any } : m))
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  // Handle Remove Member
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setRemoveLoading(true);
    try {
      await apiCall(`/company/members/${memberToRemove.memberId}`, {
        method: 'DELETE',
      });
      setActionSuccess(`Revoked organization access for ${memberToRemove.fullName}.`);
      setMemberToRemove(null);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setRemoveLoading(false);
    }
  };

  const isOwnerOrAdmin = profile?.isOwner || profile?.currentUserRole === 'admin';

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        <p className="text-xs font-medium text-slate-500 tracking-wide">Loading workspace members...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Organization Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-semibold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {profile?.name || 'Company Organization'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Enterprise Workspace
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Account Owner: <strong className="text-slate-700 dark:text-slate-200 font-medium">{profile?.owner.fullName}</strong></span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Team Size: {profile?.companySize || '10-49'} members</span>
                {profile?.billingEmail && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>Billing: {profile.billingEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Enterprise Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Members</span>
            <p className="text-xl font-semibold text-slate-900 dark:text-white mt-0.5">
              {profile?.totalMembers || 1}
            </p>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pending Invites</span>
            <p className="text-xl font-semibold text-slate-900 dark:text-white mt-0.5">
              {profile?.pendingInvites || 0}
            </p>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Access Control</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              RBAC Enforced
            </p>
          </div>
          <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Your Permissions</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-2 flex items-center gap-1.5 capitalize">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              {profile?.isOwner ? 'Owner' : profile?.currentUserRole}
            </p>
          </div>
        </div>
      </div>

      {/* Team Members Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Workspace Members</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-6">Member</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Joined Date</th>
                {isOwnerOrAdmin && <th className="py-3 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {members.map((m) => {
                const roleDef = ROLE_DEFINITIONS.find((r) => r.id === m.role);
                const isOwner = m.isOwner || m.role === 'owner';

                return (
                  <tr key={m.memberId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Member Profile */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300 shrink-0 text-xs">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {m.fullName}
                            </span>
                            {isOwner && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Primary Contact
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            {m.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Role */}
                    <td className="py-3.5 px-6">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          Owner
                        </span>
                      ) : isOwnerOrAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.memberId, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="devops">DevOps / Engineer</option>
                          <option value="viewer">Viewer / Auditor</option>
                        </select>
                      ) : (
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {roleDef?.label || m.role}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      {m.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Pending Invite
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(m.joinedAt || m.invitedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    {isOwnerOrAdmin && (
                      <td className="py-3.5 px-6 text-right">
                        {!isOwner ? (
                          <button
                            type="button"
                            onClick={() => setMemberToRemove(m)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 text-xs select-none">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Role Architecture (RBAC) */}
      <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Role & Access Architecture (RBAC)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise role-based permissions enforce least-privilege security across servers, web terminals, and billing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLE_DEFINITIONS.map((def) => {
            const Icon = def.icon;
            return (
              <div
                key={def.id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{def.label}</span>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {def.scope}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {def.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          INVITE TEAM MEMBER MODAL
          ========================================================================= */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Invite Team Member</h3>
                  <p className="text-xs text-slate-500">Dispatch an invitation to join this organization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Business Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Permission Role
                </label>
                <div className="space-y-2">
                  {ROLE_DEFINITIONS.filter((r) => r.id !== 'owner').map((r) => {
                    const Icon = r.icon;
                    const isSelected = inviteRole === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setInviteRole(r.id as any)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-900 dark:border-blue-500'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="invite-role"
                          checked={isSelected}
                          onChange={() => setInviteRole(r.id as any)}
                          className="mt-0.5 text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">{r.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              {r.scope}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{r.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          REMOVE MEMBER CONFIRMATION MODAL
          ========================================================================= */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Revoke Member Access?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to revoke access for <strong className="text-slate-700 dark:text-slate-300">{memberToRemove.fullName}</strong> ({memberToRemove.email})? They will immediately lose access to all company servers and web consoles.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removeLoading}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {removeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
