// ==============================================================================
// Page: AdminDashboard.tsx
// Purpose: Enterprise Administrator Control Center
//          1. Physical Host & Hyper-V Fleet Telemetry
//          2. Directory of Users & Role/Status Management
//          3. Cluster Audit Trail & Security Logs
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Server,
  Users,
  ShieldCheck,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  Search,
  Power,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Filter,
  BadgeAlert,
  UserCheck,
  UserX
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

interface HostStats {
  platform: string;
  hostname: string;
  uptimeSeconds: number;
  cpuCores: number;
  cpuModel: string;
  totalRamGb: number;
  usedRamGb: number;
  freeRamGb: number;
  ramUsagePercent: number;
}

interface UserRecord {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  authProvider: string;
  role: string;
  vmCount: number;
  subscriptionCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

interface FleetVM {
  vmId: number;
  name: string;
  hostname: string;
  os: string;
  status: string;
  ip: string;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  owner: {
    userId: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

interface AuditLog {
  id: string;
  type: 'ACTIVITY' | 'SECURITY';
  action: string;
  status: string;
  details: string;
  actor: {
    userId?: number;
    name?: string;
    email?: string;
  };
  targetVm?: string | null;
  ipAddress?: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'fleet' | 'audit'>('overview');
  
  // Data states
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [hostStats, setHostStats] = useState<HostStats | null>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserActionId, setSelectedUserActionId] = useState<number | null>(null);

  const [fleetVMs, setFleetVMs] = useState<FleetVM[]>([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [powerActionLoadingId, setPowerActionLoadingId] = useState<number | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // 1. Fetch Overview & Host Metrics
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await apiCall('/admin/overview');
      if (res && res.success) {
        setHostStats(res.host);
        setPlatformStats(res.stats);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load host telemetry');
    } finally {
      setOverviewLoading(false);
    }
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await apiCall(`/admin/users?search=${encodeURIComponent(userSearch)}`);
      if (res && res.success) {
        setUsers(res.users);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // 3. Fetch Fleet VMs
  const fetchFleet = async () => {
    try {
      setFleetLoading(true);
      const res = await apiCall('/admin/fleet/vms');
      if (res && res.success) {
        setFleetVMs(res.vms);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load VM fleet');
    } finally {
      setFleetLoading(false);
    }
  };

  // 4. Fetch Audit Logs
  const fetchAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await apiCall('/admin/audit-logs?limit=100');
      if (res && res.success) {
        setAuditLogs(res.logs);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'fleet') fetchFleet();
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab]);

  // Handle User Status Toggle (Suspend / Activate)
  const handleToggleUser = async (userId: number, currentActive: boolean) => {
    try {
      setSelectedUserActionId(userId);
      const res = await apiCall(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res && res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) => (u.userId === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setSelectedUserActionId(null);
    }
  };

  // Handle User Role Toggle (Admin vs Customer)
  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole.toLowerCase() === 'admin' ? 'Customer' : 'Admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    try {
      setSelectedUserActionId(userId);
      const res = await apiCall(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleName: newRole }),
      });
      if (res && res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) => (u.userId === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setSelectedUserActionId(null);
    }
  };

