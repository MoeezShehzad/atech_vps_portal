import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Shield,
  Gauge,
  TrendingUp,
  LineChart,
  Wifi,
  Key,
  Eye,
  EyeOff,
  Camera,
  KeyRound,
  DownloadCloud,
  Boxes,
  Pause,
  Play,
  ArrowUpDown,
  Globe,
  Lock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import AccountSettings from '../components/AccountSettings';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { apiCall } from '../services/api';
import { useNavigate } from 'react-router-dom';
import WindowsResourceGraph from '../components/WindowsResourceGraph';

const WebConsoleModal = React.lazy(() => import('../components/WebConsoleModal'));
const SecurityAndLogs = React.lazy(() => import('../components/SecurityAndLogs'));
const StorageAndDisks = React.lazy(() => import('../components/StorageAndDisks'));
const BillingAndInvoices = React.lazy(() => import('../components/BillingAndInvoices'));
const ConnectionGuideModal = React.lazy(() => import('../components/ConnectionGuideModal'));
const SupportAndTickets = React.lazy(() => import('../components/SupportAndTickets'));

interface Instance {
  id: string;
  vmId: number;
  name: string;
  hostname: string;
  ip: string;
  adminUser?: string;
  adminPassword?: string;
  os: string;
  status: 'running' | 'stopped' | 'provisioning' | 'paused' | string;
  cpuUsage: number;
  ramUsage: string;
  diskUsage: string;
  vCPU: number;
  ramGB: number;
  diskGB: number;
  bandwidthGb?: number;
  bandwidthUsedGb?: number;
  backupEnabled?: boolean;
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

interface VMMetrics {
  found: boolean;
  vmName: string;
  vmId?: string;
  state: string;
  status?: string;
  uptime?: string;
  processorCount?: number;
  cpuUsage: number;
  avgCpu: number;
  ramTotalMb: number;
  ramUsedMb: number;
  ramPercent: number;
  diskTotalGb: number;
  diskUsedGb: number;
  diskPercent: number;
  diskReadMb: number;
  diskWriteMb: number;
  ipAddresses?: string[];
  heartbeat?: string;
  timestamp: string;
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

interface ResizePricing {
  newPrice: number;
  priceDelta: number;
  daysRemaining?: number;
  totalDays?: number;
  unusedOldCredit?: number;
  proratedNewCost?: number;
  dueToday?: number;
  hourlyRate?: number;
  nextBillingDate?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const mainContentRef = useRef<HTMLElement>(null);

  // Reset scroll to top immediately when user changes tabs from the sidebar
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Real-time server state from API
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Advanced VM features state
  const [connectGuideVm, setConnectGuideVm] = useState<Instance | null>(null);
  const [vmSnapshots, setVmSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [snapshotActionLoading, setSnapshotActionLoading] = useState(false);

  // Automated Scheduled Backups state ($2/mo add-on)
  const [vmBackups, setVmBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [isAutoBackupActive, setIsAutoBackupActive] = useState(false);
  const [backupActionLoading, setBackupActionLoading] = useState(false);

  // Cloud Firewall (Security Groups) state
  const [vmFirewallRules, setVmFirewallRules] = useState<any[]>([]);
  const [firewallLoading, setFirewallLoading] = useState(false);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRuleProtocol, setNewRuleProtocol] = useState('TCP');
  const [newRulePort, setNewRulePort] = useState('80');
  const [newRuleCidr, setNewRuleCidr] = useState('0.0.0.0/0');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [newRuleType, setNewRuleType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [firewallActionLoading, setFirewallActionLoading] = useState(false);

  // Deploy modal add-on state
  const [deployBackupsEnabled, setDeployBackupsEnabled] = useState(false);

  // Reset Password Modal state
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordTargetVm, setResetPasswordTargetVm] = useState<Instance | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Rebuild VM Modal state
  const [isRebuildOpen, setIsRebuildOpen] = useState(false);
  const [rebuildTargetVm, setRebuildTargetVm] = useState<Instance | null>(null);
  const [rebuildImageId, setRebuildImageId] = useState<number>(1);
  const [rebuildPassword, setRebuildPassword] = useState('');
  const [rebuildConfirmHostname, setRebuildConfirmHostname] = useState('');
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscription[]>([]);
  const [catalogPlans, setCatalogPlans] = useState<PlanOption[]>([]);
  const [catalogImages, setCatalogImages] = useState<ImageOption[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [powerConfirmVm, setPowerConfirmVm] = useState<{ vmId: number; name: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'paused'>('all');

  // Modals state
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [drawerShowPassword, setDrawerShowPassword] = useState(false);
  const [copiedDrawerPassword, setCopiedDrawerPassword] = useState(false);
  const [deletingInstance, setDeletingInstance] = useState<Instance | null>(null);
  const [resizingInstance, setResizingInstance] = useState<Instance | null>(null);
  const [copiedSSH, setCopiedSSH] = useState(false);

  // Real-time telemetry monitoring for selected instance
  const [liveMetrics, setLiveMetrics] = useState<VMMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array(20).fill(0));
  const [ramHistory, setRamHistory] = useState<number[]>(() => Array(20).fill(0));
  const [diskHistory, setDiskHistory] = useState<number[]>(() => Array(20).fill(0));
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);

  // Deploy form state
  const [newHostname, setNewHostname] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [selectedImageId, setSelectedImageId] = useState<number>(1);
  const [customCpu, setCustomCpu] = useState<number>(2);
  const [customRam, setCustomRam] = useState<number>(4);
  const [customStorage, setCustomStorage] = useState<number>(50);
  const [deployUsername, setDeployUsername] = useState('ubuntu');
  const [deployPassword, setDeployPassword] = useState('root');
  const [showPassword, setShowPassword] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);

  // 1-Click Apps selection state inside Deploy Modal
  const [deployTab, setDeployTab] = useState<'os' | 'apps'>('os');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [marketplaceApps, setMarketplaceApps] = useState<any[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [appCategory, setAppCategory] = useState('all');

  // Web Terminal Console state
  const [consoleVm, setConsoleVm] = useState<Instance | null>(null);

  // Deploy SSH Key selection state
  const [authMethod, setAuthMethod] = useState<'password' | 'sshKey'>('password');
  const [userSSHKeys, setUserSSHKeys] = useState<{ keyId: number; name: string; fingerprint: string; keyType: string }[]>([]);
  const [selectedSSHKeyId, setSelectedSSHKeyId] = useState<number | 'custom'>('custom');
  const [customSSHPublicKey, setCustomSSHPublicKey] = useState('');

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDeployPassword(pass);
    setShowPassword(true);
  };

  // Resize form state
  const [resizeCpu, setResizeCpu] = useState<number>(2);
  const [resizeRam, setResizeRam] = useState<number>(4);
  const [resizeStorage, setResizeStorage] = useState<number>(50);
  const [resizePricing, setResizePricing] = useState<ResizePricing | null>(null);
  const [resizeLoading, setResizeLoading] = useState(false);

  // 1. Fetch user VMs and catalog from API
  const fetchVMs = useCallback(async () => {
    try {
      const data = await apiCall('/vms');
      if (data) {
        if (data.vms) setInstances(data.vms);
        if (data.activeSubscriptions) setActiveSubscriptions(data.activeSubscriptions);
      }
    } catch (err) {
      console.error('Failed to load user VMs:', err);
    }
  }, []);

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

  // Periodic background sync: Keeps VM power states updated (e.g., if user ran 'sudo poweroff' or 'sudo reboot' inside guest OS)
  useEffect(() => {
    if (Boolean(consoleVm)) return;
    const timer = setInterval(() => {
      fetchVMs();
    }, 12000);
    return () => clearInterval(timer);
  }, [Boolean(consoleVm)]);

  // Active VM selected for live dashboard telemetry
  const [activeTelemetryVmId, setActiveTelemetryVmId] = useState<number | null>(null);

  // Auto-select first running VM (or first VM) for main dashboard telemetry
  useEffect(() => {
    if (instances.length > 0) {
      const runningVm = instances.find((i) => i.status === 'running');
      if (runningVm) {
        if (!activeTelemetryVmId || !instances.some((i) => i.vmId === activeTelemetryVmId)) {
          setActiveTelemetryVmId(runningVm.vmId);
        }
      } else if (!activeTelemetryVmId || !instances.some((i) => i.vmId === activeTelemetryVmId)) {
        setActiveTelemetryVmId(instances[0].vmId);
      }
    } else {
      setActiveTelemetryVmId(null);
      setLiveMetrics(null);
    }
  }, [instances]);

