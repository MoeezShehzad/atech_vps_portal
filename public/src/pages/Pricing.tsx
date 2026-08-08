import React, { useState } from 'react';
import { Check, ArrowRight, Server, Shield, Cpu, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  // Configurator state
  const [cpu, setCpu] = useState(2);
  const [ram, setRam] = useState(4);
  const [disk, setDisk] = useState(80);
  const [os, setOs] = useState('Ubuntu 24.04 LTS');

  // Dynamic price calculation formula
  const calculatedPrice = (cpu * 6 + ram * 2.5 + disk * 0.1).toFixed(2);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans py-16 px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* PAGE HEADER */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Flexible Infrastructure</span>
          <h1 className="text-4xl font-extrabold text-blue-950 mt-2 font-poppins">VPS Pricing & Customizer</h1>
          <p className="text-slate-600 mt-3 text-sm">
            Choose a pre-configured plan or build a custom server tailored to your precise workload demands.
          </p>
        </div>

        {/* SECTION 1: PRE-CONFIGURED TIERS */}
        <div>
          <h2 className="text-2xl font-bold text-blue-950 mb-8 font-poppins text-center">Standard Compute Packages</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Starter Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col shadow-sm hover:border-blue-600 transition-all">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Starter</span>
              <div className="text-4xl font-extrabold text-blue-950 mb-6 font-poppins">
                $10 <span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-600 mb-8 flex-1">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 1 vCPU Core</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 2 GB RAM</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 40 GB NVMe Storage</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 1 TB Bandwidth</li>
              </ul>
              <Link to="/contact" className="w-full py-3 text-center rounded-full border border-slate-200 font-semibold text-sm text-blue-950 hover:border-blue-600 transition-all">
                Select Starter
              </Link>
            </div>

            {/* Growth Plan - Featured */}
            <div className="bg-white border-2 border-blue-600 rounded-2xl p-8 flex flex-col relative shadow-xl shadow-blue-600/10">
              <span className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Growth</span>
              <div className="text-4xl font-extrabold text-blue-950 mb-6 font-poppins">
                $25 <span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-600 mb-8 flex-1">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 2 vCPU Cores</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 4 GB RAM</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 80 GB NVMe Storage</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 3 TB Bandwidth</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Automated Weekly Backups</li>
              </ul>
              <Link to="/contact" className="w-full py-3 text-center rounded-full bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
                Select Growth
              </Link>
            </div>

            {/* Business Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col shadow-sm hover:border-blue-600 transition-all">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enterprise</span>
              <div className="text-4xl font-extrabold text-blue-950 mb-6 font-poppins">
                $55 <span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-600 mb-8 flex-1">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 4 vCPU Cores</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 8 GB RAM</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 160 GB NVMe Storage</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> 5 TB Bandwidth</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-blue-600 flex-shrink-0" /> Automated Daily Backups</li>
              </ul>
              <Link to="/contact" className="w-full py-3 text-center rounded-full border border-slate-200 font-semibold text-sm text-blue-950 hover:border-blue-600 transition-all">
                Select Enterprise
              </Link>
            </div>

          </div>
        </div>

        {/* SECTION 2: INTERACTIVE CUSTOM VPS CALCULATOR */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12">
          <div className="max-w-xl mb-8">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">Custom Configurator</span>
            <h2 className="text-3xl font-extrabold text-blue-950 mt-1 font-poppins">Configure Your Custom Instance</h2>
            <p className="text-slate-600 text-sm mt-2">Adjust hardware allocation to fit your exact specifications.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 items-start">
            
            {/* CONTROLS */}
            <div className="md:col-span-2 space-y-8">
              
              {/* CPU */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm text-blue-950 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" /> vCPU Cores
                  </label>
                  <span className="font-extrabold text-blue-600 text-sm">{cpu} Cores</span>
                </div>
                <input 
                  type="range" min="1" max="16" step="1" 
                  value={cpu} onChange={(e) => setCpu(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" 
                />
              </div>

              {/* RAM */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm text-blue-950 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" /> RAM Memory
                  </label>
                  <span className="font-extrabold text-blue-600 text-sm">{ram} GB</span>
                </div>
                <input 
                  type="range" min="1" max="32" step="1" 
                  value={ram} onChange={(e) => setRam(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" 
                />
              </div>

              {/* DISK */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm text-blue-950 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" /> NVMe Storage
                  </label>
                  <span className="font-extrabold text-blue-600 text-sm">{disk} GB</span>
                </div>
                <input 
                  type="range" min="20" max="500" step="10" 
                  value={disk} onChange={(e) => setDisk(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer" 
                />
              </div>

              {/* OPERATING SYSTEM */}
              <div>
                <label className="font-bold text-sm text-blue-950 block mb-2">Operating System</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Ubuntu 24.04 LTS', 'Debian 12', 'AlmaLinux 9', 'Windows Server'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setOs(item)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        os === item 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-600'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* LIVE SUMMARY CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-blue-950/5 space-y-6">
              <h3 className="font-bold text-blue-950 border-b border-slate-100 pb-3">Configuration Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">vCPU</span>
                  <span className="font-bold text-slate-800">{cpu} Cores</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RAM</span>
                  <span className="font-bold text-slate-800">{ram} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NVMe SSD</span>
                  <span className="font-bold text-slate-800">{disk} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OS</span>
                  <span className="font-bold text-slate-800">{os}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Estimated Monthly Total</span>
                <div className="text-3xl font-extrabold text-blue-600 font-poppins mt-1">
                  ${calculatedPrice}<span className="text-xs font-normal text-slate-500">/mo</span>
                </div>
              </div>

              <Link to="/contact" className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
                Deploy Configuration <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}