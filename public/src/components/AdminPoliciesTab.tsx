// ==============================================================================
// Component: AdminPoliciesTab.tsx
// Purpose: Enterprise Legal & Policy Management Suite
// Features: Multi-target versioning, immutable archival, direct editing,
//           and manual email notifications with effective date/time.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  Scale,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  X,
  History,
  Megaphone,
  Check,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';

export interface PolicyVersion {
  id: number;
  policyType: string;
  title: string;
  version: string;
  content: string;
  summaryOfChanges?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isCurrent: boolean;
  effectiveAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  lastNotifiedAt?: string | null;
  notifiedCount: number;
  createdById?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    userId: number;
    fullName: string;
    email: string;
  } | null;
}

const POLICY_TARGETS = [
  {
    type: 'terms-of-service',
    label: 'Terms of Service',
    description: 'Cloud infrastructure terms, SLA, acceptable use, and 90-day preservation.',
    icon: Scale,
    publicUrl: '/terms-of-service',
  },
  {
    type: 'privacy-policy',
    label: 'Privacy Policy',
    description: 'GDPR, CCPA/CPRA, data sovereignty, and cryptographic erasure notice.',
    icon: ShieldCheck,
    publicUrl: '/privacy-policy',
  },
  {
    type: 'refund-policy',
    label: 'Refund & Cancellation',
    description: 'Infrastructure compute final sales, dispute protocol, and anti-chargeback.',
    icon: DollarSign,
    publicUrl: '/refund-policy',
  },
];

