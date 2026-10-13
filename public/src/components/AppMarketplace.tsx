import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  Loader2,
  Server,
  Zap,
  Globe,
  Code,
  Database,
  Layers,
  Sliders,
  Shield,
  Activity,
  Cloud,
  MessageSquare,
  Gamepad2,
  Info,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';

interface AppItem {
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
}

interface InstalledApp {
  appId: string;
  appName: string;
  installedAt: string;
  port: number;
  accessUrl: string;
}

interface InstanceOption {
  vmId: number;
  name: string;
  ip: string;
  status: string;
  cpuCores: number;
  ramGb: number;
}

interface AppMarketplaceProps {
  instances: InstanceOption[];
  selectedVmId?: number;
  onSelectVm?: (vmId: number) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Boxes,
  'web-cms': Globe,
  'dev-stacks': Code,
  databases: Database,
  'devops-ci': Layers,
  'control-panels': Sliders,
  'security-vpn': Shield,
  monitoring: Activity,
  'cloud-storage': Cloud,
  'media-chat': MessageSquare,
  'gaming-apps': Gamepad2,
};

export default function AppMarketplace({
  instances,
  selectedVmId,
  onSelectVm,
}: AppMarketplaceProps) {
  const { toast } = useToast();

  const [apps, setApps] = useState<AppItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Target VM selection
  const activeVmId = selectedVmId || (instances.length > 0 ? instances[0].vmId : 0);
  const currentVm = instances.find((i) => i.vmId === activeVmId) || instances[0];

  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loadingInstalled, setLoadingInstalled] = useState(false);

  // Install modal state
  const [installModalApp, setInstallModalApp] = useState<AppItem | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<{
    success: boolean;
    accessUrl?: string;
    guide?: string;
    error?: string;
  } | null>(null);

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await apiCall('/api/apps');
        if (res.success) {
          setApps(res.apps || []);
          setCategories(res.categories || []);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load app marketplace.');
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Load installed apps when VM selection changes
  useEffect(() => {
    if (!activeVmId) return;
    async function loadInstalled() {
      try {
        setLoadingInstalled(true);
        const res = await apiCall(`/api/apps/vms/${activeVmId}/installed`);
        if (res.success) {
          setInstalledApps(res.installed || []);
        }
      } catch {
        setInstalledApps([]);
      } finally {
        setLoadingInstalled(false);
      }
    }
    loadInstalled();
  }, [activeVmId]);

  // Filtered catalog
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [apps, activeCategory, searchQuery]);

  // Handle 1-Click Install Execution
  const handleConfirmInstall = async () => {
    if (!installModalApp || !currentVm) return;

    try {
      setIsInstalling(true);
      setInstallResult(null);

      const res = await apiCall(`/api/apps/vms/${currentVm.vmId}/install`, {
        method: 'POST',
        body: JSON.stringify({ appId: installModalApp.id }),
      });

      if (res.success && res.result) {
        setInstallResult({
          success: true,
          accessUrl: res.result.accessUrl,
          guide: res.result.guide,
        });
        toast.success(`Successfully installed ${installModalApp.name}!`);
        // Refresh installed list
        const refresh = await apiCall(`/api/apps/vms/${currentVm.vmId}/installed`);
        if (refresh.success) setInstalledApps(refresh.installed || []);
      } else {
        throw new Error(res.error || 'Failed to deploy application.');
      }
    } catch (err: any) {
      setInstallResult({
        success: false,
        error: err.message || 'Installation encountered an unexpected error.',
      });
      toast.error(err.message || 'Installation failed.');
    } finally {
      setIsInstalling(false);
    }
  };

  const isInstalled = (appId: string) => {
    return installedApps.some((ia) => ia.appId === appId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                1-Click Marketplace
              </span>
              <span className="text-xs text-slate-400 font-medium">100+ Enterprise Apps</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              One-Click Cloud Application Store
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Deploy pre-configured production web stacks, databases, developer frameworks, VPNs, and CMS platforms directly onto your cloud instances with zero manual setup.
            </p>
          </div>

          {/* Target VM Selector Pill */}
          <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3 flex flex-col gap-1.5 min-w-[240px]">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Target Instance
            </label>
            {instances.length === 0 ? (
              <span className="text-xs text-amber-400">No active instances found</span>
            ) : (
              <select
                value={activeVmId}
                onChange={(e) => onSelectVm && onSelectVm(Number(e.target.value))}
                className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500"
              >
                {instances.map((vm) => (
                  <option key={vm.vmId} value={vm.vmId}>
                    {vm.name} ({vm.ip}) — {vm.status.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
            {currentVm && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Prompt: <code className="text-blue-300">ubuntu@{currentVm.ip.replace(/\./g, '-')}</code></span>
                <span className={`inline-block w-2 h-2 rounded-full ${currentVm.status === 'running' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applications, stacks, or keywords (e.g. docker, wordpress, redis)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="text-xs text-slate-400 self-center">
          Showing <span className="font-semibold text-white">{filteredApps.length}</span> of {apps.length} applications
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Boxes;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* App Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm">Loading applications catalog...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1">Try modifying your search query or switching categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const CatIcon = CATEGORY_ICONS[app.category] || Boxes;
            const installed = isInstalled(app.id);

            return (
              <div
                key={app.id}
                className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/90 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group hover:shadow-xl hover:shadow-blue-950/20"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                          {app.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">v{app.version}</span>
                      </div>
                    </div>

                    {installed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                    {app.description}
                  </p>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/50">
                      Port {app.defaultPort}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/50">
                      {app.minCpu} vCPU / {app.minRamGb} GB RAM
                    </span>
                    {app.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">1-Click Automated</span>
                  <button
                    onClick={() => {
                      setInstallResult(null);
                      setInstallModalApp(app);
                    }}
                    disabled={!currentVm || currentVm.status !== 'running'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      installed
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {installed ? 'Re-deploy' : 'Deploy App'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deployment Confirmation & Status Modal */}
      {installModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Deploy {installModalApp.name}</h3>
                  <p className="text-xs text-slate-400">Automated 1-Click Provisioning</p>
                </div>
              </div>
              {!isInstalling && (
                <button
                  onClick={() => setInstallModalApp(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Target Server Card */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Virtual Machine:</span>
                  <span className="font-semibold text-white">{currentVm?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Assigned Host IP:</span>
                  <span className="font-mono text-blue-400">{currentVm?.ip}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Terminal Prompt:</span>
                  <span className="font-mono text-emerald-400">ubuntu@{currentVm?.ip.replace(/\./g, '-')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Default Service Port:</span>
                  <span className="font-mono text-slate-300">:{installModalApp.defaultPort}</span>
                </div>
              </div>

              {/* Install Result Notification */}
              {installResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    installResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {installResult.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 text-xs">
                      <div className="font-semibold">
                        {installResult.success
                          ? 'Application Provisioned Successfully!'
                          : 'Deployment Failed'}
                      </div>
                      {installResult.success && installResult.guide && (
                        <p className="text-slate-300 leading-relaxed">{installResult.guide}</p>
                      )}
                      {installResult.success && installResult.accessUrl && (
                        <a
                          href={installResult.accessUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Launch {installModalApp.name} ({installResult.accessUrl})
                        </a>
                      )}
                      {!installResult.success && installResult.error && (
                        <p className="font-mono text-[11px] text-rose-400">{installResult.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress indicator while executing */}
              {isInstalling && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-semibold text-white">Configuring packages on guest VM...</div>
                    <p className="text-slate-400 mt-0.5">
                      Executing automated recipe via secure guest channel. This usually takes 30-60 seconds.
                    </p>
                  </div>
                </div>
              )}

              {!installResult && !isInstalling && (
                <div className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  <p className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Automated Actions:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Updates package repositories on target VM</li>
                    <li>Installs dependencies and required system services</li>
                    <li>Configures firewall & systemd daemon to auto-start on reboot</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setInstallModalApp(null)}
                disabled={isInstalling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {installResult ? 'Close' : 'Cancel'}
              </button>
              {!installResult && (
                <button
                  type="button"
                  onClick={handleConfirmInstall}
                  disabled={isInstalling}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Start 1-Click Install
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
