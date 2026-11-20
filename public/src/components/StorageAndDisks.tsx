// ==============================================================================
// Component: StorageAndDisks.tsx
// Purpose: Enterprise Storage & Virtual Disks Management View
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Plus,
  Server,
  Sliders,
  RefreshCw,
  Database,
  X,
  Link2,
  Unlink,
  Trash2,
  CheckCircle2,
  Copy,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';
import { TableSkeleton } from './TableSkeleton';
import { getRatesForPlan } from '../services/pricingApi';

interface PrimaryOsDisk {
  id: string;
  diskName: string;
  vmId: number;
  vmName: string;
  capacityGb: number;
  usedGb: number;
  usagePercent: number;
  type: string;
  bus: string;
  status: 'ONLINE' | 'OFFLINE';
}

interface SecondaryVolume {
  volumeId: number;
  name: string;
  sizeGb: number;
  usedGb?: number;
  usagePercent?: number;
  storageType: string;
  status: 'ATTACHED' | 'AVAILABLE';
  busInfo: string;
  monthlyPrice: number;
  vmId: number | null;
  vmName: string | null;
  vmStatus?: string | null;
}

interface StorageQuota {
  totalQuotaGb: number;
  usedQuotaGb: number;
  remainingQuotaGb: number;
  storagePerGbMonth?: number;
  planName?: string;
}

interface StorageThresholdAlert {
  name: string;
  vmName: string | null;
  usedGb: number;
  sizeGb: number;
  usagePercent: number;
  severity: 'WARNING' | 'CRITICAL';
}

const PRIMARY_OS_TIERS = [50, 100, 150, 200];

interface StoragePageCache {
  instances: any[];
  osDisks: PrimaryOsDisk[];
  volumes: SecondaryVolume[];
  quota: StorageQuota;
  alerts: StorageThresholdAlert[];
  timestamp: number;
}

let storagePageCache: StoragePageCache | null = null;

