// ==============================================================================
// Page: AdminDashboard.tsx
// Purpose: Enterprise Administrator Control Center (Hostinger-Grade Suite)
//          1. Physical Host & Hyper-V Fleet Telemetry
//          2. Directory of Users & Role/Status Management + Ghost Mode Impersonation
//          3. Global Fleet VM Oversight & Emergency Power Controls
//          4. Dynamic Plans & Promo Code Manager
//          5. IP Address Pool (IPAM) & Subnet Inventory
//          6. System Announcement & Maintenance Banner Broadcast
//          7. Security Threat Intelligence & Cluster IP Bans
//          8. Support Helpdesk Ticket Center
//          9. Cluster Audit Trail & Security Stream
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserX,
  LogIn,
  Megaphone,
  Tag,
  Network,
  ShieldAlert,
  LifeBuoy,
  Plus,
  Trash2,
  Send,
  Eye,
  Check
} from 'lucide-react';
import { apiCall, setAccessToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'fleet' | 'plans' | 'ipam' | 'announcements' | 'threats' | 'tickets' | 'audit'
  >('overview');

  // Loading & states
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [hostStats, setHostStats] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);

  // Users & Impersonation
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);

  // Fleet
  const [fleetVMs, setFleetVMs] = useState<any[]>([]);
  const [powerActionLoadingId, setPowerActionLoadingId] = useState<number | null>(null);

  // Plans & Coupons
  const [plans, setPlans] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(20);

  // IPAM
  const [ipPool, setIpPool] = useState<any[]>([]);
  const [newIpAddress, setNewIpAddress] = useState('');

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceType, setAnnounceType] = useState('info');

  // Security Threats
  const [threats, setThreats] = useState<any[]>([]);
  const [banIpInput, setBanIpInput] = useState('');

  // Support Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'RESOLVED' | 'IN_PROGRESS' | 'CLOSED'>('RESOLVED');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // 1. Overview
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

  // 2. Users
  const fetchUsers = async () => {
    try {
      const res = await apiCall(`/admin/users?search=${encodeURIComponent(userSearch)}`);
      if (res && res.success) setUsers(res.users);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    }
  };

  // Impersonate User ("Login as Customer")
  const handleImpersonate = async (user: any) => {
    if (!window.confirm(`GHOST MODE: Are you sure you want to impersonate '${user.fullName}' (${user.email})?`)) {
      return;
    }
    try {
      setImpersonatingId(user.userId);
      const res = await apiCall(`/admin/impersonate/${user.userId}`, { method: 'POST' });
      if (res && res.success) {
        // Save current admin token backup in session storage for safe return
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken) sessionStorage.setItem('originalAdminToken', currentToken);

        authLogin(res.accessToken, res.user);
        toast.info(`Impersonation active as ${user.email}`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to impersonate user');
    } finally {
      setImpersonatingId(null);
    }
  };

  // 3. Fleet
  const fetchFleet = async () => {
    try {
      const res = await apiCall('/admin/fleet/vms');
      if (res && res.success) setFleetVMs(res.vms);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fleet');
    }
  };

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
      toast.error(err.message || 'Power action failed');
    } finally {
      setPowerActionLoadingId(null);
    }
  };

  // 4. Plans & Coupons
  const fetchPlansAndCoupons = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        apiCall('/admin/plans'),
        apiCall('/admin/coupons'),
      ]);
      if (pRes?.success) setPlans(pRes.plans);
      if (cRes?.success) setCoupons(cRes.coupons);
    } catch (e) {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    try {
      const res = await apiCall('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({ code: newCouponCode, discountValue: newCouponVal, discountType: 'PERCENT' }),
      });
      if (res?.success) {
        toast.success(`Coupon ${res.coupon.code} created.`);
        setNewCouponCode('');
        fetchPlansAndCoupons();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    try {
      await apiCall(`/admin/coupons/${id}`, { method: 'DELETE' });
      toast.success('Promo code removed.');
      fetchPlansAndCoupons();
    } catch (e) {}
  };

  // 5. IPAM Pool
  const fetchIpam = async () => {
    try {
      const res = await apiCall('/admin/ipam');
      if (res?.success) setIpPool(res.ips);
    } catch (e) {}
  };

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpAddress) return;
    try {
      const res = await apiCall('/admin/ipam', {
        method: 'POST',
        body: JSON.stringify({ ipAddress: newIpAddress }),
      });
      if (res?.success) {
        toast.success(`IP ${newIpAddress} added to pool`);
        setNewIpAddress('');
        fetchIpam();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add IP');
    }
  };

  const handleReleaseIp = async (ipId: number) => {
    try {
      await apiCall(`/admin/ipam/${ipId}/release`, { method: 'PATCH' });
      toast.success('IP address released back to pool.');
      fetchIpam();
    } catch (e) {}
  };

  // 6. Announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await apiCall('/admin/announcements');
      if (res?.success) setAnnouncements(res.announcements);
    } catch (e) {}
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle || !announceMessage) return;
    try {
      const res = await apiCall('/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: announceTitle, message: announceMessage, type: announceType }),
      });
      if (res?.success) {
        toast.success('Broadcast notice launched across portal.');
        setAnnounceTitle('');
        setAnnounceMessage('');
        fetchAnnouncements();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to broadcast announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await apiCall(`/admin/announcements/${id}`, { method: 'DELETE' });
      toast.success('Announcement retracted.');
      fetchAnnouncements();
    } catch (e) {}
  };

  // 7. Security Threats & Ban
  const fetchThreats = async () => {
    try {
      const res = await apiCall('/admin/security/threats');
      if (res?.success) setThreats(res.threats);
    } catch (e) {}
  };

  const handleBanIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIpInput) return;
    try {
      const res = await apiCall('/admin/security/ban-ip', {
        method: 'POST',
        body: JSON.stringify({ ipAddress: banIpInput, reason: 'Manual Admin Cluster Ban' }),
      });
      if (res?.success) {
        toast.success(res.message);
        setBanIpInput('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to ban IP');
    }
  };

  // 8. Support Tickets
  const fetchTickets = async () => {
    try {
      const res = await apiCall('/admin/tickets');
      if (res?.success) setTickets(res.tickets);
    } catch (e) {}
  };

  const handleReplyTicket = async () => {
    if (!selectedTicket || !replyText) return;
    try {
      const res = await apiCall(`/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ response: replyText, status: replyStatus }),
      });
      if (res?.success) {
        toast.success(`Response dispatched to customer (Status: ${replyStatus}).`);
        setSelectedTicket(null);
        setReplyText('');
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket');
    }
  };

  // 9. Audit Logs
  const fetchAudit = async () => {
    try {
      const res = await apiCall('/admin/audit-logs?limit=100');
      if (res?.success) setAuditLogs(res.logs);
    } catch (e) {}
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'fleet') fetchFleet();
    if (activeTab === 'plans') fetchPlansAndCoupons();
    if (activeTab === 'ipam') fetchIpam();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'threats') fetchThreats();
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                HOSTINGER CLUSTER CORE
              </span>
              <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-900 dark:text-white">
                Global Operations & Infrastructure
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-tenant Hyper-V hypervisor controls, IPAM, revenue promotions, and security governance.
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
                if (activeTab === 'plans') fetchPlansAndCoupons();
                if (activeTab === 'ipam') fetchIpam();
                if (activeTab === 'announcements') fetchAnnouncements();
                if (activeTab === 'threats') fetchThreats();
                if (activeTab === 'tickets') fetchTickets();
                if (activeTab === 'audit') fetchAudit();
              }}
              title="Refresh"
              className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${overviewLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Hostinger Operations Suite) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Host Telemetry', icon: Activity },
            { id: 'users', label: 'Users & Impersonation', icon: Users },
            { id: 'fleet', label: 'Global Fleet', icon: Server },
            { id: 'plans', label: 'Plans & Coupons', icon: Tag },
            { id: 'ipam', label: 'IPAM Pool', icon: Network },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'threats', label: 'Security & IP Bans', icon: ShieldAlert },
            { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
            { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Registered Users</span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  {platformStats?.totalUsers ?? '...'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Active Subscriptions</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                  {platformStats?.activeSubscriptions ?? '...'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Total Fleet VMs</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  {platformStats?.totalVMs ?? '...'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Host Physical RAM</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                    <MemoryStick className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  {hostStats?.ramUsagePercent ?? 0}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {hostStats?.usedRamGb} GB / {hostStats?.totalRamGb} GB Total
                </p>
              </div>
            </div>

            {hostStats && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" /> Physical Hyper-V Node
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-500">Hostname</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{hostStats.hostname}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-500">CPU Architecture</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{hostStats.cpuCores} Physical Cores</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-500">Available Free RAM</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{hostStats.freeRamGb} GB</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USERS & IMPERSONATION (OPTION 1) */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                  User Governance & Ghost Mode Impersonation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View tenant accounts and login directly as any customer for instant debugging.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search user email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="pl-4 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
                <button onClick={fetchUsers} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">VMs</th>
                    <th className="px-6 py-3.5 text-right">Ghost Mode & Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{u.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{u.vmCount} VMs</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleImpersonate(u)}
                          disabled={impersonatingId === u.userId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all shadow-xs"
                          title="Login as Customer (Ghost Mode)"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login As User</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL FLEET */}
        {activeTab === 'fleet' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                  Cluster-Wide Virtual Machine Fleet ({fleetVMs.length})
                </h3>
                <p className="text-xs text-slate-500">Live Hyper-V hypervisor controls across all tenants.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">VM Name</th>
                    <th className="px-6 py-3.5">Owner</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">IP</th>
                    <th className="px-6 py-3.5">Specs</th>
                    <th className="px-6 py-3.5 text-right">Power Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fleetVMs.map((v) => (
                    <tr key={v.vmId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-xs">{v.name}</td>
                      <td className="px-6 py-4 text-xs font-mono">{v.owner?.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'running' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{v.ip}</td>
                      <td className="px-6 py-4 text-xs font-mono">{v.cpuCores} vCPU • {v.ramGb} GB</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleFleetPower(v.vmId, v.status)}
                          disabled={powerActionLoadingId === v.vmId}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600"
                        >
                          <Power className={`w-4 h-4 ${powerActionLoadingId === v.vmId ? 'animate-spin' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PLANS & COUPONS (OPTION 2) */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Promo Codes Engine */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" /> Promo Code & Discount Manager
              </h3>
              <form onSubmit={handleCreateCoupon} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="CODE (e.g. STARTUP50)"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase"
                  required
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCouponVal}
                  onChange={(e) => setNewCouponVal(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <span className="text-xs text-slate-500 font-semibold">% OFF</span>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <Plus className="w-3.5 h-3.5" /> Create Coupon
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {coupons.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{c.code}</span>
                      <p className="text-xs text-emerald-600 font-bold">{c.discountValue}% Discount</p>
                    </div>
                    <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Plans Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                Active Cloud VPS Packages ({plans.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Plan Name</th>
                      <th className="px-4 py-3">vCPU Cores</th>
                      <th className="px-4 py-3">RAM</th>
                      <th className="px-4 py-3">Storage</th>
                      <th className="px-4 py-3">Monthly Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {plans.map((p) => (
                      <tr key={p.planId}>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">{p.name}</td>
                        <td className="px-4 py-3 text-xs">{p.cpuCores} Cores</td>
                        <td className="px-4 py-3 text-xs">{p.ramGb} GB RAM</td>
                        <td className="px-4 py-3 text-xs">{p.storageGb} GB NVMe</td>
                        <td className="px-4 py-3 font-mono font-bold text-xs text-blue-600">${p.monthlyPrice}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: IPAM POOL (OPTION 3) */}
        {activeTab === 'ipam' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-600" /> IP Address Pool & Subnet Inventory (IPAM)
                </h3>
                <p className="text-xs text-slate-500">Manage IPv4 allocations and recycle unused addresses.</p>
              </div>

              <form onSubmit={handleAddIp} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New IP (e.g. 172.19.124.50)"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
                  Add IP
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {ipPool.map((ip) => (
                <div key={ip.ipId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{ip.ipAddress}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ip.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ip.status}
                    </span>
                  </div>
                  {ip.assignedVm && (
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      VM: {ip.assignedVm.name} ({ip.assignedVm.user?.email})
                    </p>
                  )}
                  {ip.status !== 'AVAILABLE' && (
                    <button onClick={() => handleReleaseIp(ip.ipId)} className="text-[11px] text-rose-600 font-bold hover:underline">
                      Release to Pool
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SYSTEM ANNOUNCEMENTS (OPTION 4) */}
        {activeTab === 'announcements' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" /> Global Maintenance & Announcement Broadcasts
              </h3>
              <p className="text-xs text-slate-500">Live banners broadcasted directly to customer dashboards.</p>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Notice Title (e.g. Scheduled Node Maintenance)"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="md:col-span-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  required
                />
                <select
                  value={announceType}
                  onChange={(e) => setAnnounceType(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="info">Info Notice (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="critical">Critical Maintenance (Rose)</option>
                </select>
              </div>
              <textarea
                rows={2}
                placeholder="Announcement message details for users..."
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                required
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
                Broadcast Across Cluster
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {announcements.map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{a.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{a.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono">By {a.createdBy} • {new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SECURITY & IP BANS (OPTION 5) */}
        {activeTab === 'threats' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Cluster Abuse & IP Blacklist
                </h3>
                <p className="text-xs text-slate-500">Monitor suspicious failed auth spikes and ban abusive IPs.</p>
              </div>

              <form onSubmit={handleBanIp} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="IP to ban (e.g. 192.168.1.55)"
                  value={banIpInput}
                  onChange={(e) => setBanIpInput(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
                <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold">
                  Ban IP
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Target Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {threats.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3 text-xs font-mono">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 text-xs">{t.ipAddress}</td>
                      <td className="px-4 py-3 text-xs font-bold">{t.action}</td>
                      <td className="px-4 py-3 text-xs font-mono">{t.targetUser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: SUPPORT TICKETS (OPTION 6) */}
        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-blue-600" /> Customer Support Ticket Center ({tickets.length})
            </h3>

            {selectedTicket ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{selectedTicket.id}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{selectedTicket.subject}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted by: <strong className="text-slate-700 dark:text-slate-300">{selectedTicket.user?.fullName || 'Customer'}</strong> ({selectedTicket.user?.email || 'N/A'}) • {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {selectedTicket.priority} PRIORITY
                    </span>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Back to Queue
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Customer Problem Description:
                  </label>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Official Engineering Response:
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Update Status:</span>
                      <select
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value as any)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="RESOLVED">RESOLVED (Completed)</option>
                        <option value="IN_PROGRESS">IN_PROGRESS (Investigating)</option>
                        <option value="CLOSED">CLOSED (Dismissed)</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Provide diagnostic output, resolution steps, or status explanation..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 resize-none leading-relaxed"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleReplyTicket}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Resolution to Customer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Inbox clean! Zero customer support tickets.</p>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setReplyText(t.response || '');
                        setReplyStatus(t.status === 'OPEN' ? 'RESOLVED' : t.status);
                      }}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">#{t.id}</span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{t.subject}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{t.message}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {t.user?.fullName} ({t.user?.email}) • {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                Cluster Audit Trail ({auditLogs.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-white">{log.action}</td>
                      <td className="px-4 py-3 text-xs">{log.actor?.email || 'System'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs truncate max-w-xs">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
