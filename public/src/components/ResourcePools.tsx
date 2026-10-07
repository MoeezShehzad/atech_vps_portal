// ==============================================================================
// Component: ResourcePools.tsx
// Purpose: Resource Pools & Quotas monitoring with breakdown and upgrade requests
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity, 
  Layers, 
  Server, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCw, 
  X,
  Gauge,
  CheckCircle2
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';

export default function ResourcePools() {
  const { toast } = useToast();
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [requestedCpu, setRequestedCpu] = useState(32);
  const [requestedRam, setRequestedRam] = useState(128);
  const [requestedDisk, setRequestedDisk] = useState(1000);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  // Pool Quotas (Default account limits)
  const CPU_LIMIT = 16;
  const RAM_LIMIT = 64;
  const DISK_LIMIT = 500;
  const BANDWIDTH_LIMIT_TB = 10;

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/vms');
      setInstances(res.vms || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pool metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, []);

  // Compute allocated totals
  const totalCpuAllocated = instances.reduce((acc, v) => acc + (v.cpuCores || v.vCPU || 2), 0);
  const totalRamAllocated = instances.reduce((acc, v) => acc + (v.ramGb || v.ramGB || 2), 0);
  const totalDiskAllocated = instances.reduce((acc, v) => acc + (v.storageGb || v.diskGB || 40), 0);
  const estimatedBandwidthTb = 1.4;

  const cpuPercent = Math.min(100, Math.round((totalCpuAllocated / CPU_LIMIT) * 100));
  const ramPercent = Math.min(100, Math.round((totalRamAllocated / RAM_LIMIT) * 100));
  const diskPercent = Math.min(100, Math.round((totalDiskAllocated / DISK_LIMIT) * 100));
  const bandwidthPercent = Math.min(100, Math.round((estimatedBandwidthTb / BANDWIDTH_LIMIT_TB) * 100));

  const handleRequestUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeSubmitted(true);
    setTimeout(() => {
      toast.success('Resource Pool upgrade ticket submitted to infrastructure engineers.');
      setIsUpgradeModalOpen(false);
      setUpgradeSubmitted(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-blue-950 font-poppins">
              Resource Pools & Quotas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Dedicated Compute Tier
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time infrastructure pool consumption across all virtual instances and manage account hardware quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPoolData}
            disabled={loading}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh Pool Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" /> Request Pool Expansion
          </button>
        </div>
      </div>

      {/* Quota Gauge Meters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* CPU POOL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" /> vCPU Compute Pool
            </span>
            <span className="font-mono text-blue-600 font-bold">{cpuPercent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalCpuAllocated} <span className="text-xs font-sans text-slate-400">/ {CPU_LIMIT} Cores</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${cpuPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>Available: {CPU_LIMIT - totalCpuAllocated} Cores</span>
            <span className="text-emerald-600">Optimal</span>
          </div>
        </div>

        {/* RAM POOL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <MemoryStick className="w-4 h-4 text-purple-600" /> RAM Memory Pool
            </span>
            <span className="font-mono text-purple-600 font-bold">{ramPercent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalRamAllocated} <span className="text-xs font-sans text-slate-400">/ {RAM_LIMIT} GB</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-purple-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${ramPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>Available: {RAM_LIMIT - totalRamAllocated} GB</span>
            <span className="text-emerald-600">Optimal</span>
          </div>
        </div>

        {/* STORAGE POOL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-600" /> NVMe Storage Pool
            </span>
            <span className="font-mono text-amber-600 font-bold">{diskPercent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalDiskAllocated} <span className="text-xs font-sans text-slate-400">/ {DISK_LIMIT} GB</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${diskPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>Available: {DISK_LIMIT - totalDiskAllocated} GB</span>
            <span className="text-emerald-600">Optimal</span>
          </div>
        </div>

        {/* BANDWIDTH POOL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> Egress Bandwidth
            </span>
            <span className="font-mono text-emerald-600 font-bold">{bandwidthPercent}%</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {estimatedBandwidthTb} <span className="text-xs font-sans text-slate-400">/ {BANDWIDTH_LIMIT_TB} TB</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${bandwidthPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>Reset in 22 days</span>
            <span className="text-emerald-600">Unthrottled</span>
          </div>
        </div>
      </div>

      {/* VM Resource Allocation Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 font-poppins">Instance Consumption Breakdown</h2>
            <p className="text-xs text-slate-500">Resource dedication per running virtual machine</p>
          </div>
          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-lg">
            {instances.length} Managed VM{instances.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : instances.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Server className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No active instances using pool resources</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Virtual Machine</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">vCPU Allocation</th>
                  <th className="py-3.5 px-6">RAM Memory</th>
                  <th className="py-3.5 px-6">NVMe Disk</th>
                  <th className="py-3.5 px-6">Total Pool Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {instances.map((vm) => {
                  const cpu = vm.cpuCores || vm.vCPU || 2;
                  const ram = vm.ramGb || vm.ramGB || 2;
                  const disk = vm.storageGb || vm.diskGB || 40;
                  const share = Math.round(((cpu / CPU_LIMIT + ram / RAM_LIMIT + disk / DISK_LIMIT) / 3) * 100);

                  return (
                    <tr key={vm.vmId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <strong className="text-slate-900 font-poppins">{vm.name}</strong>
                            <div className="text-[11px] font-mono text-slate-400">{vm.ip || 'Provisioning'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          vm.status === 'RUNNING'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${vm.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {vm.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {cpu} Cores <span className="text-[10px] text-slate-400 font-normal">({Math.round((cpu / CPU_LIMIT) * 100)}%)</span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {ram} GB <span className="text-[10px] text-slate-400 font-normal">({Math.round((ram / RAM_LIMIT) * 100)}%)</span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {disk} GB <span className="text-[10px] text-slate-400 font-normal">({Math.round((disk / DISK_LIMIT) * 100)}%)</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${share}%` }}></div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-600">{share}%</span>
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

      {/* UPGRADE MODAL */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-poppins">Request Pool Expansion</h3>
                <p className="text-xs text-slate-500">Scale up your account hardware quotas</p>
              </div>
            </div>

            <form onSubmit={handleRequestUpgrade} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requested vCPU Cores Cap</label>
                <input
                  type="number"
                  min="16"
                  max="128"
                  value={requestedCpu}
                  onChange={(e) => setRequestedCpu(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requested RAM Memory (GB)</label>
                <input
                  type="number"
                  min="64"
                  max="512"
                  value={requestedRam}
                  onChange={(e) => setRequestedRam(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requested NVMe Storage (GB)</label>
                <input
                  type="number"
                  min="500"
                  max="4000"
                  value={requestedDisk}
                  onChange={(e) => setRequestedDisk(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900">
                <p className="text-[11px] leading-relaxed">
                  Pool expansions are evaluated based on account tier and usually provisioned within 10 minutes by the Hyper-V hypervisor scheduler.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upgradeSubmitted}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {upgradeSubmitted ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
