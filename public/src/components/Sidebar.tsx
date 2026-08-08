import { Server, HardDrive, Cpu, Shield, Settings, LogOut, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Virtual Machines', icon: Server, active: false },
    { label: 'Storage & Disk', icon: HardDrive, active: false },
    { label: 'Resource Pools', icon: Cpu, active: false },
    { label: 'Security & Logs', icon: Shield, active: false },
    { label: 'Settings', icon: Settings, active: false },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 leading-tight">ATEC VPS</h1>
            <p className="text-xs text-slate-400">Portal Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href="#"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 rounded-xl transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}