  // Real-time telemetry monitoring (polls every 5 seconds for active dashboard VM)
  const fetchTelemetryMetrics = async (vmId: number) => {
    try {
      const data: VMMetrics = await apiCall(`/vms/${vmId}/metrics`);
      if (data) {
        setLiveMetrics(data);
        const cpuVal = Math.min(100, Math.max(0, data.avgCpu !== undefined ? data.avgCpu : (data.cpuUsage || 0)));
        const ramVal = Math.min(100, Math.max(0, data.ramPercent || 0));
        const diskVal = Math.min(100, Math.max(0, data.diskPercent || 0));
        setCpuHistory((prev) => [...prev.slice(1), cpuVal]);
        setRamHistory((prev) => [...prev.slice(1), ramVal]);
        setDiskHistory((prev) => [...prev.slice(1), diskVal]);

        // If telemetry detects VM state changed to Off, immediately refresh dashboard instances
        const currentInstance = instances.find((i) => i.vmId === vmId);
        if (currentInstance && data.state) {
          const liveState = data.state.toLowerCase();
          if (liveState !== currentInstance.status) {
            fetchVMs();
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load VM metrics:', err);
    }
  };

  useEffect(() => {
    if (!activeTelemetryVmId || Boolean(consoleVm)) {
      setLiveMetrics(null);
      setCpuHistory(Array(20).fill(0));
      setRamHistory(Array(20).fill(0));
      setDiskHistory(Array(20).fill(0));
      return;
    }

    setMetricsLoading(true);
    fetchTelemetryMetrics(activeTelemetryVmId).finally(() => setMetricsLoading(false));

    // Telemetry polling interval (5 seconds)
    const metricsTimer = setInterval(() => {
      fetchTelemetryMetrics(activeTelemetryVmId);
    }, 5000);

    return () => clearInterval(metricsTimer);
  }, [activeTelemetryVmId, Boolean(consoleVm)]);

  // Handle Escape key to close any active drawer or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedInstance(null);
        setResizingInstance(null);
        setIsDeployOpen(false);
        setDeletingInstance(null);
        setConsoleVm(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch saved SSH keys when deploy modal opens
  useEffect(() => {
    if (isDeployOpen) {
      apiCall('/ssh-keys')
        .then((data) => {
          if (data && data.keys && data.keys.length > 0) {
            setUserSSHKeys(data.keys);
            setSelectedSSHKeyId(data.keys[0].keyId);
          } else {
            setUserSSHKeys([]);
            setSelectedSSHKeyId('custom');
          }
        })
        .catch((err) => console.warn('Could not load SSH keys for deploy:', err));

      apiCall('/apps')
        .then((data) => {
          if (data && data.apps) {
            setMarketplaceApps(data.apps);
          }
        })
        .catch(() => {});
    }
  }, [isDeployOpen]);

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

  // Open deploy modal pre-filled with a specific plan (or redirect to checkout if payment required)
  const handleQuickDeploy = (plan: PlanOption) => {
    const matchingSlot = activeSubscriptions.find((s) => s.hasAvailableSlot && s.planId === plan.planId);
    if (!matchingSlot) {
      toast.info(`Configure and order ${plan.name} to continue.`);
      navigate('/configure', { state: { selectedPlan: plan } });
      return;
    }
    setSelectedPlanId(plan.planId);
    setCustomCpu(plan.cpuCores);
    setCustomRam(plan.ramGb);
    setCustomStorage(plan.storageGb);
    setNewHostname(`vps-${plan.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 899 + 100)}`);
    setIsDeployOpen(true);
  };

  // Power action (START / STOP / RESTART / PAUSE / RESUME)
  const executePowerAction = async (vmId: number, action: 'START' | 'STOP' | 'RESTART' | 'PAUSE' | 'RESUME') => {
    setActionLoadingId(vmId);
    try {
      const res = await apiCall(`/vms/${vmId}/power`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      await fetchVMs();
      if (selectedInstance && selectedInstance.vmId === vmId) {
        let nextStatus = 'stopped';
        if (action === 'START' || action === 'RESTART' || action === 'RESUME') nextStatus = 'running';
        else if (action === 'PAUSE') nextStatus = 'paused';
        setSelectedInstance({ ...selectedInstance, status: nextStatus });
      }
      toast.success(res?.message || `VM ${action.toLowerCase()} completed.`);
    } catch (err: any) {
      toast.error(err.message || 'Error executing power command', 'Power Action Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePowerAction = async (vmId: number, action: 'START' | 'STOP' | 'RESTART' | 'PAUSE' | 'RESUME', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (action === 'STOP') {
      const target = instances.find((i) => i.vmId === vmId);
      setPowerConfirmVm({ vmId, name: target ? target.name : `Virtual Machine #${vmId}` });
      return;
    }
    await executePowerAction(vmId, action);
  };

  // Deploy submit handler
  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;

    if (!activeSlot) {
      toast.warning('Payment required. Please purchase a VPS plan through checkout before deploying.');
      const targetPlan = catalogPlans.find((p) => p.planId === selectedPlanId) || catalogPlans[0];
      navigate('/configure', { state: { selectedPlan: targetPlan } });
      return;
    }

    if (authMethod === 'sshKey' && selectedSSHKeyId === 'custom' && !customSSHPublicKey.trim()) {
      toast.warning('Please paste a valid OpenSSH public key or select an existing key.');
      return;
    }

    setDeployLoading(true);
    try {
      const payload: any = {
        vmName: newHostname.trim(),
        planId: selectedPlanId,
        imageId: selectedImageId,
        customCpu,
        customRam,
        customStorage,
        username: deployUsername.trim() || 'ubuntu',
        password: deployPassword.trim() || 'root',
        authMethod,
        appId: deployTab === 'apps' && selectedAppId ? selectedAppId : undefined,
        enableBackups: deployBackupsEnabled,
      };

      if (authMethod === 'sshKey') {
        if (selectedSSHKeyId !== 'custom') {
          payload.sshKeyId = selectedSSHKeyId;
        } else {
          payload.sshPublicKey = customSSHPublicKey.trim();
        }
      }

      await apiCall('/vms/deploy', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(`Server '${newHostname}' deployed successfully.`);
      if (deployUsername.trim()) {
        try {
          localStorage.setItem('atech_preferred_admin_user', deployUsername.trim());
        } catch {}
      }
      setIsDeployOpen(false);
      setNewHostname('');
      setDeployPassword('');
      setCustomSSHPublicKey('');
      setDeployBackupsEnabled(false);
      await fetchVMs();
    } catch (err: any) {
      toast.error(err.message || 'Check cluster capacity', 'Deployment Failed');
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
          setResizePricing(data);
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
      toast.success(`Specs scaled to ${resizeCpu} vCPU, ${resizeRam}GB RAM, ${resizeStorage}GB NVMe.`);
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
      toast.error(err.message, 'Resize Failed');
    } finally {
      setResizeLoading(false);
    }
  };

  // Terminate/Delete instance handler (with optional force flag)
  const confirmDeleteInstance = async (force: boolean = false) => {
    if (!deletingInstance) return;
    const targetId = deletingInstance.vmId;

    setActionLoadingId(targetId);
    try {
      await apiCall(`/vms/${targetId}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
      });
      toast.success(`Server '${deletingInstance.name}' destroyed.`);
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

  // Helper to power off the server directly from the Destroy modal
  const handleStopThenDestroy = async () => {
    if (!deletingInstance) return;
    setActionLoadingId(deletingInstance.vmId);
    try {
      await apiCall(`/vms/${deletingInstance.vmId}/power`, {
        method: 'POST',
        body: JSON.stringify({ action: 'STOP' }),
      });
      toast.info(`Server '${deletingInstance.name}' power off requested.`);
      // Transition deleting instance state to stopped so modal advances to final confirmation
      setDeletingInstance({ ...deletingInstance, status: 'stopped' });
      setInstances((prev) =>
        prev.map((i) => (i.vmId === deletingInstance.vmId ? { ...i, status: 'stopped' } : i))
      );
      if (selectedInstance?.vmId === deletingInstance.vmId) {
        setSelectedInstance({ ...selectedInstance, status: 'stopped' });
      }
    } catch (err: any) {
      toast.error(err.message, 'Failed to Power Off');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Fetch snapshots for selected instance
  const fetchSnapshots = async (vmId: number) => {
    try {
      setSnapshotsLoading(true);
      const res = await apiCall(`/vms/${vmId}/snapshots`);
      setVmSnapshots(res.snapshots || []);
    } catch (err: any) {
      console.warn('Snapshot fetch error:', err);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  // Fetch Backups for selected instance
  const fetchBackups = async (vmId: number) => {
    try {
      setBackupsLoading(true);
      const res = await apiCall(`/vms/${vmId}/backups`);
      setVmBackups(res.backups || []);
      setIsAutoBackupActive(Boolean(res.backupEnabled));
    } catch (err: any) {
      console.warn('Backups fetch error:', err);
    } finally {
      setBackupsLoading(false);
    }
  };

  // Fetch Firewall Rules for selected instance
  const fetchFirewallRules = async (vmId: number) => {
    try {
      setFirewallLoading(true);
      const res = await apiCall(`/vms/${vmId}/firewall`);
      setVmFirewallRules(res.rules || []);
    } catch (err: any) {
      console.warn('Firewall fetch error:', err);
    } finally {
      setFirewallLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstance) {
      fetchSnapshots(selectedInstance.vmId);
      fetchBackups(selectedInstance.vmId);
      fetchFirewallRules(selectedInstance.vmId);
    } else {
      setVmSnapshots([]);
      setVmBackups([]);
      setVmFirewallRules([]);
    }
  }, [selectedInstance?.vmId]);

  // Create Snapshot
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance) return;
    try {
      setSnapshotActionLoading(true);
      const res = await apiCall(`/vms/${selectedInstance.vmId}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({ name: newSnapshotName }),
      });
      toast.success(`Checkpoint '${res.snapshot?.name || newSnapshotName || 'Snapshot'}' created.`);
      setNewSnapshotName('');
      fetchSnapshots(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create snapshot');
    } finally {
      setSnapshotActionLoading(false);
    }
  };

  // Restore Snapshot
  const handleRestoreSnapshot = async (snapshotId: number, name: string) => {
    if (!selectedInstance) return;
    if (!window.confirm(`Are you sure you want to roll back ${selectedInstance.name} to checkpoint '${name}'? Uncommitted disk changes will be reverted.`)) return;
    try {
      setSnapshotActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/snapshots/${snapshotId}/restore`, {
        method: 'POST',
      });
      toast.success(`Successfully rolled back to checkpoint '${name}'.`);
      await fetchVMs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore snapshot');
    } finally {
      setSnapshotActionLoading(false);
    }
  };

  // Delete Snapshot
  const handleDeleteSnapshot = async (snapshotId: number, name: string) => {
    if (!selectedInstance) return;
    try {
      setSnapshotActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
      });
      toast.success(`Snapshot '${name}' removed.`);
      fetchSnapshots(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete snapshot');
    } finally {
      setSnapshotActionLoading(false);
    }
  };

  // Create Manual Backup Now
  const handleCreateBackup = async () => {
    if (!selectedInstance) return;
    try {
      setBackupActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/backups`, {
        method: 'POST',
        body: JSON.stringify({ label: `Manual Point - ${new Date().toLocaleDateString()}` }),
      });
      toast.success('Disaster recovery backup snapshot created.');
      fetchBackups(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create backup');
    } finally {
      setBackupActionLoading(false);
    }
  };

  // Restore Server from Backup
  const handleRestoreBackup = async (backupId: string, location: string) => {
    if (!selectedInstance) return;
    if (!window.confirm(`CRITICAL DISASTER RECOVERY: Restore ${selectedInstance.name} to '${location}'? Current disk state will be rolled back.`)) return;
    try {
      setBackupActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/backups/${backupId}/restore`, {
        method: 'POST',
      });
      toast.success(`Server rolled back to backup successfully.`);
      await fetchVMs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore backup');
    } finally {
      setBackupActionLoading(false);
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (backupId: string) => {
    if (!selectedInstance) return;
    try {
      setBackupActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/backups/${backupId}`, {
        method: 'DELETE',
      });
      toast.success('Backup recovery point deleted.');
      fetchBackups(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete backup');
    } finally {
      setBackupActionLoading(false);
    }
  };

  // Toggle Automated Daily Backups ($2.00/mo)
  const handleToggleAutoBackups = async (enable: boolean) => {
    if (!selectedInstance) return;
    try {
      setBackupActionLoading(true);
      const res = await apiCall(`/vms/${selectedInstance.vmId}/toggle-backups`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: enable }),
      });
      setIsAutoBackupActive(res.backupEnabled);
      toast.success(res.message || (enable ? 'Automated daily backups enabled ($2.00/mo).' : 'Automated backups disabled.'));
      await fetchVMs();
      fetchBackups(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update backup plan');
    } finally {
      setBackupActionLoading(false);
    }
  };

  // Add Firewall Rule
  const handleAddFirewallRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstance) return;
    try {
      setFirewallActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/firewall/rules`, {
        method: 'POST',
        body: JSON.stringify({
          direction: newRuleType,
          protocol: newRuleProtocol,
          port: newRulePort,
          cidr: newRuleCidr || '0.0.0.0/0',
          action: 'ALLOW',
          description: newRuleDescription.trim() || `${newRuleProtocol} Port ${newRulePort}`,
        }),
      });
      toast.success(`Cloud firewall rule added for port ${newRulePort}.`);
      setIsAddRuleOpen(false);
      setNewRuleDescription('');
      fetchFirewallRules(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add firewall rule');
    } finally {
      setFirewallActionLoading(false);
    }
  };

  // Delete Firewall Rule
  const handleDeleteFirewallRule = async (ruleId: string) => {
    if (!selectedInstance) return;
    try {
      setFirewallActionLoading(true);
      await apiCall(`/vms/${selectedInstance.vmId}/firewall/rules/${ruleId}`, {
        method: 'DELETE',
      });
      toast.success('Firewall rule removed.');
      fetchFirewallRules(selectedInstance.vmId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete firewall rule');
    } finally {
      setFirewallActionLoading(false);
    }
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordTargetVm) return;
    if (!newResetPassword || newResetPassword.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    try {
      setResetPasswordLoading(true);
      await apiCall(`/vms/${resetPasswordTargetVm.vmId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: newResetPassword }),
      });
      toast.success(`Password updated for ${resetPasswordTargetVm.name}`);
      setIsResetPasswordOpen(false);
      setNewResetPassword('');
      if (selectedInstance && selectedInstance.vmId === resetPasswordTargetVm.vmId) {
        setSelectedInstance({ ...selectedInstance, adminPassword: newResetPassword });
      }
      await fetchVMs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Rebuild VM Submit
  const handleRebuildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebuildTargetVm) return;
    if (rebuildConfirmHostname !== rebuildTargetVm.hostname && rebuildConfirmHostname !== rebuildTargetVm.name) {
      toast.warning(`Please type "${rebuildTargetVm.name}" to confirm rebuild`);
      return;
    }
    try {
      setRebuildLoading(true);
      await apiCall(`/vms/${rebuildTargetVm.vmId}/rebuild`, {
        method: 'POST',
        body: JSON.stringify({
          imageId: rebuildImageId,
          adminPassword: rebuildPassword || undefined,
        }),
      });
      toast.success(`Rebuild initiated for ${rebuildTargetVm.name} with clean image.`);
      setIsRebuildOpen(false);
      setSelectedInstance(null);
      await fetchVMs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to rebuild VM');
    } finally {
      setRebuildLoading(false);
    }
  };

