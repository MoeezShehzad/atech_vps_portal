import React, { useState } from 'react';
import { ArrowRight, Server, Shield, Cpu, Award, Check, Zap, Globe, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const FEATURED_PLANS = [
  {
    name: 'VPS S',
    cpu: '2 Cores',
    ram: '4 GB RAM',
    storage: '80 GB NVMe',
    bandwidth: '4 TB Bandwidth',
    price: 6.0,
    popular: false,
  },
  {
    name: 'VPS M+',
    cpu: '4 Cores',
    ram: '6 GB RAM',
    storage: '160 GB NVMe',
    bandwidth: '8 TB Bandwidth',
    price: 11.0,
    popular: true,
  },
  {
    name: 'VPS L',
    cpu: '8 Cores',
    ram: '16 GB RAM',
    storage: '320 GB NVMe',
    bandwidth: '12 TB Bandwidth',
    price: 24.0,
    popular: false,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const handleConfigure = (plan: typeof FEATURED_PLANS[0]) => {
    navigate('/configure', { state: { selectedPlan: plan } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 pt-16 pb-24">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 text-xs font-bold text-blue-700 border border-blue-200 bg-blue-50/80 backdrop-blur-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Enterprise Data Center & Virtual Private Hosting
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-950 leading-[1.1] tracking-tight">
              High-Performance <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Cloud Infrastructure
              </span>{' '}
              Built for Scale.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Analytical Technical Consulting provides data center virtualization, specialized cloud hosting, and enterprise systems engineered for 99.9% uptime and low-latency workloads.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/configure"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/35 transition-all flex items-center justify-center gap-2 group"
              >
                Deploy Cloud Server
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/services"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-slate-300 font-extrabold text-xs uppercase tracking-wider text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all text-center"
              >
                Consulting Services
              </Link>
            </div>

            {/* Quick Feature Badges */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Instant Provisioning (~60s)
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Full Root / Admin Access
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> Pure NVMe Storage
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: METRIC & ARCHITECTURE PREVIEW CARD */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-white to-slate-50/50 border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-blue-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tight">4.9 / 5.0</h3>
                    <p className="text-xs text-slate-500 font-semibold">Client Satisfaction Score</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                  Verified SLA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-3xl font-black text-slate-950 tracking-tight">30+</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">Enterprise Deployments</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-3xl font-black text-emerald-600 tracking-tight">99.9%</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">Infrastructure Uptime</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 text-[11px]">
                  <span>System Health Check</span>
                  <span className="text-emerald-400 font-bold">● ACTIVE</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Hypervisor Cluster:</span>
                  <span className="text-blue-400 font-bold">HA-NODE-01</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Edge Firewall:</span>
                  <span className="text-blue-400 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>NVMe RAID Array:</span>
                  <span className="text-emerald-400 font-bold">OPTIMAL</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FEATURED VPS PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Flexible VPS Hosting Plans
          </h2>
          <p className="text-slate-600 text-sm font-medium">
            Scalable instances backed by high-speed NVMe storage and isolated enterprise hardware.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className="w-12 h-6 bg-slate-200 rounded-full p-1 relative transition-colors focus:outline-none"
            >
              <div className={`w-4 h-4 bg-blue-600 rounded-full transition-transform ${billingCycle === 'annually' ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-xs font-bold ${billingCycle === 'annually' ? 'text-slate-900' : 'text-slate-400'}`}>
              Annually <span className="text-emerald-600 text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-1">Save 15%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {FEATURED_PLANS.map((plan) => {
            const finalPrice = billingCycle === 'annually' ? +(plan.price * 0.85).toFixed(2) : plan.price;

            return (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl p-8 border transition-all flex flex-col justify-between relative ${
                  plan.popular
                    ? 'border-blue-600 shadow-2xl shadow-blue-950/10 ring-2 ring-blue-600/20 scale-105 z-10'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                    Most Popular Choice
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-4">
                    <h3 className="text-xl font-extrabold text-slate-950">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-slate-950 tracking-tight">${finalPrice.toFixed(2)}</span>
                    <span className="text-slate-500 text-xs font-bold"> / month</span>
                  </div>

                  <ul className="space-y-3.5 text-xs text-slate-600 font-medium border-t border-slate-100 pt-6 mb-8">
                    <li className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-blue-600" /> <strong className="text-slate-900">{plan.cpu}</strong> vCPU Cores
                    </li>
                    <li className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-blue-600" /> <strong className="text-slate-900">{plan.ram}</strong> High-Speed
                    </li>
                    <li className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-blue-600" /> <strong className="text-slate-900">{plan.storage}</strong> RAID10 Array
                    </li>
                    <li className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-600" /> <strong className="text-slate-900">{plan.bandwidth}</strong> Premium Traffic
                    </li>
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Full KVM Root Access
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleConfigure(plan)}
                  className={`w-full py-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  Configure Server <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. CORE CAPABILITIES */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">Core Infrastructure Capabilities</h2>
            <p className="text-slate-600 text-sm">Enterprise engineering tailored for low latency and high stability.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-blue-600 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2">Data Center Management</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Design, deploy, and maintain hypervisors with high availability, automated backup schedules, and failover clustering.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-blue-600 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2">Infrastructure Security</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Systematic auditing, boundary defense, active firewall configurations, and isolated virtual network segmentation.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 hover:border-blue-600 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2">Hardware Optimization</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                Precision hardware sizing and active workload balancing to eliminate resource throttling and ensure consistent performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-10 sm:p-16 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 relative z-10 max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Need a custom enterprise setup?</h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Our engineering team provides tailored server configurations, multi-node hypervisor setups, and custom IT consulting.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/contact"
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all text-center whitespace-nowrap"
            >
              Contact Infrastructure Team
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}