export default function StorageAndDisks() {
  const { toast } = useToast();
  const [instances, setInstances] = useState<any[]>(() => storagePageCache?.instances || []);
  const [loading, setLoading] = useState<boolean>(() => !storagePageCache);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [osDisks, setOsDisks] = useState<PrimaryOsDisk[]>(() => storagePageCache?.osDisks || []);
  const [volumes, setVolumes] = useState<SecondaryVolume[]>(() => storagePageCache?.volumes || []);
  const [thresholdAlerts, setThresholdAlerts] = useState<StorageThresholdAlert[]>(() => storagePageCache?.alerts || []);
  const [quota, setQuota] = useState<StorageQuota>(
    () =>
      storagePageCache?.quota || {
        totalQuotaGb: 125,
        usedQuotaGb: 0,
        remainingQuotaGb: 125,
      }
  );

  // 1. Expand Primary OS Disk modal states
  const [isExpandOsOpen, setIsExpandOsOpen] = useState(false);
  const [selectedOsDisk, setSelectedOsDisk] = useState<PrimaryOsDisk | null>(null);
  const [newOsCapacity, setNewOsCapacity] = useState(100);
  const [autoExpandOsFs, setAutoExpandOsFs] = useState(true);
  const [expandOsLoading, setExpandOsLoading] = useState(false);
  const [expandQuote, setExpandQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // 2. Unified "Create new | Attach Existing" Volume Modal states
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [volumeModalTab, setVolumeModalTab] = useState<'create' | 'existing'>('create');
  const [volSizeGb, setVolSizeGb] = useState<number>(10);
  const [volName, setVolName] = useState('');
  const [targetVmId, setTargetVmId] = useState<string>('');
  const [selectedExistingVolumeId, setSelectedExistingVolumeId] = useState<string>('');
  const [configMode, setConfigMode] = useState<'auto' | 'manual'>('auto');
  const [filesystem, setFilesystem] = useState<'ext4' | 'xfs'>('ext4');
  const [customMountPath, setCustomMountPath] = useState<string>('');
  const [volumeModalLoading, setVolumeModalLoading] = useState(false);

  // 3. Expand Block Storage Volume modal states
  const [expandingVolume, setExpandingVolume] = useState<SecondaryVolume | null>(null);
  const [newVolSizeGb, setNewVolSizeGb] = useState<number>(50);
  const [autoExpandVolFs, setAutoExpandVolFs] = useState<boolean>(true);
  const [expandVolLoading, setExpandVolLoading] = useState(false);

  // 4. Action loading state (detach / clone / delete) & Custom ATech Confirmation Modals
  const [actionVolumeId, setActionVolumeId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'detach' | 'clone' | null>(null);
  const [forceDetachModal, setForceDetachModal] = useState<{ volume: SecondaryVolume; busyMessage: string } | null>(null);
  const [forceDetachLoading, setForceDetachLoading] = useState<boolean>(false);
  const [deleteConfirmVolume, setDeleteConfirmVolume] = useState<SecondaryVolume | null>(null);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState<boolean>(false);

  const availableVolumes = volumes.filter((v) => v.status === 'AVAILABLE');

  const fetchStorageData = async (opts?: { silent?: boolean; forceFresh?: boolean }) => {
    const isSilent = Boolean(opts?.silent && storagePageCache);
    const forceFresh = Boolean(opts?.forceFresh);
    try {
      if (isSilent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const [vmsRes, volsRes] = await Promise.all([
        apiCall('/vms'),
        apiCall(forceFresh ? '/volumes?fresh=1' : '/volumes').catch(() => ({
          volumes: [],
          quota: null,
          osDiskStats: [],
          alerts: [],
        })),
      ]);

      const vms = vmsRes.vms || [];
      setInstances(vms);

      const osStatsMap = new Map<number, any>();
      if (Array.isArray(volsRes.osDiskStats)) {
        volsRes.osDiskStats.forEach((s: any) => osStatsMap.set(Number(s.vmId), s));
      }

      const primaryList: PrimaryOsDisk[] = vms.map((vm: any) => {
        const isOnline = String(vm.status || '').toUpperCase() === 'RUNNING';
        const cap = vm.storageGb || vm.diskGB || 100;
        const st = osStatsMap.get(Number(vm.vmId));
        const usedGb = st ? st.usedGb : Number((cap * 0.18).toFixed(1));
        const usagePercent = st ? st.usagePercent : Math.min(100, Math.round((usedGb / cap) * 100));

        return {
          id: `disk-${vm.vmId}-os`,
          diskName: `${vm.name.toLowerCase()}-disk0`,
          vmId: vm.vmId,
          vmName: vm.name,
          capacityGb: cap,
          usedGb,
          usagePercent,
          type: 'Enterprise NVMe SSD',
          bus: 'Primary Boot Disk',
          status: isOnline ? 'ONLINE' : 'OFFLINE',
        };
      });
      setOsDisks(primaryList);

      const loadedVols: SecondaryVolume[] = volsRes.volumes || [];
      setVolumes(loadedVols);
      const loadedAlerts = Array.isArray(volsRes.alerts) ? volsRes.alerts : [];
      setThresholdAlerts(loadedAlerts);

      const resolvedQuota: StorageQuota = volsRes.quota
        ? volsRes.quota
        : (() => {
            const used = loadedVols.reduce((acc, v) => acc + v.sizeGb, 0);
            return {
              totalQuotaGb: 125,
              usedQuotaGb: used,
              remainingQuotaGb: Math.max(0, 125 - used),
            };
          })();
      setQuota(resolvedQuota);

      storagePageCache = {
        instances: vms,
        osDisks: primaryList,
        volumes: loadedVols,
        quota: resolvedQuota,
        alerts: loadedAlerts,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      if (!isSilent) toast.error(err.message || 'Failed to fetch storage resources');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorageData({ silent: Boolean(storagePageCache) });
  }, []);

  useEffect(() => {
    if (!isExpandOsOpen || !selectedOsDisk) return;
    const targetVm = instances.find((v) => v.vmId === selectedOsDisk.vmId);
    if (!targetVm) return;

    let active = true;
    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        const data = await apiCall(`/vms/${selectedOsDisk.vmId}/preview-resize`, {
          method: 'POST',
          body: JSON.stringify({
            cpuCores: targetVm.cpuCores || targetVm.vCPU,
            ramGb: targetVm.ramGb || targetVm.ramGB,
            storageGb: newOsCapacity,
          }),
        });
        if (active && data) setExpandQuote(data);
      } catch (_) {
      } finally {
        if (active) setQuoteLoading(false);
      }
    };
    fetchQuote();
    return () => {
      active = false;
    };
  }, [isExpandOsOpen, selectedOsDisk, newOsCapacity, instances]);

  const currentVm = instances.find((v) => v.vmId === selectedOsDisk?.vmId);
  const vmRates = getRatesForPlan(currentVm?.plan || currentVm?.planId);
  const storageRate = vmRates.storagePerGbMonth;

  const totalOsGb = osDisks.reduce((acc, d) => acc + d.capacityGb, 0);

  const openVolumeModal = (tab: 'create' | 'existing' = 'create', preselectVol?: SecondaryVolume) => {
    setVolumeModalTab(tab);
    setTargetVmId(instances[0]?.vmId ? String(instances[0].vmId) : '');
    setConfigMode('auto');
    setFilesystem('ext4');
    setCustomMountPath('');
    setVolName('');
    const defaultSize = Math.min(10, Math.max(1, quota.remainingQuotaGb || 10));
    setVolSizeGb(defaultSize);
    if (preselectVol) {
      setSelectedExistingVolumeId(String(preselectVol.volumeId));
    } else if (availableVolumes.length > 0) {
      setSelectedExistingVolumeId(String(availableVolumes[0].volumeId));
    } else {
      setSelectedExistingVolumeId('');
    }
    setIsVolumeModalOpen(true);
  };

  const handleVolumeModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setVolumeModalLoading(true);

      if (volumeModalTab === 'create') {
        if (volSizeGb < 1 || volSizeGb > quota.remainingQuotaGb) {
          toast.warning(`Please enter a size between 1 GB and ${quota.remainingQuotaGb} GB.`);
          setVolumeModalLoading(false);
          return;
        }
        const res = await apiCall('/volumes', {
          method: 'POST',
          body: JSON.stringify({
            name: volName.trim() || `vol-${volSizeGb}gb`,
            sizeGb: Number(volSizeGb),
            vmId: targetVmId ? Number(targetVmId) : null,
            configMode,
            filesystem,
            mountPath: customMountPath.trim(),
          }),
        });
        toast.success(res.message || `Created & attached ${volSizeGb} GB volume.`);
      } else {
        if (!selectedExistingVolumeId || !targetVmId) {
          toast.warning('Please select an existing volume and a target virtual machine.');
          setVolumeModalLoading(false);
          return;
        }
        const res = await apiCall(`/volumes/${selectedExistingVolumeId}/attach`, {
          method: 'POST',
          body: JSON.stringify({
            vmId: Number(targetVmId),
            configMode,
            filesystem,
            mountPath: customMountPath.trim(),
          }),
        });
        toast.success(res.message || 'Existing volume attached successfully.');
      }

      setIsVolumeModalOpen(false);
      fetchStorageData();
    } catch (err: any) {
      toast.error(err.message || 'Volume operation failed');
    } finally {
      setVolumeModalLoading(false);
    }
  };

  const handleOpenExpandOs = (disk: PrimaryOsDisk) => {
    setSelectedOsDisk(disk);
    const nextTier = PRIMARY_OS_TIERS.find((t) => t > disk.capacityGb) || disk.capacityGb + 50;
    setNewOsCapacity(nextTier);
    setAutoExpandOsFs(true);
    setExpandQuote(null);
    setIsExpandOsOpen(true);
  };

  const handleExpandOsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOsDisk) return;
    if (newOsCapacity <= selectedOsDisk.capacityGb) {
      toast.warning('New capacity must be greater than current OS disk size');
      return;
    }

    try {
      setExpandOsLoading(true);
      const targetVm = instances.find((v) => v.vmId === selectedOsDisk.vmId);
      if (!targetVm) throw new Error('Target VM not found');

      const result = await apiCall(`/vms/${selectedOsDisk.vmId}/resize`, {
        method: 'PATCH',
        body: JSON.stringify({
          cpuCores: targetVm.cpuCores || targetVm.vCPU,
          ramGb: targetVm.ramGb || targetVm.ramGB,
          storageGb: newOsCapacity,
          autoExpandFs: autoExpandOsFs,
        }),
      });

      const chargedAmount = result?.pricing?.dueToday ? `$${result.pricing.dueToday.toFixed(2)}` : 'prorated amount';
      toast.success(
        `Primary OS Disk expanded to ${newOsCapacity} GB SSD${autoExpandOsFs ? ' & partition resized online' : ''}. Charged ${chargedAmount} today.`
      );
      setIsExpandOsOpen(false);
      fetchStorageData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to expand primary OS disk');
    } finally {
      setExpandOsLoading(false);
    }
  };

  const handleDetachVolume = async (vol: SecondaryVolume, force = false) => {
    try {
      if (force) {
        setForceDetachLoading(true);
      } else {
        setActionVolumeId(vol.volumeId);
        setActionType('detach');
      }
      const res = await apiCall(`/volumes/${vol.volumeId}/detach`, {
        method: 'POST',
        body: JSON.stringify({ force }),
      });
      toast.success(res.message || 'Volume safely unmounted and detached');
      setForceDetachModal(null);
      await fetchStorageData();
    } catch (err: any) {
      const msg = err.message || 'Failed to detach volume';
      if (!force && (msg.includes('currently in use') || msg.includes('VOLUME_BUSY'))) {
        setForceDetachModal({ volume: vol, busyMessage: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setForceDetachLoading(false);
      setActionVolumeId(null);
      setActionType(null);
    }
  };

  const handleCloneVolume = async (vol: SecondaryVolume) => {
    try {
      setActionVolumeId(vol.volumeId);
      setActionType('clone');
      const res = await apiCall(`/volumes/${vol.volumeId}/clone`, {
        method: 'POST',
      });
      toast.success(res.message || `Cloned backup volume created in your storage pool.`);
      await fetchStorageData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clone volume');
    } finally {
      setActionVolumeId(null);
      setActionType(null);
    }
  };

  const handleExpandVolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandingVolume) return;
    if (newVolSizeGb <= expandingVolume.sizeGb) {
      toast.warning('Enter a capacity larger than current volume size');
      return;
    }
    try {
      setExpandVolLoading(true);
      const res = await apiCall(`/volumes/${expandingVolume.volumeId}/resize`, {
        method: 'PATCH',
        body: JSON.stringify({
          sizeGb: Number(newVolSizeGb),
          autoExpandFs: autoExpandVolFs,
        }),
      });
      toast.success(res.message || `Expanded volume to ${newVolSizeGb} GB`);
      setExpandingVolume(null);
      fetchStorageData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to expand volume');
    } finally {
      setExpandVolLoading(false);
    }
  };

  const handleDeleteVolume = (vol: SecondaryVolume) => {
    setDeleteConfirmVolume(vol);
  };

  const confirmDeleteVolumeExecution = async () => {
    if (!deleteConfirmVolume) return;
    try {
      setDeleteConfirmLoading(true);
      const res = await apiCall(`/volumes/${deleteConfirmVolume.volumeId}`, {
        method: 'DELETE',
      });
      toast.success(res.message || 'Volume permanently deleted');
      setDeleteConfirmVolume(null);
      await fetchStorageData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete volume');
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const getUsageBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-600';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-blue-950 dark:text-white font-poppins">
              Storage & Virtual Disks
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Allocate custom-sized block volumes from your cloud storage pool with 1-click formatting, live usage monitoring, and instant volume clones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStorageData({ forceFresh: true, silent: true })}
            disabled={loading || refreshing}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Refresh live storage stats"
          >
            <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => openVolumeModal('create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold tracking-tight shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create / Attach Volume</span>
          </button>
        </div>
      </div>

      {/* THRESHOLD ALERT BANNER (>= 80% WARNING / >= 90% CRITICAL) */}
      {thresholdAlerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-tight text-amber-900 dark:text-amber-200">
                Storage Capacity Threshold Alert ({thresholdAlerts.length} Volume{thresholdAlerts.length > 1 ? 's' : ''} Exceeding 80%)
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {thresholdAlerts.map((a) => `${a.name} (${a.usagePercent}% used: ${a.usedGb}/${a.sizeGb} GB)`).join(' • ')}. Expand capacity to prevent disk-full interruptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Storage Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Cloud Block Storage Pool</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white font-poppins tabular-nums">
            {quota.usedQuotaGb} / {quota.totalQuotaGb}{' '}
            <span className="text-sm font-sans font-medium text-slate-500 dark:text-slate-400">GB Allocated</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, quota.totalQuotaGb > 0 ? Math.round((quota.usedQuotaGb / quota.totalQuotaGb) * 100) : 0)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {quota.remainingQuotaGb} GB available for volumes & backup clones
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Primary OS Storage (NVMe SSD)</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white font-poppins tabular-nums">
            {totalOsGb} <span className="text-sm font-sans font-medium text-slate-500 dark:text-slate-400">GB NVMe/SSD</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Dedicated OS Boot Disks (50 / 100 / 150 / 200 GB)</p>
        </div>
      </div>

      {/* SECTION 1: BLOCK STORAGE VOLUMES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold tracking-tight text-slate-900 dark:text-white font-poppins">
                Additional Block Storage Volumes
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-tight bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                {quota.remainingQuotaGb} GB Unallocated
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Carve out custom-sized volumes from your storage pool, auto-format to any mount directory, clone volume backups, and move volumes between instances.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {availableVolumes.length > 0 && (
              <button
                onClick={() => openVolumeModal('existing')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold tracking-tight transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" /> Attach Existing ({availableVolumes.length})
              </button>
            )}
            <button
              onClick={() => openVolumeModal('create')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold tracking-tight transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create / Attach Volume
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={6} />
        ) : volumes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 px-4">
            <Database className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              No Block Storage Volumes Created Yet ({quota.remainingQuotaGb} GB Available)
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
              Click "Create / Attach Volume" to allocate custom storage capacity to your instance with automatic or manual mounting.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold tracking-tight text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-6">Storage Volume</th>
                  <th className="py-3.5 px-6">Attached Instance</th>
                  <th className="py-3.5 px-6">Live Disk Usage</th>
                  <th className="py-3.5 px-6">Mount Directory</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {volumes.map((vol) => {
                  const usedGb = vol.usedGb ?? Number((vol.sizeGb * 0.05).toFixed(2));
                  const pct = vol.usagePercent ?? Math.max(2, Math.round((usedGb / vol.sizeGb) * 100));
                  return (
                    <tr key={vol.volumeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Database className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold tracking-tight text-slate-900 dark:text-white font-poppins tabular-nums">{vol.name}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">{vol.storageType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {vol.vmName ? (
                          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                            <Server className="w-3.5 h-3.5 text-blue-500" />
                            <span>{vol.vmName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Unattached (Available)</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-poppins tabular-nums font-semibold tracking-tight text-slate-900 dark:text-white">
                              {usedGb} / {vol.sizeGb} GB
                            </span>
                            <span
                              className={`font-poppins tabular-nums font-semibold tracking-tight ${
                                pct >= 90
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : pct >= 80
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`${getUsageBarColor(pct)} h-full rounded-full transition-all`}
                              style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-poppins tabular-nums text-[11px] text-slate-600 dark:text-slate-300">
                        {vol.busInfo}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            vol.status === 'ATTACHED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${vol.status === 'ATTACHED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          {vol.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {vol.status === 'AVAILABLE' ? (
                            <button
                              onClick={() => openVolumeModal('existing', vol)}
                              disabled={instances.length === 0 || actionVolumeId === vol.volumeId}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Link2 className="w-3.5 h-3.5" /> Attach
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDetachVolume(vol)}
                              disabled={actionVolumeId === vol.volumeId}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              title="Safely unmount & detach volume from instance"
                            >
                              {actionVolumeId === vol.volumeId && actionType === 'detach' ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Detaching... Please wait
                                </>
                              ) : (
                                <>
                                  <Unlink className="w-3.5 h-3.5" /> Detach
                                </>
                              )}
                            </button>
                          )}

                          {vol.sizeGb < 2000 && (
                            <button
                              onClick={() => {
                                setExpandingVolume(vol);
                                setNewVolSizeGb(Math.min(2000, vol.sizeGb + 25));
                                setAutoExpandVolFs(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5" /> Expand
                            </button>
                          )}

                          {quota.remainingQuotaGb >= vol.sizeGb && (
                            <button
                              onClick={() => handleCloneVolume(vol)}
                              disabled={actionVolumeId === vol.volumeId}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                              title="Create a 1-click point-in-time backup clone of this volume"
                            >
                              {actionVolumeId === vol.volumeId && actionType === 'clone' ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cloning... Please wait
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Clone
                                </>
                              )}
                            </button>
                          )}

                          {vol.status === 'AVAILABLE' && (
                            <button
                              onClick={() => handleDeleteVolume(vol)}
                              disabled={actionVolumeId === vol.volumeId}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Delete unattached volume & return capacity to your pool"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PRIMARY OS DISKS (50 / 100 / 150 / 200 GB) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold tracking-tight text-slate-900 dark:text-white font-poppins">
              Primary Operating System Disks (Enterprise NVMe SSD)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-performance boot volumes dedicated to each instance (50 GB, 100 GB, 150 GB, or 200 GB tiers)
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-poppins tabular-nums bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            {osDisks.length} OS Disk{osDisks.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={2} cols={5} />
        ) : osDisks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <HardDrive className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No active OS disks detected</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Deploy a virtual machine to allocate primary OS storage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold tracking-tight text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-6">OS Disk</th>
                  <th className="py-3.5 px-6">Instance</th>
                  <th className="py-3.5 px-6">Live Disk Usage</th>
                  <th className="py-3.5 px-6">Disk Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {osDisks.map((disk) => (
                  <tr key={disk.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold tracking-tight text-slate-900 dark:text-white font-poppins tabular-nums">{disk.diskName}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">{disk.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                        <Server className="w-3.5 h-3.5 text-slate-400" />
                        {disk.vmName}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-poppins tabular-nums font-semibold tracking-tight text-slate-900 dark:text-white">
                            {disk.usedGb} / {disk.capacityGb} GB
                          </span>
                          <span
                            className={`font-poppins tabular-nums font-semibold tracking-tight ${
                              disk.usagePercent >= 90
                                ? 'text-rose-600 dark:text-rose-400'
                                : disk.usagePercent >= 80
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {disk.usagePercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`${getUsageBarColor(disk.usagePercent)} h-full rounded-full transition-all`}
                            style={{ width: `${Math.min(100, Math.max(4, disk.usagePercent))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-poppins tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                      {disk.bus}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          disk.status === 'ONLINE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${disk.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {disk.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenExpandOs(disk)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Expand OS Disk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================
          MODAL 1: CREATE NEW | ATTACH EXISTING VOLUME
         ======================================================================== */}
      {isVolumeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsVolumeModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => setVolumeModalTab('create')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  volumeModalTab === 'create'
                    ? 'border-blue-600 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Create new
              </button>
              <button
                type="button"
                onClick={() => setVolumeModalTab('existing')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  volumeModalTab === 'existing'
                    ? 'border-blue-600 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <span>Attach Existing</span>
                {availableVolumes.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {availableVolumes.length}
                  </span>
                )}
              </button>
            </div>

            <form onSubmit={handleVolumeModalSubmit} className="space-y-5">
              {volumeModalTab === 'create' ? (
                <>
                  <div>
                    <label className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white block mb-2">
                      Storage size (GB)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, quota.remainingQuotaGb)}
                        value={volSizeGb}
                        onChange={(e) =>
                          setVolSizeGb(
                            Math.max(1, Math.min(quota.remainingQuotaGb || 1000, Number(e.target.value) || 1))
                          )
                        }
                        className="w-28 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white text-center focus:outline-none focus:border-blue-600"
                      />
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <div className="font-medium text-slate-600 dark:text-slate-300">Available Storage Pool</div>
                        <div>
                          <strong className="text-slate-900 dark:text-white">{quota.remainingQuotaGb} GB</strong> remaining of {quota.totalQuotaGb} GB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {[10, 25, 50, 100, quota.remainingQuotaGb]
                        .filter((v, idx, arr) => v > 0 && v <= quota.remainingQuotaGb && arr.indexOf(v) === idx)
                        .map((presetGb) => (
                          <button
                            type="button"
                            key={presetGb}
                            onClick={() => setVolSizeGb(presetGb)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                              volSizeGb === presetGb
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {presetGb === quota.remainingQuotaGb ? `Max (${presetGb} GB)` : `${presetGb} GB`}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200 block mb-1">
                        Attach to Machine
                      </label>
                      <select
                        value={targetVmId}
                        onChange={(e) => setTargetVmId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      >
                        {instances.map((vm) => (
                          <option key={vm.vmId} value={vm.vmId}>
                            {vm.name} ({vm.ip})
                          </option>
                        ))}
                        <option value="">Leave Unattached</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200 block mb-1">
                        Volume Name
                      </label>
                      <input
                        type="text"
                        value={volName}
                        onChange={(e) => setVolName(e.target.value)}
                        placeholder={`vol-${volSizeGb}gb`}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-poppins tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {availableVolumes.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                      No unattached volumes available. Switch to <strong>Create new</strong> to allocate a volume from your storage pool.
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200 block mb-1">
                          Select Existing Unattached Volume
                        </label>
                        <select
                          value={selectedExistingVolumeId}
                          onChange={(e) => setSelectedExistingVolumeId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-poppins tabular-nums text-slate-900 dark:text-white"
                        >
                          {availableVolumes.map((v) => (
                            <option key={v.volumeId} value={v.volumeId}>
                              {v.name} — {v.sizeGb} GB ({v.storageType})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200 block mb-1">
                          Attach to Machine
                        </label>
                        <select
                          value={targetVmId}
                          onChange={(e) => setTargetVmId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                        >
                          {instances.map((vm) => (
                            <option key={vm.vmId} value={vm.vmId}>
                              {vm.name} ({vm.ip})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white block mb-2.5">
                  Choose Configuration
                </label>

                <div className="space-y-3">
                  <div>
                    <div
                      onClick={() => setConfigMode('auto')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        configMode === 'auto'
                          ? 'border-blue-600 bg-white dark:bg-slate-900 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                      } ${configMode === 'auto' ? 'rounded-b-none' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="configMode"
                          checked={configMode === 'auto'}
                          onChange={() => setConfigMode('auto')}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            Automatically Format & Mount
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            We will automatically configure and mount this volume to your chosen directory.
                          </p>
                        </div>
                      </div>
                    </div>

                    {configMode === 'auto' && (
                      <div className="p-4 border border-t-0 border-slate-300 dark:border-slate-700 rounded-b-xl bg-slate-50/60 dark:bg-slate-800/50 space-y-4">
                        <div>
                          <div className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white mb-2">
                            Choose a filesystem
                          </div>
                          <div className="flex items-center gap-6">
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                              <input
                                type="radio"
                                name="filesystem"
                                value="ext4"
                                checked={filesystem === 'ext4'}
                                onChange={() => setFilesystem('ext4')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>Ext4</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                              <input
                                type="radio"
                                name="filesystem"
                                value="xfs"
                                checked={filesystem === 'xfs'}
                                onChange={() => setFilesystem('xfs')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>XFS</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Mount Directory Path</span>
                            </label>
                            <span className="text-[10px] text-slate-500">Auto-mounted on boot</span>
                          </div>
                          <input
                            type="text"
                            value={customMountPath}
                            onChange={(e) => setCustomMountPath(e.target.value)}
                            placeholder={`/mnt/${volName.trim() || `vol-${volSizeGb}gb`}`}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-poppins tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                          />
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                            Enter any directory path (e.g. <span className="font-mono">/mnt/my-storage</span> or <span className="font-mono">/data/my-storage</span>). If the folder does not exist yet on your server, it will be created automatically when attached.
                          </p>
                          <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                            Target folder path:{' '}
                            <strong className="font-poppins tabular-nums">
                              {customMountPath.trim() || `/mnt/${(volName.trim() || `vol-${volSizeGb}gb`).toLowerCase().replace(/[^a-z0-9-_]/g, '-')}`}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => setConfigMode('manual')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      configMode === 'manual'
                        ? 'border-blue-600 bg-white dark:bg-slate-900 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="configMode"
                        checked={configMode === 'manual'}
                        onChange={() => setConfigMode('manual')}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          Manually Format & Mount
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          We will attach the volume so you can partition, format, and mount it manually.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVolumeModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold tracking-tight text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    volumeModalLoading ||
                    (volumeModalTab === 'create' && quota.remainingQuotaGb <= 0) ||
                    (volumeModalTab === 'existing' && availableVolumes.length === 0)
                  }
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold tracking-tight shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {volumeModalLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{configMode === 'auto' ? 'Attaching & Mounting... Please wait' : 'Attaching... Please wait'}</span>
                    </>
                  ) : volumeModalTab === 'create' ? (
                    `Create & Attach (${volSizeGb} GB)`
                  ) : (
                    'Attach Volume'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPAND BLOCK STORAGE VOLUME */}
      {expandingVolume && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setExpandingVolume(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-poppins mb-1">
              Expand Block Storage Volume
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Volume: <strong className="font-poppins tabular-nums">{expandingVolume.name}</strong> (Current: {expandingVolume.sizeGb} GB)
            </p>

            <form onSubmit={handleExpandVolSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-300 block mb-1.5">
                  New Total Volume Size (GB)
                </label>
                <input
                  type="number"
                  min={expandingVolume.sizeGb + 1}
                  max={2000}
                  value={newVolSizeGb}
                  onChange={(e) => setNewVolSizeGb(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-poppins tabular-nums font-semibold tracking-tight text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Expandable up to 2,000 GB (2 TB). Billed according to your plan's per-GB storage rate.
                </p>
              </div>

              {newVolSizeGb > expandingVolume.sizeGb && (() => {
                const addGb = Math.max(0, newVolSizeGb - expandingVolume.sizeGb);
                const rate = quota.storagePerGbMonth ?? 0.024;
                const monthlyAdd = (addGb * rate).toFixed(2);
                return (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Additional Capacity</span>
                      <span className="font-semibold tabular-nums">+{addGb} GB</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>Plan Storage Rate ({quota.planName || 'Active Plan'})</span>
                      <span className="font-semibold tabular-nums">${rate.toFixed(4)} / GB / mo</span>
                    </div>
                    <div className="pt-1.5 mt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-900 dark:text-white font-semibold">
                      <span>Recurring Monthly Addition</span>
                      <span className="text-blue-600 dark:text-blue-400 tabular-nums">+${monthlyAdd} / mo</span>
                    </div>
                  </div>
                );
              })()}

              {expandingVolume.status === 'ATTACHED' && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoExpandVolFs}
                    onChange={(e) => setAutoExpandVolFs(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <div className="font-semibold tracking-tight text-slate-900 dark:text-white">
                      Automatically expand mounted volume capacity online
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Updates your mounted directory capacity immediately without requiring a server reboot.
                    </p>
                  </div>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpandingVolume(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold tracking-tight text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expandVolLoading || newVolSizeGb <= expandingVolume.sizeGb}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold tracking-tight cursor-pointer flex items-center justify-center gap-2"
                >
                  {expandVolLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Expanding... Please wait</span>
                    </>
                  ) : (
                    `Expand to ${newVolSizeGb} GB`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXPAND PRIMARY OS DISK */}
      {isExpandOsOpen && selectedOsDisk && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsExpandOsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-poppins">Expand Primary OS Disk</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: <strong className="font-poppins tabular-nums text-slate-800 dark:text-slate-200">{selectedOsDisk.diskName}</strong> (Current: {selectedOsDisk.capacityGb} GB)
                </p>
              </div>
            </div>

            <form onSubmit={handleExpandOsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-300 block mb-2">
                  Primary OS Storage Tiers (50 / 100 / 150 / 200 GB)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIMARY_OS_TIERS.map((tierGb) => {
                    const isDisabled = tierGb <= selectedOsDisk.capacityGb;
                    const isSelected = newOsCapacity === tierGb;
                    const deltaGb = Math.max(0, tierGb - selectedOsDisk.capacityGb);
                    const tierCost = (deltaGb * storageRate).toFixed(2);
                    return (
                      <button
                        type="button"
                        key={tierGb}
                        disabled={isDisabled}
                        onClick={() => setNewOsCapacity(tierGb)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="font-semibold tracking-tight text-xs">{tierGb} GB OS SSD</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-poppins tabular-nums mt-0.5">
                          {isDisabled ? 'Current / Lower' : `+$${tierCost}/mo`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExpandOsFs}
                  onChange={(e) => setAutoExpandOsFs(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-semibold tracking-tight text-slate-900 dark:text-white">
                    Automatically expand OS partition online
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Applies the expanded capacity to your operating system partition automatically.
                  </p>
                </div>
              </label>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Current OS Capacity:</span>
                  <span className="font-poppins tabular-nums font-semibold text-slate-700 dark:text-slate-300">{selectedOsDisk.capacityGb} GB</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>New OS Capacity:</span>
                  <span className="font-poppins tabular-nums font-semibold tracking-tight text-blue-600 dark:text-blue-400">{newOsCapacity} GB</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center">
                  <span className="font-semibold tracking-tight text-slate-900 dark:text-white">Prorated Due Today:</span>
                  <span className="text-base font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-poppins tabular-nums">
                    {quoteLoading
                      ? '...'
                      : expandQuote
                      ? `$${Number(expandQuote.dueToday ?? expandQuote.priceDelta ?? 0).toFixed(2)}`
                      : `$${((newOsCapacity - selectedOsDisk.capacityGb) * storageRate).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpandOsOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold tracking-tight text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expandOsLoading || newOsCapacity <= selectedOsDisk.capacityGb}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold tracking-tight cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {expandOsLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Expanding... Please wait
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Expansion
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ATECH CONSULT BUSY VOLUME / FORCE DETACH CONFIRMATION MODAL */}
      {forceDetachModal && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              disabled={forceDetachLoading}
              onClick={() => setForceDetachModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-poppins">
                  Volume Currently In Use
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target: <strong className="font-poppins tabular-nums text-slate-800 dark:text-slate-200">{forceDetachModal.volume.name}</strong> ({forceDetachModal.volume.sizeGb} GB)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 leading-relaxed">
                {forceDetachModal.busyMessage}
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1">
                <div className="font-semibold tracking-tight">WARNING (ATech Consult Terms of Service):</div>
                <p className="text-[11px] leading-relaxed">
                  Force-detaching while applications or terminal sessions are actively using this directory may corrupt or delete unsaved data. Per ATC Terms of Service, ATC is not responsible for data loss caused by user-initiated force detachment.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-5">
              <button
                type="button"
                disabled={forceDetachLoading}
                onClick={() => setForceDetachModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold tracking-tight text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={forceDetachLoading}
                onClick={() => handleDetachVolume(forceDetachModal.volume, true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold tracking-tight shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {forceDetachLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Force Detaching... Please wait</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Force Detach Volume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ATECH CONSULT PERMANENT DELETE VOLUME CONFIRMATION MODAL */}
      {deleteConfirmVolume && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              disabled={deleteConfirmLoading}
              onClick={() => setDeleteConfirmVolume(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white font-poppins">
                  Permanently Delete Block Volume
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Volume: <strong className="font-poppins tabular-nums text-slate-800 dark:text-slate-200">{deleteConfirmVolume.name}</strong> ({deleteConfirmVolume.sizeGb} GB)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete storage volume{' '}
                <strong className="font-poppins tabular-nums text-slate-900 dark:text-white">{deleteConfirmVolume.name}</strong>? This will erase the volume and return{' '}
                <strong>{deleteConfirmVolume.sizeGb} GB</strong> back to your available Cloud Block Storage Pool.
              </p>

              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1">
                <div className="font-semibold tracking-tight">WARNING (ATech Consult Terms of Service):</div>
                <p className="text-[11px] leading-relaxed">
                  This permanently erases all files stored on this volume. ATC is not responsible for any data loss resulting from user-initiated volume deletion or force delete.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-5">
              <button
                type="button"
                disabled={deleteConfirmLoading}
                onClick={() => setDeleteConfirmVolume(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold tracking-tight text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmLoading}
                onClick={confirmDeleteVolumeExecution}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold tracking-tight shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {deleteConfirmLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting... Please wait</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Volume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
