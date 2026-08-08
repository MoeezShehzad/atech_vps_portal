import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  Plus, 
  Power, 
  RefreshCw, 
  Search,
  X,
  Terminal,
  Copy,
  Check,
  MemoryStick,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Instance {
  id: string;
  name: string;
  ip: string;
  os: string;
  status: 'running' | 'stopped' | 'rebooting';
  cpuUsage: number;
  ramUsage: string;
  diskUsage: string;
  vCPU: number;
  ramGB: number;
  diskGB: number;
  createdAt: string;
}

export default function Dashboard() {
  const { logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers state
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [copiedSSH, setCopiedSSH] = useState(false);

  // Deploy form state
  const [newHostname, setNewHostname] = useState('');
  const [selectedOS, setSelectedOS] = useState('Ubuntu 24.04 LTS');
  const [selectedPlan, setSelectedPlan] = useState<{ vCPU: number; ramGB: number; label: string }>({
    vCPU: 2,
    ramGB: 4,
    label: 'Standard - 2 vCPU / 4GB RAM'
  });
  const [newDiskGB, setNewDiskGB] = useState(50);

  // Initial infrastructure state
  const [instances, setInstances] = useState<Instance[]>([
    {
      id: 'vps-01',
      name: 'Prod-DB-Primary',
      ip: '192.168.10.45',
      os: 'Ubuntu 24.04 LTS',
      status: 'running',
      cpuUsage: 18,
      ramUsage: '4.2 / 8 GB',
      diskUsage: '32 / 80 GB',
      vCPU: 4,
      ramGB: 8,
      diskGB: 80,
      createdAt: '2026-01-15'
    },
    {
      id: 'vps-02',
      name: 'Web-App-Frontend',
      ip: '192.168.10.12',
      os: 'Debian 12',
      status: 'running',
      cpuUsage: 42,
      ramUsage: '2.1 / 4 GB',
      diskUsage: '14 / 40 GB',
      vCPU: 2,
      ramGB: 4,
      diskGB: 40,
      createdAt: '2026-02-10'
    },
    {
      id: 'vps-03',
      name: 'Mail-Server-Relay',
      ip: '192.168.10.88',
      os: 'Ubuntu 22.04 LTS',
      status: 'stopped',
      cpuUsage: 0,
      ramUsage: '0.0 / 4 GB',
      diskUsage: '20 / 50 GB',
      vCPU: 2,
      ramGB: 4,
      diskGB: 50,
      createdAt: '2026-03-01'
    },
  ]);

  // Aggregate stats calculations
  const totalStorage = instances.reduce((acc, inst) => acc + inst.diskGB, 0);

  const toggleServerStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent row click opening drawer

    setInstances((prev) =>
      prev.map((inst) => {
        if (inst.id === id) {
          const nextStatus = inst.status === 'running' ? 'stopped' : 'running';
          const updated: Instance = {
            ...inst,
            status: nextStatus,
            cpuUsage: nextStatus === 'running' ? 12 : 0,
          };

          if (selectedInstance?.id === id) {
            setSelectedInstance(updated);
          }

          return updated;
        }
        return inst;
      })
    );
  };

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;

    const newId = `vps-0${instances.length + 1}`;
    const randomHost = Math.floor(Math.random() * 200) + 10;
    const newIp = `192.168.10.${randomHost}`;

    const newServer: Instance = {
      id: newId,
      name: newHostname.trim(),
      ip: newIp,
      os: selectedOS,
      status: 'running',
      cpuUsage: 8,
      ramUsage: `0.5 / ${selectedPlan.ramGB} GB`,
      diskUsage: `4 / ${newDiskGB} GB`,
      vCPU: selectedPlan.vCPU,
      ramGB: selectedPlan.ramGB,
      diskGB: Number(newDiskGB),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setInstances([newServer, ...instances]);
    setIsDeployOpen(false);
    setNewHostname('');
  };

  const handleCopySSH = (ip: string) => {
    navigator.clipboard.writeText(`ssh root@${ip}`);
    setCopiedSSH(true);
    setTimeout(() => setCopiedSSH(false), 2000);
  };

  const filteredInstances = instances.filter((inst) =>
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.ip.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-950 font-poppins">
              Infrastructure Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage virtual private servers, network configurations, and resource allocation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDeployOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20"
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total VPS</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{instances.length} Active</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">Optimal</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg CPU Usage</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">20%</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Allocated</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalStorage} GB</p>
            </div>
          </div>
        </div>

        {/* INSTANCE TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* TABLE CONTROLS */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 font-poppins">
              Virtual Private Servers
            </h2>
            <div className="relative w-full sm:w-64">
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
                  <th className="px-6 py-3.5">OS</th>
                  <th className="px-6 py-3.5">CPU Load</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstances.map((inst) => (
                  <tr 
                    key={inst.id} 
                    onClick={() => setSelectedInstance(inst)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                      <Server className="w-4 h-4 text-slate-400" />
                      {inst.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          inst.status === 'running'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inst.status === 'running' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{inst.ip}</td>
                    <td className="px-6 py-4 text-xs">{inst.os}</td>
                    <td className="px-6 py-4">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            inst.cpuUsage > 75 ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${inst.cpuUsage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">{inst.cpuUsage}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => toggleServerStatus(inst.id, e)}
                          title={inst.status === 'running' ? 'Power Off' : 'Power On'}
                          className={`p-1.5 rounded-lg border transition-all ${
                            inst.status === 'running'
                              ? 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                              : 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== DEPLOY NEW INSTANCE MODAL ==================== */}
      {isDeployOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsDeployOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 font-poppins mb-1">
              Deploy New Instance
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Select your server distribution, hardware sizing, and hostname.
            </p>

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hostname / Server Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. App-Server-01"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating System
                </label>
                <select
                  value={selectedOS}
                  onChange={(e) => setSelectedOS(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                >
                  <option value="Ubuntu 24.04 LTS">Ubuntu 24.04 LTS</option>
                  <option value="Ubuntu 22.04 LTS">Ubuntu 22.04 LTS</option>
                  <option value="Debian 12">Debian 12</option>
                  <option value="CentOS Stream 9">CentOS Stream 9</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hardware Plan
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'starter') setSelectedPlan({ vCPU: 1, ramGB: 2, label: 'Starter' });
                    if (val === 'standard') setSelectedPlan({ vCPU: 2, ramGB: 4, label: 'Standard' });
                    if (val === 'pro') setSelectedPlan({ vCPU: 4, ramGB: 8, label: 'Pro' });
                  }}
                  defaultValue="standard"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                >
                  <option value="starter">Starter - 1 vCPU / 2GB RAM</option>
                  <option value="standard">Standard - 2 vCPU / 4GB RAM</option>
                  <option value="pro">Pro - 4 vCPU / 8GB RAM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disk Storage (GB)
                </label>
                <input
                  type="number"
                  min="20"
                  max="500"
                  value={newDiskGB}
                  onChange={(e) => setNewDiskGB(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                >
                  Provision Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SERVER DETAIL SIDEBAR DRAWER ==================== */}
      {selectedInstance && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full border-l border-slate-200 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            
            <div className="space-y-6">
              {/* DRAWER HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg font-poppins">
                      {selectedInstance.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-500">{selectedInstance.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInstance(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
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
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hardware Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Cpu className="w-3.5 h-3.5" /> vCPU Cores
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedInstance.vCPU} vCPU</p>
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
                      <Clock className="w-3.5 h-3.5" /> Created Date
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedInstance.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* EVENT REBOOT LOGS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recent Logs & Events
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">Server Status Verified</p>
                      <p className="text-[10px] text-slate-400">Health checks passed 5m ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 border-t border-slate-200/60 pt-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-800">System Boot Completed</p>
                      <p className="text-[10px] text-slate-400">Initial boot sequence completed</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* DRAWER FOOTER ACTIONS */}
            <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
              <button
                onClick={(e) => toggleServerStatus(selectedInstance.id, e)}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border ${
                  selectedInstance.status === 'running'
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Power className="w-4 h-4" />
                {selectedInstance.status === 'running' ? 'Power Down Instance' : 'Start Instance'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}