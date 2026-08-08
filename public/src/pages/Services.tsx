import React from 'react';
import { Server, Shield, HardDrive, Cpu, Settings, Database } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: <Server className="w-6 h-6 text-blue-600" />,
      title: "Data Center Design & Management",
      description: "Architecture and management of highly available hosting platforms, Hyper-V clusters, and virtual private servers."
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      title: "Infrastructure & Network Security",
      description: "Log auditing, perimeter firewall defense, access security, and continuous storage integrity verification."
    },
    {
      icon: <HardDrive className="w-6 h-6 text-blue-600" />,
      title: "Backup & Disaster Recovery Plans",
      description: "Automated execution of multi-site backup policies, 30-day retention schedules, and fast emergency recovery."
    },
    {
      icon: <Cpu className="w-6 h-6 text-blue-600" />,
      title: "Hardware Sizing & Optimization",
      description: "Utilization analysis to optimize CPU, memory, and NVMe storage allocations across hypervisors."
    },
    {
      icon: <Database className="w-6 h-6 text-blue-600" />,
      title: "Database Systems Support",
      description: "Deployment, automated maintenance, and backup scripts for core relational databases."
    },
    {
      icon: <Settings className="w-6 h-6 text-blue-600" />,
      title: "System Automation & Scripting",
      description: "Custom PowerShell and Bash scripts for routine server operations, health checks, and state transitions."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Expertise & Solutions</span>
          <h1 className="text-4xl font-extrabold text-blue-950 mt-2 font-poppins">Comprehensive IT Services</h1>
          <p className="text-slate-600 mt-3 text-sm">Tailored IT solutions built around your business goals.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((srv, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:border-blue-600 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 mb-6">
                {srv.icon}
              </div>
              <h3 className="text-lg font-bold text-blue-950 mb-2">{srv.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{srv.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}