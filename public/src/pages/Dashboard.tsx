import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  Plus, 
  Power, 
  Search,
  X,
  Terminal,
  Copy,
  Check,
  MemoryStick,
  Clock,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Layers,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AccountSettings from '../components/AccountSettings';
import { apiCall } from '../services/api';

interface Instance {
  id: string;
  vmId: number;
  name: string;
  hostname: string;
  ip: string;
  os: string;
  status: 'running' | 'stopped' | 'provisioning';
  cpuUsage: number;
  ramUsage: string;
  diskUsage: string;
  vCPU: number;
  ramGB: number;
  diskGB: number;
  monthlyPrice: number;
  createdAt: string;
}

interface PlanOption {
  planId: number;
  name: string;
  description: string;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  monthlyPrice: string | number;
}

interface ImageOption {
  imageId: number;
  name: string;
  osFamily: string;
  version: string;
  templatePath: string;
}

interface ActiveSubscription {
  subscriptionId: number;
  planId: number;
  planName: string;
  monthlyPrice: number;
  startDate: string;
  endDate: string | null;
  daysRemaining: number;
  activeVmCount: number;
  hasAvailableSlot: boolean;
  specs: {
    cpuCores: number;
    ramGb: number;
    storageGb: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Real-time server state from API
  const [instances, setInstances] = useState<Instance[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscription[]>([]);
  const [catalogPlans, setCatalogPlans] = useState<PlanOption[]>([]);
  const [catalogImages, setCatalogImages] = useState<ImageOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');

  // Modals state
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<Instance | null>(null);
  const [resizingInstance, setResizingInstance] = useState<Instance | null>(null);
  const [copiedSSH, setCopiedSSH] = useState(false);

  // Deploy form state
  const [newHostname, setNewHostname] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [selectedImageId, setSelectedImageId] = useState<number>(1);
  const [customCpu, setCustomCpu] = useState<number>(2);
  const [customRam, setCustomRam] = useState<number>(4);
  const [customStorage, setCustomStorage] = useState<number>(50);
  const [deployLoading, setDeployLoading] = useState(false);

  // Resize form state
  const [resizeCpu, setResizeCpu] = useState<number>(2);
  const [resizeRam, setResizeRam] = useState<number>(4);
  const [resizeStorage, setResizeStorage] = useState<number>(50);
  const [resizePricing, setResizePricing] = useState<{ newPrice: number; priceDelta: number } | null>(null);
  const [resizeLoading, setResizeLoading] = useState(false);

  // 1. Fetch user VMs and catalog from API
  const fetchVMs = async () => {
    try {
      const data = await apiCall('/vms');
      if (data) {
        if (data.vms) setInstances(data.vms);
        if (data.activeSubscriptions) setActiveSubscriptions(data.activeSubscriptions);
      }
    } catch (err) {
      console.error('Failed to load user VMs:', err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const data = await apiCall('/vms/catalog');
      if (data) {
        if (data.plans) setCatalogPlans(data.plans);
        if (data.images) setCatalogImages(data.images);
        if (data.plans?.[0]) {
          setSelectedPlanId(data.plans[0].planId);
          setCustomCpu(data.plans[0].cpuCores);
          setCustomRam(data.plans[0].ramGb);
          setCustomStorage(data.plans[0].storageGb);
        }
        if (data.images?.[0]) {
          setSelectedImageId(data.images[0].imageId);
        }
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchVMs(), fetchCatalog()]);
      setIsLoading(false);
    };
    init();
  }, []);

  // Poll if any VM is currently provisioning
  useEffect(() => {
    const hasProvisioning = instances.some((i) => i.status === 'provisioning');
    if (!hasProvisioning) return;

    const timer = setInterval(() => {
      fetchVMs();
    }, 3000);
    return () => clearInterval(timer);
  }, [instances]);

  // Handle Escape key to close any active drawer or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedInstance(null);
        setResizingInstance(null);
        setIsDeployOpen(false);
        setDeletingInstance(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update plan specs when plan selection changes in Deploy modal
  const handlePlanChange = (planId: number) => {
    setSelectedPlanId(planId);
    const plan = catalogPlans.find((p) => p.planId === planId);
    if (plan) {
      setCustomCpu(plan.cpuCores);
      setCustomRam(plan.ramGb);
      setCustomStorage(plan.storageGb);
    }
  };

  // Open deploy modal pre-filled with a specific plan
  const handleQuickDeploy = (plan: PlanOption) => {
    setSelectedPlanId(plan.planId);
    setCustomCpu(plan.cpuCores);
    setCustomRam(plan.ramGb);
    setCustomStorage(plan.storageGb);
    setNewHostname(`vps-${plan.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 899 + 100)}`);
    setIsDeployOpen(true);
  };

  // Power action (START / STOP / RESTART)
  const handlePowerAction = async (vmId: number, action: 'START' | 'STOP' | 'RESTART', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoadingId(vmId);
    try {
      await apiCall(`/vms/${vmId}/power`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      await fetchVMs();
      if (selectedInstance && selectedInstance.vmId === vmId) {
        const nextStatus = action === 'START' || action === 'RESTART' ? 'running' : 'stopped';
        setSelectedInstance({ ...selectedInstance, status: nextStatus });
      }
    } catch (err: any) {
      alert(`Power action failed: ${err.message || 'Error executing command'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Deploy submit handler
  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;

    setDeployLoading(true);
    try {
      await apiCall('/vms/deploy', {
        method: 'POST',
        body: JSON.stringify({
          vmName: newHostname.trim(),
          planId: selectedPlanId,
          imageId: selectedImageId,
          customCpu,
          customRam,
          customStorage,
        }),
      });
      setIsDeployOpen(false);
      setNewHostname('');
      await fetchVMs();
    } catch (err: any) {
      alert(`Deployment failed: ${err.message || 'Check cluster capacity'}`);
    } finally {
      setDeployLoading(false);
    }
  };

  // Open resize modal and calculate initial pricing
  const openResizeModal = (inst: Instance, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResizingInstance(inst);
    setResizeCpu(inst.vCPU);
    setResizeRam(inst.ramGB);
    setResizeStorage(inst.diskGB);
    setResizePricing({ newPrice: inst.monthlyPrice, priceDelta: 0 });
  };

  // Update resize price preview
  useEffect(() => {
    if (!resizingInstance) return;
    const updatePreview = async () => {
      try {
        const data = await apiCall(`/vms/${resizingInstance.vmId}/preview-resize`, {
          method: 'POST',
          body: JSON.stringify({ cpuCores: resizeCpu, ramGb: resizeRam, storageGb: resizeStorage }),
        });
        if (data) {
          setResizePricing({ newPrice: data.newPrice, priceDelta: data.priceDelta });
        }
      } catch (err) {
        console.error('Preview resize error:', err);
      }
    };
    updatePreview();
  }, [resizeCpu, resizeRam, resizeStorage, resizingInstance]);

  // Apply resize submit
  const handleResizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resizingInstance) return;

    setResizeLoading(true);
    try {
      await apiCall(`/vms/${resizingInstance.vmId}/resize`, {
        method: 'PATCH',
        body: JSON.stringify({ cpuCores: resizeCpu, ramGb: resizeRam, storageGb: resizeStorage }),
      });
      setResizingInstance(null);
      await fetchVMs();
      if (selectedInstance && selectedInstance.vmId === resizingInstance.vmId) {
        setSelectedInstance({
          ...selectedInstance,
          vCPU: resizeCpu,
          ramGB: resizeRam,
          diskGB: resizeStorage,
          monthlyPrice: resizePricing?.newPrice || selectedInstance.monthlyPrice,
        });
      }
    } catch (err: any) {
      alert(`Resize failed: ${err.message}`);
    } finally {
      setResizeLoading(false);
    }
  };

  // Terminate/Delete instance handler (Hostinger standard)
  const confirmDeleteInstance = async () => {
    if (!deletingInstance) return;
    const targetId = deletingInstance.vmId;

    setActionLoadingId(targetId);
    try {
      await apiCall(`/vms/${targetId}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      console.warn('Destroy notice:', err);
    } finally {
      // Guaranteed local state cleanup so modal never gets stuck
      setInstances((prev) => prev.filter((i) => i.vmId !== targetId));
      if (selectedInstance?.vmId === targetId) {
        setSelectedInstance(null);
      }
      setDeletingInstance(null);
      setActionLoadingId(null);
      await fetchVMs();
    }
  };

  const handleCopySSH = (ip: string) => {
    navigator.clipboard.writeText(`ssh root@${ip}`);
    setCopiedSSH(true);
    setTimeout(() => setCopiedSSH(false), 2000);
  };

  // Aggregate stats
  const totalStorage = instances.reduce((acc, inst) => acc + inst.diskGB, 0);
  const runningCount = instances.filter((i) => i.status === 'running').length;
  const stoppedCount = instances.filter((i) => i.status === 'stopped').length;
  const activeSlot = activeSubscriptions.find((s) => s.hasAvailableSlot);

  // Filter pipeline
  const filteredInstances = instances.filter((inst) => {
    const matchesSearch = 
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.ip.includes(searchTerm);

    const matchesStatus = 
      statusFilter === 'all' || inst.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* PERSISTENT SIDEBAR */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* DYNAMIC CONTENT CONTAINER */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* RENDER ACCOUNT SETTINGS WHEN TAB IS SETTINGS */}
        {activeTab === 'settings' && <AccountSettings />}

        {/* RENDER DASHBOARD / VMS VIEWS */}
        {(activeTab === 'dashboard' || activeTab === 'vms') && (
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-blue-950 font-poppins">
                    Infrastructure Dashboard
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Hyper-V Cluster Online
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Manage your virtual machines, scale RAM & CPU resources, and control power cycles.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => fetchVMs()}
                  title="Refresh instances"
                  className="p-2.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
                <button 
                  onClick={() => setIsDeployOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" /> Deploy New Instance
                </button>
              </div>
            </div>

            {/* OVERVIEW METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Servers</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{instances.length} Configured</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Running Instances</p>
                  <p className="text-xl font-bold text-emerald-600 mt-0.5">{runningCount} Active</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Allocated vCPUs</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    {instances.reduce((acc, i) => acc + i.vCPU, 0)} Cores
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Allocated</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{totalStorage} GB NVMe</p>
                </div>
              </div>
            </div>

            {/* ACTIVE SUBSCRIPTION AVAILABLE SLOT BANNER (Hostinger Model) */}
            {activeSlot && (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-emerald-500/40 shadow-xl relative overflow-hidden mb-6">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Plan: {activeSlot.planName} (Prepaid)
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold font-poppins text-white">
                      1 Server Slot Available — Ready to Deploy
                    </h2>
                    <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                      You have an active 30-day package with <strong>{activeSlot.daysRemaining} days remaining</strong> (valid until {activeSlot.endDate}). You can deploy a fresh virtual server slot at zero extra charge ($0.00).
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1 font-mono">
                      <span>⚡ {activeSlot.specs?.cpuCores} vCPU</span>
                      <span>•</span>
                      <span>💾 {activeSlot.specs?.ramGb} GB RAM</span>
                      <span>•</span>
                      <span>🚀 {activeSlot.specs?.storageGb} GB NVMe</span>
                      <span>•</span>
                      <span>🌐 1 Static IPv4</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPlanId(activeSlot.planId);
                        setCustomCpu(activeSlot.specs?.cpuCores || 2);
                        setCustomRam(activeSlot.specs?.ramGb || 4);
                        setCustomStorage(activeSlot.specs?.storageGb || 50);
                        setNewHostname(`srv-${activeSlot.planName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 899 + 100)}`);
                        setIsDeployOpen(true);
                      }}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Set Up VPS ($0.00)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CREATIVE EMPTY STATE (When user has 0 machines purchased) */}
            {instances.length === 0 && !isLoading && (
              <div className="space-y-8">
                {/* HERO PROMO CARD */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-8 md:p-12 text-white shadow-xl border border-slate-800">
                  <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" /> High-Performance Gen 2 Hyper-V Cloud
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-poppins">
                      Launch Your First Virtual Private Server
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                      You don't have any active virtual servers yet. Select a certified package below to provision dedicated vCPUs, enterprise NVMe storage, and static IPv4 in seconds.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-4">
                      <button
                        onClick={() => setIsDeployOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> Quick Deploy Server
                      </button>
                      <a
                        href="/pricing"
                        className="px-6 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
                      >
                        View Full Pricing Specs <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* PACKAGE PURCHASE CARDS */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-poppins">
                        Available Cloud Server Packages
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select a package to launch your machine instantly on our local cluster.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {catalogPlans.map((plan) => {
                      const isPopular = plan.name.toLowerCase().includes('pro');
                      return (
                        <div
                          key={plan.planId}
                          className={`relative bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${
                            isPopular
                              ? 'border-blue-600 shadow-md shadow-blue-500/10 ring-2 ring-blue-600/20'
                              : 'border-slate-200'
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-sm">
                              Most Popular
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-slate-900 text-base font-poppins">{plan.name}</h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                            </div>

                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-extrabold text-blue-950 font-poppins">
                                ${plan.monthlyPrice}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">/ month</span>
                            </div>

                            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                                <span><strong>{plan.cpuCores}</strong> vCPU Cores</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MemoryStick className="w-3.5 h-3.5 text-blue-600" />
                                <span><strong>{plan.ramGb} GB</strong> High-Speed RAM</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                                <span><strong>{plan.storageGb} GB</strong> Fast NVMe Disk</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                <span>1 Dedicated Static IPv4</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6">
                            <button
                              onClick={() => handleQuickDeploy(plan)}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                isPopular
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              Deploy Plan <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* INSTANCE TABLE SECTION (When user has active VMs) */}
            {instances.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* TABLE CONTROLS & FILTER TABS */}
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* STATUS FILTER TABS */}
                  <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All
                      <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">
                        {instances.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('running')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'running'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Running
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md text-[10px]">
                        {runningCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('stopped')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'stopped'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Stopped
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">
                        {stoppedCount}
                      </span>
                    </button>
                  </div>

                  {/* SEARCH INPUT */}
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search instances or IP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Instance Name</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">IP Address</th>
                        <th className="px-6 py-3.5">Hardware Specs</th>
                        <th className="px-6 py-3.5">Monthly Rate</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInstances.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                            No virtual servers found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredInstances.map((inst) => (
                          <tr 
                            key={inst.id} 
                            onClick={() => setSelectedInstance(inst)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                              <Server className="w-4 h-4 text-slate-400" />
                              <div>
                                <p>{inst.name}</p>
                                <p className="text-[10px] text-slate-400 font-normal">{inst.os}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  inst.status === 'running'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : inst.status === 'provisioning'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    inst.status === 'running'
                                      ? 'bg-emerald-500'
                                      : inst.status === 'provisioning'
                                      ? 'bg-blue-500 animate-ping'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                {inst.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{inst.ip}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-blue-600" /> {inst.vCPU} vCPU
                                <span className="text-slate-300">•</span>
                                <MemoryStick className="w-3.5 h-3.5 text-purple-600" /> {inst.ramGB} GB RAM
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 font-poppins text-xs">
                              ${inst.monthlyPrice}/mo
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* POWER BUTTON */}
                                <button
                                  onClick={(e) =>
                                    handlePowerAction(
                                      inst.vmId,
                                      inst.status === 'running' ? 'STOP' : 'START',
                                      e
                                    )
                                  }
                                  disabled={actionLoadingId === inst.vmId}
                                  title={inst.status === 'running' ? 'Power Off' : 'Power On'}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    inst.status === 'running'
                                      ? 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                      : 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                                  }`}
                                >
                                  <Power className={`w-4 h-4 ${actionLoadingId === inst.vmId ? 'animate-spin' : ''}`} />
                                </button>

                                {/* RESIZE SPECS BUTTON */}
                                <button
                                  onClick={(e) => openResizeModal(inst, e)}
                                  title="Scale CPU & RAM Specs"
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>
                                
                                {/* DELETE ACTION BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingInstance(inst);
                                  }}
                                  title="Terminate / Destroy Server"
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLACEHOLDER FOR OTHER TABS */}
        {!['dashboard', 'vms', 'settings'].includes(activeTab) && (
          <div className="max-w-7xl mx-auto bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 font-medium">
            Section <strong className="capitalize text-slate-800">{activeTab}</strong> is under construction.
          </div>
        )}

      </main>

      {/* SCALE / RESIZE HARDWARE SPECS MODAL */}
      {resizingInstance && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setResizingInstance(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-poppins">
                  Scale Hardware Specs
                </h3>
                <p className="text-xs text-slate-500">
                  Target VM: <strong className="text-slate-800">{resizingInstance.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleResizeSubmit} className="space-y-6 mt-6">
              {/* CPU CORES SLIDER */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" /> vCPU Cores
                  </span>
                  <span className="text-blue-600 font-bold text-sm">{resizeCpu} Cores</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={resizeCpu}
                  onChange={(e) => setResizeCpu(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 Core</span>
                  <span>4 Cores</span>
                  <span>8 Cores</span>
                  <span>16 Cores</span>
                </div>
              </div>

              {/* RAM SLIDER */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <MemoryStick className="w-4 h-4 text-purple-600" /> RAM Memory
                  </span>
                  <span className="text-purple-600 font-bold text-sm">{resizeRam} GB RAM</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="64"
                  step="2"
                  value={resizeRam}
                  onChange={(e) => setResizeRam(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>2 GB</span>
                  <span>16 GB</span>
                  <span>32 GB</span>
                  <span>64 GB</span>
                </div>
              </div>

              {/* NVME STORAGE SLIDER */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-amber-600" /> NVMe Storage Disk
                  </span>
                  <span className="text-amber-600 font-bold text-sm">{resizeStorage} GB NVMe</span>
                </div>
                <input
                  type="range"
                  min={resizingInstance.diskGB}
                  max="500"
                  step="10"
                  value={resizeStorage}
                  onChange={(e) => setResizeStorage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{resizingInstance.diskGB} GB (Current)</span>
                  <span>100 GB</span>
                  <span>250 GB</span>
                  <span>500 GB</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Dynamic expansion: Virtual disks can be scaled up dynamically without data loss. Disk shrinking is not supported to protect file system data.
                </p>
              </div>

              {/* DYNAMIC PRICE PREVIEW */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Updated Monthly Rate</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Current: ${resizingInstance.monthlyPrice}/mo
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-blue-950 font-poppins">
                    ${resizePricing?.newPrice || resizingInstance.monthlyPrice}
                    <span className="text-xs font-normal text-slate-500">/mo</span>
                  </p>
                  {resizePricing && resizePricing.priceDelta !== 0 && (
                    <span className={`text-[10px] font-bold ${resizePricing.priceDelta > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {resizePricing.priceDelta > 0 ? `+$${resizePricing.priceDelta}/mo upgrade` : `-$${Math.abs(resizePricing.priceDelta)}/mo downgrade`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResizingInstance(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resizeLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {resizeLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adjusting Specs...
                    </>
                  ) : (
                    'Apply Specification Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPLOY NEW INSTANCE MODAL */}
      {isDeployOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsDeployOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
              Deploy New Virtual Machine
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Instant Generation 2 Hyper-V provisioning from enterprise image templates.
            </p>

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Server Hostname / Tag
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. app-prod-01"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating System / Master Image
                </label>
                <select
                  value={selectedImageId}
                  onChange={(e) => setSelectedImageId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                >
                  {catalogImages.map((img) => (
                    <option key={img.imageId} value={img.imageId}>
                      {img.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Plan Tier
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                >
                  {catalogPlans.map((p) => (
                    <option key={p.planId} value={p.planId}>
                      {p.name} — {p.cpuCores} vCPU / {p.ramGb}GB RAM (${p.monthlyPrice}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    vCPU Cores
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={customCpu}
                    onChange={(e) => setCustomCpu(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RAM (GB)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="64"
                    value={customRam}
                    onChange={(e) => setCustomRam(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NVMe Disk (GB)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    step="10"
                    value={customStorage}
                    onChange={(e) => setCustomStorage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* REAL-TIME DYNAMIC PRICING PREVIEW / PREPAID ACTIVE SLOT */}
              {activeSlot ? (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Included in Active Plan: {activeSlot.planName}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    You have an active VPS slot with <strong>{activeSlot.daysRemaining} days remaining</strong> (valid until {activeSlot.endDate}). This instance will be provisioned under your prepaid package at zero additional charge.
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Estimated Due Now</span>
                    <span className="text-sm font-extrabold text-emerald-600 font-poppins">
                      $0.00 (Prepaid Slot)
                    </span>
                  </div>
                </div>
              ) : (() => {
                const plan = catalogPlans.find((p) => p.planId === selectedPlanId) || catalogPlans[0];
                if (!plan) return null;
                const extraCpu = Math.max(0, customCpu - plan.cpuCores);
                const extraRam = Math.max(0, customRam - plan.ramGb);
                const extraStorage = Math.max(0, customStorage - plan.storageGb);
                const delta = extraCpu * 2.5 + extraRam * 1.5 + extraStorage * 0.10;
                const total = Number(plan.monthlyPrice) + delta;

                return (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Base Plan ({plan.name})</span>
                      <span className="font-semibold text-slate-700">${plan.monthlyPrice}/mo</span>
                    </div>
                    {delta > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-blue-600 font-medium">
                        <span>Resource Scaling (+{extraCpu} vCPU, +{extraRam}GB RAM{extraStorage > 0 ? `, +${extraStorage}GB NVMe` : ''})</span>
                        <span>+${delta.toFixed(2)}/mo</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Live Estimated Rate</span>
                      <span className="text-sm font-extrabold text-blue-600 font-poppins">
                        ${total.toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deployLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {deployLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Provisioning Server...
                    </>
                  ) : (
                    'Provision Server'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / TERMINATE CONFIRMATION MODAL */}
      {deletingInstance && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">
                Destroy Virtual Machine
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Are you sure you want to permanently terminate <strong className="text-slate-900 font-mono">{deletingInstance.name}</strong> ({deletingInstance.ip})?
              The Hyper-V VM and all associated VHDX storage will be unlinked and deleted, and its IP will be released.
            </p>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Your Active Subscription Stays Intact</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Destroying this instance frees up your server slot. You can deploy a fresh VPS anytime at <strong>$0.00</strong> during your 30-day billing cycle.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingInstance(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteInstance}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all"
              >
                Destroy Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVER DETAIL SIDEBAR DRAWER */}
      {selectedInstance && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex justify-end transition-all"
          onClick={() => setSelectedInstance(null)}
        >
          <div 
            className="bg-white w-full max-w-lg h-full border-l border-slate-200 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="space-y-6">
              {/* DRAWER HEADER (Never hidden behind navbar; elevated z-index & prominent close button) */}
              <div className="sticky -top-6 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-md z-30 border-b border-slate-100 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg font-poppins">
                      {selectedInstance.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-500">{selectedInstance.hostname}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInstance(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
                  title="Close Details Panel (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>

              {/* SSH CONNECTION STRING */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" /> Terminal SSH Access
                </label>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono flex items-center justify-between gap-2 border border-slate-800">
                  <span>ssh root@{selectedInstance.ip}</span>
                  <button
                    onClick={() => handleCopySSH(selectedInstance.ip)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                    title="Copy SSH Command"
                  >
                    {copiedSSH ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SPECS GRID */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hardware Specifications
                  </h4>
                  <button
                    onClick={(e) => openResizeModal(selectedInstance, e)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" /> Resize Specs
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Cpu className="w-3.5 h-3.5" /> vCPU Cores
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedInstance.vCPU} Cores</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <MemoryStick className="w-3.5 h-3.5" /> Memory
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedInstance.ramGB} GB RAM</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <HardDrive className="w-3.5 h-3.5" /> NVMe Storage
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedInstance.diskGB} GB</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <DollarSign className="w-3.5 h-3.5" /> Monthly Rate
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">${selectedInstance.monthlyPrice}/mo</p>
                  </div>
                </div>
              </div>

              {/* EVENT REBOOT LOGS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hyper-V Status & Health
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">Cluster Heartbeat Active</p>
                      <p className="text-[10px] text-slate-400">VM state synced with host 192.168.100.92</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* DRAWER FOOTER ACTIONS */}
            <div className="pt-6 border-t border-slate-100 flex items-center gap-2.5">
              <button
                onClick={() => setSelectedInstance(null)}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs transition-all border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>

              <button
                onClick={(e) =>
                  handlePowerAction(
                    selectedInstance.vmId,
                    selectedInstance.status === 'running' ? 'STOP' : 'START',
                    e
                  )
                }
                disabled={actionLoadingId === selectedInstance.vmId}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border ${
                  selectedInstance.status === 'running'
                    ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Power className={`w-4 h-4 ${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}`} />
                {selectedInstance.status === 'running' ? 'Power Off' : 'Power On'}
              </button>

              <button
                onClick={() => setDeletingInstance(selectedInstance)}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
                Destroy
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}