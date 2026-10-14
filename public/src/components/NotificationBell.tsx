// ==============================================================================
// Component: NotificationBell.tsx
// Purpose: Interactive notification bell with unread badge & live alert popover
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Shield, 
  HardDrive, 
  DollarSign, 
  Info, 
  AlertTriangle,
  X
} from 'lucide-react';
import { apiCall } from '../services/api';
import { formatDate } from '../utils/dateFormatter';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'security' | 'billing' | 'infrastructure' | 'system';
  timestamp: string;
  isRead: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiCall('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // Graceful fallback for unauthenticated or polling errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // 20s live sync
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await apiCall('/notifications/mark-read', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiCall('/notifications/clear', { method: 'POST' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.warn('Clear notifications error:', e);
    }
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === 'unread') return !item.isRead;
    if (filter === 'alerts') return item.type === 'warning' || item.type === 'error';
    return true;
  });

  const formatRelativeTime = (isoString: string) => {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return formatDate(isoString);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-xs"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white font-poppins">
                Alerts & Activity
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear all"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex px-4 pt-2.5 pb-2 gap-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('alerts')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === 'alerts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Alerts
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-semibold">No notifications to display</p>
                <p className="text-[10px] mt-0.5">Your infrastructure is running normally.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                let Icon = Info;
                let iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/60';

                if (item.category === 'security') {
                  Icon = Shield;
                  iconColor = 'text-purple-500 bg-purple-50 dark:bg-purple-950/60';
                } else if (item.category === 'billing') {
                  Icon = DollarSign;
                  iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60';
                } else if (item.type === 'warning') {
                  Icon = AlertTriangle;
                  iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/60';
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-start gap-3 transition-colors ${
                      !item.isRead
                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconColor}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </strong>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-mono">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                        {item.message}
                      </p>
                    </div>

                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
