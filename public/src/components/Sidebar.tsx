import React, { useState } from 'react';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  Shield, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  CreditCard, 
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import atcLogo from '../assets/ATC_Logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atech_customer_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('atech_customer_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCompany = user?.accountType === 'company' || Boolean(user?.companyName);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isCompany ? [{ id: 'team', label: 'Team Management', icon: Users }] : []),
    { id: 'marketplace', label: '1-Click Marketplace', icon: Boxes },
    { id: 'storage', label: 'Storage & Disk', icon: HardDrive },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
    { id: 'security', label: 'Security & Logs', icon: Shield },
    { id: 'support', label: 'Support & Helpdesk', icon: LifeBuoy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between md:h-[calc(100vh-73px)] sticky top-[73px] shrink-0 select-none transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Single Middle Collapse/Expand Toggle on Sidebar Rail (NOT in options) */}
      <button
        type="button"
        onClick={toggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Compress sidebar'}
        className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-40 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Brand Header */}
        <div className={`shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center transition-all ${collapsed ? 'p-3.5 justify-center' : 'px-5 py-4 space-x-3'}`}>
          <div className="flex items-center justify-center shrink-0">
            <img 
              src={atcLogo} 
              alt="ATC Logo" 
              className={`object-contain transition-all ${collapsed ? 'h-7 w-auto' : 'h-8 w-auto drop-shadow-xs'}`} 
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight font-poppins truncate tracking-tight">
                  ATC CLOUD
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  VPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">Infrastructure Portal</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5 overflow-y-auto flex-1 min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all group relative ${
                  collapsed
                    ? 'justify-center p-3'
                    : 'space-x-3 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <span className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-amber-400 rounded-full" />
                )}
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}

          {/* ADMIN CONSOLE LINK (Shown only for Admin users) */}
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              title={collapsed ? 'Admin Console' : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-all mt-3 ${
                collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
              }`}
            >
              <Shield className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              {!collapsed && <span>Admin Console</span>}
            </button>
          )}
        </nav>
      </div>

      {/* Footer Controls: Theme Toggle & Logout */}
      <div className={`shrink-0 border-t border-slate-100 dark:border-slate-800 space-y-2 ${collapsed ? 'p-3' : 'p-4'}`}>
        {/* iOS-Style Theme Switcher in Sidebar */}
        <div className={`rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/80 flex items-center ${
          collapsed ? 'justify-center p-2' : 'px-4 py-2.5 justify-between'
        }`}>
          {!collapsed && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Appearance</span>}
          <ThemeToggle />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center w-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all group ${
            collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-rose-600" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}