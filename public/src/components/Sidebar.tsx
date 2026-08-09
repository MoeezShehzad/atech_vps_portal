import { Server, HardDrive, Cpu, Shield, Settings, LogOut, LayoutDashboard } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vms', label: 'Virtual Machines', icon: Server },
    { id: 'storage', label: 'Storage & Disk', icon: HardDrive },
    { id: 'pools', label: 'Resource Pools', icon: Cpu },
    { id: 'security', label: 'Security & Logs', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-sm shadow-blue-500/20">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-tight font-poppins">
              ATEC VPS
            </h1>
            <p className="text-xs text-slate-500 font-medium">Portal Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all">
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-rose-600" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}