  // Handle Admin Fleet Power Action
  const handleFleetPower = async (vmId: number, currentStatus: string) => {
    const action = currentStatus === 'running' ? 'STOP' : 'START';
    try {
      setPowerActionLoadingId(vmId);
      const res = await apiCall(`/admin/fleet/vms/${vmId}/power`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      if (res && res.success) {
        toast.success(res.message);
        setFleetVMs((prev) =>
          prev.map((v) => (v.vmId === vmId ? { ...v, status: action === 'START' ? 'running' : 'stopped' } : v))
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger power action');
    } finally {
      setPowerActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                ADMIN CONSOLE
              </span>
              <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-900 dark:text-white">
                Cluster Infrastructure Management
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Host physical telemetry, multi-tenant VM oversight, and account governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <button
              onClick={() => {
                fetchOverview();
                if (activeTab === 'users') fetchUsers();
                if (activeTab === 'fleet') fetchFleet();
                if (activeTab === 'audit') fetchAudit();
              }}
              title="Refresh all metrics"
              className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${overviewLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Host & Cluster Telemetry', icon: Activity },
            { id: 'users', label: 'User Directory & Roles', icon: Users },
            { id: 'fleet', label: 'Global VM Fleet', icon: Server },
            { id: 'audit', label: 'Cluster Audit Trail', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: HOST OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Aggregate Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <span>Registered Users</span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  {platformStats?.totalUsers ?? '...'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Multi-tenant accounts</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <span>Active Cloud Subscriptions</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                  {platformStats?.activeSubscriptions ?? '...'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Prepaid billing plans</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <span>Total Provisioned VMs</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  {platformStats?.totalVMs ?? '...'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {platformStats?.activeVMs ?? 0} currently running
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <span>Host Physical RAM</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                    <MemoryStick className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  {hostStats?.ramUsagePercent ?? 0}% <span className="text-xs font-normal text-slate-500">used</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {hostStats?.usedRamGb} GB / {hostStats?.totalRamGb} GB Total
                </p>
              </div>
            </div>

            {/* Host Physical Hardware Details */}
            {hostStats && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" /> Physical Host Node Hardware
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400">
                    Host Online ({hostStats.platform.toUpperCase()})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Host Server Name</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{hostStats.hostname}</p>
                    <span className="text-[11px] text-slate-400 font-mono">Uptime: {Math.round(hostStats.uptimeSeconds / 3600)} hours</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">CPU Architecture</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{hostStats.cpuCores} Physical Cores</p>
                    <span className="text-[11px] text-slate-400 truncate block">{hostStats.cpuModel}</span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Available Free RAM</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{hostStats.freeRamGb} GB</p>
                    <span className="text-[11px] text-slate-400 font-mono">Ready for new VM allocations</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & ROLES */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                  Registered Users & Governance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage permissions, promote administrators, and enforce account suspensions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Account Status</th>
                    <th className="px-6 py-3.5">VMs / Subscriptions</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No users found matching search query.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">{u.fullName}</p>
                          <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.role.toLowerCase() === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          {u.vmCount} VMs • {u.subscriptionCount} Plans
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Role Toggle */}
                            <button
                              onClick={() => handleToggleRole(u.userId, u.role)}
                              disabled={selectedUserActionId === u.userId}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-purple-500 hover:text-purple-600 transition-all"
                              title="Toggle Role (Admin / Customer)"
                            >
                              {u.role.toLowerCase() === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>

                            {/* Status Toggle */}
                            <button
                              onClick={() => handleToggleUser(u.userId, u.isActive)}
                              disabled={selectedUserActionId === u.userId}
                              className={`p-1.5 rounded-lg border transition-all ${
                                u.isActive
                                  ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-300'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={u.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

        {/* TAB 3: GLOBAL FLEET VMS */}
        {activeTab === 'fleet' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                  Cluster-Wide Virtual Machine Fleet ({fleetVMs.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct Hyper-V hypervisor oversight over all tenant virtual servers.
                </p>
              </div>
              <button
                onClick={fetchFleet}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${fleetLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">VM Name</th>
                    <th className="px-6 py-3.5">Owner</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">IP Address</th>
                    <th className="px-6 py-3.5">Allocated Specs</th>
                    <th className="px-6 py-3.5 text-right">Emergency Power</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fleetVMs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No virtual machines active in fleet.
                      </td>
                    </tr>
                  ) : (
                    fleetVMs.map((v) => (
                      <tr key={v.vmId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-xs">
                          {v.name}
                          <span className="block text-[10px] font-normal text-slate-400">{v.os}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{v.owner.fullName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{v.owner.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              v.status === 'running'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'running' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {v.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{v.ip}</td>
                        <td className="px-6 py-4 text-xs font-mono">
                          {v.cpuCores} vCPU • {v.ramGb} GB RAM • {v.storageGb} GB NVMe
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleFleetPower(v.vmId, v.status)}
                            disabled={powerActionLoadingId === v.vmId}
                            title={v.status === 'running' ? 'Power Off VM' : 'Power On VM'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              v.status === 'running'
                                ? 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600'
                            }`}
                          >
                            <Power className={`w-4 h-4 ${powerActionLoadingId === v.vmId ? 'animate-spin' : ''}`} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CLUSTER AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                  Real-Time Cluster Audit & Security Stream
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chronological trail of VM life-cycle changes, logins, and administrative actions.
                </p>
              </div>
              <button
                onClick={fetchAudit}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Actor</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                        No audit records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {log.actor?.email || 'System'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status?.toUpperCase() === 'SUCCESS'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-md truncate">
                          {log.details || log.ipAddress || '—'}
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
    </div>
  );
}
