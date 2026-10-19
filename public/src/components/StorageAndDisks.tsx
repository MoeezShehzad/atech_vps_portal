// ==============================================================================
// Component: StorageAndDisks.tsx
// Purpose: Full-featured Storage & Virtual Disks management view
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Plus, 
  Server, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  RefreshCw, 
  Database, 
  Layers, 
  ArrowUpRight, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';

interface VirtualDisk {
  id: string;
  diskName: string;
  vmId: number;
  vmName: string;
  capacityGb: number;
  type: string;
  bus: string;
  status: 'ONLINE' | 'OFFLINE';
  path: string;
}

export default function StorageAndDisks() {
  const { toast } = useToast();
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disks, setDisks] = useState<VirtualDisk[]>([]);

  // Modal states
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [selectedDisk, setSelectedDisk] = useState<VirtualDisk | null>(null);
  const [newCapacity, setNewCapacity] = useState(50);
  const [expandLoading, setExpandLoading] = useState(false);
  const [expandQuote, setExpandQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/vms');
      const vms = res.vms || [];
      setInstances(vms);

      // Map VMs to Virtual Disks
      const virtualDisks: VirtualDisk[] = [];
      vms.forEach((vm: any) => {
        const isOnline = String(vm.status || '').toUpperCase() === 'RUNNING';
        virtualDisks.push({
          id: `disk-${vm.vmId}-os`,
          diskName: `${vm.name.toLowerCase()}-disk0`,
          vmId: vm.vmId,
          vmName: vm.name,
          capacityGb: vm.storageGb || vm.diskGB || 40,
          type: 'Enterprise SSD',
          bus: 'SCSI Controller (0:0)',
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          path: `/dev/cloud-storage/vol-${vm.vmId}`,
        });
      });
      setDisks(virtualDisks);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch storage resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  // Fetch live prorated financial quote whenever disk or capacity changes
  useEffect(() => {
    if (!isExpandOpen || !selectedDisk) return;
    const targetVm = instances.find((v) => v.vmId === selectedDisk.vmId);
    if (!targetVm) return;

    let active = true;
    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        const data = await apiCall(`/vms/${selectedDisk.vmId}/preview-resize`, {
          method: 'POST',
          body: JSON.stringify({
            cpuCores: targetVm.cpuCores || targetVm.vCPU,
            ramGb: targetVm.ramGb || targetVm.ramGB,
            storageGb: newCapacity,
          }),
        });
        if (active && data) {
          setExpandQuote(data);
        }
      } catch (e) {
        console.warn('[Storage Quote Warning]:', e);
      } finally {
        if (active) setQuoteLoading(false);
      }
    };

    fetchQuote();
    return () => {
      active = false;
    };
  }, [isExpandOpen, selectedDisk, newCapacity, instances]);

  const totalAllocatedGb = disks.reduce((acc, d) => acc + d.capacityGb, 0);

  const handleOpenExpand = (disk: VirtualDisk) => {
    setSelectedDisk(disk);
    setNewCapacity(disk.capacityGb + 50);
    setExpandQuote(null);
    setIsExpandOpen(true);
  };

  const handleExpandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisk) return;

    if (newCapacity <= selectedDisk.capacityGb) {
      toast.warning('New capacity must be greater than current size');
      return;
    }

    try {
      setExpandLoading(true);
      const targetVm = instances.find((v) => v.vmId === selectedDisk.vmId);
      if (!targetVm) throw new Error('Target VM not found');

      // Call resize API
      const result = await apiCall(`/vms/${selectedDisk.vmId}/resize`, {
        method: 'PATCH',
        body: JSON.stringify({
          cpuCores: targetVm.cpuCores || targetVm.vCPU,
          ramGb: targetVm.ramGb || targetVm.ramGB,
          storageGb: newCapacity,
        }),
      });

      const chargedAmount = result?.pricing?.dueToday ? `$${result.pricing.dueToday.toFixed(2)}` : 'prorated amount';
      toast.success(`Virtual Disk expanded to ${newCapacity} GB SSD. Charged ${chargedAmount} today.`);
      setIsExpandOpen(false);
      fetchStorageData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to expand disk');
    } finally {
      setExpandLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-blue-950 dark:text-white font-poppins">
              Storage & Virtual Disks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400">
              Enterprise SSD Storage
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage attached virtual hard drives and perform live disk capacity expansions for your instances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStorageData}
            disabled={loading}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh storage"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Storage Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Storage Allocated</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalAllocatedGb} <span className="text-sm font-sans font-medium text-slate-500 dark:text-slate-400">GB SSD</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Provisioned across active instances</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Virtual Disks</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {disks.length} <span className="text-sm font-sans font-medium text-slate-500 dark:text-slate-400">Disks</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Mounted SCSI controllers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Storage Architecture</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            Enterprise SSD
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Dedicated VHDX block isolation</p>
        </div>
      </div>

      {/* Disks Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white font-poppins">Attached Virtual Hard Disks</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">All provisioned virtual disks and dynamically expanding volumes</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            {disks.length} Volume{disks.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : disks.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <HardDrive className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No active storage volumes detected</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Deploy a virtual machine to allocate SSD storage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-6">Disk Volume</th>
                  <th className="py-3.5 px-6">Attached VM</th>
                  <th className="py-3.5 px-6">Capacity</th>
                  <th className="py-3.5 px-6">Format / Bus</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {disks.map((disk) => (
                  <tr key={disk.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white font-mono">{disk.diskName}</div>
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
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">{disk.capacityGb} GB</div>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full w-2/5 rounded-full"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {disk.bus}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        disk.status === 'ONLINE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${disk.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {disk.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenExpand(disk)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Expand
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EXPAND DISK MODAL */}
      {isExpandOpen && selectedDisk && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsExpandOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-poppins">Expand Virtual Disk</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Target: <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedDisk.diskName}</strong></p>
              </div>
            </div>

            <form onSubmit={handleExpandSubmit} className="space-y-4">
              {/* Quick Add-on Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Select Storage Add-On Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { addGb: 25, label: '+25 GB SSD', monthly: '$2.50/mo' },
                    { addGb: 50, label: '+50 GB SSD', monthly: '$5.00/mo' },
                    { addGb: 100, label: '+100 GB SSD', monthly: '$10.00/mo' },
                    { addGb: 250, label: '+250 GB SSD', monthly: '$25.00/mo' },
                  ].map((tier) => {
                    const isSelected = newCapacity === selectedDisk.capacityGb + tier.addGb;
                    return (
                      <button
                        type="button"
                        key={tier.addGb}
                        onClick={() => setNewCapacity(selectedDisk.capacityGb + tier.addGb)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-xs">{tier.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{tier.monthly}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider for custom capacity */}
              <div className="pt-1">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">Custom Target Capacity</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-sm">{newCapacity} GB SSD</span>
                </div>
                <input
                  type="range"
                  min={selectedDisk.capacityGb}
                  max={selectedDisk.capacityGb + 500}
                  step="5"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  <span>Current: {selectedDisk.capacityGb} GB</span>
                  <span>Expansion: +{newCapacity - selectedDisk.capacityGb} GB</span>
                  <span>Max: {selectedDisk.capacityGb + 500} GB</span>
                </div>
              </div>

              {/* ATC Enterprise Prorated Financial Quote Card */}
              {quoteLoading ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> Calculating prorated billing quote...
                </div>
              ) : expandQuote && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Billing Cycle Status:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {expandQuote.daysRemaining || 15} days remaining in cycle
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Monthly Storage Rate:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      +${expandQuote.priceDelta ? expandQuote.priceDelta.toFixed(2) : '0.00'}/mo
                      <span className="text-[10px] text-slate-400 ml-1 font-mono">(~${expandQuote.hourlyRate || '0.00'}/hr)</span>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">Amount Due Today (Prorated):</span>
                    <span className="text-base text-blue-600 dark:text-blue-400 font-mono">
                      ${expandQuote.dueToday ? expandQuote.dueToday.toFixed(2) : '0.00'} USD
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                    * Next renewal automatically unifies into your monthly VPS bill at ${expandQuote.newPrice ? expandQuote.newPrice.toFixed(2) : '0.00'}/mo.
                  </p>
                </div>
              )}

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Disks can only expand, never shrink. File system partition expands dynamically without downtime.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpandOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expandLoading || newCapacity <= selectedDisk.capacityGb}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {expandLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Expanding...
                    </>
                  ) : (
                    `Confirm & Expand ${expandQuote?.dueToday ? `($${expandQuote.dueToday.toFixed(2)})` : ''}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
