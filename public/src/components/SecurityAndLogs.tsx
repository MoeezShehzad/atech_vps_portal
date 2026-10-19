import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Server,
  Lock,
  Terminal,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  LogOut,
  Laptop,
  Globe,
  Filter,
} from 'lucide-react';
import { apiCall } from '../services/api';
import { formatDate } from '../utils/dateFormatter';

interface SecurityOverview {
  securityScore: number;
  account: {
    email: string;
    emailVerified: boolean;
    authProvider: string;
    memberSince: string;
    lastLoginAt: string | null;
  };
  stats: {
    activeSSHKeys: number;
    activeVMs: number;
    failedAttemptsLast24h: number;
    activeSessionsCount: number;
  };
}

interface AuditLog {
  id: string;
  type: 'SECURITY' | 'VM_OPERATION';
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  details: string;
  ipAddress: string;
  vmName: string | null;
  timestamp: string;
}

export default function SecurityAndLogs() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [category, setCategory] = useState<'ALL' | 'AUTH' | 'VMS' | 'SECURITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revoking, setRevoking] = useState<boolean>(false);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Fetch security overview and audit logs
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [overviewRes, logsRes] = await Promise.all([
        apiCall('/security/overview'),
        apiCall(`/security/logs?category=${category}&search=${encodeURIComponent(searchQuery)}`),
      ]);

      if (overviewRes && overviewRes.success) {
        setOverview(overviewRes);
      }
      if (logsRes && logsRes.success) {
        setLogs(logsRes.logs || []);
      }
    } catch (err) {
      console.error('[SecurityAndLogs] Error loading security data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Optional auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, category, searchQuery]);

  // Handle emergency termination of all sessions
  const handleRevokeSessions = async () => {
    if (!window.confirm('Are you sure you want to terminate all other active login sessions on other devices?')) {
      return;
    }
    setRevoking(true);
    setRevokeSuccess(null);
    try {
      const res = await apiCall('/security/revoke-sessions', { method: 'POST' });
      if (res && res.success) {
        setRevokeSuccess(`Successfully invalidated ${res.revokedCount} session token(s). Your account is safe.`);
        fetchData(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke sessions.');
    } finally {
      setRevoking(false);
    }
  };

  // Export audit logs to downloadable CSV
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;
    const headers = ['Timestamp', 'Type', 'Action', 'Status', 'Target / VM', 'IP Address', 'Details'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.type,
      l.action,
      l.status,
      l.vmName || 'N/A',
      l.ipAddress || 'Internal',
      `"${formatLogDetails(l.details || '', l.action).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `atc_security_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Icon helper based on event action
  const getActionIcon = (action: string, type: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) return <Key className="w-4 h-4 text-blue-600" />;
    if (act.includes('CONSOLE') || act.includes('TERMINAL')) return <Terminal className="w-4 h-4 text-emerald-600" />;
    if (act.includes('DEPLOY') || act.includes('START') || act.includes('CREATE')) return <Server className="w-4 h-4 text-indigo-600" />;
    if (act.includes('DESTROY') || act.includes('STOP') || act.includes('FORCE')) return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    if (act.includes('REVOKE') || act.includes('PASSWORD')) return <Lock className="w-4 h-4 text-amber-600" />;
    return type === 'SECURITY' ? <Shield className="w-4 h-4 text-blue-600" /> : <Server className="w-4 h-4 text-slate-600" />;
  };

  // Status Badge styling
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> SUCCESS
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> {s || 'PENDING'}
      </span>
    );
  };

  // Format log details to prevent raw JSON and sensitive IDs from leaking
  const formatLogDetails = (details: string, action: string) => {
    if (!details) return '—';
    const clean = details.trim();

    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        if (action === 'PAYMENT_RECEIVED') {
          const amt = parsed.amount || '';
          const brand = parsed.brand || 'Card';
          const card = parsed.maskedCard || (parsed.last4 ? `•••• ${parsed.last4}` : '');
          const inv = parsed.invoiceNumber ? ` • ${parsed.invoiceNumber}` : '';
          return `Payment of ${amt} received via ${brand} ${card ? `(${card})` : ''}${inv}`.trim();
        }
        if (action === 'INVOICE_GENERATED') {
          const inv = parsed.invoiceNumber || 'Invoice';
          const amt = parsed.amount ? ` for ${parsed.amount}` : '';
          return `${inv} generated${amt}`;
        }
        // General JSON sanitizer: strip sensitive keys
        const sensitiveKeys = ['transactionid', 'secret', 'token', 'key', 'password', 'gateway', 'sortcode', 'bankaccount', 'accountnumber', 'clientsecret'];
        const safeEntries = Object.entries(parsed)
          .filter(([k]) => !sensitiveKeys.some((sk) => k.toLowerCase().includes(sk)))
          .map(([k, v]) => `${k}: ${v}`);
        return safeEntries.join(' • ') || 'Completed';
      } catch {
        // fallback to regex scrub
      }
    }

    return clean
      .replace(/pi_[a-zA-Z0-9]{15,}/g, '[REDACTED_TX]')
      .replace(/ch_[a-zA-Z0-9]{15,}/g, '[REDACTED_TX]')
      .replace(/sk_[a-zA-Z0-9]{15,}/g, '[REDACTED_KEY]');
  };

  const score = overview?.securityScore ?? 85;
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-rose-600';
  const scoreBg = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">
                Security & Audit Trail
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor live authentication events, guest access logs, and account safety posture.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* REVOKE NOTICE BANNER */}
      {revokeSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{revokeSuccess}</span>
          </div>
          <button onClick={() => setRevokeSuccess(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. TOP SECURITY POSTURE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* SCORE CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Security Health</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg} ${scoreColor}`}>
              {score >= 80 ? 'Optimal' : score >= 60 ? 'Attention' : 'Vulnerable'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${scoreColor}`}>{score}%</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">calculated posture</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* AUTHENTICATION POSTURE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Identity Guard</span>
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {overview?.account.email || 'Authenticated'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                {overview?.account.authProvider || 'LOCAL'}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE SESSIONS & RECOVERY */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Sessions</span>
            <Laptop className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {overview?.stats.activeSessionsCount || 1}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">device token(s)</span>
            </div>
            <button
              onClick={handleRevokeSessions}
              disabled={revoking}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline cursor-pointer"
            >
              {revoking ? 'Revoking...' : 'Terminate Others'}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Last authenticated login: {overview?.account.lastLoginAt ? new Date(overview.account.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
          </p>
        </div>

        {/* SSH KEY PROTECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SSH Public Keys</span>
            <Key className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {overview?.stats.activeSSHKeys || 0}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5">key(s) enrolled</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {overview?.stats.failedAttemptsLast24h === 0
              ? 'Zero intrusion anomalies in 24h'
              : `${overview?.stats.failedAttemptsLast24h} failed login alert(s)`}
          </p>
        </div>
      </div>

      {/* 3. LOG VIEWER CONTROLS & FILTER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          {/* CATEGORY TABS */}
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
            {(['ALL', 'AUTH', 'VMS', 'SECURITY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCategory(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  category === tab
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'ALL' && 'All Activity'}
                {tab === 'AUTH' && 'Authentication'}
                {tab === 'VMS' && 'VM Management'}
                {tab === 'SECURITY' && 'Security Events'}
              </button>
            ))}
          </div>

          {/* SEARCH & AUTO-REFRESH */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, VM, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 transition-all"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Live (15s)</span>
            </label>
          </div>
        </div>

        {/* 4. AUDIT LOGS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wider uppercase">
                <th className="py-3 px-5">Event / Action</th>
                <th className="py-3 px-5">Target / Scope</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Origin / IP</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600/20 border-t-blue-600 mb-2"></div>
                    <p className="text-xs font-semibold">Loading secure audit logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No events found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Audit events will appear as actions are performed.'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getActionIcon(log.action, log.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white font-mono">
                            {log.action}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {log.type === 'SECURITY' ? 'Auth & Token' : 'Host Orchestrator'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      {log.vmName ? (
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                          {log.vmName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Account Core</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      {renderStatusBadge(log.status)}
                    </td>

                    <td className="py-3.5 px-5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{log.ipAddress}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div>{formatDate(log.timestamp)}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-300 max-w-sm truncate" title={formatLogDetails(log.details, log.action)}>
                      {formatLogDetails(log.details, log.action)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER SUMMARY */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Displaying {logs.length} most recent security and infrastructure event(s)</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Real-time Audit Ledger Active
          </span>
        </div>
      </div>
    </div>
  );
}