export default function AdminPoliciesTab() {
  const { toast } = useToast();

  const [selectedTarget, setSelectedTarget] = useState<string>('terms-of-service');
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyVersion | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewingPolicy, setPreviewingPolicy] = useState<PolicyVersion | null>(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastingPolicy, setBroadcastingPolicy] = useState<PolicyVersion | null>(null);

  // Form states for Editor Modal
  const [formTitle, setFormTitle] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formEffectiveAt, setFormEffectiveAt] = useState('');
  const [formSummaryOfChanges, setFormSummaryOfChanges] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMakeCurrent, setFormMakeCurrent] = useState(false);
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);

  // Broadcast modal state
  const [customBroadcastNote, setCustomBroadcastNote] = useState('');
  const [broadcastInApp, setBroadcastInApp] = useState(true);
  const [broadcastEmail, setBroadcastEmail] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/policies/admin/all');
      if (res && res.success) {
        setPolicies(res.policies || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load policy versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Filter policies for current target
  const currentTargetPolicies = policies.filter(
    (p) => p.policyType === selectedTarget
  );

  const activePolicy = currentTargetPolicies.find((p) => p.isCurrent);
  const archivedAndDraftPolicies = currentTargetPolicies.filter(
    (p) => !p.isCurrent
  );

  // Handle open Editor for New Version
  const handleOpenNewVersion = () => {
    setEditingPolicy(null);
    const targetMeta = POLICY_TARGETS.find((t) => t.type === selectedTarget);
    setFormTitle(activePolicy?.title || targetMeta?.label || 'Policy');

    // Auto-suggest next version number
    let nextVer = 'v1.0';
    if (activePolicy?.version) {
      const match = activePolicy.version.match(/v?(\d+)(\.(\d+))?/i);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = match[3] ? parseInt(match[3], 10) : 0;
        nextVer = `v${major}.${minor + 1}`;
      } else {
        nextVer = `${activePolicy.version}.1`;
      }
    }

    setFormVersion(nextVer);
    // Pre-fill effective date as current ISO local string
    const now = new Date();
    setFormEffectiveAt(now.toISOString().slice(0, 16));
    setFormSummaryOfChanges('');
    setFormContent(activePolicy?.content || '');
    setFormMakeCurrent(false);
    setFormStatus('DRAFT');
    setEditorTab('write');
    setEditorModalOpen(true);
  };

  // Handle open Editor for Existing Policy
  const handleOpenEdit = (policy: PolicyVersion) => {
    setEditingPolicy(policy);
    setFormTitle(policy.title);
    setFormVersion(policy.version);
    const eff = new Date(policy.effectiveAt);
    setFormEffectiveAt(eff.toISOString().slice(0, 16));
    setFormSummaryOfChanges(policy.summaryOfChanges || '');
    setFormContent(policy.content);
    setFormMakeCurrent(policy.isCurrent);
    setFormStatus(policy.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
    setEditorTab('write');
    setEditorModalOpen(true);
  };

  // Save policy version
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formVersion.trim() || !formContent.trim()) {
      toast.error('Title, version, and content are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingPolicy) {
        // Update existing
        const res = await apiCall(`/policies/admin/${editingPolicy.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle,
            version: formVersion,
            effectiveAt: formEffectiveAt ? new Date(formEffectiveAt).toISOString() : new Date().toISOString(),
            summaryOfChanges: formSummaryOfChanges,
            content: formContent,
            status: editingPolicy.isCurrent ? 'PUBLISHED' : formStatus,
          }),
        });

        if (res && res.success) {
          toast.success(`Policy ${formVersion} updated successfully!`);
          setEditorModalOpen(false);
          await fetchPolicies();
        }
      } else {
        // Create new version
        const res = await apiCall('/policies/admin', {
          method: 'POST',
          body: JSON.stringify({
            policyType: selectedTarget,
            title: formTitle,
            version: formVersion,
            effectiveAt: formEffectiveAt ? new Date(formEffectiveAt).toISOString() : new Date().toISOString(),
            summaryOfChanges: formSummaryOfChanges,
            content: formContent,
            status: formStatus,
            makeCurrent: formMakeCurrent,
          }),
        });

        if (res && res.success) {
          toast.success(`Policy ${formVersion} created successfully!`);
          setEditorModalOpen(false);
          await fetchPolicies();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  // Publish / Make active
  const handlePublishActive = async (policy: PolicyVersion) => {
    if (!window.confirm(`Are you sure you want to make ${policy.version} the LIVE active ${policy.title}? The previous version will be moved to archives.`)) {
      return;
    }

    try {
      const res = await apiCall(`/policies/admin/${policy.id}/publish`, {
        method: 'POST',
      });
      if (res && res.success) {
        toast.success(`Version ${policy.version} is now LIVE!`);
        await fetchPolicies();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate policy');
    }
  };

  // Delete draft / archive
  const handleDeletePolicy = async (policy: PolicyVersion) => {
    if (policy.isCurrent) {
      toast.error('Cannot delete the currently live policy. Set another version as active first.');
      return;
    }

    if (!window.confirm(`Permanently delete policy version ${policy.version}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await apiCall(`/policies/admin/${policy.id}`, {
        method: 'DELETE',
      });
      if (res && res.success) {
        toast.success(`Version ${policy.version} deleted.`);
        await fetchPolicies();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete policy');
    }
  };

  // Open Broadcast Modal
  const handleOpenBroadcast = (policy: PolicyVersion) => {
    setBroadcastingPolicy(policy);
    setCustomBroadcastNote('');
    setBroadcastInApp(true);
    setBroadcastEmail(true);
    setBroadcastModalOpen(true);
  };

  // Dispatch Broadcast Email
  const handleSendBroadcast = async () => {
    if (!broadcastingPolicy) return;

    try {
      setBroadcasting(true);
      const res = await apiCall(`/policies/admin/${broadcastingPolicy.id}/broadcast`, {
        method: 'POST',
        body: JSON.stringify({
          customMessage: customBroadcastNote.trim() || undefined,
          channels: {
            inApp: broadcastInApp,
            email: broadcastEmail,
          },
        }),
      });

      if (res && res.success) {
        toast.success(res.message || 'Policy notification broadcast queued successfully!');
        setBroadcastModalOpen(false);
        await fetchPolicies();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch email broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const selectedMeta = POLICY_TARGETS.find((t) => t.type === selectedTarget);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins">
                Legal Policies &amp; Compliance Suite
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable versioning, historical archives, and controlled manual email broadcasts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchPolicies}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenNewVersion}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Version
          </button>
        </div>
      </div>

      {/* Target Selector Tabs */}
      <div className="grid sm:grid-cols-3 gap-4">
        {POLICY_TARGETS.map((target) => {
          const Icon = target.icon;
          const isSelected = selectedTarget === target.type;
          const count = policies.filter((p) => p.policyType === target.type).length;
          const activeVer = policies.find(
            (p) => p.policyType === target.type && p.isCurrent
          );

          return (
            <div
              key={target.type}
              onClick={() => setSelectedTarget(target.type)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {target.label}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {count} total version{count === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {activeVer && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    Live: {activeVer.version}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {target.description}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <a
                  href={target.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  View Public Page <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Live & Active Policy Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Current Live Policy
                </span>
                {activePolicy && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                    {activePolicy.version}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-poppins">
                {activePolicy ? activePolicy.title : `No Active ${selectedMeta?.label} Set`}
              </h3>
            </div>
          </div>

          {activePolicy && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPreviewingPolicy(activePolicy);
                  setPreviewModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Full Text
              </button>

              <button
                type="button"
                onClick={() => handleOpenEdit(activePolicy)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Direct Edit
              </button>

              {/* Manual Email Broadcast Button */}
              <button
                type="button"
                onClick={() => handleOpenBroadcast(activePolicy)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                📢 Send Email to Users
              </button>
            </div>
          )}
        </div>

        {activePolicy ? (
          <div className="grid md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-1">
                Effective Date &amp; Time
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {new Date(activePolicy.effectiveAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-1">
                Last Published
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activePolicy.publishedAt
                  ? new Date(activePolicy.publishedAt).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                    })
                  : 'N/A'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-1">
                Email Broadcast Status
              </span>
              {activePolicy.notifiedCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sent ({activePolicy.notifiedCount}x)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Not sent yet (Manual send available)
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-1">
                Change Summary
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                {activePolicy.summaryOfChanges || 'Initial published version.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No version is currently marked active for {selectedMeta?.label}.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a version below to publish as live, or create a new version draft.
            </p>
          </div>
        )}
      </div>

      {/* Historical Versions & Archives Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Version History &amp; Immutable Archives
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail of all published revisions, drafts, and historical copies.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
            {currentTargetPolicies.length} Total Record{currentTargetPolicies.length === 1 ? '' : 's'}
          </span>
        </div>

        {currentTargetPolicies.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No version history found for {selectedMeta?.label}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-y border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Title &amp; Summary</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Broadcast</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentTargetPolicies.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      p.isCurrent ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {p.version}
                        {p.isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-sans font-bold">
                            LIVE
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {p.title}
                      </p>
                      {p.summaryOfChanges && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {p.summaryOfChanges}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {new Date(p.effectiveAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.isCurrent ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          Active Current
                        </span>
                      ) : p.status === 'ARCHIVED' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Archived Copy
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.notifiedCount > 0 ? (
                        <span
                          title={
                            p.lastNotifiedAt
                              ? `Last notified: ${new Date(p.lastNotifiedAt).toLocaleString()}`
                              : undefined
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                        >
                          <Check className="w-3 h-3" /> Notified ({p.notifiedCount})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not sent</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewingPolicy(p);
                            setPreviewModalOpen(true);
                          }}
                          title="View Policy Content"
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Policy"
                          className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {!p.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handlePublishActive(p)}
                            title="Set as Live Active Version"
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenBroadcast(p)}
                          title="Send Email Broadcast"
                          className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {!p.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDeletePolicy(p)}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: POLICY VERSION EDITOR (CREATE / EDIT)
          ========================================================================= */}
      {editorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-poppins">
                  {editingPolicy ? `Edit Policy (${editingPolicy.version})` : `Create New ${selectedMeta?.label} Version`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: <strong className="text-blue-600 dark:text-blue-400">{selectedMeta?.label}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePolicy} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Terms of Service & Cloud Agreement"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Version *
                    </label>
                    <input
                      type="text"
                      required
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      placeholder="e.g. v1.1 or v2.0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Effective Date &amp; Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formEffectiveAt}
                      onChange={(e) => setFormEffectiveAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Summary of Changes (Audited &amp; Included in User Emails)
                </label>
                <input
                  type="text"
                  value={formSummaryOfChanges}
                  onChange={(e) => setFormSummaryOfChanges(e.target.value)}
                  placeholder="e.g. Updated Section 6 with new 90-day VM preservation guarantee."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Write vs Preview Tabs */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Policy Content (Markdown &amp; Text Supported)
                  </span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        editorTab === 'write'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        editorTab === 'preview'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>

                {editorTab === 'write' ? (
                  <textarea
                    rows={14}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Enter policy sections in Markdown or text..."
                    className="w-full p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden resize-y"
                  />
                ) : (
                  <div className="p-6 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 max-h-[350px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {formContent ? (
                      formContent
                    ) : (
                      <span className="text-slate-400 italic">No content entered yet.</span>
                    )}
                  </div>
                )}
              </div>

              {!editingPolicy?.isCurrent && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Publish as Live Active Version
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically archives the previous version. (Emails are NOT sent automatically).
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formMakeCurrent}
                    onChange={(e) => setFormMakeCurrent(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingPolicy ? 'Update Version' : 'Save Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: FULL TEXT PREVIEW MODAL
          ========================================================================= */}
      {previewModalOpen && previewingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono">
                    {previewingPolicy.version}
                  </span>
                  {previewingPolicy.isCurrent && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                      LIVE
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    Effective:{' '}
                    {new Date(previewingPolicy.effectiveAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {previewingPolicy.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {previewingPolicy.content}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Status: <strong>{previewingPolicy.status}</strong>
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: MANUAL EMAIL BROADCAST CONFIRMATION MODAL
          ========================================================================= */}
      {broadcastModalOpen && broadcastingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">
                    Dispatch Policy Update Notice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official notification to all active registered users.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-900 dark:text-amber-300 block mb-0.5">
                      Manual Email Control
                    </strong>
                    <p className="text-amber-800/90 dark:text-amber-400/90 leading-relaxed">
                      You are in full control. Clicking send will queue an official email notice to all registered users containing the version number, exact effective date &amp; time, and summary of changes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document Target:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {broadcastingPolicy.title} ({broadcastingPolicy.version})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effective Date &amp; Time:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(broadcastingPolicy.effectiveAt).toLocaleString('en-US', {
                      timeZone: 'UTC',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    })}
                  </span>
                </div>
                {broadcastingPolicy.summaryOfChanges && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Key Updates:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 max-w-xs text-right truncate">
                      {broadcastingPolicy.summaryOfChanges}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Previous Broadcasts:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {broadcastingPolicy.notifiedCount} sent
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Note from Management (appended to email)
                </label>
                <textarea
                  rows={3}
                  value={customBroadcastNote}
                  onChange={(e) => setCustomBroadcastNote(e.target.value)}
                  placeholder="e.g. Please review these revisions to our cloud retention policy..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastEmail}
                    onChange={(e) => setBroadcastEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Safe SMTP Email Dispatch
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastInApp}
                    onChange={(e) => setBroadcastInApp(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    In-App Notification Banner
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={broadcasting || (!broadcastEmail && !broadcastInApp)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {broadcasting ? 'Queueing Broadcast...' : 'Confirm & Dispatch Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
