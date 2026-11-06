import React, { useState } from 'react';
import { 
  HardDrive, 
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
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCompanyWorkspace?: boolean;
  isOwner?: boolean;
  workspaceName?: string;
  workspaceLogo?: string | null;
  workspaceRole?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCompanyWorkspace = false,
  isOwner = true,
  workspaceName,
  workspaceLogo,
  workspaceRole,
}: SidebarProps) {
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

  const isCompany = user?.accountType === 'company' || Boolean(user?.companyName) || isCompanyWorkspace || isOwner;

  // Active Workspace / Identity details
  const effectiveCompanyLogo = workspaceLogo || user?.companyLogoUrl || user?.organization?.logoUrl || null;
  const personAvatar = user?.avatarUrl || null;

  const displayCompanyName = workspaceName || user?.companyName || user?.organization?.name || 'Company Organization';
  const displayUserName = user?.fullName || user?.email?.split('@')[0] || 'User Profile';
  const displayRole = workspaceRole || (isOwner ? 'Owner' : user?.role || 'Member');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: '1-Click Marketplace', icon: Boxes },
    { id: 'storage', label: 'Storage & Disk', icon: HardDrive },
    ...((!isCompanyWorkspace || isOwner) ? [{ id: 'billing', label: 'Billing & Invoices', icon: CreditCard }] : []),
    { id: 'security', label: 'Security & Logs', icon: Shield },
    { id: 'support', label: 'Support & Helpdesk', icon: LifeBuoy },
    ...(isCompany ? [{ id: 'team', label: 'Team Management', icon: Users }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between md:h-[calc(100vh-73px)] sticky top-[73px] shrink-0 select-none transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Middle Collapse/Expand Toggle on Sidebar Rail */}
      <button
        type="button"
        onClick={toggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Compress sidebar'}
        className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-40 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Dynamic Workspace / Identity Badge (Company Logo or Person Avatar) */}
        <div className={`p-3.5 border-b border-slate-200/80 dark:border-slate-800 transition-all ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            title={
              collapsed
                ? isCompanyWorkspace
                  ? `${displayCompanyName} • Company Workspace (${displayRole})`
                  : `${displayUserName} • Personal Profile`
                : 'Account & Profile Settings'
            }
            className={`w-full group flex items-center rounded-xl p-2.5 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/60 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60'
                : 'bg-slate-50/70 dark:bg-slate-950/30'
            } ${collapsed ? 'justify-center !p-1.5' : 'space-x-3'}`}
          >
            {/* Identity Avatar / Logo Thumbnail */}
            <div className="relative shrink-0">
              <div className={`rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex items-center justify-center p-1 shadow-xs transition-transform group-hover:scale-105 ${
                collapsed ? 'w-10 h-10' : 'w-12 h-12'
              }`}>
                {isCompanyWorkspace ? (
                  effectiveCompanyLogo ? (
                    <img
                      src={effectiveCompanyLogo}
                      alt={displayCompanyName}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white text-base font-black tracking-tight">
                      {displayCompanyName.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  personAvatar ? (
                    <img
                      src={personAvatar}
                      alt={displayUserName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {(user?.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )
                )}
              </div>

              {/* Persona Status / Type Indicator Pill */}
              {isCompanyWorkspace ? (
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-2xs"
                  title="Company Organization"
                >
                  <Building2 className="w-2.5 h-2.5" />
                </span>
              ) : (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-2xs"
                  title="Personal Account Active"
                />
              )}
            </div>

            {/* Label & Details (Shown when expanded) */}
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-1">
                  <p 
                    className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    title={isCompanyWorkspace ? displayCompanyName : displayUserName}
                  >
                    {isCompanyWorkspace ? displayCompanyName : displayUserName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {isCompanyWorkspace ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {displayRole}
                      </span>
                      <span className="truncate text-slate-400 dark:text-slate-500 font-medium">
                        &bull; {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block font-medium">
                      {user?.email || 'Personal Account'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
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
