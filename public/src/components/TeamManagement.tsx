import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
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
  Settings,
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
  logoUrl?: string | null;
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

  // Remove confirmation modal state
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeOwnerPassword, setRemoveOwnerPassword] = useState('');
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Company Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompanySize, setEditCompanySize] = useState('10-49');
  const [editBillingEmail, setEditBillingEmail] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Role Elevation Confirmation Modal State (for non-owners)
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ memberId: number; newRole: string } | null>(null);
  const [roleChangeOwnerPassword, setRoleChangeOwnerPassword] = useState('');
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

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

  // Open Edit Settings Modal
  const openSettingsModal = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditCompanySize(profile.companySize || '10-49');
    setEditBillingEmail(profile.billingEmail || '');
    setEditTaxId(profile.taxId || '');
    setEditLogoUrl(profile.logoUrl || null);
    setOwnerPassword('');
    setSettingsError(null);
    setShowSettingsModal(true);
  };

  // Handle Company Profile Save
  
  const handleLogoUploadModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSettingsError('Logo file size cannot exceed 10MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      setSettingsError(null);
      const formData = new FormData();
      formData.append('logo', file);

      const res = await apiCall('/company/logo', {
        method: 'POST',
        body: formData,
      });

      if (res?.success && res.logoUrl) {
        setEditLogoUrl(res.logoUrl);
        if (profile) {
          setProfile({ ...profile, logoUrl: res.logoUrl });
        }
      } else {
        setSettingsError(res?.error || 'Failed to upload logo.');
      }
    } catch (err: any) {
      setSettingsError(err?.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogoModal = async () => {
    try {
      setUploadingLogo(true);
      setSettingsError(null);
      const res = await apiCall('/company/logo', { method: 'DELETE' });
      if (res?.success) {
        setEditLogoUrl(null);
        if (profile) {
          setProfile({ ...profile, logoUrl: null });
        }
      }
    } catch (err: any) {
      setSettingsError(err?.message || 'Failed to remove logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    if (!editName.trim()) {
      setSettingsError('Company / Organization name is required.');
      return;
    }

    if (!profile?.isOwner && !ownerPassword) {
      setSettingsError("Owner authorization required. Please enter the Account Owner's password to commit changes.");
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await apiCall('/company/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          companySize: editCompanySize,
          billingEmail: editBillingEmail.trim(),
          taxId: editTaxId.trim(),
          ownerPassword: profile?.isOwner ? undefined : ownerPassword,
        }),
      });

      if (res?.success) {
        setActionSuccess('Company profile settings updated successfully.');
        setShowSettingsModal(false);
        await loadData();
      } else {
        setSettingsError(res?.error || 'Failed to update company settings.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSettingsError(err.message);
      } else {
        setSettingsError('Failed to update company settings.');
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle Role Change Request
  const handleRoleChange = async (memberId: number, newRole: string) => {
    // If not owner, require owner password via modal
    if (!profile?.isOwner) {
      setRoleChangeTarget({ memberId, newRole });
      setRoleChangeOwnerPassword('');
      setRoleChangeError(null);
      return;
    }

    // Direct change if caller is the Owner
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

  // Submit Elevated Role Change with Owner Password
  const handleSubmitElevatedRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeTarget) return;

    if (!roleChangeOwnerPassword) {
      setRoleChangeError("Please enter the Account Owner's password to authorize this role modification.");
      return;
    }

    setRoleChangeLoading(true);
    setRoleChangeError(null);
    try {
      const res = await apiCall(`/company/members/${roleChangeTarget.memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: roleChangeTarget.newRole,
          ownerPassword: roleChangeOwnerPassword,
        }),
      });

      if (res?.success) {
        setActionSuccess('Member access role updated with owner elevation.');
        setMembers((prev) =>
          prev.map((m) =>
            m.memberId === roleChangeTarget.memberId ? { ...m, role: roleChangeTarget.newRole as any } : m
          )
        );
        setRoleChangeTarget(null);
      } else {
        setRoleChangeError(res?.error || 'Role change failed.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRoleChangeError(err.message);
      } else {
        setRoleChangeError('Failed to authorize role change.');
      }
    } finally {
      setRoleChangeLoading(false);
    }
  };

  // Open Remove Member Modal
  const openRemoveModal = (member: CompanyMember) => {
    setMemberToRemove(member);
    setRemoveOwnerPassword('');
    setRemoveError(null);
  };

  // Handle Remove Member
  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToRemove) return;

    if (!profile?.isOwner && !removeOwnerPassword) {
      setRemoveError("Owner authorization required. Please enter the Account Owner's password.");
      return;
    }

    setRemoveLoading(true);
    setRemoveError(null);
    try {
      const res = await apiCall(`/company/members/${memberToRemove.memberId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          ownerPassword: profile?.isOwner ? undefined : removeOwnerPassword,
        }),
      });

      if (res?.success) {
        setActionSuccess(`Revoked organization access for ${memberToRemove.fullName}.`);
        setMemberToRemove(null);
        await loadData();
      } else {
        setRemoveError(res?.error || 'Failed to remove team member.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRemoveError(err.message);
      } else {
        setRemoveError('Failed to remove team member.');
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
                    <span>Billing Contact: {profile.billingEmail}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={openSettingsModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Company Settings</span>
              </button>
            )}

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

        {/* Enterprise Metrics */}
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
              RBAC Protected
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
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Organization Team Members
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Member</th>
                <th className="py-3 px-6">Assigned Role</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Joined / Invited</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {members.map((m) => {
                const isMemberOwner = m.isOwner || m.role === 'owner';
                const roleDef = ROLE_DEFINITIONS.find((r) => r.id === m.role) || ROLE_DEFINITIONS[2];

                return (
                  <tr key={m.memberId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Member Profile */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200 shrink-0 text-xs">
                          {m.fullName ? m.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {m.fullName}
                            </span>
                            {isMemberOwner && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Owner
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {m.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Assignment */}
                    <td className="py-3.5 px-6">
                      {isMemberOwner ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          Full Organization Owner
                        </span>
                      ) : isOwnerOrAdmin ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.memberId, e.target.value)}
                          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="admin">Admin (Full Access)</option>
                          <option value="devops">DevOps / Engineer</option>
                          <option value="viewer">Viewer / Auditor</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                          {roleDef.label}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      {m.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          Pending Invite
                        </span>
                      )}
                    </td>

                    {/* Joined / Invited Date */}
                    <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                      {m.joinedAt
                        ? new Date(m.joinedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : `Invited ${new Date(m.invitedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      {!isMemberOwner && isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => openRemoveModal(m)}
                          title={m.status === 'invited' ? 'Cancel Invitation' : 'Revoke Member Access'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Reference Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            Role Permissions Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLE_DEFINITIONS.filter((r) => r.id !== 'owner').map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{r.label}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {r.scope}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{r.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          COMPANY SETTINGS MODAL (With Owner Authorization Prompt for Non-Owners)
          ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Company Profile Settings</h3>
                  <p className="text-xs text-slate-500">Manage organization details and contact info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settingsError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

                        <form onSubmit={handleSaveCompanySettings} className="space-y-4">
              {/* Company Logo Upload Control */}
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {uploadingLogo ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : editLogoUrl ? (
                    <img src={editLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold px-2.5 py-1 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-all inline-block shadow-2xs">
                      {editLogoUrl ? 'Change Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={handleLogoUploadModal}
                      />
                    </label>
                    {editLogoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogoModal}
                        disabled={uploadingLogo}
                        className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Stored on webserver. PNG, JPG, WEBP, or SVG up to 10MB.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Analytical Technical Consulting Ltd"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Size
                </label>
                <select
                  value={editCompanySize}
                  onChange={(e) => setEditCompanySize(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="1-9">1 - 9 employees (Startup)</option>
                  <option value="10-49">10 - 49 employees (Midsize)</option>
                  <option value="50-249">50 - 249 employees (Growth)</option>
                  <option value="250+">250+ employees (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Billing & Notification Email
                </label>
                <input
                  type="email"
                  value={editBillingEmail}
                  onChange={(e) => setEditBillingEmail(e.target.value)}
                  placeholder="billing@company.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tax Identification / VAT Number (Optional)
                </label>
                <input
                  type="text"
                  value={editTaxId}
                  onChange={(e) => setEditTaxId(e.target.value)}
                  placeholder="e.g. GB123456789"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Owner Authorization Elevation Prompt for Non-Owners */}
              {!profile?.isOwner && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">Owner Authorization Required</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
                        You are modifying organization-level details. This action requires authorization from the Account Owner (<strong>{profile?.owner.fullName}</strong> &bull; {profile?.owner.email}).
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">
                      Account Owner Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Enter owner password to commit changes"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE CHANGE ELEVATION MODAL (For Non-Owner Admins)
          ========================================================================= */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Owner Authorization Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Modifying team member access roles requires elevation from the Account Owner (<strong>{profile?.owner.fullName}</strong>).
              </p>
            </div>

            {roleChangeError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{roleChangeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitElevatedRoleChange} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Owner Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={roleChangeOwnerPassword}
                  onChange={(e) => setRoleChangeOwnerPassword(e.target.value)}
                  placeholder="Enter owner password"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleChangeTarget(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleChangeLoading}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {roleChangeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INVITE MODAL
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
          REMOVE MEMBER CONFIRMATION MODAL (With Owner Password check for Non-Owners)
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

            {removeError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{removeError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRemove} className="space-y-3 pt-1">
              {!profile?.isOwner && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-left space-y-1.5">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                      Owner authorization required to revoke access.
                    </p>
                  </div>
                  <input
                    type="password"
                    required
                    value={removeOwnerPassword}
                    onChange={(e) => setRemoveOwnerPassword(e.target.value)}
                    placeholder="Account Owner's password"
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={removeLoading}
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {removeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Revoke Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
