// ==============================================================================
// Component: SupportAndTickets.tsx
// Purpose: Customer Support Ticket & Multi-Turn Chat Helpdesk Portal
//          - Multi-Turn Real-Time Chat Conversation History
//          - Customer can send follow-up replies directly into the ongoing thread
//          - View status, priority, and assigned engineer
//          - Raise new support tickets with priorities and target VM tagging
//          - Close resolved tickets
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  Server,
  X,
  Filter,
  Check,
  UserCheck,
  HelpCircle,
  User,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';

export interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'SUPPORT';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Ticket {
  id: number;
  userId: number;
  subject: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'AWAITING_USER_ACTION' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CLOSED_TIMEOUT' | 'REOPENED';
  assignedTo?: string | null;
  response?: string | null;
  chatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  timelineDay?: number;
  timelineLabel?: string;
  slaState?: string;
  remainingHours?: number | null;
  isFollowUp?: boolean;
  parentTicketId?: number | null;
  lastAutomatedAction?: string;
}

interface TicketStats {
  total: number;
  open: number;
  awaitingAction?: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export default function SupportAndTickets() {
  const { toast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    awaitingAction: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'AWAITING_USER_ACTION' | 'REOPENED' | 'RESOLVED' | 'CLOSED_TIMEOUT'>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortField, setSortField] = useState<'updatedAt' | 'createdAt' | 'id'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Selected Ticket for Full Thread Chat
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // New Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('TECHNICAL');
  const [otherCategoryText, setOtherCategoryText] = useState<string>('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [selectedVmId, setSelectedVmId] = useState<string>('');
  const [userVms, setUserVms] = useState<{ vmId: number; name: string; ip: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Selected detail ticket for closing
  const [closingId, setClosingId] = useState<number | null>(null);

  const fetchTickets = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await apiCall('/tickets');
      if (res && res.success) {
        setTickets(res.tickets || []);
        if (res.stats) setStats(res.stats);

        // Update activeTicket if currently selected
        if (activeTicket) {
          const fresh = (res.tickets || []).find((t: Ticket) => t.id === activeTicket.id);
          if (fresh) setActiveTicket(fresh);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserVms = async () => {
    try {
      const res = await apiCall('/vms');
      if (res && res.vms) {
        setUserVms(
          res.vms.map((v: any) => ({
            vmId: v.vmId,
            name: v.name || v.vmName,
            ip: v.ip,
          }))
        );
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchTickets();
    fetchUserVms();
  }, []);



  // Polling for active ticket thread updates in real-time every 4s
  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiCall(`/tickets/${activeTicket.id}`);
        if (res && res.success && res.ticket) {
          const fresh = res.ticket;
          setActiveTicket((prev) => {
            if (!prev || prev.id !== fresh.id) return prev;
            const prevLen = prev.chatHistory?.length || 0;
            const freshLen = fresh.chatHistory?.length || 0;
            if (prevLen !== freshLen || prev.status !== fresh.status || prev.response !== fresh.response) {
              return fresh;
            }
            return prev;
          });
        }
      } catch (_) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.warning('Please enter a subject line and description of your issue.');
      return;
    }

    let finalSubjectText = newSubject.trim();
    if (newCategory === 'OTHER' && otherCategoryText.trim()) {
      finalSubjectText = `[${otherCategoryText.trim()}] ${finalSubjectText}`;
    } else if (newCategory !== 'OTHER' && newCategory) {
      finalSubjectText = `[${newCategory}] ${finalSubjectText}`;
    }

    setSubmitting(true);
    try {
      const res = await apiCall('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: finalSubjectText,
          message: newMessage.trim(),
          priority: newPriority,
          vmId: selectedVmId ? Number(selectedVmId) : undefined,
        }),
      });

      if (res && res.success) {
        toast.success(res.message || 'Support ticket submitted successfully!');
        setIsCreateOpen(false);
        setNewSubject('');
        setNewMessage('');
        setNewCategory('TECHNICAL');
        setOtherCategoryText('');
        setNewPriority('NORMAL');
        setSelectedVmId('');
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCustomerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const msgToSend = replyText.trim();
    if (!activeTicket || !msgToSend) return;

    setSendingReply(true);
    setReplyText(''); // Clear input immediately for responsive chat UX

    try {
      const res = await apiCall(`/tickets/${activeTicket.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: msgToSend }),
      });

      if (res && (res.success || res.ticket)) {
        const updatedTicket = res.ticket || res;
        setActiveTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
      } else {
        fetchTickets();
      }
    } catch (err: any) {
      setReplyText(msgToSend); // Restore if error
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    setClosingId(ticketId);
    try {
      const res = await apiCall(`/tickets/${ticketId}/close`, {
        method: 'PATCH',
      });
      if (res && res.success) {
        toast.success('Ticket marked as resolved and closed.');
        fetchTickets();
        if (activeTicket && activeTicket.id === ticketId) {
          setActiveTicket((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to close ticket');
    } finally {
      setClosingId(null);
    }
  };

  const filteredTickets = tickets
    .filter((t) => {
      // 1. Status Filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        t.status === statusFilter ||
        (statusFilter === 'CLOSED_TIMEOUT' && (t.status === 'CLOSED_TIMEOUT' || t.status === 'CLOSED'));

      // 2. Date Range Filter (From Date to To Date)
      let matchesDate = true;
      const ticketTime = new Date(t.createdAt).getTime();
      if (dateFrom) {
        const fromTime = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (ticketTime < fromTime) matchesDate = false;
      }
      if (dateTo) {
        const toTime = new Date(dateTo).setHours(23, 59, 59, 999);
        if (ticketTime > toTime) matchesDate = false;
      }

      // 3. Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.subject.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        `t-${t.id}`.includes(q) ||
        (t.lastAutomatedAction && t.lastAutomatedAction.toLowerCase().includes(q)) ||
        (t.response && t.response.toLowerCase().includes(q));

      return matchesStatus && matchesDate && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id - b.id;
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        // Default: updatedAt
        comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800';
      case 'HIGH':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800';
      case 'NORMAL':
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700';
    }
  };

  const getSlaStateBadge = (t: Ticket) => {
    const state = t.slaState || (t.status === 'AWAITING_USER_ACTION' ? 'Pending Action' : t.status);
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
      case 'Closed':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">
              Technical Support & Helpdesk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
              24/7 Tier-2 Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Open engineering tickets for instance configurations, networking setup, billing inquiries, and technical guidance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total Tickets</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block font-poppins">
              {stats.total}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <LifeBuoy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Open Tickets</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block font-poppins">
              {stats.open}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Pending User Action</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block font-poppins">
              {stats.awaitingAction ?? 0}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Resolved & Closed</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block font-poppins">
              {stats.resolved + stats.closed}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
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
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, subject, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Secondary Filter & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Left: Date Range Pickers */}
          <div className="flex flex-wrap items-center gap-3">

            {/* Date Range Filtering */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Date:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                title="From date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                title="To date"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
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
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="updatedAt">Last Activity</option>
              <option value="createdAt">Creation Date</option>
              <option value="id">Ticket ID</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1"
              title={sortOrder === 'desc' ? 'Descending (Newest first)' : 'Ascending (Oldest first)'}
            >
              <span>{sortOrder === 'desc' ? 'Descending ↓' : 'Ascending ↑'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List or Active Ticket View */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : activeTicket ? (
        /* DEDICATED ACTIVE TICKET CONVERSATION VIEW (Matching Admin section layout) */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-start sm:items-center gap-3">
              {/* Dedicated Top-Left Back Arrow Button */}
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all shrink-0 cursor-pointer shadow-xs"
                title="Back to Tickets"
                aria-label="Back to Tickets"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    Ticket #{activeTicket.id}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-poppins">{activeTicket.subject}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted on {new Date(activeTicket.createdAt).toLocaleString()}
                  {activeTicket.assignedTo && (
                    <> • Assigned Engineer: <strong className="text-slate-700 dark:text-slate-300">{activeTicket.assignedTo}</strong></>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityBadge(activeTicket.priority)}`}>
                {activeTicket.priority} PRIORITY
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getSlaStateBadge(activeTicket)}`}>
                {activeTicket.status.replace('_', ' ')}
              </span>

              {activeTicket.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => handleCloseTicket(activeTicket.id)}
                  disabled={closingId === activeTicket.id}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{closingId === activeTicket.id ? 'Resolving...' : 'Resolve & Close'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Conversation History Thread */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer Conversation History:
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeTicket.chatHistory?.length || (activeTicket.response ? 2 : 1)} message(s)
              </span>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 max-h-[460px] overflow-y-auto">
              {(() => {
                const thread = activeTicket.chatHistory && activeTicket.chatHistory.length > 0
                  ? activeTicket.chatHistory
                  : [
                      { id: '1', sender: 'CUSTOMER' as const, senderName: 'You', message: activeTicket.message, timestamp: activeTicket.createdAt },
                      ...(activeTicket.response ? [{ id: '2', sender: 'SUPPORT' as const, senderName: activeTicket.assignedTo || 'Engineer', message: activeTicket.response, timestamp: activeTicket.updatedAt }] : []),
                    ];

                return thread.map((msg, idx) => {
                  const isUser = msg.sender === 'CUSTOMER';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Headphones className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-semibold">
                          <span>{isUser ? 'You' : msg.senderName || 'Technical Support'}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* Follow-up Reply Input */}
          <form
            onSubmit={handleSendCustomerReply}
            className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
          >
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {activeTicket.status === 'CLOSED' ? 'Ticket Closed (Sending a message will reopen it):' : 'Write a Follow-Up Reply:'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={activeTicket.status === 'CLOSED' ? 'This ticket is closed. Type here to reopen and ask a follow-up...' : 'Write your follow-up reply or question...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No support tickets found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {tickets.length === 0
              ? 'You have not submitted any technical requests yet. If you have questions about your server or configuration, open a ticket anytime.'
              : 'No tickets matched your filter criteria.'}
          </p>
          {tickets.length === 0 && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Open Your First Ticket
            </button>
          )}
        </div>
      ) : (
        /* TABLE MATCHING USER IMAGE MOCKUP */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
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
                {filteredTickets.map((t) => {
                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setActiveTicket(t);
                        setReplyText('');
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
                          {t.message}
                        </p>
                      </td>

                      {/* Active Timeline */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle font-medium text-slate-800 dark:text-slate-200">
                        {t.timelineLabel || `Day ${t.timelineDay ?? 0}`}
                      </td>

                      {/* SLA State Status */}
                      <td className="py-4 px-5 whitespace-nowrap align-middle">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getSlaStateBadge(t)}`}
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
                              : `Status update recorded`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: OPEN NEW SUPPORT TICKET */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 rounded-xl text-blue-600 dark:text-blue-400">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-poppins">Raise Support Ticket</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dedicated engineer assistance for your servers</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {/* Category Selection with 'Other' support */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Topic / Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="TECHNICAL">Technical & Server Diagnostics</option>
                  <option value="BILLING">Billing, Invoices & Subscriptions</option>
                  <option value="NETWORK">Networking & Port Forwarding</option>
                  <option value="ACCESS">Account Access & Credentials</option>
                  <option value="OTHER">Other (Specify custom topic)</option>
                </select>

                {newCategory === 'OTHER' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter your custom topic or inquiry area..."
                    value={otherCategoryText}
                    onChange={(e) => setOtherCategoryText(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 animate-in fade-in duration-150"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot connect via SSH on port 22, network timeout"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="LOW" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Low (General Inquiries)</option>
                    <option value="NORMAL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Normal (Configuration)</option>
                    <option value="HIGH" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">High (Performance Degraded)</option>
                    <option value="URGENT" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Urgent (VM Offline / Outage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Related VM (Optional)
                  </label>
                  <select
                    value={selectedVmId}
                    onChange={(e) => setSelectedVmId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">General Account / Platform</option>
                    {userVms.map((v) => (
                      <option key={v.vmId} value={v.vmId} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        {v.name} ({v.ip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Describe Your Issue or Request *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide detailed error logs, terminal output, or what steps caused the issue..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Dispatch Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
