import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import AccountSettings from '../components/AccountSettings';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import { apiCall } from '../services/api';

const WebConsoleModal = React.lazy(() => import('../components/WebConsoleModal'));
const SecurityAndLogs = React.lazy(() => import('../components/SecurityAndLogs'));
const StorageAndDisks = React.lazy(() => import('../components/StorageAndDisks'));
const ResourcePools = React.lazy(() => import('../components/ResourcePools'));
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

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Real-time server state from API
  const [instances, setInstances] = useState<Instance[]>([]);

  // Advanced VM features state
  const [connectGuideVm, setConnectGuideVm] = useState<Instance | null>(null);
  const [vmSnapshots, setVmSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [snapshotActionLoading, setSnapshotActionLoading] = useState(false);

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
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');

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
  const [cpuHistory, setCpuHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [ramHistory, setRamHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Deploy form state
  const [newHostname, setNewHostname] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [selectedImageId, setSelectedImageId] = useState<number>(1);
  const [customCpu, setCustomCpu] = useState<number>(2);
  const [customRam, setCustomRam] = useState<number>(4);
  const [customStorage, setCustomStorage] = useState<number>(50);
  const [deployUsername, setDeployUsername] = useState(() => {
    try {
      return localStorage.getItem('atech_preferred_admin_user') || 'ubuntu';
    } catch {
      return 'ubuntu';
    }
  });
  const [deployPassword, setDeployPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);

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
  const [resizePricing, setResizePricing] = useState<{ newPrice: number; priceDelta: number } | null>(null);
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
    const timer = setInterval(() => {
      fetchVMs();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

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

  // Real-time telemetry monitoring (polls every 3 seconds for active dashboard VM)
  const fetchTelemetryMetrics = async (vmId: number) => {
    try {
      const data: VMMetrics = await apiCall(`/vms/${vmId}/metrics`);
      if (data) {
        setLiveMetrics(data);
        const cpuVal = Math.min(100, Math.max(0, data.avgCpu !== undefined ? data.avgCpu : (data.cpuUsage || 0)));
        const ramVal = Math.min(100, Math.max(0, data.ramPercent || 0));
        setCpuHistory((prev) => [...prev.slice(1), cpuVal]);
        setRamHistory((prev) => [...prev.slice(1), ramVal]);

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
    if (!activeTelemetryVmId) {
      setLiveMetrics(null);
      setCpuHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      setRamHistory([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      return;
    }

    setMetricsLoading(true);
    fetchTelemetryMetrics(activeTelemetryVmId).finally(() => setMetricsLoading(false));

    // Telemetry polling interval (3.5 seconds)
    const metricsTimer = setInterval(() => {
      fetchTelemetryMetrics(activeTelemetryVmId);
    }, 3500);

    return () => clearInterval(metricsTimer);
  }, [activeTelemetryVmId]);

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
      toast.error(err.message || 'Error executing power command', 'Power Action Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Deploy submit handler
  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;

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

  // Terminate/Delete instance handler (Hostinger standard with optional force flag)
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

  useEffect(() => {
    if (selectedInstance) {
      fetchSnapshots(selectedInstance.vmId);
    } else {
      setVmSnapshots([]);
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
  const activeSlot = activeSubscriptions.find((s) => s.hasAvailableSlot);

  const handleOpenDeployModal = () => {
    if (activeSlot) {
      setSelectedPlanId(activeSlot.planId);
      setCustomCpu(activeSlot.specs?.cpuCores || 2);
      setCustomRam(activeSlot.specs?.ramGb || 4);
      setCustomStorage(activeSlot.specs?.storageGb || 50);
      setNewHostname(`srv-${activeSlot.planName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 899 + 100)}`);
    } else {
      const defaultPlan = catalogPlans[0];
      if (defaultPlan) {
        setSelectedPlanId(defaultPlan.planId);
        setCustomCpu(defaultPlan.cpuCores);
        setCustomRam(defaultPlan.ramGb);
        setCustomStorage(defaultPlan.storageGb);
        setNewHostname(`srv-vps-${Math.floor(Math.random() * 899 + 100)}`);
      }
    }
    let savedUser = '';
    try {
      savedUser = localStorage.getItem('atech_preferred_admin_user') || '';
    } catch {}
    const autoUser = savedUser || (user?.email ? user.email.split('@')[0].replace(/[^a-z0-9_-]/g, '').toLowerCase() : 'ubuntu');
    setDeployUsername(autoUser || 'ubuntu');
    if (!deployPassword) {
      generateStrongPassword();
    }
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
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* HOSTINGER GHOST MODE IMPERSONATION BANNER */}
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

        {/* RENDER RESOURCE POOLS & QUOTAS */}
        {activeTab === 'pools' && (
          <React.Suspense fallback={
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          }>
            <ResourcePools />
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

        {/* RENDER DASHBOARD / VMS VIEWS */}
        {(activeTab === 'dashboard' || activeTab === 'vms') && (
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-blue-950 dark:text-white font-poppins">
                    Infrastructure Dashboard
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
                    Hyper-V Cluster Online
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage your virtual machines, scale RAM & CPU resources, and control power cycles.
                </p>
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
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" /> Deploy New Instance
                </button>
              </div>
            </div>

            {/* OVERVIEW METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Servers</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{instances.length} Configured</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Running Instances</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{runningCount} Active</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Allocated vCPUs</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {instances.reduce((acc, i) => acc + i.vCPU, 0)} Cores
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Storage Allocated</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalStorage} GB NVMe</p>
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

            {/* LIVE HYPER-V RESOURCE MONITORING & PERFORMANCE DASHBOARD */}
            {instances.length > 0 && (() => {
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
                            Live Hyper-V Telemetry & Resource Load
                          </h2>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVmRunning ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isVmRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                            {isVmRunning ? 'Real-Time Active' : 'Instance Standby'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          High-resolution telemetry stream directly from Windows Hyper-V Host cluster
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
                      {/* 1. CPU LOAD & HISTORICAL SPARKLINE */}
                      <div className="p-4 bg-gradient-to-br from-blue-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-blue-100/90 dark:border-blue-900/30 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Processor (vCPU)
                            </span>
                            <span className="text-lg font-mono font-extrabold text-blue-600 dark:text-blue-400">
                              {liveMetrics ? `${Math.min(100, Math.max(0, liveMetrics.avgCpu !== undefined ? liveMetrics.avgCpu : liveMetrics.cpuUsage))}%` : `${Math.min(100, activeMonitoringVm.cpuUsage)}%`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
                            <div 
                              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, liveMetrics?.avgCpu ?? activeMonitoringVm.cpuUsage))}%` }}
                            />
                          </div>
                          {/* Live 10-sample Sparkline */}
                          <div className="flex items-end gap-1.5 h-12 pt-2 px-2 bg-white/80 dark:bg-slate-950/60 rounded-xl border border-blue-100/70 dark:border-slate-800">
                            {cpuHistory.map((val, idx) => (
                              <div 
                                key={idx}
                                title={`Sample ${idx + 1}: ${val}%`}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-xs transition-all duration-300"
                                style={{ height: `${Math.max(10, Math.min(100, val))}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1 border-t border-blue-100/60 dark:border-slate-800">
                          <span>{activeMonitoringVm.vCPU} Cores Assigned</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">Live 10-tick trend</span>
                        </div>
                      </div>

                      {/* 2. RAM ALLOCATION & WORKLOAD */}
                      <div className="p-4 bg-gradient-to-br from-purple-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-purple-100/90 dark:border-purple-900/30 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <MemoryStick className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Memory (RAM)
                            </span>
                            <span className="text-lg font-mono font-extrabold text-purple-600 dark:text-purple-400">
                              {liveMetrics ? `${liveMetrics.ramPercent}%` : `${activeMonitoringVm.ramUsage}`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
                            <div 
                              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, liveMetrics?.ramPercent ?? 20))}%` }}
                            />
                          </div>
                          {/* Live 10-sample Sparkline */}
                          <div className="flex items-end gap-1.5 h-12 pt-2 px-2 bg-white/80 dark:bg-slate-950/60 rounded-xl border border-purple-100/70 dark:border-slate-800">
                            {ramHistory.map((val, idx) => (
                              <div 
                                key={idx}
                                title={`Sample ${idx + 1}: ${val}%`}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-xs transition-all duration-300"
                                style={{ height: `${Math.max(10, Math.min(100, val))}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1 border-t border-purple-100/60 dark:border-slate-800">
                          <span>{liveMetrics?.ramUsedMb ? `${liveMetrics.ramUsedMb} MB` : 'Active'} used</span>
                          <span>{liveMetrics?.ramTotalMb ? `${liveMetrics.ramTotalMb} MB` : `${activeMonitoringVm.ramGB} GB`} Cap</span>
                        </div>
                      </div>

                      {/* 3. NVME STORAGE VHDX & DISK THROUGHPUT */}
                      <div className="p-4 bg-gradient-to-br from-amber-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-amber-100/90 dark:border-amber-900/30 shadow-xs flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" /> NVMe Virtual Storage
                            </span>
                            <span className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400">
                              {liveMetrics ? `${liveMetrics.diskPercent}%` : '20%'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden mb-3">
                            <div 
                              className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, liveMetrics?.diskPercent ?? 20))}%` }}
                            />
                          </div>
                          <div className="bg-white/80 dark:bg-slate-950/60 p-3 rounded-xl border border-amber-100/70 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-500 dark:text-slate-400">Physical Size:</span>
                              <strong className="text-slate-800 dark:text-slate-200">
                                {liveMetrics?.diskUsedGb !== undefined ? `${liveMetrics.diskUsedGb} GB` : `${Math.round(activeMonitoringVm.diskGB * 0.2)} GB`}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-500 dark:text-slate-400">Allocated Cap:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{activeMonitoringVm.diskGB} GB NVMe</strong>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono">
                              <span className="text-slate-500 dark:text-slate-400">Read: <strong className="text-slate-700 dark:text-slate-300">{liveMetrics?.diskReadMb || 0} MB</strong></span>
                              <span className="text-slate-500 dark:text-slate-400">Write: <strong className="text-slate-700 dark:text-slate-300">{liveMetrics?.diskWriteMb || 0} MB</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1 border-t border-amber-100/60 dark:border-slate-800">
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
                        Power on this virtual machine to start streaming real-time Hyper-V CPU usage, memory demand, and NVMe disk throughput directly to this dashboard.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

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
                        <th className="px-6 py-3.5">Monthly Rate</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                            <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{inst.ip}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {inst.vCPU} vCPU
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <MemoryStick className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> {inst.ramGB} GB RAM
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-poppins text-xs">
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
                                      ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800'
                                  }`}
                                >
                                  <Power className={`w-4 h-4 ${actionLoadingId === inst.vmId ? 'animate-spin' : ''}`} />
                                </button>

                                {/* SSH CONNECTION GUIDE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConnectGuideVm(inst);
                                  }}
                                  title="SSH Connection Guide (Terminal / PuTTY)"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>

                                {/* WEB TERMINAL CONSOLE BUTTON */}
                                {inst.status === 'running' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConsoleVm(inst);
                                    }}
                                    title="Open In-Browser Web Console Terminal"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all"
                                  >
                                    <Terminal className="w-4 h-4" />
                                  </button>
                                )}

                                {/* RESIZE SPECS BUTTON */}
                                <button
                                  onClick={(e) => openResizeModal(inst, e)}
                                  title="Scale CPU & RAM Specs"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
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
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-all"
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

              {/* PLAN SELECTION OR ACTIVE PREPAID SLOT */}
              {activeSlot ? (
                <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 border border-emerald-500/40 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Prepaid Package
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      $0.00 / Free Slot
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeSlot.planName} Plan</span>
                      <span className="text-xs font-normal text-slate-300 font-mono">({activeSlot.daysRemaining} days remaining)</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      You have an active subscription package. Your instance will be provisioned directly under your plan at zero extra charge ($0.00).
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs text-slate-200 bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-sans">vCPU Cores</span>
                      <strong className="text-white text-xs">{activeSlot.specs?.cpuCores} vCPU</strong>
                    </div>
                    <div className="text-center border-x border-white/10">
                      <span className="block text-[10px] text-slate-400 font-sans">RAM</span>
                      <strong className="text-white text-xs">{activeSlot.specs?.ramGb} GB</strong>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-sans">NVMe Storage</span>
                      <strong className="text-emerald-300 text-xs">{activeSlot.specs?.storageGb} GB NVMe</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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

                  {(() => {
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
                </>
              )}

              {/* SERVER AUTHENTICATION (PASSWORD vs SSH PUBLIC KEY) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" /> Authentication Method
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">SSH & Root Access</span>
                </div>

                {/* AUTH METHOD SELECTOR TABS */}
                <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('password')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      authMethod === 'password'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Password Auth</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('sshKey')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      authMethod === 'sshKey'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Terminal className="w-3 h-3 text-blue-600" />
                    <span>SSH Public Key</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={authMethod === 'sshKey' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      required
                      value={deployUsername}
                      onChange={(e) => setDeployUsername(e.target.value)}
                      placeholder="e.g. admin or custom user"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Custom admin account for SSH & sudo access</p>
                  </div>

                  {authMethod === 'password' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Root / Admin Password
                        </label>
                        <button
                          type="button"
                          onClick={generateStrongPassword}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
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
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 pr-8 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Select Saved SSH Key
                        </label>
                        <select
                          value={selectedSSHKeyId}
                          onChange={(e) => setSelectedSSHKeyId(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 transition-all"
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          OpenSSH Public Key
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={customSSHPublicKey}
                          onChange={(e) => setCustomSSHPublicKey(e.target.value)}
                          placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user@laptop"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-600 transition-all"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Paste public key from <code className="text-slate-600">~/.ssh/id_ed25519.pub</code> or <code className="text-slate-600">~/.ssh/id_rsa.pub</code>.
                        </p>
                      </div>
                    )}

                    <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-[11px] text-blue-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        Injected directly into guest authorized_keys
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDeployOpen(false);
                          setActiveTab('settings');
                        }}
                        className="text-[10px] font-bold text-blue-700 hover:underline"
                      >
                        Manage Keys →
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                  <strong className="text-slate-900 font-mono">{deletingInstance.name}</strong> ({deletingInstance.ip}) is currently active and running. For cloud data protection and hypervisor integrity, active virtual machines must be powered off before permanent termination.
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
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex justify-end transition-all"
          onClick={() => setSelectedInstance(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg h-full border-l border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="space-y-6">
              {/* DRAWER HEADER (Never hidden behind navbar; elevated z-index & prominent close button) */}
              <div className="sticky -top-6 -mx-6 px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg font-poppins">
                      {selectedInstance.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{selectedInstance.hostname}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInstance(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                  title="Close Details Panel (Esc)"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>

              {/* SSH CONNECTION STRING & SERVER CREDENTIALS */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" /> Terminal SSH Access
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Port 22</span>
                </label>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono flex items-center justify-between gap-2 border border-slate-800 shadow-inner">
                  <span>ssh {selectedInstance.adminUser || 'ubuntu'}@{selectedInstance.ip}</span>
                  <button
                    onClick={() => handleCopySSH(`ssh ${selectedInstance.adminUser || 'ubuntu'}@${selectedInstance.ip}`)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-1"
                    title="Copy SSH Command"
                  >
                    {copiedSSH ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>User: <strong className="text-slate-800 font-mono">{selectedInstance.adminUser || 'ubuntu'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="text-slate-400">Pass:</span>
                    <strong className="text-slate-800 bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px]">
                      {drawerShowPassword ? (selectedInstance.adminPassword || 'root') : '••••••••'}
                    </strong>
                    <button
                      onClick={() => setDrawerShowPassword(!drawerShowPassword)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
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
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy Password"
                    >
                      {copiedDrawerPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* LAUNCH IN-BROWSER WEB CONSOLE */}
                {selectedInstance.status === 'running' ? (
                  <button
                    onClick={() => {
                      const target = selectedInstance;
                      setSelectedInstance(null);
                      setConsoleVm(target);
                    }}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Launch Web Terminal Console</span>
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-slate-200">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Web Console Available When Running</span>
                  </div>
                )}

                {/* ADVANCED VM ACTIONS ROW (CONNECT, RESET PASS, REBUILD) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConnectGuideVm(selectedInstance)}
                    className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-blue-200/60"
                    title="SSH / PuTTY connection commands"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordTargetVm(selectedInstance);
                      setNewResetPassword('');
                      setIsResetPasswordOpen(true);
                    }}
                    className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80"
                    title="Reset guest root/admin password"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRebuildTargetVm(selectedInstance);
                      setRebuildPassword('');
                      setRebuildConfirmHostname('');
                      setIsRebuildOpen(true);
                    }}
                    className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-200/60"
                    title="Rebuild VM with clean OS"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rebuild OS</span>
                  </button>
                </div>

                {/* CHECKPOINTS & SNAPSHOTS */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" /> Checkpoints & Snapshots
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {vmSnapshots.length} snapshot{vmSnapshots.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Snapshot name (e.g. pre-update)"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={snapshotActionLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
                    >
                      {snapshotActionLoading ? 'Saving...' : 'Snapshot'}
                    </button>
                  </form>

                  {snapshotsLoading ? (
                    <div className="py-2 text-center text-xs text-slate-400">Loading checkpoints...</div>
                  ) : vmSnapshots.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No snapshots created yet. Take a snapshot to save state.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {vmSnapshots.map((snap: any) => (
                        <div key={snap.snapshotId || snap.id} className="p-2 bg-white rounded-lg border border-slate-200/70 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-800 font-mono text-[11px]">{snap.name || snap.snapshotName}</strong>
                            <div className="text-[10px] text-slate-400">{new Date(snap.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                              disabled={snapshotActionLoading}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold transition-colors"
                              title="Roll back to this checkpoint"
                            >
                              Rollback
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                              disabled={snapshotActionLoading}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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

              {/* LIVE RESOURCE MONITORING & TELEMETRY */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedInstance.status === 'running' ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${selectedInstance.status === 'running' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </span>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> Live Resource Telemetry
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    {metricsLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                    ) : (
                      <>⚡ Polling 3s</>
                    )}
                  </span>
                </div>

                {selectedInstance.status === 'running' ? (
                  <div className="space-y-3">
                    {/* CPU & RAM LIVE METRICS CARDS */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* CPU MONITOR CARD */}
                      <div className="p-3.5 bg-gradient-to-br from-blue-50/60 to-slate-50 rounded-2xl border border-blue-100/80 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-blue-600" /> CPU Usage
                          </span>
                          <span className="text-xs font-mono font-bold text-blue-600">
                            {liveMetrics ? `${Math.min(100, Math.max(0, liveMetrics.avgCpu !== undefined ? liveMetrics.avgCpu : liveMetrics.cpuUsage))}%` : `${Math.min(100, selectedInstance.cpuUsage)}%`}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-2.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, liveMetrics?.avgCpu ?? selectedInstance.cpuUsage))}%` }}
                          />
                        </div>
                        {/* Real-time mini sparkline bar chart */}
                        <div className="flex items-end gap-1 h-7 pt-1 px-1 bg-white/70 rounded-lg border border-blue-100/60">
                          {cpuHistory.map((val, idx) => (
                            <div 
                              key={idx}
                              title={`Sample ${idx + 1}: ${val}%`}
                              className="flex-1 bg-blue-500/80 hover:bg-blue-600 rounded-xs transition-all duration-300"
                              style={{ height: `${Math.max(12, Math.min(100, val))}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1.5 font-mono">
                          <span>{selectedInstance.vCPU} vCPUs</span>
                          <span>Live trend</span>
                        </div>
                      </div>

                      {/* RAM MONITOR CARD */}
                      <div className="p-3.5 bg-gradient-to-br from-purple-50/60 to-slate-50 rounded-2xl border border-purple-100/80 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                            <MemoryStick className="w-3.5 h-3.5 text-purple-600" /> RAM Load
                          </span>
                          <span className="text-xs font-mono font-bold text-purple-600">
                            {liveMetrics ? `${liveMetrics.ramPercent}%` : `${selectedInstance.ramUsage}`}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mb-2.5">
                          <div 
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, liveMetrics?.ramPercent ?? 20))}%` }}
                          />
                        </div>
                        {/* Real-time mini sparkline bar chart */}
                        <div className="flex items-end gap-1 h-7 pt-1 px-1 bg-white/70 rounded-lg border border-purple-100/60">
                          {ramHistory.map((val, idx) => (
                            <div 
                              key={idx}
                              title={`Sample ${idx + 1}: ${val}%`}
                              className="flex-1 bg-purple-500/80 hover:bg-purple-600 rounded-xs transition-all duration-300"
                              style={{ height: `${Math.max(12, Math.min(100, val))}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1.5 font-mono">
                          <span>{liveMetrics?.ramUsedMb ? `${liveMetrics.ramUsedMb} MB` : 'Dynamic'}</span>
                          <span>{liveMetrics?.ramTotalMb ? `${liveMetrics.ramTotalMb} MB` : `${selectedInstance.ramGB} GB`}</span>
                        </div>
                      </div>
                    </div>

                    {/* DISK USAGE & IOPS METRICS */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">NVMe VHDX Allocation</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {liveMetrics?.diskUsedGb !== undefined ? `${liveMetrics.diskUsedGb} GB physical / ${liveMetrics.diskTotalGb} GB total` : `${selectedInstance.diskGB} GB Provisioned`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-700">
                          {liveMetrics ? `${liveMetrics.diskPercent}%` : '25%'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, liveMetrics?.diskPercent ?? 25))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 font-mono">
                          <span>Read:</span> <strong className="text-slate-700">{liveMetrics?.diskReadMb || 0} MB</strong>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <span>Write:</span> <strong className="text-slate-700">{liveMetrics?.diskWriteMb || 0} MB</strong>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Check className="w-3 h-3" /> Healthy IO
                        </span>
                      </div>
                    </div>

                    {/* UPTIME & HEALTH STATUS */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-800">Hyper-V Engine Uptime</p>
                          <p className="text-[10px] font-mono text-slate-500">{liveMetrics?.uptime || 'Active'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{liveMetrics?.status || 'Operating normally'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    <Power className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">Server is Powered Off</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Start instance to activate live Hyper-V performance telemetry and IO counters.</p>
                  </div>
                )}
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
                  This command updates the guest password directly via the hypervisor bridge. VM does not need to restart.
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