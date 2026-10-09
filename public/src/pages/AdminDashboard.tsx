// ==============================================================================
// Page: AdminDashboard.tsx
// Purpose: Enterprise Administrator Control Center (Cloud Infrastructure Suite)
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

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  LayoutDashboard,
  Menu,
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
  Check,
  Edit,
  Pencil,
  X,
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

  // Sidebar compression & expansion states
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atech_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('atech_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

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
  const [adminPowerConfirmVm, setAdminPowerConfirmVm] = useState<{ vmId: number; name: string } | null>(null);

  // Plans & Coupons
  const [plans, setPlans] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(20);
  const [newCouponPlanId, setNewCouponPlanId] = useState<string>('');
  
  // Create Plan Form States
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCpu, setNewPlanCpu] = useState(2);
  const [newPlanRam, setNewPlanRam] = useState(4);
  const [newPlanStorage, setNewPlanStorage] = useState(50);
  const [newPlanPrice, setNewPlanPrice] = useState(9.99);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Edit Plan State
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editPlanLoading, setEditPlanLoading] = useState(false);

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

  const executeFleetPower = async (vmId: number, action: 'START' | 'STOP') => {
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

  const handleFleetPower = async (vmId: number, currentStatus: string) => {
    if (currentStatus === 'running') {
      const target = fleetVMs.find((v) => v.vmId === vmId);
      setAdminPowerConfirmVm({ vmId, name: target ? target.name : `Virtual Machine #${vmId}` });
      return;
    }
    await executeFleetPower(vmId, 'START');
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
        body: JSON.stringify({
          code: newCouponCode,
          discountValue: newCouponVal,
          discountType: 'PERCENT',
          applicablePlanId: newCouponPlanId ? Number(newCouponPlanId) : undefined,
        }),
      });
      if (res?.success) {
        toast.success(`Coupon ${res.coupon.code} created.`);
        setNewCouponCode('');
        setNewCouponPlanId('');
        fetchPlansAndCoupons();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanPrice) return;
    setCreatingPlan(true);
    try {
      const res = await apiCall('/admin/plans', {
        method: 'POST',
        body: JSON.stringify({
          name: newPlanName,
          cpuCores: newPlanCpu,
          ramGb: newPlanRam,
          storageGb: newPlanStorage,
          monthlyPrice: newPlanPrice,
        }),
      });
      if (res?.success) {
        toast.success(`Plan '${res.plan.name}' created successfully!`);
        setNewPlanName('');
        setNewPlanPrice(9.99);
        fetchPlansAndCoupons();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create plan');
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setEditPlanLoading(true);
    try {
      const res = await apiCall(`/admin/plans/${editingPlan.planId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editingPlan.name,
          cpuCores: editingPlan.cpuCores,
          ramGb: editingPlan.ramGb,
          storageGb: editingPlan.storageGb,
          monthlyPrice: editingPlan.monthlyPrice,
          isActive: editingPlan.isActive,
        }),
      });
      if (res?.success) {
        toast.success(`Plan '${res.plan.name}' updated successfully!`);
        setEditingPlan(null);
        fetchPlansAndCoupons();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setEditPlanLoading(false);
    }
  };

  const handleDeletePlan = async (planId: number, planName: string) => {
    if (!window.confirm(`Are you sure you want to delete/deactivate plan '${planName}'?`)) {
      return;
    }
    try {
      const res = await apiCall(`/admin/plans/${planId}`, { method: 'DELETE' });
      if (res?.success) {
        toast.success(res.message || 'Plan removed successfully.');
        fetchPlansAndCoupons();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete plan');
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

  const adminChatBottomRef = useRef<HTMLDivElement>(null);

  // 8. Support Tickets
  const fetchTickets = async () => {
    try {
      const res = await apiCall('/admin/tickets');
      if (res?.success) {
        setTickets(res.tickets || []);
        // CRITICAL FIX: Synchronize selectedTicket with fresh data from server
        setSelectedTicket((prev: any) => {
          if (!prev) return null;
          const fresh = (res.tickets || []).find((t: any) => t.id === prev.id);
          return fresh || prev;
        });
      }
    } catch (e) {}
  };

  // Real-time auto-polling for admin tickets and active conversation every 3.5s
  useEffect(() => {
    if (activeTab !== 'tickets') return;

    const interval = setInterval(async () => {
      try {
        if (selectedTicket) {
          const res = await apiCall(`/admin/tickets/${selectedTicket.id}`);
          if (res?.success && res.ticket) {
            const fresh = res.ticket;
            setSelectedTicket((prev: any) => {
              if (!prev || prev.id !== fresh.id) return prev;
              const prevLen = prev.chatHistory?.length || 0;
              const freshLen = fresh.chatHistory?.length || 0;
              if (
                prevLen !== freshLen ||
                prev.status !== fresh.status ||
                prev.response !== fresh.response ||
                prev.updatedAt !== fresh.updatedAt
              ) {
                return fresh;
              }
              return prev;
            });
            setTickets((prev) =>
              prev.map((t) => (t.id === fresh.id ? { ...t, ...fresh } : t))
            );
          }
        } else {
          // Poll the ticket queue list
          const res = await apiCall('/admin/tickets');
          if (res?.success) setTickets(res.tickets || []);
        }
      } catch (_) {}
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTab, selectedTicket?.id]);



  const handleReplyTicket = async () => {
    const msgToSend = replyText.trim();
    if (!selectedTicket || !msgToSend) return;
    setReplyText(''); // Immediately clear input on dispatch
    try {
      const res = await apiCall(`/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ response: msgToSend, status: replyStatus }),
      });
      if (res && (res.success || res.ticket)) {
        toast.success(`Response dispatched to customer (Status: ${replyStatus}).`);
        const updatedTicket = res.ticket || res;
        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
        fetchTickets();
      }
    } catch (err: any) {
      setReplyText(msgToSend); // Restore on error
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'fleet') fetchFleet();
    if (activeTab === 'plans') fetchPlansAndCoupons();
    if (activeTab === 'ipam') fetchIpam();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'threats') fetchThreats();
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab]);

  const navItems = [
    { id: 'overview', label: 'Host Telemetry', icon: Activity, badge: null, alert: false },
    { id: 'users', label: 'Users & Impersonation', icon: Users, badge: users.length || null, alert: false },
    { id: 'fleet', label: 'Global Fleet', icon: Server, badge: fleetVMs.length || null, alert: false },
    { id: 'plans', label: 'Plans & Coupons', icon: Tag, badge: null, alert: false },
    { id: 'ipam', label: 'IPAM Pool', icon: Network, badge: null, alert: false },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, badge: announcements.length || null, alert: false },
    { id: 'threats', label: 'Security & IP Bans', icon: ShieldAlert, badge: threats.length ? threats.length : null, alert: true },
    { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy, badge: tickets.filter((t) => t.status === 'OPEN').length || null, alert: true },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, badge: null, alert: false },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* COLLAPSIBLE & EXPANDABLE ADMIN SIDEBAR */}
      <aside
        className={`relative fixed md:sticky top-0 h-screen z-50 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Single Middle Collapse/Expand Toggle on Sidebar Rail (NOT in options) */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Compress sidebar'}
          className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-40 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Top: Branding */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'mx-auto' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-poppins block truncate">
                    ATEC CLOUD
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded tracking-wide">
                    SUPER ADMIN
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileSidebarOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl transition-all relative group ${
                  sidebarCollapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-2.5 text-xs font-semibold'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badge Count */}
                {item.badge ? (
                  sidebarCollapsed ? (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ) : (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.alert
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )
                ) : null}

                {/* Tooltip on Collapsed hover */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Back to Client Portal */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            title={sidebarCollapsed ? 'Return to Client Portal' : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              sidebarCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-2.5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            {!sidebarCollapsed && <span>Client Portal</span>}
          </button>

          {/* Theme Switcher */}
          <div className={`flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 ${
            sidebarCollapsed ? 'justify-center' : 'justify-between px-3'
          }`}>
            {!sidebarCollapsed && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Theme</span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 tracking-wide uppercase">
                  ATEC CLUSTER CORE
                </span>
                <h1 className="text-lg md:text-xl font-bold font-poppins text-slate-900 dark:text-white truncate">
                  {activeTab === 'overview' && 'Host Telemetry & Cluster Oversight'}
                  {activeTab === 'users' && 'Directory of Users & Ghost Mode'}
                  {activeTab === 'fleet' && 'Global Virtual Machine Fleet'}
                  {activeTab === 'plans' && 'Cloud Plans & Promo Engine'}
                  {activeTab === 'ipam' && 'IP Address Pool & Subnet Management'}
                  {activeTab === 'announcements' && 'Broadcast Maintenance & Notices'}
                  {activeTab === 'threats' && 'Security Threat Intel & IP Blacklist'}
                  {activeTab === 'tickets' && 'Customer Support Ticket Helpdesk'}
                  {activeTab === 'audit' && 'Cluster Audit Trail & Event Stream'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
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
              title="Refresh Current View"
              className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${overviewLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 md:p-8 space-y-6 max-w-7xl w-full">

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
            {/* Create New Plan Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Create Custom VPS Plan
              </h3>
              <form onSubmit={handleCreatePlan} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Plan Name</label>
                  <input
                    type="text"
                    placeholder="e.g. VPS Ultra Scale"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">vCPUs</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={newPlanCpu}
                    onChange={(e) => setNewPlanCpu(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="256"
                    value={newPlanRam}
                    onChange={(e) => setNewPlanRam(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={newPlanStorage}
                    onChange={(e) => setNewPlanStorage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Price ($/mo)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingPlan}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{creatingPlan ? 'Deploying...' : 'Deploy New Plan'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Promo Codes Engine */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" /> Promo Code & Discount Manager
              </h3>
              <form onSubmit={handleCreateCoupon} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="CODE (e.g. FLASH50)"
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

                <select
                  value={newCouponPlanId}
                  onChange={(e) => setNewCouponPlanId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="">Apply to Any Plan</option>
                  {plans.map((p) => (
                    <option key={p.planId} value={p.planId}>
                      Specific Plan: {p.name} (${p.monthlyPrice}/mo)
                    </option>
                  ))}
                </select>

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
                      {c.applicablePlanId && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          Target Plan ID: #{c.applicablePlanId}
                        </p>
                      )}
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">
                    Active Cloud VPS Packages ({plans.length})
                  </h3>
                  <p className="text-xs text-slate-500">Edit package specifications, update prices, or remove tiers.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Plan Name</th>
                      <th className="px-4 py-3">vCPU Cores</th>
                      <th className="px-4 py-3">RAM</th>
                      <th className="px-4 py-3">Storage</th>
                      <th className="px-4 py-3">Monthly Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {plans.map((p) => (
                      <tr key={p.planId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-xs">{p.name}</td>
                        <td className="px-4 py-3 text-xs">{p.cpuCores} Cores</td>
                        <td className="px-4 py-3 text-xs">{p.ramGb} GB RAM</td>
                        <td className="px-4 py-3 text-xs">{p.storageGb} GB {p.storageType || 'NVMe'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-xs text-blue-600">${Number(p.monthlyPrice).toFixed(2)}/mo</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {p.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingPlan({ ...p })}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Edit Plan Specs & Price"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(p.planId, p.name)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 transition-colors"
                              title="Delete or Deactivate Plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL: EDIT PLAN SPECS & PRICING */}
            {editingPlan && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-blue-600" /> Edit VPS Plan ({editingPlan.name})
                    </h3>
                    <button
                      onClick={() => setEditingPlan(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">vCPU Cores</label>
                        <input
                          type="number"
                          min="1"
                          max="64"
                          value={editingPlan.cpuCores}
                          onChange={(e) => setEditingPlan({ ...editingPlan, cpuCores: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">RAM (GB)</label>
                        <input
                          type="number"
                          min="1"
                          max="256"
                          value={editingPlan.ramGb}
                          onChange={(e) => setEditingPlan({ ...editingPlan, ramGb: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Storage (GB)</label>
                        <input
                          type="number"
                          min="10"
                          max="2000"
                          value={editingPlan.storageGb}
                          onChange={(e) => setEditingPlan({ ...editingPlan, storageGb: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price ($/mo)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={editingPlan.monthlyPrice}
                          onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="planActive"
                        checked={Boolean(editingPlan.isActive)}
                        onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <label htmlFor="planActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Active (Visible in client storefront & pricing table)
                      </label>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingPlan(null)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editPlanLoading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editPlanLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

                {/* Conversation History Thread */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Customer Conversation History:
                  </label>
                  <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
                    {(() => {
                      const thread = selectedTicket.chatHistory && selectedTicket.chatHistory.length > 0
                        ? selectedTicket.chatHistory
                        : [
                            { id: '1', sender: 'CUSTOMER', senderName: selectedTicket.user?.fullName || 'Customer', message: selectedTicket.message, timestamp: selectedTicket.createdAt },
                            ...(selectedTicket.response ? [{ id: '2', sender: 'SUPPORT', senderName: selectedTicket.assignedTo || 'Engineer', message: selectedTicket.response, timestamp: selectedTicket.updatedAt }] : []),
                          ];

                      return thread.map((msg: any, idx: number) => {
                        const isCustomer = msg.sender === 'CUSTOMER';
                        return (
                          <div
                            key={msg.id || idx}
                            className={`p-3 rounded-xl text-xs space-y-1 ${
                              isCustomer
                                ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                                : 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold opacity-80">
                              <span className={isCustomer ? 'text-slate-700 dark:text-slate-300' : 'text-blue-600 dark:text-blue-400'}>
                                {isCustomer ? `Customer (${msg.senderName})` : `Admin Response (${msg.senderName})`}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        );
                      });
                    })()}
                    <div ref={adminChatBottomRef} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Post Support Message / Diagnostic Resolution:
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
                      disabled={!replyText.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Message to Customer
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
                        setReplyText('');
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

        </main>
      </div>

      {/* ADMIN POWER OFF CONFIRMATION MODAL */}
      {adminPowerConfirmVm && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">Power Off Fleet Instance?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Emergency power off command will be issued to Hyper-V host</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              Are you sure you want to shut down <strong className="text-slate-900 dark:text-white font-bold">{adminPowerConfirmVm.name}</strong>? Guest processes and customer services will be immediately interrupted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdminPowerConfirmVm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = adminPowerConfirmVm.vmId;
                  setAdminPowerConfirmVm(null);
                  executeFleetPower(id, 'STOP');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" /> Confirm Power Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
