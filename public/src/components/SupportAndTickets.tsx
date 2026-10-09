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
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string | null;
  response?: string | null;
  chatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  total: number;
  open: number;
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
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Selected Ticket for Full Thread Chat
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // New Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  useEffect(() => {
    if (activeTicket) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket, activeTicket?.chatHistory]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.warning('Please enter a subject line and description of your issue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiCall('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: newSubject.trim(),
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

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.response && t.response.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
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

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-100 text-slate-700';
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
            Open engineering tickets for VM networking, hypervisor diagnostics, OS installations, and storage assistance.
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Open & Queue</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block font-poppins">
              {stats.open}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">In Progress</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block font-poppins">
              {stats.inProgress}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Resolved</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block font-poppins">
              {stats.resolved}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
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

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityBadge(activeTicket.priority)}`}>
                {activeTicket.priority} PRIORITY
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(activeTicket.status)}`}>
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

              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to All Tickets</span>
              </button>
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
        /* CLEAN COMPACT TICKET LIST (Ticket 1, Ticket 2, Ticket 3... like Admin Section) */
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const msgCount = t.chatHistory?.length || (t.response ? 2 : 1);
            return (
              <div
                key={t.id}
                onClick={() => {
                  setActiveTicket(t);
                  setReplyText('');
                }}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all bg-white dark:bg-slate-900 shadow-xs group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400">#{t.id}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {t.subject}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{t.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Submitted on {new Date(t.createdAt).toLocaleDateString()} • {msgCount} message{msgCount === 1 ? '' : 's'}
                    {t.assignedTo && ` • Engineer: ${t.assignedTo}`}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(t.status)}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
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