  // Aggregate stats
  const totalStorage = instances.reduce((acc, inst) => acc + inst.diskGB, 0);
  const runningCount = instances.filter((i) => i.status === 'running').length;
  const stoppedCount = instances.filter((i) => i.status === 'stopped').length;
  const pausedCount = instances.filter((i) => i.status === 'paused').length;
  const activeSlot = activeSubscriptions.find((s) => s.hasAvailableSlot);

  const handleOpenDeployModal = () => {
    const targetPlan = (activeSlot ? catalogPlans.find((p) => p.planId === activeSlot.planId) : null) || catalogPlans[0];
    if (!activeSlot) {
      toast.info('Please configure and order a VPS package to deploy your instance.');
      navigate('/configure', { state: { selectedPlan: targetPlan } });
      return;
    }
    if (targetPlan) {
      setSelectedPlanId(targetPlan.planId);
      setCustomCpu(targetPlan.cpuCores);
      setCustomRam(targetPlan.ramGb);
      setCustomStorage(targetPlan.storageGb);
    }
    const randId = Math.floor(1000 + Math.random() * 9000);
    setNewHostname(`srv-vps-${randId}`);
    setDeployUsername('ubuntu');
    setDeployPassword('root');
    setDeployTab('os');
    setSelectedAppId('');
    setAppSearch('');
    setIsDeployOpen(true);
  };

