import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Search,
  Server,
  Globe,
  Code2,
  Database,
  GitBranch,
  Sliders,
  Shield,
  Activity,
  Cloud,
  MessageSquare,
  Gamepad2,
  Play,
  ExternalLink,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  BookOpen,
  Cpu,
  HardDrive,
  Lock,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { ModernFloatingInput, ModernFloatingSelect } from './ModernFormControls';
import { apiCall } from '../services/api';

export interface MarketplaceVM {
  vmId: number;
  vmName: string;
  osName: string;
  status: string;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  ipAddress: string;
}

export interface CatalogApp {
  id: string;
  name: string;
  category: string;
  version: string;
  description: string;
  defaultPort: number;
  minRamGb: number;
  minCpu: number;
  tags: string[];
  accessGuide: string;
  installCommands?: string[];
}

export interface AppCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface InstalledAppItem {
  appId: string;
  appName: string;
  category?: string;
  version?: string;
  description?: string;
  tags?: string[];
  installedAt: string;
  port: number;
  accessUrl: string;
  guide?: string;
  config?: {
    port?: number;
    domain?: string | null;
    adminEmail?: string | null;
    openFirewallPort?: boolean;
  };
}

export interface InstallJobItem {
  jobKey: string;
  vmId: number;
  vmName: string;
  appId: string;
  appName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  phase: string;
  progress: number;
  logs: string[];
  config?: {
    port?: number;
    domain?: string | null;
    adminEmail?: string | null;
    openFirewallPort?: boolean;
  };
  startedAt: string;
  completedAt?: string | null;
  result?: any;
  error?: string | null;
}

interface OneClickMarketplaceProps {
  vms: MarketplaceVM[];
  selectedVmId: number | null;
  onSelectVmId: (vmId: number) => void;
  onOpenDeployModal: () => void;
  onStartVm?: (vmId: number, vmName: string) => void;
  onOpenTerminal?: (vmId: number, vmName: string, ip: string) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const CATEGORY_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; badgeClass: string; iconBgClass: string }
> = {
  all: {
    icon: Boxes,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70',
    iconBgClass: 'bg-blue-600 text-white',
  },
  'web-cms': {
    icon: Globe,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/70',
    iconBgClass: 'bg-indigo-600 text-white',
  },
  'dev-stacks': {
    icon: Code2,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    iconBgClass: 'bg-emerald-600 text-white',
  },
  databases: {
    icon: Database,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    iconBgClass: 'bg-amber-500 text-white',
  },
  'devops-ci': {
    icon: GitBranch,
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/70',
    iconBgClass: 'bg-violet-600 text-white',
  },
  'control-panels': {
    icon: Sliders,
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/70',
    iconBgClass: 'bg-cyan-600 text-white',
  },
  'security-vpn': {
    icon: Shield,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70',
    iconBgClass: 'bg-rose-600 text-white',
  },
  monitoring: {
    icon: Activity,
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/70',
    iconBgClass: 'bg-teal-600 text-white',
  },
  'cloud-storage': {
    icon: Cloud,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
    iconBgClass: 'bg-sky-600 text-white',
  },
  'media-chat': {
    icon: MessageSquare,
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800/70',
    iconBgClass: 'bg-fuchsia-600 text-white',
  },
  'gaming-apps': {
    icon: Gamepad2,
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/70',
    iconBgClass: 'bg-orange-600 text-white',
  },
};

