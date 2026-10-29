import React, { useState, useEffect, useRef } from 'react';
import { Building2, User, ChevronDown, Check, Lock } from 'lucide-react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface WorkspaceOrg {
  orgId: number;
  name: string;
  role: 'owner' | 'admin' | 'devops' | 'viewer';
  isOwner: boolean;
  ownerName: string;
  memberCount: number;
}

interface WorkspaceSwitcherProps {
  currentWorkspace: string;
  onSelectWorkspace: (workspaceId: string, orgName?: string, role?: string) => void;
}

export default function WorkspaceSwitcher({
  currentWorkspace,
  onSelectWorkspace,
}: WorkspaceSwitcherProps) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<WorkspaceOrg[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if current user is registered as a company
  const isCompanyUser = user?.accountType === 'company' || Boolean(user?.companyName);

  useEffect(() => {
    let isMounted = true;
    async function loadOrgs() {
      try {
        const res = await apiCall('/company/my-organizations');
        if (res?.success && res?.organizations && isMounted) {
          setOrganizations(res.organizations);
          // Auto-select first organization if:
          // 1. User registered as company (strictly company workspace)
          // 2. Or user has never selected a workspace yet and belongs to an organization
          const savedWorkspace = localStorage.getItem('atech_active_workspace_org_id');
          if (res.organizations.length > 0) {
            if (isCompanyUser && (currentWorkspace === 'personal' || !currentWorkspace)) {
              const firstOrg = res.organizations[0];
              onSelectWorkspace(String(firstOrg.orgId), firstOrg.name, firstOrg.role);
            } else if (!savedWorkspace && (currentWorkspace === 'personal' || !currentWorkspace)) {
              const firstOrg = res.organizations[0];
              onSelectWorkspace(String(firstOrg.orgId), firstOrg.name, firstOrg.role);
            }
          }
        }
      } catch (err) {
        // Silent catch for individual accounts
      }
    }
    loadOrgs();
    return () => {
      isMounted = false;
    };
  }, [isCompanyUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If user has no organizations, don't show the switcher
  if (!organizations || organizations.length === 0) {
    return null;
  }

  const selectedOrg = organizations.find((o) => String(o.orgId) === String(currentWorkspace)) || organizations[0];
  const isPersonal = !isCompanyUser && (!selectedOrg || currentWorkspace === 'personal');

  const roleBadges: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    devops: 'DevOps',
    viewer: 'Viewer',
  };

  // If user is a company account, lock switcher to Company only (read-only pill with company name)
  if (isCompanyUser) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-blue-50/90 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs select-none">
        <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5 max-w-[170px] sm:max-w-[220px] truncate">
          <span className="truncate font-bold">
            {selectedOrg?.name || user?.companyName || 'Company Organization'}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-blue-200/70 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200">
            {selectedOrg?.isOwner ? 'Owner' : 'Company'}
          </span>
        </div>
      </div>
    );
  }

  // For invited team members (who are not company owners themselves), allow switching between personal and invited orgs
  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer ${
          isPersonal
            ? 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            : 'bg-blue-50/90 dark:bg-blue-950/60 hover:bg-blue-100/90 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs'
        }`}
      >
        {isPersonal ? (
          <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <User className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5" />
          </div>
        )}

        <div className="flex items-center gap-1.5 max-w-[170px] sm:max-w-[220px] truncate">
          <span className="truncate font-bold">
            {isPersonal ? 'Personal Workspace' : selectedOrg?.name}
          </span>
          {!isPersonal && selectedOrg?.role && (
            <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-blue-200/70 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200">
              {roleBadges[selectedOrg.role] || selectedOrg.role}
            </span>
          )}
        </div>

        <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn py-1.5">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Workspace
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {organizations.length + 1} Available
            </span>
          </div>

          <div className="py-1">
            {/* 1. Personal Workspace Option */}
            <div
              onClick={() => {
                onSelectWorkspace('personal');
                setIsOpen(false);
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-xs transition-colors ${
                isPersonal
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold">Personal Account</p>
                  <p className="text-[10px] text-slate-400 font-normal">Personal servers & billing</p>
                </div>
              </div>
              {isPersonal && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </div>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

            <div className="px-3 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Company Organizations
              </span>
            </div>

            {/* 2. Organization List */}
            {organizations.map((org) => {
              const isSelected = String(org.orgId) === String(currentWorkspace);
              return (
                <div
                  key={org.orgId}
                  onClick={() => {
                    onSelectWorkspace(String(org.orgId), org.name, org.role);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold truncate">{org.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal truncate">
                        Role: <span className="font-semibold capitalize">{org.role}</span> • {org.memberCount} members
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