  const handleCopySSH = (target: string) => {
    const cmd = target.startsWith('ssh ') ? target : `ssh ${target}`;
    navigator.clipboard.writeText(cmd);
    setCopiedSSH(true);
    setTimeout(() => setCopiedSSH(false), 2000);
  };

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
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans">
      {/* PERSISTENT SIDEBAR */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* DYNAMIC CONTENT CONTAINER */}
      <main ref={mainContentRef} className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* GHOST MODE IMPERSONATION BANNER */}
        {user?.isImpersonated && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px]">GHOST MODE</span>
              <span>You are viewing this portal as <strong>{user.email}</strong> (Impersonated by {user.impersonatedBy || 'Admin'}).</span>
            </div>
            <button
              onClick={() => {
                const orig = sessionStorage.getItem('originalAdminToken');
                if (orig) {
                  localStorage.setItem('accessToken', orig);
                  sessionStorage.removeItem('originalAdminToken');
                }
                window.location.href = '/admin';
              }}
              className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-xs"
            >
              Exit Impersonation
            </button>
          </div>
        )}

        {/* RENDER ACCOUNT SETTINGS WHEN TAB IS SETTINGS */}
        {activeTab === 'settings' && <AccountSettings />}
        {/* RENDER SECURITY & AUDIT LOGS WHEN TAB IS SECURITY */}
        {activeTab === 'security' && (
          <React.Suspense fallback={
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          }>
            <SecurityAndLogs />
          </React.Suspense>
        )}

        {/* RENDER STORAGE & VIRTUAL DISKS */}
        {activeTab === 'storage' && (
          <React.Suspense fallback={
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          }>
            <StorageAndDisks />
          </React.Suspense>
        )}

        {/* RENDER BILLING & INVOICES */}
        {activeTab === 'billing' && (
          <React.Suspense fallback={
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          }>
            <BillingAndInvoices />
          </React.Suspense>
        )}

        {/* RENDER SUPPORT & HELPDESK */}
        {activeTab === 'support' && (
          <React.Suspense fallback={
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          }>
            <SupportAndTickets />
          </React.Suspense>
        )}

        {/* RENDER DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* MINIMALIST COMPACT HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-poppins">
                  Virtual Machines
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {instances.length} {instances.length === 1 ? 'server' : 'servers'}
                </span>
                {runningCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {runningCount} active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {/* IN-APP REAL-TIME NOTIFICATION BELL */}
                <NotificationBell />

                {/* IOS-STYLE THEME TOGGLE */}
                <ThemeToggle />

                <button 
                  onClick={() => fetchVMs()}
                  title="Refresh instances"
                  className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
                <button 
                  onClick={handleOpenDeployModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" /> {activeSlot ? 'Deploy Instance' : 'Order New VPS'}
                </button>
              </div>
            </div>

            {/* ACTIVE SUBSCRIPTION AVAILABLE SLOT BANNER */}
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
                      onClick={handleOpenDeployModal}
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
                      {activeSlot ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Active VPS Subscription Slot Reserved</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> High-Performance Cloud Infrastructure
                        </>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-poppins">
                      {activeSlot ? `Deploy Your Reserved ${activeSlot.planName} Server` : 'Launch Your First Virtual Private Server'}
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                      {activeSlot
                        ? `Your ${activeSlot.planName} package is active and your dedicated cloud resources are reserved on our cluster. Whenever you're ready, click below to pick your OS, set admin credentials, or choose 1-Click Apps.`
                        : `You don't have any active virtual servers yet. Select a certified package below to provision dedicated vCPUs, enterprise NVMe storage, and static IPv4 in seconds.`}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-4">
                      <button
                        onClick={handleOpenDeployModal}
                        className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                          activeSlot
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/30'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30'
                        }`}
                      >
                        <Zap className="w-4 h-4" /> {activeSlot ? '⚡ Deploy Reserved Server Now' : 'Configure & Order VPS'}
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
                              {activeSubscriptions.some((s) => s.hasAvailableSlot && s.planId === plan.planId) ? (
                                <>Deploy Instance <ArrowUpRight className="w-3.5 h-3.5" /></>
                              ) : (
                                <>Configure & Order <ArrowUpRight className="w-3.5 h-3.5" /></>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* UNUSED ACTIVE SUBSCRIPTION SLOT BANNER */}
            {instances.length > 0 && activeSubscriptions.some((s) => s.hasAvailableSlot) && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                      You have {activeSubscriptions.filter((s) => s.hasAvailableSlot).length} unused VPS slot(s) ready for deployment!
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Your package is active. Whenever you are ready, configure and launch your virtual server.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOpenDeployModal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
                >
                  Deploy Available Slot Now →
                </button>
              </div>
            )}

            {/* INSTANCE TABLE SECTION (When user has active VMs) */}
            {instances.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                
                {/* TABLE CONTROLS & FILTER TABS */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* STATUS FILTER TABS */}
                  <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'all'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      All
                      <span className="bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md text-[10px]">
                        {instances.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('running')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'running'
                          ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Running
                      <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded-md text-[10px]">
                        {runningCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('paused')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'paused'
                          ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Paused
                      <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[10px]">
                        {pausedCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setStatusFilter('stopped')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'stopped'
                          ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Stopped
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md text-[10px]">
                        {stoppedCount}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {/* SEARCH INPUT */}
                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search instances or IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                      />
                    </div>

                    {/* TELEMETRY TOGGLE BUTTON */}
                    <button
                      onClick={() => setShowTelemetry(!showTelemetry)}
                      title={showTelemetry ? 'Hide Live Telemetry' : 'Show Live Telemetry'}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                        showTelemetry
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{showTelemetry ? 'Telemetry On' : 'Telemetry Off'}</span>
                    </button>
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5">Instance Name</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">IP Address</th>
                        <th className="px-6 py-3.5">Hardware Specs</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredInstances.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                            No virtual servers found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredInstances.map((inst) => (
                          <tr 
                            key={inst.id} 
                            onClick={() => setSelectedInstance(inst)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-3">
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
                                    : inst.status === 'paused'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : inst.status === 'provisioning'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    inst.status === 'running'
                                      ? 'bg-emerald-500'
                                      : inst.status === 'paused'
                                      ? 'bg-amber-500'
                                      : inst.status === 'provisioning'
                                      ? 'bg-blue-500 animate-ping'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                {inst.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{inst.ip}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {inst.vCPU} vCPU
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <MemoryStick className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> {inst.ramGB} GB RAM
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                  <HardDrive className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {inst.diskGB} GB NVMe
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <ArrowUpDown className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> {inst.bandwidthGb || 80} GB Transfer
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
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
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    inst.status === 'running'
                                      ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800'
                                  }`}
                                >
                                  <Power className={`w-3.5 h-3.5 ${actionLoadingId === inst.vmId ? 'animate-spin' : ''}`} />
                                </button>

                                {/* REBOOT BUTTON */}
                                <button
                                  onClick={(e) => handlePowerAction(inst.vmId, 'RESTART', e)}
                                  disabled={actionLoadingId === inst.vmId}
                                  title="Reboot / Restart Server"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === inst.vmId ? 'animate-spin' : ''}`} />
                                </button>

                                {/* PAUSE / RESUME BUTTON */}
                                <button
                                  onClick={(e) => handlePowerAction(inst.vmId, inst.status === 'paused' ? 'RESUME' : 'PAUSE', e)}
                                  disabled={actionLoadingId === inst.vmId || inst.status === 'stopped'}
                                  title={inst.status === 'paused' ? 'Resume Server' : 'Pause Server'}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    inst.status === 'stopped'
                                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                      : inst.status === 'paused'
                                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer'
                                  }`}
                                >
                                  {inst.status === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-indigo-500" />}
                                </button>

                                {/* SSH CONNECTION GUIDE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConnectGuideVm(inst);
                                  }}
                                  title="SSH Connection Guide (Terminal / PuTTY)"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* WEB TERMINAL CONSOLE BUTTON */}
                                {inst.status === 'running' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConsoleVm(inst);
                                    }}
                                    title="Open In-Browser Web Console Terminal"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer"
                                  >
                                    <Terminal className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* RESIZE SPECS BUTTON */}
                                <button
                                  onClick={(e) => openResizeModal(inst, e)}
                                  title="Scale CPU & RAM Specs"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* DELETE ACTION BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingInstance(inst);
                                  }}
                                  title="Terminate / Destroy Server"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

            {/* LIVE RESOURCE MONITORING & PERFORMANCE DASHBOARD */}
            {instances.length > 0 && showTelemetry && (() => {
              const activeMonitoringVm = instances.find((i) => i.vmId === activeTelemetryVmId) || instances[0];
              const isVmRunning = activeMonitoringVm?.status === 'running';

              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
                  {/* MONITORING HEADER WITH VM SELECTOR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-white font-poppins">
                            Live Server Telemetry & Resource Load
                          </h2>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVmRunning ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isVmRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                            {isVmRunning ? 'Real-Time Active' : 'Instance Standby'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          High-resolution telemetry stream directly from cloud compute nodes
                        </p>
                      </div>
                    </div>

                    {/* TARGET VM SELECTOR & REFRESH */}
                    <div className="flex items-center gap-3">
                      {instances.length > 1 && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
                          <Server className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <select
                            value={activeTelemetryVmId || activeMonitoringVm.vmId}
                            onChange={(e) => setActiveTelemetryVmId(Number(e.target.value))}
                            className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            {instances.map((inst) => (
                              <option key={inst.vmId} value={inst.vmId} className="dark:bg-slate-800 dark:text-white">
                                {inst.name} ({inst.status.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                        {metricsLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">⚡ 3.5s stream</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isVmRunning ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* 1. CPU LOAD & WINDOWS TASK MANAGER GRAPH */}
                      <div className="p-4 bg-gradient-to-br from-blue-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-blue-100/90 dark:border-blue-900/30 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Processor (vCPU)
                            </span>
                            <span className="text-lg font-mono font-extrabold text-blue-600 dark:text-blue-400">
                              {liveMetrics ? `${Math.min(100, Math.max(0, liveMetrics.avgCpu !== undefined ? liveMetrics.avgCpu : liveMetrics.cpuUsage))}%` : `${Math.min(100, activeMonitoringVm.cpuUsage)}%`}
                            </span>
                          </div>

                          {/* Windows Task Manager Performance Graph */}
                          <WindowsResourceGraph
                            data={cpuHistory}
                            color="blue"
                            unit="%"
                            timeLabel="60 seconds"
                            maxLabel="100%"
                            minLabel="0%"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-2 border-t border-blue-100/60 dark:border-slate-800">
                          <span>{activeMonitoringVm.vCPU} Cores Assigned</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">% Utilization</span>
                        </div>
                      </div>

                      {/* 2. RAM ALLOCATION & WINDOWS TASK MANAGER GRAPH */}
                      <div className="p-4 bg-gradient-to-br from-purple-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-purple-100/90 dark:border-purple-900/30 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <MemoryStick className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Memory (RAM)
                            </span>
                            <span className="text-lg font-mono font-extrabold text-purple-600 dark:text-purple-400">
                              {liveMetrics ? `${liveMetrics.ramPercent}%` : `${activeMonitoringVm.ramUsage}`}
                            </span>
                          </div>

                          {/* Windows Task Manager Performance Graph */}
                          <WindowsResourceGraph
                            data={ramHistory}
                            color="purple"
                            unit="%"
                            timeLabel="60 seconds"
                            maxLabel="100%"
                            minLabel="0%"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-2 border-t border-purple-100/60 dark:border-slate-800">
                          <span>{liveMetrics?.ramUsedMb ? `${liveMetrics.ramUsedMb} MB` : 'Active'} used</span>
                          <span>{liveMetrics?.ramTotalMb ? `${liveMetrics.ramTotalMb} MB` : `${activeMonitoringVm.ramGB} GB`} Cap</span>
                        </div>
                      </div>

                      {/* 3. NVME STORAGE & PERFORMANCE GRAPH */}
                      <div className="p-4 bg-gradient-to-br from-amber-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-amber-100/90 dark:border-amber-900/30 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" /> NVMe Virtual Storage
                            </span>
                            <span className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400">
                              {liveMetrics ? `${liveMetrics.diskPercent}%` : '20%'}
                            </span>
                          </div>

                          {/* Windows Task Manager Performance Graph */}
                          <WindowsResourceGraph
                            data={diskHistory}
                            color="amber"
                            unit="%"
                            timeLabel="60 seconds"
                            maxLabel="100%"
                            minLabel="0%"
                          />

                          <div className="mt-2.5 bg-white/80 dark:bg-slate-950/60 p-2.5 rounded-xl border border-amber-100/70 dark:border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-500 dark:text-slate-400">Physical Size:</span>
                              <strong className="text-slate-800 dark:text-slate-200">
                                {liveMetrics?.diskUsedGb !== undefined ? `${liveMetrics.diskUsedGb} GB` : `${Math.round(activeMonitoringVm.diskGB * 0.2)} GB`} / {activeMonitoringVm.diskGB} GB
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800/80 font-mono">
                              <span className="text-slate-500 dark:text-slate-400">Read: <strong className="text-slate-700 dark:text-slate-300">{liveMetrics?.diskReadMb || 0} MB</strong></span>
                              <span className="text-slate-500 dark:text-slate-400">Write: <strong className="text-slate-700 dark:text-slate-300">{liveMetrics?.diskWriteMb || 0} MB</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-2 border-t border-amber-100/60 dark:border-slate-800">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Uptime: {liveMetrics?.uptime || 'Active'}
                          </span>
                          <span>Status: {liveMetrics?.status || 'Normal'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <Power className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {activeMonitoringVm.name} is Powered Off
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                        Power on this virtual machine to start streaming real-time CPU usage, memory demand, and NVMe disk throughput directly to this dashboard.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {/* PLACEHOLDER FOR OTHER TABS */}
        {!['dashboard', 'vms', 'settings', 'security', 'storage', 'pools', 'billing', 'support'].includes(activeTab) && (
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

              {/* GOOGLE-STYLE PRORATED PRICE PREVIEW */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>Billing Cycle Status:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {resizePricing?.daysRemaining ?? 15} days remaining in cycle
                  </span>
                </div>

                {resizePricing?.unusedOldCredit !== undefined && resizePricing.priceDelta > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Unused Current Plan Credit ({resizePricing.daysRemaining}d):</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        -${resizePricing.unusedOldCredit?.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Prorated Upgraded Specs ({resizePricing.daysRemaining}d):</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                        +${resizePricing.proratedNewCost?.toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">Amount Due Today (Prorated):</p>
                    <p className="text-[10px] text-slate-400">
                      ~${resizePricing?.hourlyRate || '0.00'}/hr equivalent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      ${resizePricing?.dueToday !== undefined ? resizePricing.dueToday.toFixed(2) : (resizePricing?.newPrice || resizingInstance.monthlyPrice)}
                      <span className="text-xs font-normal text-slate-500"> USD</span>
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between">
                  <span>Next Recurring Monthly Bill:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    ${resizePricing?.newPrice || resizingInstance.monthlyPrice}/mo
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResizingInstance(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resizeLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {resizeLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adjusting Specs...
                    </>
                  ) : (
                    `Apply Specification Changes ${resizePricing?.dueToday ? `($${resizePricing.dueToday.toFixed(2)})` : ''}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPLOY NEW INSTANCE MODAL */}
      {isDeployOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setIsDeployOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-poppins mb-1">
              Deploy New Virtual Machine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Provision an enterprise cloud instance with a Clean OS or 1-Click Pre-Installed Application.
            </p>

            {/* DEPLOYMENT MODE TABS */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 border border-slate-200/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setDeployTab('os');
                  setSelectedAppId('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  deployTab === 'os'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                Clean OS Distribution
              </button>
              <button
                type="button"
                onClick={() => setDeployTab('apps')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  deployTab === 'apps'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                1-Click Apps (Marketplace)
              </button>
            </div>

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Server Hostname / Tag
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. app-prod-01"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>

              {/* 1-CLICK APPS MARKETPLACE SELECTOR */}
              {deployTab === 'apps' ? (
                <div className="space-y-3 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/70">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select 1-Click Application
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      {selectedAppId ? `App Selected` : `Choose from 50+ Apps`}
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search apps (docker, wordpress, aapanel, nextcloud, redis, etc.)..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Scrollable Apps Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                    {marketplaceApps
                      .filter((app) => {
                        const q = appSearch.trim().toLowerCase();
                        return (
                          !q ||
                          app.name.toLowerCase().includes(q) ||
                          app.description.toLowerCase().includes(q) ||
                          (app.tags && app.tags.some((t: string) => t.toLowerCase().includes(q)))
                        );
                      })
                      .map((app) => {
                        const isSelected = selectedAppId === app.id;
                        return (
                          <div
                            key={app.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAppId('');
                              } else {
                                setSelectedAppId(app.id);
                                if (app.minRamGb && app.minRamGb > customRam) {
                                  setCustomRam(app.minRamGb);
                                }
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                                : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                {app.name}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span>Port {app.defaultPort}</span>
                              <span className="font-mono">v{app.version}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {selectedAppId ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Pre-installing <strong>{marketplaceApps.find(a => a.id === selectedAppId)?.name || selectedAppId}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAppId('')}
                        className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Click an application above to have it pre-installed automatically on first boot.
                    </p>
                  )}
                </div>
              ) : (
                /* CLEAN OS SELECTOR */
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operating System / Master Image
                  </label>
                  <select
                    value={selectedImageId}
                    onChange={(e) => setSelectedImageId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                  >
                    {catalogImages.map((img) => (
                      <option key={img.imageId} value={img.imageId}>
                        {img.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* PLAN SELECTION: If already purchased, hide plan selection as requested. If new user, show plan selector */}
              {activeSlot ? (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Using Active Plan Slot: <strong className="text-emerald-700 dark:text-emerald-400">{activeSlot.planName}</strong> ({activeSlot.specs?.cpuCores} vCPU, {activeSlot.specs?.ramGb}GB RAM, {activeSlot.specs?.storageGb}GB NVMe)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">$0.00 / Prepaid</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Cloud Plan Tier
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => handlePlanChange(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    >
                      {catalogPlans.map((p) => (
                        <option key={p.planId} value={p.planId}>
                          {p.name} — {p.cpuCores} vCPU / {p.ramGb}GB RAM / {p.storageGb}GB NVMe (${p.monthlyPrice}/mo)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        vCPU Cores
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={customCpu}
                        onChange={(e) => setCustomCpu(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        RAM (GB)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="64"
                        value={customRam}
                        onChange={(e) => setCustomRam(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        NVMe Disk (GB)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="500"
                        step="10"
                        value={customStorage}
                        onChange={(e) => setCustomStorage(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  {(() => {
                    const plan = catalogPlans.find((p) => p.planId === selectedPlanId) || catalogPlans[0];
                    if (!plan) return null;
                    const extraCpu = Math.max(0, customCpu - plan.cpuCores);
                    const extraRam = Math.max(0, customRam - plan.ramGb);
                    const extraStorage = Math.max(0, customStorage - plan.storageGb);
                    const delta = extraCpu * 2.5 + extraRam * 1.5 + extraStorage * 0.10;
                    const backupFee = deployBackupsEnabled ? 2.00 : 0.00;
                    const total = Number(plan.monthlyPrice) + delta + backupFee;

                    return (
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Base Plan ({plan.name})</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">${plan.monthlyPrice}/mo</span>
                        </div>
                        {delta > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            <span>Resource Scaling (+{extraCpu} vCPU, +{extraRam}GB RAM{extraStorage > 0 ? `, +${extraStorage}GB NVMe` : ''})</span>
                            <span>+${delta.toFixed(2)}/mo</span>
                          </div>
                        )}
                        {deployBackupsEnabled && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Automated Scheduled Backups Add-on</span>
                            <span>+$2.00/mo</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimated Monthly Rate</span>
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-poppins">
                            ${total.toFixed(2)}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* SERVER AUTHENTICATION (PASSWORD vs SSH PUBLIC KEY) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Authentication Method
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SSH & Root Access</span>
                </div>

                {/* AUTH METHOD SELECTOR TABS */}
                <div className="grid grid-cols-2 gap-2 bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('password')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      authMethod === 'password'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Password Auth</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('sshKey')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      authMethod === 'sshKey'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>SSH Public Key</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={authMethod === 'sshKey' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      required
                      value={deployUsername}
                      onChange={(e) => setDeployUsername(e.target.value)}
                      placeholder="e.g. admin or custom user"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Custom admin account for SSH & sudo access</p>
                  </div>

                  {authMethod === 'password' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Root / Admin Password
                        </label>
                        <button
                          type="button"
                          onClick={generateStrongPassword}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          Generate Strong
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={deployPassword}
                          onChange={(e) => setDeployPassword(e.target.value)}
                          placeholder="Secure server password"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 pr-8 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Encrypted credentials for initial server login</p>
                    </div>
                  ) : null}
                </div>

                {authMethod === 'sshKey' && (
                  <div className="space-y-2.5 pt-1">
                    {userSSHKeys.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Select Saved SSH Key
                        </label>
                        <select
                          value={selectedSSHKeyId}
                          onChange={(e) => setSelectedSSHKeyId(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 transition-all"
                        >
                          {userSSHKeys.map((k) => (
                            <option key={k.keyId} value={k.keyId}>
                              {k.name} ({k.keyType} - {k.fingerprint.slice(0, 20)}...)
                            </option>
                          ))}
                          <option value="custom">+ Paste a new OpenSSH public key</option>
                        </select>
                      </div>
                    )}

                    {(selectedSSHKeyId === 'custom' || userSSHKeys.length === 0) && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          OpenSSH Public Key
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={customSSHPublicKey}
                          onChange={(e) => setCustomSSHPublicKey(e.target.value)}
                          placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user@laptop"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 transition-all"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Paste public key from <code className="text-slate-600 dark:text-slate-400">~/.ssh/id_ed25519.pub</code> or <code className="text-slate-600 dark:text-slate-400">~/.ssh/id_rsa.pub</code>.
                        </p>
                      </div>
                    )}

                    <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        Injected directly into guest authorized_keys
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDeployOpen(false);
                          setActiveTab('settings');
                        }}
                        className="text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:underline"
                      >
                        Manage Keys →
                      </button>
                    </div>
                  </div>
                )}

                {/* AUTOMATED SCHEDULED BACKUPS OPTIONAL ADD-ON ($2.00/MO) */}
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3 transition-colors">
                  <input
                    type="checkbox"
                    id="deployBackupOption"
                    checked={deployBackupsEnabled}
                    onChange={(e) => setDeployBackupsEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="deployBackupOption" className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Enable Automated Scheduled Backups
                      </span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 font-mono">
                        +$2.00/mo
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Daily enterprise recovery snapshots stored in off-host backup cluster with 1-click disaster recovery rollback. Retains 7 rolling daily checkpoints.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                {activeSlot ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeployOpen(false);
                      const targetPlan = catalogPlans.find((p) => p.planId === selectedPlanId) || catalogPlans[0];
                      navigate('/configure', { state: { selectedPlan: targetPlan } });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>💳 Proceed to Checkout & Pay →</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP FOR POWER OFF (STOP) */}
      {powerConfirmVm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">Power Off Machine?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Graceful shutdown command will be issued to the server</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              Are you sure you want to stop <strong className="text-slate-900 dark:text-white font-bold">{powerConfirmVm.name}</strong>? Any unsaved processes or temporary memory cache inside the virtual machine will be halted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPowerConfirmVm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = powerConfirmVm.vmId;
                  setPowerConfirmVm(null);
                  executePowerAction(id, 'STOP');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" /> Confirm Power Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / TERMINATE CONFIRMATION MODAL (ENTERPRISE GUARD) */}
      {deletingInstance && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {deletingInstance.status === 'running' ? (
              /* ACTIVE RUNNING SERVER GUARD */
              <>
                <div className="flex items-center gap-3 text-amber-600 mb-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl">
                    <Power className="w-6 h-6 text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-poppins">
                      Server is Currently Running
                    </h3>
                    <p className="text-[11px] text-amber-600 font-semibold">
                      Power off required before termination
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  <strong className="text-slate-900 font-mono">{deletingInstance.name}</strong> ({deletingInstance.ip}) is currently active and running. For cloud data protection and storage integrity, active virtual machines must be powered off before permanent termination.
                </p>

                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 mb-5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Recommended Enterprise Procedure</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Click <strong>"Power Off Server First"</strong> to shut down the machine cleanly. Once stopped, you can complete the destruction.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeletingInstance(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === deletingInstance.vmId}
                    onClick={() => confirmDeleteInstance(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all text-center"
                  >
                    Force Stop & Destroy
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === deletingInstance.vmId}
                    onClick={handleStopThenDestroy}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    {actionLoadingId === deletingInstance.vmId ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Stopping Server...
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5" /> Power Off Server First
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* STOPPED SERVER DESTROY CONFIRMATION */
              <>
                <div className="flex items-center gap-3 text-rose-600 mb-3">
                  <div className="p-2.5 bg-rose-50 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-poppins">
                      Destroy Virtual Machine
                    </h3>
                    <p className="text-[11px] text-slate-400">Server status: Stopped</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Are you sure you want to permanently terminate <strong className="text-slate-900 font-mono">{deletingInstance.name}</strong> ({deletingInstance.ip})?
                  The virtual machine and all associated storage will be unlinked and deleted, and its IP will be released.
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
                    disabled={actionLoadingId === deletingInstance.vmId}
                    onClick={() => confirmDeleteInstance(false)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
                  >
                    {actionLoadingId === deletingInstance.vmId ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Destroying...
                      </>
                    ) : (
                      'Destroy Server'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SERVER DETAIL SIDEBAR DRAWER */}
      {selectedInstance && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex justify-end transition-all"
          onClick={() => setSelectedInstance(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-xl h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="p-6 md:p-7 space-y-6">
              {/* DRAWER HEADER */}
              <div className="sticky -top-6 -mx-6 md:-mx-7 -mt-6 px-6 md:px-7 py-4.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                    <Server className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg font-poppins truncate">
                        {selectedInstance.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedInstance.status === 'running'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedInstance.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                        {selectedInstance.status === 'running' ? 'RUNNING' : 'STOPPED'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {selectedInstance.hostname} • <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedInstance.ip}</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedInstance(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                  title="Close Details Panel (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>

              {/* SECTION 1: ACCESS & CREDENTIALS CARD */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Terminal SSH Access
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Port 22
                  </span>
                </div>

                {/* SSH Command Box */}
                <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl text-xs font-mono flex items-center justify-between gap-3 border border-slate-800 shadow-inner">
                  <span className="truncate select-all text-emerald-400">
                    ssh {selectedInstance.adminUser || 'ubuntu'}@{selectedInstance.ip}
                  </span>
                  <button
                    onClick={() => handleCopySSH(`ssh ${selectedInstance.adminUser || 'ubuntu'}@${selectedInstance.ip}`)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="Copy SSH Command"
                  >
                    {copiedSSH ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Credentials Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>User:</span>
                    </div>
                    <strong className="text-slate-900 dark:text-white font-mono">{selectedInstance.adminUser || 'ubuntu'}</strong>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Pass:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {drawerShowPassword ? (selectedInstance.adminPassword || 'root') : '••••••••'}
                      </strong>
                      <button
                        onClick={() => setDrawerShowPassword(!drawerShowPassword)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={drawerShowPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {drawerShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedInstance.adminPassword || 'root');
                          setCopiedDrawerPassword(true);
                          setTimeout(() => setCopiedDrawerPassword(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedDrawerPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Web Console Button */}
                {selectedInstance.status === 'running' ? (
                  <button
                    onClick={() => {
                      const target = selectedInstance;
                      setSelectedInstance(null);
                      setConsoleVm(target);
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Terminal className="w-4 h-4 text-emerald-300" />
                    <span>Launch Web Terminal Console</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-300/60 dark:border-slate-700/60">
                    <Terminal className="w-4 h-4 opacity-50" />
                    <span>Web Console Available When Running</span>
                  </div>
                )}
              </div>

              {/* SECTION 2: QUICK VM OPERATIONS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Management Actions
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConnectGuideVm(selectedInstance)}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                    title="SSH / PuTTY connection commands"
                  >
                    <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Connect Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordTargetVm(selectedInstance);
                      setNewResetPassword('');
                      setIsResetPasswordOpen(true);
                    }}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                    title="Reset guest root/admin password"
                  >
                    <Key className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Reset Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRebuildTargetVm(selectedInstance);
                      setRebuildPassword('');
                      setRebuildConfirmHostname('');
                      setIsRebuildOpen(true);
                    }}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                    title="Rebuild VM with clean OS"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span>Rebuild OS</span>
                  </button>
                </div>
              </div>

              {/* SECTION 3: HARDWARE SPECIFICATIONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Hardware Specifications
                  </h4>
                  <button
                    onClick={(e) => openResizeModal(selectedInstance, e)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Resize Specs
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                      <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>vCPU Cores</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{selectedInstance.vCPU} Cores</p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                      <MemoryStick className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Memory</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{selectedInstance.ramGB} GB RAM</p>
                  </div>

                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>NVMe Storage</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">{selectedInstance.diskGB} GB</p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: BANDWIDTH & DATA TRANSFER QUOTA */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Monthly Bandwidth & Traffic Quota
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-400">
                    1 Gbps Dedicated Link
                  </span>
                </div>

                {(() => {
                  const quotaGb = selectedInstance.bandwidthGb || 80;
                  const usedGb = selectedInstance.bandwidthUsedGb || parseFloat((((selectedInstance.vmId * 7.3 + 14.2) % (quotaGb * 0.7)) + 4.2).toFixed(1));
                  const percent = Math.min(100, Math.round((usedGb / quotaGb) * 100));

                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Data Transferred this cycle:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {usedGb} GB <span className="text-slate-400 font-normal">/ {quotaGb} GB</span> ({percent}%)
                        </strong>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                        <span>Cycle resets on 1st of month</span>
                        <span>{quotaGb - usedGb > 0 ? `${(quotaGb - usedGb).toFixed(1)} GB remaining` : 'Quota limit reached'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 5: AUTOMATED SCHEDULED BACKUPS ($2.00/MO) */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Automated Scheduled Backups
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      +$2.00/mo
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAutoBackups(!isAutoBackupActive)}
                    disabled={backupActionLoading}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      isAutoBackupActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {backupActionLoading ? 'Updating...' : isAutoBackupActive ? '✓ Active ($2/mo)' : '+ Enable ($2/mo)'}
                  </button>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Retention: <strong>7 Rolling Daily Recovery Points</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={backupActionLoading}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {backupActionLoading ? 'Working...' : '+ Create Backup Now'}
                  </button>
                </div>

                {backupsLoading ? (
                  <div className="py-3 text-center text-xs text-slate-400">Loading backup recovery points...</div>
                ) : vmBackups.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
                    No scheduled backups yet. Enable automated daily backups or take a manual backup above.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pt-1">
                    {vmBackups.map((b: any) => (
                      <div key={b.backupId} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">{b.backupLocation.split('/').pop().trim()}</strong>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                              {b.backupType}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(b.createdAt).toLocaleString()} • {b.backupSizeGb ? `${b.backupSizeGb} GB` : '4.2 GB'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(b.backupId, b.backupLocation)}
                            disabled={backupActionLoading}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                            title="Restore server from this backup point"
                          >
                            Restore Server
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBackup(b.backupId)}
                            disabled={backupActionLoading}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete recovery snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 6: CLOUD FIREWALL (SECURITY GROUPS) */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Cloud Firewall & Security Groups
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddRuleOpen(!isAddRuleOpen)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddRuleOpen ? 'Cancel' : 'Add Rule'}</span>
                  </button>
                </div>

                {/* ADD RULE INLINE FORM */}
                {isAddRuleOpen && (
                  <form onSubmit={handleAddFirewallRule} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>New Security Rule</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-normal">Presets:</span>
                        <button
                          type="button"
                          onClick={() => { setNewRuleType('INBOUND'); setNewRuleProtocol('TCP'); setNewRulePort('22'); setNewRuleDescription('SSH Access'); }}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] hover:text-blue-600 cursor-pointer"
                        >
                          SSH
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewRuleType('INBOUND'); setNewRuleProtocol('TCP'); setNewRulePort('80'); setNewRuleDescription('HTTP Web'); }}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] hover:text-blue-600 cursor-pointer"
                        >
                          HTTP
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewRuleType('INBOUND'); setNewRuleProtocol('TCP'); setNewRulePort('443'); setNewRuleDescription('HTTPS Web'); }}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] hover:text-blue-600 cursor-pointer"
                        >
                          HTTPS
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewRuleType('INBOUND'); setNewRuleProtocol('TCP'); setNewRulePort('3306'); setNewRuleDescription('MySQL Database'); }}
                          className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] hover:text-blue-600 cursor-pointer"
                        >
                          MySQL
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Direction</label>
                        <select
                          value={newRuleType}
                          onChange={(e: any) => setNewRuleType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="INBOUND">Inbound</option>
                          <option value="OUTBOUND">Outbound</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Protocol</label>
                        <select
                          value={newRuleProtocol}
                          onChange={(e) => setNewRuleProtocol(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="TCP">TCP</option>
                          <option value="UDP">UDP</option>
                          <option value="ICMP">ICMP</option>
                          <option value="ALL">ALL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Port / Range</label>
                        <input
                          type="text"
                          required
                          value={newRulePort}
                          onChange={(e) => setNewRulePort(e.target.value)}
                          placeholder="e.g. 80, 8080"
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Source CIDR</label>
                        <input
                          type="text"
                          required
                          value={newRuleCidr}
                          onChange={(e) => setNewRuleCidr(e.target.value)}
                          placeholder="0.0.0.0/0"
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Rule label or description"
                        value={newRuleDescription}
                        onChange={(e) => setNewRuleDescription(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddRuleOpen(false)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={firewallActionLoading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {firewallActionLoading ? 'Saving...' : 'Apply Rule'}
                      </button>
                    </div>
                  </form>
                )}

                {/* RULES LIST */}
                {firewallLoading ? (
                  <div className="py-3 text-center text-xs text-slate-400">Loading firewall rules...</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {vmFirewallRules.map((rule: any) => (
                      <div
                        key={rule.id}
                        className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              rule.direction === 'INBOUND'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                            }`}
                          >
                            {rule.direction}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                              {rule.protocol} {rule.port}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-2">from {rule.cidr}</span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{rule.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                            {rule.action}
                          </span>
                          {!rule.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFirewallRule(rule.id)}
                              disabled={firewallActionLoading}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 7: CHECKPOINTS & SNAPSHOTS */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Checkpoints & Snapshots
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    {vmSnapshots.length} snapshot{vmSnapshots.length === 1 ? '' : 's'}
                  </span>
                </div>

                <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Snapshot name (e.g. pre-update)"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={snapshotActionLoading || !newSnapshotName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {snapshotActionLoading ? 'Saving...' : 'Take Snapshot'}
                  </button>
                </form>

                {snapshotsLoading ? (
                  <div className="py-3 text-center text-xs text-slate-400">Loading checkpoints...</div>
                ) : vmSnapshots.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
                    No snapshots created yet. Take a snapshot to preserve system state.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pt-1">
                    {vmSnapshots.map((snap: any) => (
                      <div key={snap.snapshotId || snap.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">{snap.name || snap.snapshotName}</strong>
                          <div className="text-[10px] text-slate-400">{new Date(snap.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                            disabled={snapshotActionLoading}
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-amber-200/60 dark:border-amber-800/60"
                            title="Roll back to this checkpoint"
                          >
                            Rollback
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                            disabled={snapshotActionLoading}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STICKY DRAWER FOOTER ACTIONS */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 md:p-5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedInstance(null)}
                className="py-2.5 px-3.5 rounded-xl font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                className={`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-xs ${
                  selectedInstance.status === 'running'
                    ? 'border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}`} />
                {selectedInstance.status === 'running' ? 'Power Off' : 'Power On'}
              </button>

              <button
                onClick={(e) => handlePowerAction(selectedInstance.vmId, 'RESTART', e)}
                disabled={actionLoadingId === selectedInstance.vmId || selectedInstance.status !== 'running'}
                className="py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                title="Reboot Guest VM"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}`} />
                Reboot
              </button>

              <button
                onClick={(e) =>
                  handlePowerAction(
                    selectedInstance.vmId,
                    selectedInstance.status === 'paused' ? 'RESUME' : 'PAUSE',
                    e
                  )
                }
                disabled={actionLoadingId === selectedInstance.vmId || (selectedInstance.status !== 'running' && selectedInstance.status !== 'paused')}
                className="py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                title={selectedInstance.status === 'paused' ? 'Resume VM Execution' : 'Pause (Suspend) VM Execution'}
              >
                {selectedInstance.status === 'paused' ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </>
                )}
              </button>

              <button
                onClick={() => setDeletingInstance(selectedInstance)}
                className="ml-auto py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Destroy
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INTERACTIVE WEB TERMINAL CONSOLE MODAL */}
      {consoleVm && (
        <React.Suspense fallback={null}>
          <WebConsoleModal
            vmId={consoleVm.vmId}
            vmName={consoleVm.name}
            vmIp={consoleVm.ip}
            adminUser={consoleVm.adminUser}
            adminPassword={consoleVm.adminPassword}
            onClose={() => setConsoleVm(null)}
            onSessionEnd={fetchVMs}
          />
        </React.Suspense>
      )}

      {/* CONNECTION HELPER MODAL */}
      {connectGuideVm && (
        <React.Suspense fallback={null}>
          <ConnectionGuideModal
            isOpen={Boolean(connectGuideVm)}
            onClose={() => setConnectGuideVm(null)}
            vm={{
              name: connectGuideVm.name,
              ip: connectGuideVm.ip,
              adminUser: connectGuideVm.adminUser,
              adminPassword: connectGuideVm.adminPassword,
              os: connectGuideVm.os,
            }}
            onOpenWebConsole={() => {
              const target = connectGuideVm;
              if (target.status !== 'running') {
                toast.info(`Server '${target.name}' is currently powered off. Please start the server to launch Web Console.`);
                return;
              }
              setConnectGuideVm(null);
              setConsoleVm(target);
            }}
          />
        </React.Suspense>
      )}

      {/* RESET GUEST PASSWORD MODAL */}
      {isResetPasswordOpen && resetPasswordTargetVm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsResetPasswordOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Reset Admin Password</h3>
                <p className="text-xs text-slate-500">
                  Target VM: <strong className="font-mono text-slate-800">{resetPasswordTargetVm.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Root / Admin Password</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
                      let p = '';
                      for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                      setNewResetPassword(p);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900">
                <p className="text-[11px] leading-relaxed">
                  This command updates the guest password directly. VM does not need to restart.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordLoading || !newResetPassword}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {resetPasswordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REBUILD VM MODAL */}
      {isRebuildOpen && rebuildTargetVm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsRebuildOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Rebuild Operating System</h3>
                <p className="text-xs text-slate-500">
                  Target VM: <strong className="font-mono text-slate-800">{rebuildTargetVm.name}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleRebuildSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select OS Image</label>
                <select
                  value={rebuildImageId}
                  onChange={(e) => setRebuildImageId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  {catalogImages.map((img) => (
                    <option key={img.imageId} value={img.imageId}>
                      {img.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Root Password</label>
                <input
                  type="text"
                  value={rebuildPassword}
                  onChange={(e) => setRebuildPassword(e.target.value)}
                  placeholder="Leave blank to preserve current"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-900 space-y-1">
                <strong className="flex items-center gap-1 text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Caution: All data will be erased
                </strong>
                <p className="text-[11px] leading-relaxed">
                  Rebuilding replaces the root disk with a fresh master image. Your IP address and subscription specs will remain unchanged.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Type <span className="font-mono text-rose-600">{rebuildTargetVm.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={rebuildConfirmHostname}
                  onChange={(e) => setRebuildConfirmHostname(e.target.value)}
                  placeholder={rebuildTargetVm.name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRebuildOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rebuildLoading || rebuildConfirmHostname !== rebuildTargetVm.name}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  {rebuildLoading ? 'Rebuilding...' : 'Confirm Rebuild'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}