export default function OneClickMarketplace({
  vms,
  selectedVmId,
  onSelectVmId,
  onOpenDeployModal,
  onStartVm,
  onOpenTerminal,
  showNotification,
}: OneClickMarketplaceProps) {
  const [apps, setApps] = useState<CatalogApp[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchitectureGuide, setShowArchitectureGuide] = useState(false);

  // Installed apps & active background jobs for selected VM
  const [installedApps, setInstalledApps] = useState<InstalledAppItem[]>([]);
  const [loadingInstalled, setLoadingInstalled] = useState(false);
  const [vmJobs, setVmJobs] = useState<InstallJobItem[]>([]);

  // Configuration & StackScript Modal State
  const [configureApp, setConfigureApp] = useState<CatalogApp | null>(null);
  const [customPort, setCustomPort] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [openFirewallPort, setOpenFirewallPort] = useState<boolean>(true);
  const [showStackScriptPreview, setShowStackScriptPreview] = useState<boolean>(false);
  const [submittingInstall, setSubmittingInstall] = useState<boolean>(false);

  // Active Live Console Modal / Access Guide Modal
  const [activeJobModal, setActiveJobModal] = useState<InstallJobItem | null>(null);
  const [guideModalApp, setGuideModalApp] = useState<InstalledAppItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const activeVm = useMemo(() => {
    if (!vms || vms.length === 0) return null;
    if (selectedVmId) {
      const match = vms.find((v) => v.vmId === selectedVmId);
      if (match) return match;
    }
    return vms[0];
  }, [vms, selectedVmId]);

  // Ensure selectedVmId is initialized when vms load
  useEffect(() => {
    if (!selectedVmId && vms.length > 0) {
      onSelectVmId(vms[0].vmId);
    }
  }, [vms, selectedVmId, onSelectVmId]);

  // 1. Load 1-Click Catalog
  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const data = await apiCall('/apps');
        if (mounted && data?.success) {
          setApps(data.apps || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load 1-Click Marketplace catalog:', err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    };
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Installed Apps & Poll Jobs for Active VM
  const fetchVmAppStatus = async (vmId: number, silent = false) => {
    if (!silent) setLoadingInstalled(true);
    try {
      const [instData, jobsData] = await Promise.all([
        apiCall(`/apps/vms/${vmId}/installed`),
        apiCall(`/apps/vms/${vmId}/jobs`),
      ]);

      if (instData?.success) {
        setInstalledApps(instData.installed || []);
      }
      if (jobsData?.success) {
        const jobsList: InstallJobItem[] = jobsData.jobs || [];
        setVmJobs(jobsList);

        // Update activeJobModal if open
        setActiveJobModal((prev) => {
          if (!prev) return null;
          const updated = jobsList.find((j) => j.jobKey === prev.jobKey);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Error fetching VM app status:', err);
    } finally {
      if (!silent) setLoadingInstalled(false);
    }
  };

  useEffect(() => {
    if (!activeVm) {
      setInstalledApps([]);
      setVmJobs([]);
      return;
    }
    fetchVmAppStatus(activeVm.vmId, false);
  }, [activeVm?.vmId]);

  // Poll every 2.5s while any job on the selected VM is RUNNING
  const hasRunningJobs = useMemo(
    () => vmJobs.some((j) => j.status === 'RUNNING') || activeJobModal?.status === 'RUNNING',
    [vmJobs, activeJobModal]
  );

  useEffect(() => {
    if (!activeVm || !hasRunningJobs) return;
    const timer = setInterval(() => {
      fetchVmAppStatus(activeVm.vmId, true);
    }, 2500);
    return () => clearInterval(timer);
  }, [activeVm?.vmId, hasRunningJobs]);

  // Filtered catalog apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        (app.tags && app.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [apps, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: apps.length };
    for (const app of apps) {
      counts[app.category] = (counts[app.category] || 0) + 1;
    }
    return counts;
  }, [apps]);

  const installedAppIds = useMemo(() => {
    return new Set(installedApps.map((i) => i.appId));
  }, [installedApps]);

  const openConfigureModal = (app: CatalogApp, showScriptFirst = false) => {
    setConfigureApp(app);
    setCustomPort(String(app.defaultPort || 80));
    setCustomDomain('');
    setAdminEmail('');
    setOpenFirewallPort(true);
    setShowStackScriptPreview(showScriptFirst);
  };

  const handleLaunchInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configureApp || !activeVm) {
      showNotification('error', 'Please select or deploy a target virtual machine first.');
      return;
    }

    setSubmittingInstall(true);
    try {
      const data = await apiCall(`/apps/vms/${activeVm.vmId}/install`, {
        method: 'POST',
        body: JSON.stringify({
          appId: configureApp.id,
          asyncMode: true,
          config: {
            customPort: Number(customPort) || configureApp.defaultPort,
            domain: customDomain.trim() || undefined,
            adminEmail: adminEmail.trim() || undefined,
            openFirewallPort,
          },
        }),
      });

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to start 1-Click installation.');
      }

      const launchedJob: InstallJobItem = data.result?.job || {
        jobKey: `${activeVm.vmId}:${configureApp.id}`,
        vmId: activeVm.vmId,
        vmName: activeVm.vmName,
        appId: configureApp.id,
        appName: configureApp.name,
        status: 'RUNNING',
        phase: 'Initializing StackScript Engine',
        progress: 12,
        logs: [`[APP-INSTALL] Dispatched 1-Click StackScript for ${configureApp.name} on ${activeVm.vmName}...`],
        startedAt: new Date().toISOString(),
      };

      setConfigureApp(null);
      setVmJobs((prev) => [launchedJob, ...prev.filter((j) => j.jobKey !== launchedJob.jobKey)]);
      setActiveJobModal(launchedJob);
      showNotification(
        'info',
        `1-Click StackScript started: Installing ${configureApp.name} on ${activeVm.vmName}...`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to launch 1-Click application installer.');
    } finally {
      setSubmittingInstall(false);
    }
  };

  const handleRemoveInstalledApp = async (appId: string, appName: string) => {
    if (!activeVm) return;
    try {
      const data = await apiCall(`/apps/vms/${activeVm.vmId}/installed/${appId}`, {
        method: 'DELETE',
      });
      if (data?.success) {
        setInstalledApps((prev) => prev.filter((a) => a.appId !== appId));
        showNotification('success', `Removed ${appName} from ${activeVm.vmName}'s installed apps.`);
      } else {
        showNotification('error', data?.error || 'Failed to remove application.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error removing application.');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const isVmRunning = activeVm?.status?.toLowerCase() === 'running';

  return (
    <div className="space-y-6 pb-12">
      {/* ==================================================================== */}
      {/* 1. TOP HERO & TARGET VIRTUAL MACHINE SELECTOR (LINODE STYLE)         */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 md:p-7 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Linode-Style StackScript Automation Engine
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-poppins">
                1-Click Application Marketplace
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Select any of your Virtual Machines below and deploy production-ready software stacks, databases, control panels, and Dockerized services in one click via automated SSH StackScripts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowArchitectureGuide((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Info className="w-4 h-4 text-amber-400" />
                {showArchitectureGuide ? 'Hide How It Works' : 'How 1-Click StackScripts Work'}
                {showArchitectureGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={onOpenDeployModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Deploy New Instance + App
              </button>
            </div>
          </div>

          {/* Expandable "What Happens in the Background" Architecture Pipeline */}
          {showArchitectureGuide && (
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-[11px]">
                    1
                  </span>
                  Target VM & UDF Config
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You select your running VM and optional User-Defined Fields (<code className="text-amber-300">APP_PORT</code>, <code className="text-amber-300">APP_DOMAIN</code>, <code className="text-amber-300">ADMIN_EMAIL</code>).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-400/20 border border-blue-400/40 flex items-center justify-center text-[11px]">
                    2
                  </span>
                  SSH Bridge & Lock Guard
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Our orchestration engine connects over SSH (<code className="text-blue-300">port 22</code>), configures non-interactive <code className="text-blue-300">sudo</code>, and waits for any background <code className="text-blue-300">dpkg/apt</code> locks to release.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-[11px]">
                    3
                  </span>
                  StackScript Execution
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A Base64-encoded Bash StackScript installs dependencies, configures systemd services or Docker containers, and streams <code className="text-emerald-300">[APP-INSTALL]</code> logs live.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-400/20 border border-purple-400/40 flex items-center justify-center text-[11px]">
                    4
                  </span>
                  Firewall & Ready URL
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  UFW firewall rules open the target TCP port automatically and register the live Web URL + default credentials in your VM dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Target VM Selector Bar */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {vms.length === 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No Virtual Machines Found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Deploy a virtual machine first to install 1-Click Marketplace applications onto it.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenDeployModal}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                Deploy Your First VM
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 max-w-2xl">
                <div className="w-full sm:w-80">
                  <ModernFloatingSelect
                    label="Step 1: Select Target Virtual Machine"
                    icon={<Server className="w-4 h-4" />}
                    value={activeVm ? String(activeVm.vmId) : ''}
                    onChange={(e) => onSelectVmId(Number(e.target.value))}
                    options={vms.map((vm) => ({
                      value: String(vm.vmId),
                      label: `${vm.vmName} — ${vm.ipAddress} (${vm.status})`,
                    }))}
                  />
                </div>

                {activeVm && (
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border ${
                        isVmRunning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isVmRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      {activeVm.status}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold">
                      IP: {activeVm.ipAddress}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                      {activeVm.cpuCores} vCPU / {activeVm.ramGb} GB RAM
                    </span>
                  </div>
                )}
              </div>

              {activeVm && (
                <div className="flex items-center gap-2.5 shrink-0">
                  {!isVmRunning && onStartVm && (
                    <button
                      type="button"
                      onClick={() => onStartVm(activeVm.vmId, activeVm.vmName)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Power On VM
                    </button>
                  )}
                  {isVmRunning &&
                    onOpenTerminal &&
                    activeVm.ipAddress &&
                    !activeVm.ipAddress.startsWith('DHCP') && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenTerminal(activeVm.vmId, activeVm.vmName, activeVm.ipAddress)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        Open Web SSH
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => fetchVmAppStatus(activeVm.vmId, false)}
                    title="Refresh installed apps & jobs"
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingInstalled ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. ACTIVE INSTALLATION JOBS & INSTALLED APPS ON SELECTED VM          */}
      {/* ==================================================================== */}
      {activeVm && (vmJobs.length > 0 || installedApps.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Applications on <span className="text-blue-600 dark:text-blue-400 font-mono">{activeVm.vmName}</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {installedApps.length} Active
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage live services, view default credentials, or watch active StackScript deployments.
                </p>
              </div>
            </div>
          </div>

          {/* Active / Recent Jobs Banner */}
          {vmJobs.filter((j) => j.status === 'RUNNING' || j.status === 'FAILED').length > 0 && (
            <div className="space-y-3">
              {vmJobs
                .filter((j) => j.status === 'RUNNING' || j.status === 'FAILED')
                .map((job) => (
                  <div
                    key={job.jobKey}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      job.status === 'RUNNING'
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/70'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/70'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        {job.status === 'RUNNING' ? (
                          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        )}
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {job.appName} — {job.phase}
                        </span>
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {job.progress}%
                        </span>
                      </div>

                      {job.status === 'RUNNING' && (
                        <div className="w-full h-2 rounded-full bg-blue-200/60 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}

                      <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                        {job.logs && job.logs.length > 0
                          ? job.logs[job.logs.length - 1]
                          : 'Preparing remote execution...'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveJobModal(job)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      View Live Console
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Installed Applications Grid */}
          {installedApps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {installedApps.map((inst) => {
                const catMeta = CATEGORY_META[inst.category || 'web-cms'] || CATEGORY_META.all;
                const CatIcon = catMeta.icon;
                return (
                  <div
                    key={inst.appId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catMeta.iconBgClass}`}>
                          <CatIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {inst.appName}
                            </h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              Port :{inst.port}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Installed {new Date(inst.installedAt).toLocaleDateString()} • v{inst.version || 'Latest'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveInstalledApp(inst.appId, inst.appName)}
                        title="Remove from installed apps"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                      <a
                        href={inst.accessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Web App
                      </a>
                      <button
                        type="button"
                        onClick={() => setGuideModalApp(inst)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        Access Guide
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. SEARCH & CATEGORY FILTER BAR                                      */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:max-w-md">
            <ModernFloatingInput
              label="Search 100+ 1-Click Applications (e.g. WordPress, Docker, MySQL, WireGuard)"
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type app name, stack, or tag..."
              rightElement={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredApps.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{apps.length}</strong> verified StackScripts
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(categories.length > 0
            ? categories
            : [{ id: 'all', name: 'All Applications' }]
          ).map((cat) => {
            const meta = CATEGORY_META[cat.id] || CATEGORY_META.all;
            const Icon = meta.icon;
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. APPLICATION CATALOG GRID                                          */}
      {/* ==================================================================== */}
      {loadingCatalog ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Loading 1-Click Marketplace Catalog...
          </p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Boxes className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No matching applications found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try clearing your search filter or switching to "All Applications" to browse all {apps.length} available 1-Click StackScripts.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => {
            const catMeta = CATEGORY_META[app.category] || CATEGORY_META.all;
            const CatIcon = catMeta.icon;
            const isInstalled = installedAppIds.has(app.id);
            const activeJob = vmJobs.find(
              (j) => j.appId === app.id && j.status === 'RUNNING'
            );

            const meetsSpecs =
              !activeVm ||
              (activeVm.ramGb >= (app.minRamGb || 1) &&
                activeVm.cpuCores >= (app.minCpu || 1));

            return (
              <div
                key={app.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${catMeta.iconBgClass}`}
                      >
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            v{app.version}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                            TCP :{app.defaultPort}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isInstalled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Installed
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${catMeta.badgeClass}`}>
                        {categories.find((c) => c.id === app.category)?.name || app.category}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {app.description}
                  </p>

                  {/* Tags */}
                  {app.tags && app.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {app.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specs & Action Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Min Requirement:
                    </span>
                    <span
                      className={`font-semibold inline-flex items-center gap-1 ${
                        meetsSpecs
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {meetsSpecs ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {app.minCpu} vCPU / {app.minRamGb} GB RAM
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeJob ? (
                      <button
                        type="button"
                        onClick={() => setActiveJobModal(activeJob)}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Installing ({activeJob.progress}%) — View Logs
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openConfigureModal(app, false)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {isInstalled ? 'Reinstall / Configure' : '1-Click Install'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfigureModal(app, true)}
                          title="Inspect StackScript Bash Commands"
                          className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. 1-CLICK STACKSCRIPT CONFIGURATION MODAL                           */}
      {/* ==================================================================== */}
      {configureApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-white shrink-0">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold">{configureApp.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/15 text-blue-200">
                      v{configureApp.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    1-Click Automated StackScript Deployment & Environment Configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfigureApp(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchInstall} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Target VM Selection */}
              <div className="space-y-3">
                <ModernFloatingSelect
                  label="Target Virtual Machine"
                  icon={<Server className="w-4 h-4" />}
                  value={activeVm ? String(activeVm.vmId) : ''}
                  onChange={(e) => onSelectVmId(Number(e.target.value))}
                  required
                  options={vms.map((vm) => ({
                    value: String(vm.vmId),
                    label: `${vm.vmName} (${vm.ipAddress}) — ${vm.cpuCores} vCPU / ${vm.ramGb} GB RAM [${vm.status}]`,
                  }))}
                />

                {activeVm && !isVmRunning && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        <strong>{activeVm.vmName}</strong> is currently <strong>{activeVm.status}</strong>. The VM must be running with an active IP so SSH can execute the StackScript.
                      </span>
                    </div>
                    {onStartVm && (
                      <button
                        type="button"
                        onClick={() => onStartVm(activeVm.vmId, activeVm.vmName)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Power On
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* StackScript User-Defined Fields (UDF) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModernFloatingInput
                  label="Service Port (TCP)"
                  type="number"
                  value={customPort}
                  onChange={(e) => setCustomPort(e.target.value)}
                  placeholder="e.g. 8080"
                  required
                />
                <ModernFloatingInput
                  label="Custom Domain / Hostname (Optional)"
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. app.yourdomain.com"
                />
              </div>

              <ModernFloatingInput
                label="Admin / Let's Encrypt Notification Email (Optional)"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@yourdomain.com"
              />

              {/* Firewall Toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Automatically Open Port :{customPort || configureApp.defaultPort} in UFW Firewall
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Executes <code className="font-mono">sudo ufw allow {customPort || configureApp.defaultPort}/tcp</code> after installation completes
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={openFirewallPort}
                  onChange={(e) => setOpenFirewallPort(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              {/* Access Guide Preview */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 space-y-1">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Post-Install Access & Credentials Guide
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                  {configureApp.accessGuide.replace(
                    /{IP}/g,
                    customDomain.trim() || activeVm?.ipAddress || 'YOUR_VM_IP'
                  )}
                </p>
              </div>

              {/* Collapsible StackScript Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowStackScriptPreview((prev) => !prev)}
                  className="w-full px-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    Inspect Automated StackScript Recipe ({configureApp.installCommands?.length || 0} steps)
                  </span>
                  {showStackScriptPreview ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showStackScriptPreview && (
                  <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1.5 overflow-x-auto max-h-56">
                    <div className="text-slate-500">#!/bin/bash — Executed via SSH Bridge on {activeVm?.vmName || 'Target VM'}</div>
                    <div className="text-amber-400">
                      export DEBIAN_FRONTEND=noninteractive APP_PORT="{customPort || configureApp.defaultPort}"
                      {customDomain ? ` APP_DOMAIN="${customDomain}"` : ''}
                    </div>
                    {(configureApp.installCommands || []).map((cmd, i) => (
                      <div key={i} className="text-emerald-400">
                        <span className="text-slate-500 select-none mr-2">${i + 1}</span>
                        {cmd}
                      </div>
                    ))}
                    {openFirewallPort && (
                      <div className="text-cyan-400">
                        <span className="text-slate-500 select-none mr-2">$</span>
                        sudo ufw allow {customPort || configureApp.defaultPort}/tcp
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfigureApp(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInstall || !activeVm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {submittingInstall ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dispatching StackScript...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Launch 1-Click Installation on {activeVm?.vmName}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. LIVE STACKSCRIPT INSTALLATION CONSOLE MODAL                       */}
      {/* ==================================================================== */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-white animate-fadeIn">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {activeJobModal.status === 'RUNNING' ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                ) : activeJobModal.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <div>
                  <h3 className="text-base font-bold">
                    {activeJobModal.appName} — 1-Click StackScript Console
                  </h3>
                  <p className="text-xs text-slate-400">
                    Target VM: <span className="text-blue-400 font-mono">{activeJobModal.vmName}</span> • Phase:{' '}
                    <span className="text-amber-300 font-semibold">{activeJobModal.phase}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveJobModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">{activeJobModal.phase}</span>
                  <span className="text-blue-400">{activeJobModal.progress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      activeJobModal.status === 'FAILED'
                        ? 'bg-rose-500'
                        : activeJobModal.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${activeJobModal.progress}%` }}
                  />
                </div>
              </div>

              {/* Live Terminal Output */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs h-64 overflow-y-auto space-y-1.5">
                {(activeJobModal.logs || []).map((line, idx) => (
                  <div
                    key={idx}
                    className={
                      line.includes('ERROR')
                        ? 'text-rose-400'
                        : line.includes('Verified & Active') || line.includes('COMPLETED_SUCCESSFULLY')
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
                {activeJobModal.status === 'RUNNING' && (
                  <div className="text-blue-400 animate-pulse">
                    _ Executing remote commands over SSH bridge...
                  </div>
                )}
              </div>

              {/* Completed Result Card */}
              {activeJobModal.status === 'COMPLETED' && activeJobModal.result && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">
                      Application Ready & Port Opened!
                    </span>
                    <a
                      href={activeJobModal.result.accessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open {activeJobModal.result.accessUrl}
                    </a>
                  </div>
                  <p className="text-xs font-mono text-slate-200">
                    {activeJobModal.result.guide}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {activeJobModal.status === 'RUNNING'
                    ? 'You can close this window — installation continues safely in the background.'
                    : `Status: ${activeJobModal.status}`}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveJobModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                >
                  Close Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. ACCESS GUIDE & CREDENTIALS MODAL                                  */}
      {/* ==================================================================== */}
      {guideModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {guideModalApp.appName} — Access & Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuideModalApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Web Endpoint URL
                </div>
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-blue-600 dark:text-blue-400">
                  <a
                    href={guideModalApp.accessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {guideModalApp.accessUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(guideModalApp.accessUrl, 'url')}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 cursor-pointer shrink-0"
                  >
                    {copiedText === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Instructions & Default Credentials
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {guideModalApp.guide}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <a
                  href={guideModalApp.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Launch Web Interface
                </a>
                <button
                  type="button"
                  onClick={() => setGuideModalApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
