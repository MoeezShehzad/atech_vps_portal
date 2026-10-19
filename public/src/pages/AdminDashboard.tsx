// ==============================================================================
// Page: AdminDashboard.tsx
// Purpose: Enterprise Administrator Control Center (Cloud Infrastructure Suite)
//          1. Physical Host & Virtual Compute Fleet Telemetry
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
import { useDebounce } from '../hooks/useDebounce';
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
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Eye,
  Check,
  Edit,
  Pencil,
  X,
  CreditCard,
  DollarSign,
  Receipt,
  RotateCcw,
  FileText,
  BarChart3,
  PieChart,
  Mail,
  Radio,
  Download,
  TrendingUp,
  Ban,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { apiCall, setAccessToken, getAccessToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';
import { formatDate, formatDateTime } from '../utils/dateFormatter';
import {
  ModernFloatingInput,
  ModernFloatingTextarea,
  ModernFloatingSelect,
} from '../components/ModernFormControls';

export default function AdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'users'
    | 'finance'
    | 'fleet'
    | 'broadcasts'
    | 'reports'
    | 'plans'
    | 'ipam'
    | 'announcements'
    | 'threats'
    | 'tickets'
    | 'audit'
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

  // Users & Roles & Ghost Mode
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 350);
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [availableRoles, setAvailableRoles] = useState<string[]>(['Customer', 'Service_Provider', 'Support_Staff', 'Admin']);
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<any | null>(null);
  const [userProfileData, setUserProfileData] = useState<any | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState<boolean>(false);
  const [changingRoleUserId, setChangingRoleUserId] = useState<number | null>(null);

  // Finance & Payments
  const [billingOverview, setBillingOverview] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [billingCustomers, setBillingCustomers] = useState<any[]>([]);
  const [selectedBillingCustomer, setSelectedBillingCustomer] = useState<any | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [billingViewMode, setBillingViewMode] = useState<'by_customer' | 'all_invoices'>('by_customer');
  const [billingLoading, setBillingLoading] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePagination, setInvoicePagination] = useState<any>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [refundModalInvoice, setRefundModalInvoice] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('requested_by_customer');
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [markPaidModalInvoice, setMarkPaidModalInvoice] = useState<any | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState<string>('BANK_WIRE');
  const [markPaidNotes, setMarkPaidNotes] = useState<string>('Direct Wire / Manual Bank Transfer confirmed');
  const [markPaidProcessing, setMarkPaidProcessing] = useState(false);
  const [voidModalInvoice, setVoidModalInvoice] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Unpaid order / Order cancellation');
  const [voidProcessing, setVoidProcessing] = useState(false);
  const [selectedInvoiceReceipt, setSelectedInvoiceReceipt] = useState<any | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Safe Broadcasts
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'vps_owners' | 'service_providers' | 'unpaid'>('all');
  const [broadcastInApp, setBroadcastInApp] = useState(true);
  const [broadcastEmail, setBroadcastEmail] = useState(true);
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [activeBroadcastJob, setActiveBroadcastJob] = useState<any | null>(null);

  // Executive Reports & Analytics
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  // Fleet
  const [fleetVMs, setFleetVMs] = useState<any[]>([]);
  const [powerActionLoadingId, setPowerActionLoadingId] = useState<number | null>(null);
  const [adminPowerConfirmVm, setAdminPowerConfirmVm] = useState<{ vmId: number; name: string } | null>(null);

  // Plans & Coupons
  const [plans, setPlans] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState(20);
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newCouponPlanId, setNewCouponPlanId] = useState<string>('');
  const [newCouponValidFrom, setNewCouponValidFrom] = useState<string>('');
  const [newCouponExpiresAt, setNewCouponExpiresAt] = useState<string>('');
  
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
  const [replyStatus, setReplyStatus] = useState<'AWAITING_USER_ACTION' | 'RESOLVED' | 'IN_PROGRESS' | 'CLOSED'>('AWAITING_USER_ACTION');
  const [adminTicketStatusFilter, setAdminTicketStatusFilter] = useState<string>('ALL');
  const [adminTicketIdleFilter, setAdminTicketIdleFilter] = useState<string>('ALL');
  const [adminDateFrom, setAdminDateFrom] = useState<string>('');
  const [adminDateTo, setAdminDateTo] = useState<string>('');
  const [adminSortField, setAdminSortField] = useState<'updatedAt' | 'createdAt' | 'id'>('updatedAt');
  const [adminSortOrder, setAdminSortOrder] = useState<'asc' | 'desc'>('desc');
  const [adminTicketSearch, setAdminTicketSearch] = useState<string>('');

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

  // 2. Users & Roles
  const fetchUsers = async (searchOverride?: string) => {
    try {
      const activeSearch = typeof searchOverride === 'string' ? searchOverride : debouncedUserSearch;
      let query = `?search=${encodeURIComponent(activeSearch)}`;
      if (userRoleFilter && userRoleFilter !== 'ALL') {
        query += `&role=${encodeURIComponent(userRoleFilter)}`;
      }
      const res = await apiCall(`/admin/users${query}`);
      if (res && res.success) {
        setUsers(res.users);
        if (res.availableRoles) setAvailableRoles(res.availableRoles);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users');
    }
  };

  const handleUpdateRole = async (userId: number, newRoleName: string) => {
    try {
      setChangingRoleUserId(userId);
      const res = await apiCall(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRoleName }),
      });
      if (res && res.success) {
        toast.success(res.message || 'User role updated.');
        setUsers((prev) =>
          prev.map((u) => (u.userId === userId ? { ...u, role: newRoleName } : u))
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    } finally {
      setChangingRoleUserId(null);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const res = await apiCall(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res && res.success) {
        toast.success(res.message || `User account ${nextStatus ? 'activated' : 'suspended'}`);
        setUsers((prev) =>
          prev.map((u) => (u.userId === userId ? { ...u, isActive: nextStatus, isSuspended: !nextStatus } : u))
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const handleOpenUserDrawer = async (user: any) => {
    setSelectedUserForDrawer(user);
    setUserProfileLoading(true);
    setUserProfileData(null);
    try {
      const res = await apiCall(`/admin/users/${user.userId}/profile`);
      if (res && res.success) {
        setUserProfileData(res.profile);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user 360 profile');
    } finally {
      setUserProfileLoading(false);
    }
  };

  const handleAdminSubscriptionAction = async (subscriptionId: number, action: 'EXTEND_30_DAYS' | 'SUSPEND' | 'RESUME' | 'CANCEL') => {
    try {
      const res = await apiCall(`/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Subscription updated.');
        if (selectedUserForDrawer) {
          const profRes = await apiCall(`/admin/users/${selectedUserForDrawer.userId}/profile`);
          if (profRes?.success) setUserProfileData(profRes.profile);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update subscription');
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
        const currentToken = getAccessToken() || localStorage.getItem('accessToken');
        if (currentToken) sessionStorage.setItem('originalAdminToken', currentToken);

        authLogin(res.accessToken || res.token, res.user);
        toast.info(`Impersonation active as ${user.email}`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to impersonate user');
    } finally {
      setImpersonatingId(null);
    }
  };

  // 3. Billing & Payments
  const fetchFinance = async () => {
    try {
      setBillingLoading(true);
      const queryStatus = invoiceStatusFilter !== 'ALL' ? `&status=${invoiceStatusFilter}` : '';
      const userParam = selectedBillingCustomer ? `&userId=${selectedBillingCustomer.userId}` : '';
      const [overviewRes, invoicesRes] = await Promise.all([
        apiCall('/admin/billing/overview'),
        apiCall(`/admin/billing/invoices?page=${invoicePage}&limit=50&search=${encodeURIComponent(invoiceSearch)}${queryStatus}${userParam}`),
      ]);
      if (overviewRes?.success) setBillingOverview(overviewRes.overview);
      if (invoicesRes?.success) {
        setInvoices(invoicesRes.invoices);
        if (invoicesRes.customers) setBillingCustomers(invoicesRes.customers);
        setInvoicePagination(invoicesRes.pagination);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load billing ledger');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundModalInvoice) return;
    try {
      setRefundProcessing(true);
      const res = await apiCall(`/admin/billing/refund`, {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: refundModalInvoice.id || refundModalInvoice.invoiceId,
          amount: refundAmount ? parseFloat(refundAmount) : undefined,
          reason: refundReason,
        }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Refund successfully executed.');
        setRefundModalInvoice(null);
        setRefundAmount('');
        fetchFinance();
      }
    } catch (err: any) {
      toast.error(err.message || 'Refund execution failed');
    } finally {
      setRefundProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!markPaidModalInvoice) return;
    try {
      setMarkPaidProcessing(true);
      const res = await apiCall(`/admin/billing/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: markPaidModalInvoice.id || markPaidModalInvoice.invoiceId,
          paymentMethod: markPaidMethod,
          notes: markPaidNotes,
        }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Invoice marked as paid and VPS slot deposited.');
        setMarkPaidModalInvoice(null);
        fetchFinance();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark invoice as paid');
    } finally {
      setMarkPaidProcessing(false);
    }
  };

  const handleVoidInvoice = async () => {
    if (!voidModalInvoice) return;
    try {
      setVoidProcessing(true);
      const res = await apiCall(`/admin/billing/void-invoice`, {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: voidModalInvoice.id || voidModalInvoice.invoiceId,
          reason: voidReason,
        }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Invoice voided.');
        setVoidModalInvoice(null);
        fetchFinance();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to void invoice');
    } finally {
      setVoidProcessing(false);
    }
  };

  const handleViewInvoiceReceipt = async (inv: any) => {
    try {
      setLoadingReceipt(true);
      const invoiceId = inv.invoiceNumber || inv.id || inv.invoiceId;
      const res = await apiCall(`/admin/billing/invoices/${invoiceId}`);
      if (res && res.invoice) {
        setSelectedInvoiceReceipt(res.invoice);
      } else {
        setSelectedInvoiceReceipt({
          ...inv,
          customer: inv.user || selectedBillingCustomer || {
            name: 'Valued Customer',
            email: 'N/A',
            country: 'United States',
            address: 'Enterprise Node',
            city: 'Dallas',
          },
          items: [
            {
              description: `Analytical Technical Consulting - ${inv.plan?.name || inv.planName || 'Cloud VPS Compute'}`,
              specs: 'Dedicated High-Performance Virtual Machine',
              period: 'Monthly Subscription',
              amount: Number(inv.amount || inv.total || 0),
            },
          ],
          subtotal: Number(inv.amount || inv.total || 0),
          tax: 0,
          total: Number(inv.amount || inv.total || 0),
        });
      }
    } catch (err: any) {
      setSelectedInvoiceReceipt({
        ...inv,
        customer: inv.user || selectedBillingCustomer || {
          name: 'Valued Customer',
          email: 'N/A',
          country: 'United States',
          address: 'Enterprise Node',
          city: 'Dallas',
        },
        items: [
          {
            description: `Analytical Technical Consulting - ${inv.plan?.name || inv.planName || 'Cloud VPS Compute'}`,
            specs: 'Dedicated High-Performance Virtual Machine',
            period: 'Monthly Subscription',
            amount: Number(inv.amount || inv.total || 0),
          },
        ],
        subtotal: Number(inv.amount || inv.total || 0),
        tax: 0,
        total: Number(inv.amount || inv.total || 0),
      });
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleDownloadInvoicePDF = async (inv: any) => {
    try {
      toast.info('Generating official enterprise PDF invoice...');
      let receiptData = selectedInvoiceReceipt;
      if (!receiptData || receiptData.invoiceNumber !== inv.invoiceNumber) {
        try {
          const res = await apiCall(`/admin/billing/invoices/${inv.invoiceNumber || inv.id || inv.invoiceId}`);
          receiptData = res.invoice;
        } catch (_) {
          receiptData = {
            ...inv,
            customer: inv.user || selectedBillingCustomer || {
              name: 'Valued Customer',
              email: 'N/A',
              country: 'United States',
              address: 'Enterprise Node',
              city: 'Dallas',
            },
            items: [
              {
                description: `Analytical Technical Consulting - ${inv.plan?.name || inv.planName || 'Cloud VPS Compute'}`,
                specs: 'Dedicated High-Performance Virtual Machine',
                period: 'Monthly Subscription',
                amount: Number(inv.amount || inv.total || 0),
              },
            ],
            subtotal: Number(inv.amount || inv.total || 0),
            tax: 0,
            total: Number(inv.amount || inv.total || 0),
          };
        }
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryBlue = [37, 99, 235];
      const darkSlate = [15, 23, 42];
      const mutedSlate = [100, 116, 139];
      const lightBg = [248, 250, 252];

      // Company Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Analytical Technical Consulting (ATC)', 20, 24);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Enterprise Cloud Infrastructure & Virtualization', 20, 30);
      doc.text('Billing & Accounts: billing@atechconsult.com', 20, 35);

      // Invoice Title & Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('INVOICE', 190, 24, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(receiptData.invoiceNumber || inv.invoiceNumber || 'INV-DRAFT', 190, 30, { align: 'right' });

      // Status Badge
      const statusText = String(receiptData.status || inv.status || 'PAID').toUpperCase();
      if (statusText === 'PAID') {
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(155, 34, 35, 6, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52);
        doc.text('PAID IN FULL', 172.5, 38.5, { align: 'center' });
      } else if (statusText === 'REFUNDED') {
        doc.setFillColor(243, 232, 255);
        doc.roundedRect(155, 34, 35, 6, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(107, 33, 168);
        doc.text('REFUNDED', 172.5, 38.5, { align: 'center' });
      } else {
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(155, 34, 35, 6, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.text(statusText, 172.5, 38.5, { align: 'center' });
      }

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, 44, 190, 44);

      // Billed To Box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(20, 50, 80, 28, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('BILLED TO (CUSTOMER)', 24, 56);
      doc.setFontSize(9.5);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      const customerName = receiptData.customer?.name || receiptData.customer?.fullName || inv.user?.fullName || selectedBillingCustomer?.fullName || 'Customer';
      doc.text(customerName.slice(0, 32), 24, 62);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text((receiptData.customer?.email || inv.user?.email || selectedBillingCustomer?.email || '').slice(0, 36), 24, 67);
      const location = [receiptData.customer?.city, receiptData.customer?.country].filter(Boolean).join(', ') || 'United States';
      doc.text(location.slice(0, 36), 24, 72);

      // Payment Details Box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(110, 50, 80, 28, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('PAYMENT DETAILS', 114, 56);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      const issueDateStr = formatDate(receiptData.issueDate || receiptData.createdAt || inv.createdAt);
      doc.text(`Issue Date: ${issueDateStr}`, 114, 62);
      const gw = receiptData.paymentMethod || inv.paymentMethod || 'Card Gateway';
      doc.text(`Gateway / Method: ${gw}`, 114, 67);
      const txn = receiptData.transactionId || 'TXN-SETTLED';
      doc.text(`Transaction Reference: ${txn.slice(0, 22)}`, 114, 72);

      // Table Header
      let y = 88;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('SERVICE / ITEM DESCRIPTION', 24, y + 5);
      doc.text('PERIOD', 125, y + 5);
      doc.text('AMOUNT (USD)', 185, y + 5, { align: 'right' });

      // Table Items
      y += 12;
      const items = receiptData.items && receiptData.items.length > 0 ? receiptData.items : [{
        description: `Analytical Technical Consulting - ${inv.plan?.name || inv.planName || 'Cloud VPS Compute'}`,
        specs: 'Dedicated High-Performance Virtual Machine',
        period: 'Monthly Subscription',
        amount: Number(receiptData.subtotal || receiptData.total || inv.amount || inv.total || 0),
      }];

      for (const item of items) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(String(item.description || '').slice(0, 48), 24, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
        doc.text(String(item.specs || 'Dedicated Cloud Compute Allocation').slice(0, 52), 24, y + 4.5);

        doc.setFontSize(8.5);
        doc.text(String(item.period || 'Monthly'), 125, y + 2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(`$${Number(item.amount || 0).toFixed(2)}`, 185, y + 2, { align: 'right' });

        y += 14;
        doc.setDrawColor(241, 245, 249);
        doc.line(20, y - 4, 190, y - 4);
      }

      // Totals
      y += 4;
      const subtotal = Number(receiptData.subtotal || inv.amount || inv.total || 0);
      const tax = Number(receiptData.tax || 0);
      const total = Number(receiptData.total || inv.amount || inv.total || 0);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Subtotal:', 140, y);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(`$${subtotal.toFixed(2)}`, 185, y, { align: 'right' });

      y += 6;
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Tax (0%):', 140, y);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(`$${tax.toFixed(2)}`, 185, y, { align: 'right' });

      y += 8;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(140, y - 2, 190, y - 2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text('Total (USD):', 140, y + 4);
      doc.text(`$${total.toFixed(2)}`, 185, y + 4, { align: 'right' });

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
      doc.text('Thank you for choosing Analytical Technical Consulting (ATC) Cloud Infrastructure.', 105, 275, { align: 'center' });
      doc.text('For questions, contact customer-support@atechconsult.com', 105, 280, { align: 'center' });

      doc.save(`${receiptData.invoiceNumber || inv.invoiceNumber || 'invoice'}.pdf`);
      toast.success('Official PDF invoice downloaded successfully!');
    } catch (err: any) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF invoice');
    }
  };

  // 4. Safe Broadcasts
  const fetchBroadcasts = async () => {
    try {
      const res = await apiCall('/admin/broadcast-history');
      if (res?.success) setBroadcastHistory(res.history || []);
    } catch (e) {}
  };

  useEffect(() => {
    if (!activeBroadcastJob || activeBroadcastJob.status === 'COMPLETED' || activeBroadcastJob.status === 'FAILED') return;
    const interval = setInterval(async () => {
      try {
        const res = await apiCall(`/admin/broadcast-status/${activeBroadcastJob.jobId}`);
        if (res && res.success && res.job) {
          setActiveBroadcastJob(res.job);
          if (res.job.status === 'COMPLETED') {
            toast.success(`Broadcast campaign finished! Delivered to ${res.job.sentCount} recipients.`);
            fetchBroadcasts();
          }
        }
      } catch (e) {}
    }, 2500);
    return () => clearInterval(interval);
  }, [activeBroadcastJob?.jobId, activeBroadcastJob?.status]);

  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      toast.error('Please specify both subject and message body.');
      return;
    }
    if (!broadcastInApp && !broadcastEmail) {
      toast.error('Select at least one broadcast channel (In-App or Email).');
      return;
    }
    try {
      setBroadcastSending(true);
      const res = await apiCall('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastSubject,
          message: broadcastBody,
          audience: broadcastAudience,
          channels: { inApp: broadcastInApp, email: broadcastEmail },
          priority: broadcastPriority,
        }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Broadcast campaign queued safely.');
        setActiveBroadcastJob(res.job);
        setBroadcastSubject('');
        setBroadcastBody('');
        fetchBroadcasts();
      }
    } catch (err: any) {
      toast.error(err.message || 'Broadcast launch failed');
    } finally {
      setBroadcastSending(false);
    }
  };

  // 5. Executive Reports & Analytics
  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const res = await apiCall('/admin/reports');
      if (res && res.success) {
        setReportsData(res.reports);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load executive reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleExportCsv = async (dataset: 'finance' | 'fleet') => {
    try {
      setExportingReport(dataset);
      const token = getAccessToken();
      const res = await fetch(`/api/admin/reports/export?dataset=${dataset}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atc-${dataset}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${dataset === 'finance' ? 'Financial Ledger' : 'Fleet Capacity'} CSV successfully downloaded.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setExportingReport(null);
    }
  };

  // 6. Fleet
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
          discountType: newCouponType,
          applicablePlanId: newCouponPlanId ? Number(newCouponPlanId) : undefined,
          validFrom: newCouponValidFrom ? new Date(newCouponValidFrom).toISOString() : undefined,
          expiresAt: newCouponExpiresAt ? new Date(newCouponExpiresAt).toISOString() : undefined,
        }),
      });
      if (res?.success) {
        toast.success(`Coupon ${res.coupon.code} created.`);
        setNewCouponCode('');
        setNewCouponPlanId('');
        setNewCouponValidFrom('');
        setNewCouponExpiresAt('');
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

  const handleDeleteIp = async (ipId: number) => {
    if (!window.confirm('Delete this IP address from the pool inventory?')) return;
    try {
      const res = await apiCall(`/admin/ipam/${ipId}`, { method: 'DELETE' });
      toast.success(res?.message || 'IP address removed from inventory.');
      fetchIpam();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete IP');
    }
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
    if (activeTab === 'finance') fetchFinance();
    if (activeTab === 'broadcasts') fetchBroadcasts();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'fleet') fetchFleet();
    if (activeTab === 'plans') fetchPlansAndCoupons();
    if (activeTab === 'ipam') fetchIpam();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'threats') fetchThreats();
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userRoleFilter, debouncedUserSearch]);

  useEffect(() => {
    if (activeTab === 'finance') fetchFinance();
  }, [invoiceStatusFilter, invoicePage, selectedBillingCustomer]);

  const navItems = [
    { id: 'overview', label: 'Host Telemetry', icon: Activity, badge: null, alert: false },
    { id: 'users', label: 'Users & Roles', icon: Users, badge: users.length || null, alert: false },
    { id: 'finance', label: 'Billing & Payments', icon: CreditCard, badge: null, alert: false },
    { id: 'fleet', label: 'Global Fleet', icon: Server, badge: fleetVMs.length || null, alert: false },
    { id: 'broadcasts', label: 'Safe Broadcasts', icon: Mail, badge: null, alert: false },
    { id: 'reports', label: 'Executive Reports', icon: BarChart3, badge: null, alert: false },
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
                    ATC CLOUD
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
                  ATC CLUSTER CORE
                </span>
                <h1 className="text-lg md:text-xl font-bold font-poppins text-slate-900 dark:text-white truncate">
                  {activeTab === 'overview' && 'Host Telemetry & Cluster Oversight'}
                  {activeTab === 'users' && 'Directory of Users, Roles & Ghost Mode'}
                  {activeTab === 'finance' && 'Billing, Invoices & Payment Transactions'}
                  {activeTab === 'fleet' && 'Global Virtual Machine Fleet'}
                  {activeTab === 'broadcasts' && 'Safe Multi-Channel Broadcast Center'}
                  {activeTab === 'reports' && 'Executive Reports & Capacity Intelligence'}
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
                if (activeTab === 'finance') fetchFinance();
                if (activeTab === 'broadcasts') fetchBroadcasts();
                if (activeTab === 'reports') fetchReports();
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
                  <Cpu className="w-4 h-4 text-blue-600" /> Physical Compute Node
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

        {/* TAB 2: USERS & SERVICE PROVIDERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  User & Service Provider Directory ({users.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Granular role permissions, tenant suspension controls, 360° account profiling, and ghost impersonation.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchUsers()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Role Filter Pills */}
            <div className="px-5 flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All Users' },
                { id: 'Customer', label: 'Customers' },
                { id: 'Service_Provider', label: 'Service Providers / Resellers' },
                { id: 'Support_Staff', label: 'Support Staff' },
                { id: 'Admin', label: 'Administrators' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setUserRoleFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    userRoleFilter === pill.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">User Identity</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Infrastructure</th>
                    <th className="px-6 py-3.5">Total Spend</th>
                    <th className="px-6 py-3.5 text-right">Controls & 360° Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{u.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                        <span className="text-[10px] text-slate-400">Joined {formatDate(u.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role || 'Customer'}
                          onChange={(e) => handleUpdateRole(u.userId, e.target.value)}
                          disabled={changingRoleUserId === u.userId}
                          className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="Customer">Customer</option>
                          <option value="Service_Provider">Service Provider</option>
                          <option value="Support_Staff">Support Staff</option>
                          <option value="Admin">Administrator</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u.userId, u.isActive)}
                            title={u.isActive ? 'Suspend User Access' : 'Activate User Access'}
                            className={`p-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                              u.isActive
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <span className="font-semibold text-slate-900 dark:text-white">{u.vmCount || 0} VMs</span>
                        <span className="text-slate-400"> • {u.activeSubscriptions || 0} Plans</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-900 dark:text-white">
                        ${Number(u.totalSpend || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenUserDrawer(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Inspect complete 360° customer profile, VMs, and billing history"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>360° Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleImpersonate(u)}
                            disabled={impersonatingId === u.userId}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="Login as Customer (Ghost Mode)"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Ghost Mode</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                        No users found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: BILLING & FULL PAYMENTS MANAGEMENT */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Financial Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Gross Processed</span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  ${Number(billingOverview?.totalGrossVolume || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{billingOverview?.paidCount || 0} Paid Invoices</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Card Gateway Volume</span>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  ${Number(billingOverview?.stripeVolume || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Direct Credit/Debit Cards</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Bank Wire / Direct</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
                  ${Number(billingOverview?.bankVolume || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Direct Bank Transfers</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Refunds Issued</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-2">
                  -${Number(billingOverview?.refundVolume || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{billingOverview?.refundedCount || 0} Transactions</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Monthly Recurring</span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
                  ${Number(billingOverview?.mrr || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Est. ARR: ${Number(billingOverview?.estimatedArr || 0).toFixed(2)}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Pending / Due</span>
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
                  ${Number(billingOverview?.pendingVolume || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{billingOverview?.pendingCount || 0} Unpaid Orders</p>
              </div>
            </div>

            {/* Invoices & Customer Accounts Manager */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    Customer Accounts & Invoice History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Browse customer accounts, view complete individual invoice histories, and execute payment controls.
                  </p>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingViewMode('by_customer');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      billingViewMode === 'by_customer'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>By Customer ({billingCustomers.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBillingViewMode('all_invoices');
                      setSelectedBillingCustomer(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      billingViewMode === 'all_invoices'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>All Invoices Ledger</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: BY CUSTOMER ACCOUNT */}
              {billingViewMode === 'by_customer' && (
                <div className="p-5 space-y-4">
                  {!selectedBillingCustomer ? (
                    <>
                      {/* Customer Search Bar */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Find customer by name or email..."
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        {customerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCustomerSearchQuery('')}
                            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Customer Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {billingCustomers
                          .filter((c) => {
                            if (!customerSearchQuery.trim()) return true;
                            const q = customerSearchQuery.toLowerCase();
                            return (
                              c.fullName?.toLowerCase().includes(q) ||
                              c.email?.toLowerCase().includes(q)
                            );
                          })
                          .map((customer) => (
                            <div
                              key={customer.userId}
                              onClick={() => setSelectedBillingCustomer(customer)}
                              className="bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                    {customer.fullName?.charAt(0)?.toUpperCase() || 'C'}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                      {customer.fullName}
                                    </h4>
                                    <p className="text-[11px] font-mono text-slate-400 truncate">
                                      {customer.email}
                                    </p>
                                  </div>
                                </div>

                                {customer.pendingCount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                                    {customer.pendingCount} Pending
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 shrink-0">
                                    All Paid
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Total Spend</span>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    ${Number(customer.totalSpent || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Total Invoices</span>
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {customer.totalInvoices} Invoices
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-slate-400">
                                  Last invoice: {customer.latestInvoiceNumber || 'N/A'}
                                </span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  <span>View Full History</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          ))}
                        {billingCustomers.length === 0 && (
                          <div className="col-span-3 text-center py-12 text-xs text-slate-400">
                            No customer billing history available.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Customer Complete Invoices History View */
                    <div className="space-y-4 animate-in fade-in duration-150">
                      {/* Back button and Customer Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedBillingCustomer(null)}
                            className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition-colors"
                            title="Back to Customer Directory"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white font-poppins">
                                {selectedBillingCustomer.fullName}
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                User ID #{selectedBillingCustomer.userId}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {selectedBillingCustomer.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-sans block">Lifetime Paid</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ${Number(selectedBillingCustomer.totalSpent || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                            <span className="text-[10px] text-slate-400 font-sans block">Total Records</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {invoices.length} Invoices
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Complete Invoice History Table for this User */}
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-5 py-3.5">Invoice #</th>
                              <th className="px-5 py-3.5">Issue Date</th>
                              <th className="px-5 py-3.5">Plan / Service</th>
                              <th className="px-5 py-3.5">Amount & Gateway</th>
                              <th className="px-5 py-3.5">Payment Status</th>
                              <th className="px-5 py-3.5 text-right">Administrative Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {invoices.map((inv) => (
                              <tr key={inv.id || inv.invoiceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-5 py-4">
                                  <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">{inv.invoiceNumber}</p>
                                </td>
                                <td className="px-5 py-4 text-xs font-mono">
                                  {formatDateTime(inv.createdAt)}
                                </td>
                                <td className="px-5 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {inv.plan?.name || inv.planName || 'Cloud VPS Service'}
                                </td>
                                <td className="px-5 py-4">
                                  <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                    ${Number(inv.amount || inv.total || 0).toFixed(2)}
                                  </p>
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                    {inv.paymentMethod || 'Card Gateway'}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      inv.status === 'PAID'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                        : inv.status === 'PENDING'
                                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                                        : inv.status === 'REFUNDED'
                                        ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400'
                                        : inv.status === 'VOID'
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleViewInvoiceReceipt(inv)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                      title="View complete invoice receipt breakdown"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Details</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownloadInvoicePDF(inv)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                      title="Download official PDF invoice"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>PDF</span>
                                    </button>

                                    {inv.status === 'PAID' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRefundModalInvoice(inv);
                                          setRefundAmount(String(inv.amount || inv.total));
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                        title="Issue administrative refund"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Refund</span>
                                      </button>
                                    )}

                                    {inv.status === 'PENDING' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => setMarkPaidModalInvoice(inv)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                          title="Verify payment and activate slot"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Mark Paid</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setVoidModalInvoice(inv)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer"
                                          title="Cancel and void invoice"
                                        >
                                          <Ban className="w-3.5 h-3.5" />
                                          <span>Void</span>
                                        </button>
                                      </>
                                    )}

                                    {inv.status === 'REFUNDED' && (
                                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                                        Refunded
                                      </span>
                                    )}

                                    {inv.status === 'VOID' && (
                                      <span className="text-[11px] font-mono text-slate-400">
                                        Voided
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {invoices.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                                  No invoices generated for this customer yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: ALL INVOICES FLAT LEDGER */}
              {billingViewMode === 'all_invoices' && (
                <>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {[
                        { id: 'ALL', label: 'All Invoices' },
                        { id: 'PAID', label: 'Paid' },
                        { id: 'PENDING', label: 'Pending' },
                        { id: 'REFUNDED', label: 'Refunded' },
                        { id: 'VOID', label: 'Void / Cancelled' },
                        { id: 'FAILED', label: 'Failed' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setInvoiceStatusFilter(st.id);
                            setInvoicePage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            invoiceStatusFilter === st.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search invoice or customer..."
                          value={invoiceSearch}
                          onChange={(e) => setInvoiceSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchFinance()}
                          className="pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={fetchFinance}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Filter
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-3.5">Invoice #</th>
                          <th className="px-6 py-3.5">Customer (Click to View History)</th>
                          <th className="px-6 py-3.5">Plan / Description</th>
                          <th className="px-6 py-3.5">Amount & Gateway</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-right">Payment Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {invoices.map((inv) => (
                          <tr key={inv.id || inv.invoiceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">{inv.invoiceNumber}</p>
                              <p className="text-[11px] font-mono text-slate-400">{formatDateTime(inv.createdAt)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => {
                                  const c = billingCustomers.find((b) => b.userId === inv.user?.userId) || inv.user;
                                  setSelectedBillingCustomer(c);
                                  setBillingViewMode('by_customer');
                                }}
                                className="text-left group cursor-pointer"
                              >
                                <p className="font-semibold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                                  {inv.user?.fullName || 'Guest'}
                                </p>
                                <p className="text-[11px] font-mono text-slate-400">{inv.user?.email || 'N/A'}</p>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {inv.plan?.name || inv.planName || 'Cloud VPS Service'}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                ${Number(inv.amount || inv.total || 0).toFixed(2)}
                              </p>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                {inv.paymentMethod || 'Card Gateway'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === 'PAID'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                    : inv.status === 'PENDING'
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                                    : inv.status === 'REFUNDED'
                                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400'
                                    : inv.status === 'VOID'
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewInvoiceReceipt(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  title="View full receipt details"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoicePDF(inv)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  title="Download official PDF invoice"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                {inv.status === 'PAID' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRefundModalInvoice(inv);
                                      setRefundAmount(String(inv.amount || inv.total));
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Refund</span>
                                  </button>
                                )}

                                {inv.status === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setMarkPaidModalInvoice(inv)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Mark Paid</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setVoidModalInvoice(inv)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Void</span>
                                    </button>
                                  </>
                                )}

                                {inv.status === 'REFUNDED' && (
                                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                                    Refunded
                                  </span>
                                )}

                                {inv.status === 'VOID' && (
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Voided
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                              No invoices matching selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {invoicePagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Page {invoicePagination.page} of {invoicePagination.totalPages} ({invoicePagination.total} total)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={invoicePage <= 1}
                          onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={invoicePage >= invoicePagination.totalPages}
                          onClick={() => setInvoicePage((p) => p + 1)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB: SAFE MULTI-CHANNEL BROADCAST CENTER */}
        {activeTab === 'broadcasts' && (
          <div className="space-y-6">
            {/* IP Reputation Protection Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-poppins">
                    Enterprise Safe Mail Server Rate-Limiting Protection
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Broadcast dispatches are throttled to <strong>20 emails per batch with a 2.5s pause</strong>. Automated RFC 2369 bulk headers, list unsubscribe tags, and spam suppression directives are embedded into every outbound message to safeguard your mail server IP from blacklisting by external mail providers.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Broadcast Campaign Composer */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" /> Dispatch New Mass Announcement
                </h3>

                <form onSubmit={handleDispatchBroadcast} className="space-y-4">
                  {/* Audience Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Customer Audience
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'all', title: 'All Users', desc: 'Global platform broadcast' },
                        { id: 'vps_owners', title: 'Active VPS Owners', desc: 'Tenants with deployed VMs' },
                        { id: 'service_providers', title: 'Service Providers', desc: 'Resellers and B2B partners' },
                        { id: 'unpaid', title: 'Pending Invoices', desc: 'Customers awaiting checkout' },
                      ].map((aud) => (
                        <label
                          key={aud.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            broadcastAudience === aud.id
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="broadcastAudience"
                            value={aud.id}
                            checked={broadcastAudience === aud.id}
                            onChange={() => setBroadcastAudience(aud.id as any)}
                            className="mt-0.5 text-blue-600"
                          />
                          <div>
                            <span className="font-bold block text-slate-900 dark:text-white">{aud.title}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{aud.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Channels */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Delivery Channels
                    </label>
                    <div className="flex items-center gap-6 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={broadcastInApp}
                          onChange={(e) => setBroadcastInApp(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>In-App Announcement Center</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={broadcastEmail}
                          onChange={(e) => setBroadcastEmail(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Safe Throttled Email Queue</span>
                      </label>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Campaign Priority
                    </label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="normal">Normal Broadcast (Standard notification)</option>
                      <option value="high">High Priority (Urgent maintenance notice)</option>
                      <option value="urgent">Critical Security Warning (Immediate banner)</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Broadcast Title / Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Network Maintenance on ATC Cloud Cluster..."
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Message Body */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Message Body (Supports multi-line text)
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Enter the complete bulletin details, impacted services, schedule, and customer action items..."
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      required
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={broadcastSending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className={`w-4 h-4 ${broadcastSending ? 'animate-spin' : ''}`} />
                    <span>{broadcastSending ? 'Queuing Campaign...' : 'Launch Safe Broadcast Campaign'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Live Progress & History */}
              <div className="lg:col-span-5 space-y-6">
                {/* Active Broadcast Job Monitor */}
                {activeBroadcastJob && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-300 dark:border-blue-800 p-5 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        Live Broadcast Tracker
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          activeBroadcastJob.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700 animate-pulse'
                        }`}
                      >
                        {activeBroadcastJob.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {activeBroadcastJob.title}
                    </h4>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              activeBroadcastJob.totalRecipients > 0
                                ? Math.round((activeBroadcastJob.sentCount / activeBroadcastJob.totalRecipients) * 100)
                                : 100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Delivered {activeBroadcastJob.sentCount} of {activeBroadcastJob.totalRecipients} emails
                        </span>
                        <span className="font-mono font-bold">
                          {activeBroadcastJob.totalRecipients > 0
                            ? Math.round((activeBroadcastJob.sentCount / activeBroadcastJob.totalRecipients) * 100)
                            : 100}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Past Broadcast History */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-poppins flex items-center justify-between">
                    <span>Recent Broadcast Dispatches</span>
                    <button
                      type="button"
                      onClick={fetchBroadcasts}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Refresh
                    </button>
                  </h4>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {broadcastHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300">
                            {item.audience}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>{formatDateTime(item.createdAt)}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ {item.sentCount || 'All'} Delivered
                          </span>
                        </div>
                      </div>
                    ))}
                    {broadcastHistory.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No previous broadcast campaigns dispatched yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EXECUTIVE REPORTS & CAPACITY INTELLIGENCE */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Cluster Intelligence & Executive Reports
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-level financial summaries, visual growth trends, and physical server capacity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={exportingReport === 'finance'}
                  onClick={() => handleExportCsv('finance')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${exportingReport === 'finance' ? 'animate-spin' : ''}`} />
                  <span>Export Financial Ledger (.CSV)</span>
                </button>

                <button
                  type="button"
                  disabled={exportingReport === 'fleet'}
                  onClick={() => handleExportCsv('fleet')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${exportingReport === 'fleet' ? 'animate-spin' : ''}`} />
                  <span>Export Fleet Capacity (.CSV)</span>
                </button>
              </div>
            </div>

            {/* 1. KEY EXECUTIVE METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold">Gross Processed</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  ${Number(reportsData?.financial?.grossVolume || 0).toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Card: ${Number(reportsData?.financial?.stripeVolume || 0).toFixed(2)} • Wire: ${Number(reportsData?.financial?.bankVolume || 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold">Monthly Recurring (MRR)</span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                  ${Number(reportsData?.financial?.mrr || 0).toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal">/mo</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Annualized (ARR): <strong className="text-slate-700 dark:text-slate-300">${Number(reportsData?.financial?.arr || 0).toFixed(2)}</strong>
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold">Virtual Machines</span>
                  <Server className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {reportsData?.fleetCapacity?.totalVms || 0}
                  <span className="text-xs text-slate-400 font-normal"> instances</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {reportsData?.fleetCapacity?.runningVms || 0} Running • {reportsData?.fleetCapacity?.stoppedVms || 0} Stopped
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span className="font-semibold">Helpdesk Resolution</span>
                  <LifeBuoy className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                  {reportsData?.ticketSla?.resolutionRate ?? 100}%
                </div>
                <p className="text-[11px] text-slate-400">
                  {reportsData?.ticketSla?.open || 0} Open Tickets • {reportsData?.ticketSla?.resolved || 0} Solved
                </p>
              </div>
            </div>

            {/* 2. REVENUE & ACTIVITY TREND CHART */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Revenue Trend (Last 6 Months)
                  </h4>
                  <p className="text-xs text-slate-500">Monthly billing collections and customer compute growth.</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-blue-600" />
                    <span className="text-slate-600 dark:text-slate-400">Monthly Revenue</span>
                  </div>
                </div>
              </div>

              {/* Visual Bar Chart */}
              <div className="pt-4">
                <div className="h-44 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-200 dark:border-slate-800 pb-3 px-2">
                  {((reportsData?.financial?.monthlyTrend?.length ? reportsData.financial.monthlyTrend : [
                    { month: 'May', revenue: 0 },
                    { month: 'Jun', revenue: 0 },
                    { month: 'Jul', revenue: 0 },
                    { month: 'Aug', revenue: 0 },
                    { month: 'Sep', revenue: 0 },
                    { month: 'Oct', revenue: Number(reportsData?.financial?.grossVolume || 0) },
                  ]) as any[]).map((item, idx, arr) => {
                    const maxRev = Math.max(...arr.map((a: any) => Number(a.revenue || 0)), 10);
                    const pct = Math.max(8, Math.min(100, Math.round((Number(item.revenue || 0) / maxRev) * 100)));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                          ${Number(item.revenue || 0).toFixed(0)}
                        </div>
                        <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex items-end h-full">
                          <div
                            className="w-full bg-gradient-to-t from-blue-700 to-indigo-500 rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-xs"
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. PHYSICAL HOST CAPACITY (SIMPLIFIED & CLEAR) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  Host Hardware Capacity & Allocation (ATC Cloud Cluster)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real physical cores, memory, and SSD disk commitment across all customer virtual machines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. CPU Allocation */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Processor Cores (vCPU)
                      </span>
                      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                        {reportsData?.fleetCapacity?.allocatedVcpus || 0} / {reportsData?.fleetCapacity?.totalHostCores || 8} Cores
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Safe Headroom
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            4,
                            ((reportsData?.fleetCapacity?.allocatedVcpus || 0) /
                              (reportsData?.fleetCapacity?.totalHostCores || 8)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{reportsData?.fleetCapacity?.allocatedVcpus || 0} vCPUs Provisioned</span>
                    <span>{reportsData?.fleetCapacity?.totalHostCores || 8} Host Cores</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1 border-t border-slate-200 dark:border-slate-700/50">
                    Ratio is {reportsData?.fleetCapacity?.cpuOvercommitRatio || '1.0'}:1. Ideal for responsive compute performance.
                  </p>
                </div>

                {/* 2. RAM Allocation */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        RAM Memory Committed
                      </span>
                      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                        {reportsData?.fleetCapacity?.allocatedRamGb || 0} / {reportsData?.fleetCapacity?.totalHostRamGb || 16} GB
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        Number(reportsData?.fleetCapacity?.ramAllocationPercent || 0) < 85
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {Number(reportsData?.fleetCapacity?.ramAllocationPercent || 0) < 85 ? 'Healthy' : 'High Load'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(4, reportsData?.fleetCapacity?.ramAllocationPercent || 0)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{reportsData?.fleetCapacity?.ramAllocationPercent || 0}% Allocated</span>
                    <span>{reportsData?.fleetCapacity?.totalHostRamGb || 16} GB Physical RAM</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1 border-t border-slate-200 dark:border-slate-700/50">
                    Guaranteed dedicated host memory for stable VM operations.
                  </p>
                </div>

                {/* 3. Disk Allocation */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Enterprise SSD Storage
                      </span>
                      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                        {reportsData?.fleetCapacity?.allocatedDiskGb || 0} / {reportsData?.fleetCapacity?.totalHostStorageGb || 500} GB
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Ample Space
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(4, reportsData?.fleetCapacity?.diskAllocationPercent || 0)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{reportsData?.fleetCapacity?.allocatedDiskGb || 0} GB Provisioned</span>
                    <span>{reportsData?.fleetCapacity?.totalHostStorageGb || 500} GB Capacity</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1 border-t border-slate-200 dark:border-slate-700/50">
                    High-speed SSD storage pool backing virtual hard disks (VHDX).
                  </p>
                </div>
              </div>
            </div>

            {/* 4. PLAN DISTRIBUTION & DEMOGRAPHICS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Plan Popularity */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  VPS Plan Distribution & Monthly Revenue
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Plan Name</th>
                        <th className="px-4 py-3">Monthly Rate</th>
                        <th className="px-4 py-3">Subscribers</th>
                        <th className="px-4 py-3 text-right">Est. Monthly Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {reportsData?.planPopularity?.map((plan: any) => (
                        <tr key={plan.planId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-white">
                            {plan.name}
                          </td>
                          <td className="px-4 py-3">${Number(plan.price || 0).toFixed(2)}/mo</td>
                          <td className="px-4 py-3 font-bold text-blue-600">
                            {plan.activeSubscriptions || 0} active ({plan.totalSubscriptions || 0} total)
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            ${Number(plan.monthlyRevenue || 0).toFixed(2)}/mo
                          </td>
                        </tr>
                      ))}
                      {(!reportsData?.planPopularity || reportsData.planPopularity.length === 0) && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400">
                            No subscription plan metrics available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tenant Demographics & SLA */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-poppins flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    User Directory Breakdown
                  </h4>
                  <div className="space-y-2.5">
                    {reportsData?.userBreakdown?.map((rb: any) => (
                      <div
                        key={rb.role}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{rb.role}</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{rb.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-poppins flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-amber-600" />
                    Customer Support SLA Status
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-center pt-1">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-500">Open Tickets</span>
                      <p className="text-lg font-bold font-mono text-amber-600 mt-0.5">
                        {reportsData?.ticketSla?.open || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-500">Resolved Tickets</span>
                      <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                        {reportsData?.ticketSla?.resolved || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                <p className="text-xs text-slate-500">Live virtual infrastructure controls across all tenants.</p>
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
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FLASH50"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discount</label>
                    <input
                      type="number"
                      min="1"
                      max={newCouponType === 'PERCENT' ? 100 : 10000}
                      value={newCouponVal}
                      onChange={(e) => setNewCouponVal(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as any)}
                      className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    >
                      <option value="PERCENT">% OFF</option>
                      <option value="FIXED">$ OFF</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Applicable Plan</label>
                  <select
                    value={newCouponPlanId}
                    onChange={(e) => setNewCouponPlanId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Any VPS Plan</option>
                    {plans.map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.name} (${p.monthlyPrice}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date (From)</label>
                  <input
                    type="date"
                    value={newCouponValidFrom}
                    onChange={(e) => setNewCouponValidFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">End Date (To)</label>
                  <input
                    type="date"
                    value={newCouponExpiresAt}
                    onChange={(e) => setNewCouponExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Coupon
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {coupons.map((c) => {
                  const now = new Date();
                  const isExpired = c.expiresAt && new Date(c.expiresAt) < now;
                  const isUpcoming = c.validFrom && new Date(c.validFrom) > now;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isExpired
                          ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20'
                          : isUpcoming
                            ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{c.code}</span>
                            <span
                              className={`ml-2 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                  : isUpcoming
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                              }`}
                            >
                              {isExpired ? 'Expired' : isUpcoming ? 'Scheduled' : 'Active'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                          {c.discountType === 'FIXED' ? `$${c.discountValue} OFF (1st Month)` : `${c.discountValue}% OFF (1st Month)`}
                        </p>

                        {/* Timing details */}
                        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          {c.validFrom || c.expiresAt ? (
                            <p className="font-medium">
                              📅 Offer Period: {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'Start'} – {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'No expiry'}
                            </p>
                          ) : (
                            <p className="italic text-[10px]">No date restrictions</p>
                          )}
                          {c.applicablePlanId && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                              Target Plan: #{c.applicablePlanId}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Used: {c.timesUsed || 0} / {c.maxUses || 100}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      <th className="px-4 py-3">Bandwidth</th>
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
                        <td className="px-4 py-3 text-xs">{p.storageGb} GB {p.storageType || 'SSD'}</td>
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {p.bandwidthMbps >= 1000 ? `${(p.bandwidthMbps / 1000).toFixed(0)} TB` : `${p.bandwidthMbps || 80} GB`}
                        </td>
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

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Bandwidth Transfer Quota (GB / month)</label>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {editingPlan.bandwidthMbps >= 1000 ? `${(editingPlan.bandwidthMbps / 1000).toFixed(0)} TB / mo` : `${editingPlan.bandwidthMbps || 80} GB / mo`}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {[
                          { gb: 20, label: '20 GB' },
                          { gb: 40, label: '40 GB' },
                          { gb: 80, label: '80 GB' },
                          { gb: 160, label: '160 GB' },
                          { gb: 320, label: '320 GB' },
                          { gb: 500, label: '500 GB' },
                          { gb: 1000, label: '1 TB' },
                          { gb: 2000, label: '2 TB' },
                        ].map((bw) => (
                          <button
                            type="button"
                            key={bw.gb}
                            onClick={() => setEditingPlan({ ...editingPlan, bandwidthMbps: bw.gb })}
                            className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              editingPlan.bandwidthMbps === bw.gb
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {bw.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="10"
                        max="100000"
                        value={editingPlan.bandwidthMbps || 80}
                        onChange={(e) => setEditingPlan({ ...editingPlan, bandwidthMbps: Number(e.target.value) })}
                        placeholder="Custom Bandwidth (GB)"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                        required
                      />
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
                  <Network className="w-4 h-4 text-blue-600" /> Public IP Address Pool & Subnet Inventory (IPAM)
                </h3>
                <p className="text-xs text-slate-500">Manage real public static IPv4 addresses purchased for cluster assignment.</p>
              </div>

              <form onSubmit={handleAddIp} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Public IPv4 (e.g. 198.51.100.25)"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  required
                />
                <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  Add IP
                </button>
              </form>
            </div>

            {ipPool.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Network className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No public static IP addresses in inventory</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  When you purchase public static IPv4 blocks from your upstream datacenter, add them here using the &quot;Add IP&quot; form above. Standard virtual machines use local Hyper-V private networking.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {ipPool.map((ip) => (
                  <div key={ip.ipId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{ip.ipAddress}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ip.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'}`}>
                          {ip.status}
                        </span>
                        {ip.status === 'AVAILABLE' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteIp(ip.ipId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete IP address from inventory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {ip.assignedVm && (
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        VM: {ip.assignedVm.name} ({ip.assignedVm.user?.email})
                      </p>
                    )}
                    {ip.status !== 'AVAILABLE' && (
                      <button onClick={() => handleReleaseIp(ip.ipId)} className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer">
                        Release to Pool
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                    <span className="text-[10px] text-slate-400 font-mono">By {a.createdBy} • {formatDate(a.createdAt)}</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-blue-600" /> Customer Support Queue & SLA Lifecycle Engine ({tickets.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated 10-day inactivity countdown, multi-tier reminders (Day 3, 6, 9), and auto-close timeouts.
                </p>
              </div>
              <button
                onClick={fetchTickets}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {selectedTicket ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Dedicated Top-Left Back Arrow Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shrink-0 cursor-pointer shadow-xs"
                      title="Back to Queue"
                      aria-label="Back to Queue"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                          T-{selectedTicket.id}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{selectedTicket.subject}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Submitted by: <strong className="text-slate-700 dark:text-slate-300">{selectedTicket.user?.fullName || 'Customer'}</strong> ({selectedTicket.user?.email || 'N/A'}) • {formatDateTime(selectedTicket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {selectedTicket.priority} PRIORITY
                    </span>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Queue</span>
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
                                {formatDateTime(msg.timestamp)}
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

                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Post Support Message / Diagnostic Resolution:
                    </span>

                    <div className="w-full sm:w-80">
                      <ModernFloatingSelect
                        label="Update Ticket Status"
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value as any)}
                        options={[
                          { value: 'AWAITING_USER_ACTION', label: 'Awaiting User Action (Start 10d SLA Clock)' },
                          { value: 'IN_PROGRESS', label: 'IN_PROGRESS (Investigating)' },
                          { value: 'RESOLVED', label: 'RESOLVED (Completed)' },
                          { value: 'CLOSED', label: 'CLOSED (Dismissed)' },
                        ]}
                      />
                    </div>
                  </div>

                  <ModernFloatingTextarea
                    label="Diagnostic Output / Resolution Steps"
                    rows={4}
                    placeholder="Provide diagnostic output, resolution steps, root cause analysis, or status explanation..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleReplyTicket}
                      disabled={!replyText.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Message to Customer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Advanced Filtering & Sorting Toolbar */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                      {[
                        { id: 'ALL', label: 'All Records' },
                        { id: 'OPEN', label: 'Open' },
                        { id: 'AWAITING_USER_ACTION', label: 'Pending Action' },
                        { id: 'REOPENED', label: 'Reopened' },
                        { id: 'RESOLVED', label: 'Resolved' },
                        { id: 'CLOSED_TIMEOUT', label: 'Autoclosed' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setAdminTicketStatusFilter(st.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            adminTicketStatusFilter === st.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="w-full lg:w-80">
                      <ModernFloatingInput
                        label="Search Support Tickets"
                        icon={<Search className="w-4 h-4" />}
                        placeholder="Search ID, customer email, subject..."
                        value={adminTicketSearch}
                        onChange={(e) => setAdminTicketSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Secondary Filter & Sorting Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                    {/* Left: Inactivity & Date Range Pickers */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Filter className="w-3.5 h-3.5" /> Inactivity:
                        </span>
                        {[
                          { id: 'ALL', label: 'Any' },
                          { id: '3', label: '>3 Days' },
                          { id: '6', label: '>6 Days' },
                          { id: '9', label: '>9 Days' },
                        ].map((idl) => (
                          <button
                            key={idl.id}
                            onClick={() => setAdminTicketIdleFilter(idl.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              adminTicketIdleFilter === idl.id
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {idl.label}
                          </button>
                        ))}
                      </div>

                      <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

                      {/* Date Range Filtering */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-semibold">Date:</span>
                        <input
                          type="date"
                          value={adminDateFrom}
                          onChange={(e) => setAdminDateFrom(e.target.value)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                          title="From date"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="date"
                          value={adminDateTo}
                          onChange={(e) => setAdminDateTo(e.target.value)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                          title="To date"
                        />
                        {(adminDateFrom || adminDateTo) && (
                          <button
                            onClick={() => {
                              setAdminDateFrom('');
                              setAdminDateTo('');
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Sort Field & Sort Order */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Sort by:</span>
                      <select
                        value={adminSortField}
                        onChange={(e) => setAdminSortField(e.target.value as any)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
                      >
                        <option value="updatedAt">Last Activity</option>
                        <option value="createdAt">Creation Date</option>
                        <option value="id">Ticket ID</option>
                      </select>

                      <button
                        onClick={() => setAdminSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1"
                        title={adminSortOrder === 'desc' ? 'Descending (Newest first)' : 'Ascending (Oldest first)'}
                      >
                        <span>{adminSortOrder === 'desc' ? 'Descending ↓' : 'Ascending ↑'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Queue Table Matching Mockup */}
                {(() => {
                  const filtered = tickets
                    .filter((t: any) => {
                      const matchesStatus =
                        adminTicketStatusFilter === 'ALL' ||
                        t.status === adminTicketStatusFilter ||
                        (adminTicketStatusFilter === 'CLOSED_TIMEOUT' && (t.status === 'CLOSED_TIMEOUT' || t.status === 'CLOSED'));

                      let matchesIdle = true;
                      const days = t.timelineDay ?? 0;
                      if (adminTicketIdleFilter === '3') matchesIdle = days >= 3;
                      else if (adminTicketIdleFilter === '6') matchesIdle = days >= 6;
                      else if (adminTicketIdleFilter === '9') matchesIdle = days >= 9;

                      // Date Range Filter
                      let matchesDate = true;
                      const ticketTime = new Date(t.createdAt).getTime();
                      if (adminDateFrom) {
                        const fromTime = new Date(adminDateFrom).setHours(0, 0, 0, 0);
                        if (ticketTime < fromTime) matchesDate = false;
                      }
                      if (adminDateTo) {
                        const toTime = new Date(adminDateTo).setHours(23, 59, 59, 999);
                        if (ticketTime > toTime) matchesDate = false;
                      }

                      const q = adminTicketSearch.toLowerCase();
                      const matchesSearch =
                        !q ||
                        t.subject.toLowerCase().includes(q) ||
                        t.message.toLowerCase().includes(q) ||
                        `t-${t.id}`.includes(q) ||
                        (t.user?.email && t.user.email.toLowerCase().includes(q)) ||
                        (t.user?.fullName && t.user.fullName.toLowerCase().includes(q)) ||
                        (t.lastAutomatedAction && t.lastAutomatedAction.toLowerCase().includes(q));

                      return matchesStatus && matchesIdle && matchesDate && matchesSearch;
                    })
                    .sort((a: any, b: any) => {
                      let comparison = 0;
                      if (adminSortField === 'id') {
                        comparison = a.id - b.id;
                      } else if (adminSortField === 'createdAt') {
                        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      } else {
                        comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
                      }
                      return adminSortOrder === 'desc' ? -comparison : comparison;
                    });

                  if (filtered.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 text-center py-8">
                        No support tickets matching current filter criteria.
                      </p>
                    );
                  }

                  const getSlaBadge = (state: string) => {
                    switch (state) {
                      case 'Open':
                        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
                      case 'Reopened':
                        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
                      case 'Pending Action':
                        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
                      case 'Autoclosed':
                        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
                      case 'Resolved':
                        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
                      default:
                        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
                    }
                  };

                  return (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                              <th className="py-3.5 px-5 font-semibold">Ticket ID</th>
                              <th className="py-3.5 px-5 font-semibold">Subject Context</th>
                              <th className="py-3.5 px-5 font-semibold whitespace-nowrap">Active Timeline</th>
                              <th className="py-3.5 px-5 font-semibold whitespace-nowrap">SLA State Status</th>
                              <th className="py-3.5 px-5 font-semibold">Last Automated System Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {filtered.map((t: any) => (
                              <tr
                                key={t.id}
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setReplyText('');
                                  setReplyStatus(
                                    t.status === 'AWAITING_USER_ACTION'
                                      ? 'RESOLVED'
                                      : 'AWAITING_USER_ACTION'
                                  );
                                }}
                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                              >
                                {/* Ticket ID */}
                                <td className="py-4 px-5 whitespace-nowrap align-middle">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">
                                      T-{t.id}
                                    </span>
                                    {t.status === 'OPEN' || t.status === 'REOPENED' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
                                        LIVE
                                      </span>
                                    ) : null}
                                  </div>
                                </td>

                                {/* Subject Context */}
                                <td className="py-4 px-5 align-middle max-w-xs md:max-w-md">
                                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {t.subject}
                                  </span>
                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                                    {t.user?.fullName} ({t.user?.email}) • {t.message}
                                  </p>
                                </td>

                                {/* Active Timeline */}
                                <td className="py-4 px-5 whitespace-nowrap align-middle font-medium text-slate-800 dark:text-slate-200">
                                  {t.timelineLabel || `Day ${t.timelineDay ?? 0}`}
                                </td>

                                {/* SLA State Status */}
                                <td className="py-4 px-5 whitespace-nowrap align-middle">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getSlaBadge(
                                      t.slaState || (t.status === 'AWAITING_USER_ACTION' ? 'Pending Action' : t.status)
                                    )}`}
                                  >
                                    {t.slaState || (t.status === 'AWAITING_USER_ACTION' ? 'Pending Action' : t.status)}
                                  </span>
                                </td>

                                {/* Last Automated System Action */}
                                <td className="py-4 px-5 align-middle text-slate-500 dark:text-slate-400 text-xs">
                                  <span className="line-clamp-1">
                                    {t.lastAutomatedAction ||
                                      (t.status === 'OPEN'
                                        ? 'Ticket generated. Initial queue validation'
                                        : 'Status update recorded')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
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
                      <td className="px-4 py-3 text-xs font-mono">{formatDateTime(log.timestamp)}</td>
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

      {/* 360° CUSTOMER PROFILE DRAWER / MODAL */}
      {selectedUserForDrawer && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                  {selectedUserForDrawer.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white font-poppins">
                      {selectedUserForDrawer.fullName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {selectedUserForDrawer.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {selectedUserForDrawer.email} • User ID #{selectedUserForDrawer.userId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUserForDrawer(null);
                  setUserProfileData(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {userProfileLoading ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs">Loading complete 360° telemetry profile...</p>
                </div>
              ) : userProfileData ? (
                <>
                  {/* Metric Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-xs text-slate-500">Lifetime Gross Spend</span>
                      <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                        ${Number(userProfileData.metrics?.totalSpend || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-xs text-slate-500">Active Subscriptions</span>
                      <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {userProfileData.metrics?.activeSubscriptions || 0} Paid Plans
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                      <span className="text-xs text-slate-500">Deployed Virtual Machines</span>
                      <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                        {userProfileData.metrics?.vmCount || 0} Fleet Instances
                      </p>
                    </div>
                  </div>

                  {/* Section: Virtual Machines */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-600" />
                      Provisioned Virtual Machines ({userProfileData.vms?.length || 0})
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase font-semibold">
                          <tr>
                            <th className="px-4 py-2.5">VM Name</th>
                            <th className="px-4 py-2.5">IP Address</th>
                            <th className="px-4 py-2.5">Specs</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {userProfileData.vms?.map((vm: any) => (
                            <tr key={vm.vmId}>
                              <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-white">{vm.name}</td>
                              <td className="px-4 py-3">{vm.ip}</td>
                              <td className="px-4 py-3">{vm.cpuCores} vCPU • {vm.ramGb} GB RAM</td>
                              <td className="px-4 py-3 font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  vm.status === 'running' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {vm.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(!userProfileData.vms || userProfileData.vms.length === 0) && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400">No VMs currently deployed.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section: Subscriptions & Entitlements */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      Recurring Subscriptions & Plan Slots ({userProfileData.subscriptions?.length || 0})
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase font-semibold">
                          <tr>
                            <th className="px-4 py-2.5">Plan Name</th>
                            <th className="px-4 py-2.5">Monthly Price</th>
                            <th className="px-4 py-2.5">Next Expiry / Renewal</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5 text-right">Quick Management</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {userProfileData.subscriptions?.map((sub: any) => (
                            <tr key={sub.id}>
                              <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-white">{sub.plan?.name}</td>
                              <td className="px-4 py-3">${Number(sub.plan?.monthlyPrice || 0).toFixed(2)}/mo</td>
                              <td className="px-4 py-3">{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : 'N/A'}</td>
                              <td className="px-4 py-3 font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-sans">
                                <button
                                  type="button"
                                  onClick={() => handleAdminSubscriptionAction(sub.id, 'EXTEND_30_DAYS')}
                                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold cursor-pointer"
                                  title="Add 30 free days to this subscription period"
                                >
                                  +30 Days Free
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!userProfileData.subscriptions || userProfileData.subscriptions.length === 0) && (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-slate-400">No active subscriptions.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section: Invoices */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-purple-600" />
                      Invoice Ledger & Billing History ({userProfileData.invoices?.length || 0})
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase font-semibold">
                          <tr>
                            <th className="px-4 py-2.5">Invoice #</th>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Amount</th>
                            <th className="px-4 py-2.5">Gateway</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {userProfileData.invoices?.map((inv: any) => (
                            <tr key={inv.id}>
                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                              <td className="px-4 py-3 font-sans">{formatDate(inv.createdAt)}</td>
                              <td className="px-4 py-3">${Number(inv.amount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 font-sans uppercase text-[10px]">{inv.paymentMethod}</td>
                              <td className="px-4 py-3 font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(!userProfileData.invoices || userProfileData.invoices.length === 0) && (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-slate-400">No invoices generated yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForDrawer(null);
                  setUserProfileData(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT REFUND MODAL */}
      {refundModalInvoice && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">Process Payment Refund</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reversal of funds back to cardholder</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <p className="text-slate-500">Invoice: <strong className="text-slate-900 dark:text-white">{refundModalInvoice.invoiceNumber}</strong></p>
              <p className="text-slate-500">Customer: <strong className="text-slate-900 dark:text-white">{refundModalInvoice.user?.fullName} ({refundModalInvoice.user?.email})</strong></p>
              <p className="text-slate-500">Original Amount: <strong className="text-emerald-600">${Number(refundModalInvoice.amount || 0).toFixed(2)}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Refund Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                max={refundModalInvoice.amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
              />
              <span className="text-[11px] text-slate-400">Leave as default for 100% full refund</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Refund
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="requested_by_customer">Customer Requested Refund</option>
                <option value="duplicate">Duplicate Charge</option>
                <option value="fraudulent">Fraudulent / Unauthorized Transaction</option>
                <option value="service_unsatisfactory">Service Technical Issue</option>
              </select>
            </div>

            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
              Note: Issuing this refund will reverse the charge via the payment processor, mark the invoice as REFUNDED, and deactivate the associated VPS subscription slot.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={refundProcessing}
                onClick={handleProcessRefund}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${refundProcessing ? 'animate-spin' : ''}`} />
                <span>{refundProcessing ? 'Refunding...' : 'Confirm & Issue Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK INVOICE AS PAID MODAL */}
      {markPaidModalInvoice && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">Mark Invoice as Paid</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reconcile wire transfer and deposit VPS runtime</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <p className="text-slate-500">Invoice: <strong className="text-slate-900 dark:text-white">{markPaidModalInvoice.invoiceNumber}</strong></p>
              <p className="text-slate-500">Customer: <strong className="text-slate-900 dark:text-white">{markPaidModalInvoice.user?.fullName} ({markPaidModalInvoice.user?.email})</strong></p>
              <p className="text-slate-500">Amount Due: <strong className="text-emerald-600">${Number(markPaidModalInvoice.amount || 0).toFixed(2)}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Settlement Payment Channel
              </label>
              <select
                value={markPaidMethod}
                onChange={(e) => setMarkPaidMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="BANK_WIRE">Bank Wire / ACH Direct Transfer</option>
                <option value="CRYPTO">Cryptocurrency (BTC / USDT / ETH)</option>
                <option value="MANUAL_CREDIT">Admin Courtesy / Corporate Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audit Notes / Wire Reference ID
              </label>
              <input
                type="text"
                value={markPaidNotes}
                onChange={(e) => setMarkPaidNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
              Marking this invoice as PAID will immediately credit the customer's account with 30 days of active VPS runtime slot and transmit a confirmation receipt.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMarkPaidModalInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={markPaidProcessing}
                onClick={handleMarkAsPaid}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className={`w-3.5 h-3.5 ${markPaidProcessing ? 'animate-spin' : ''}`} />
                <span>{markPaidProcessing ? 'Marking Paid...' : 'Confirm & Deposit Slot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID INVOICE MODAL */}
      {voidModalInvoice && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">Void Invoice</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cancel unpaid transaction record</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to void invoice <strong className="text-slate-900 dark:text-white">{voidModalInvoice.invoiceNumber}</strong> for <strong className="text-slate-900 dark:text-white">${Number(voidModalInvoice.amount || 0).toFixed(2)}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Void Reason
              </label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={voidProcessing}
                onClick={handleVoidInvoice}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className={`w-3.5 h-3.5 ${voidProcessing ? 'animate-spin' : ''}`} />
                <span>{voidProcessing ? 'Voiding...' : 'Confirm Void'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-xs text-slate-500 dark:text-slate-400">Emergency power off command will be issued to host</p>
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
      {/* ENTERPRISE INVOICE DETAILS & PRINT MODAL */}
      {selectedInvoiceReceipt && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200 space-y-6 my-8">
            {/* Top Bar with Brand and Close */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block font-mono">
                  Official Invoice Receipt
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-poppins">
                  Analytical Technical Consulting (ATC)
                </h3>
                <p className="text-xs text-slate-500">Enterprise Cloud Infrastructure & Systems</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedInvoiceReceipt.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                      : selectedInvoiceReceipt.status === 'REFUNDED'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-400'
                      : selectedInvoiceReceipt.status === 'VOID'
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                  }`}
                >
                  {selectedInvoiceReceipt.status === 'PAID' ? 'PAID IN FULL' : selectedInvoiceReceipt.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedInvoiceReceipt(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice & Billed-To Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Billed To */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block font-mono">
                  Billed To Customer
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedInvoiceReceipt.customer?.name || selectedInvoiceReceipt.customer?.fullName || selectedInvoiceReceipt.user?.fullName || selectedBillingCustomer?.fullName || 'Customer'}
                </p>
                <p className="text-slate-500 font-mono">
                  {selectedInvoiceReceipt.customer?.email || selectedInvoiceReceipt.user?.email || selectedBillingCustomer?.email || 'N/A'}
                </p>
                <p className="text-slate-500">
                  {[
                    selectedInvoiceReceipt.customer?.address,
                    selectedInvoiceReceipt.customer?.city,
                    selectedInvoiceReceipt.customer?.country,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'United States'}
                </p>
                {selectedInvoiceReceipt.customer?.phone && (
                  <p className="text-slate-500 font-mono">Phone: {selectedInvoiceReceipt.customer.phone}</p>
                )}
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block font-mono">
                  Invoice & Settlement
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedInvoiceReceipt.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {formatDate(selectedInvoiceReceipt.issueDate || selectedInvoiceReceipt.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {selectedInvoiceReceipt.paymentMethod || 'Card Gateway'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                    {selectedInvoiceReceipt.transactionId || 'TXN-SETTLED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Service / Item Description</th>
                    <th className="px-4 py-3">Billing Period</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {(selectedInvoiceReceipt.items || [
                    {
                      description: 'Analytical Technical Consulting - Cloud VPS Compute',
                      specs: 'Dedicated High-Performance Virtual Machine',
                      period: 'Monthly Subscription',
                      amount: selectedInvoiceReceipt.amount || selectedInvoiceReceipt.total || 0,
                    },
                  ]).map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{item.description}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.specs}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono">{item.period || 'Monthly'}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${Number(item.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>Subtotal:</span>
                  <span>${Number(selectedInvoiceReceipt.subtotal || selectedInvoiceReceipt.amount || selectedInvoiceReceipt.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>Tax (0%):</span>
                  <span>${Number(selectedInvoiceReceipt.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white font-poppins">Total Amount:</span>
                  <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                    ${Number(selectedInvoiceReceipt.total || selectedInvoiceReceipt.amount || 0).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Verified Cryptographic Invoice Record
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadInvoicePDF(selectedInvoiceReceipt)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
