import React, { useState } from 'react';
import { 
  Server, Cpu, HardDrive, Zap, Play, Square, RefreshCw, 
  Terminal, Plus, ShieldCheck, Activity, Globe, MoreVertical 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VPSInstance {
  id: string;
  name: string;
  ip: string;
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  status: 'running' | 'stopped' | 'rebooting';
  region: string;
}

export default function Dashboard() {
  // Mock active VPS instances state
  const [instances, setInstances] = useState<VPSInstance[]>([
    {
      id: 'vps-01',
      name: 'Prod-Web-Server-01',
      ip: '192.168.1.102',
      os: 'Ubuntu 24.04 LTS',
      cpu: 4,
      ram: 8,
      disk: 160,
      status: 'running',
      region: 'Data Center Node 1'
    },
    {
      id: 'vps-02',
      name: 'App-Backend-DB',
      ip: '192.168.1.105',
      os: 'Debian 12',
      cpu: 2,
      ram: 4,
      disk: 80,
      status: 'running',
      region: 'Data Center Node 1'
    },
    {
      id: 'vps-03',
      name: 'Staging-Testing-Env',
      ip: '192.168.1.118',
      os: 'Ubuntu 22.04 LTS',
      cpu: 1,
      ram: 2,
      disk: 40,
      status: 'stopped',
      region: 'Data Center Node 2'
    }
  ]);

  // Action Handlers
  const handlePowerAction = (id: string, action: 'start' | 'stop' | 'reboot') => {
    setInstances(prev => prev.map(item => {
      if (item.id === id) {
        if (action === 'start') return { ...item, status: 'running' };
        if (action === 'stop') return { ...item, status: 'stopped' };
        if (action === 'reboot') return { ...item, status: 'rebooting' };
      }
      return item;
    }));
  };

  // Metric aggregates
  const totalCpu = instances.reduce((acc, curr) => acc + (curr.status === 'running' ? curr.cpu : 0), 0);
  const totalRam = instances.reduce((acc, curr) => acc + (curr.status === 'running' ? curr.ram : 0), 0);
  const activeCount = instances.filter(i => i.status === 'running').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-blue-950 font-poppins">Virtual Instances</h1>
            <p className="text-xs text-slate-500 mt-1">Manage, monitor, and configure your cloud infrastructure servers.</p>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Deploy New Instance
          </Link>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Active VPS</span>
              <Server className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-950 font-poppins">
              {activeCount} <span className="text-xs font-normal text-slate-400">/ {instances.length} Online</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Allocated vCPUs</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-950 font-poppins">
              {totalCpu} <span className="text-xs font-normal text-slate-400">Cores Active</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">RAM Consumption</span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-950 font-poppins">
              {totalRam} <span className="text-xs font-normal text-slate-400">GB Memory</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-500 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">System Health</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 font-poppins flex items-center gap-2">
              99.98% <span className="text-xs font-normal text-slate-400">Uptime</span>
            </div>
          </div>

        </div>

        {/* INSTANCES LIST TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-blue-950 font-poppins">Your Provisioned Servers</h2>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full border border-blue-100">
              Hyper-V Cluster Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Instance Name</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">IP Address</th>
                  <th className="py-4 px-6">Specs</th>
                  <th className="py-4 px-6">OS Distribution</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {instances.map((vm) => (
                  <tr key={vm.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* NAME */}
                    <td className="py-4 px-6 font-bold text-blue-950">
                      <div className="flex items-center gap-2.5">
                        <Server className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <div>{vm.name}</div>
                          <div className="text-[10px] font-normal text-slate-400">{vm.region}</div>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6">
                      {vm.status === 'running' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Running
                        </span>
                      )}
                      {vm.status === 'stopped' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Powered Off
                        </span>
                      )}
                      {vm.status === 'rebooting' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Rebooting
                        </span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-4 px-6 font-mono text-slate-600 font-semibold">
                      {vm.ip}
                    </td>

                    {/* SPECS */}
                    <td className="py-4 px-6 text-slate-600">
                      {vm.cpu} vCPU / {vm.ram} GB / {vm.disk} GB NVMe
                    </td>

                    {/* OS */}
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {vm.os}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* START BUTTON */}
                        {vm.status === 'stopped' && (
                          <button
                            title="Start Server"
                            onClick={() => handlePowerAction(vm.id, 'start')}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-200"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* REBOOT / STOP BUTTONS */}
                        {vm.status === 'running' && (
                          <>
                            <button
                              title="Reboot Instance"
                              onClick={() => handlePowerAction(vm.id, 'reboot')}
                              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Power Off"
                              onClick={() => handlePowerAction(vm.id, 'stop')}
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-200"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* TERMINAL CONSOLE */}
                        <button
                          title="Open Web Console Terminal"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200"
                        >
                          <Terminal className="w-3.5 h-3.5" />
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
    </div>
  );
}