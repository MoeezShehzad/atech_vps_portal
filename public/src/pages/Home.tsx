import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Server, 
  Shield, 
  Cpu, 
  Award, 
  Check, 
  Zap, 
  Globe, 
  ShieldCheck, 
  ChevronRight,
  Terminal,
  Activity,
  Sparkles,
  Layers,
  Lock,
  Database,
  Star,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchVpsPlans } from '../services/pricingApi';
import AnimatedCloudTerminal from '../components/AnimatedCloudTerminal';

const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/place/Analytical+Technical+Consulting/@41.6493404,-88.1755207,17z/data=!3m1!4b1!4m6!3m5!1s0x258bf3e100baa53b:0xdad95528ab037483!8m2!3d41.6493364!4d-88.1729458!16s%2Fg%2F11y56zr_t0?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D";

const DEFAULT_HOME_PLANS = [
  {
    planId: 1,
    name: 'VPS Basic',
    cpu: '2 Cores',
    cpuCores: 2,
    ram: '2 GB RAM',
    ramGb: 2,
    storage: '50 GB SSD',
    storageGb: 50,
    bandwidth: '4 TB Bandwidth',
    price: 4.97,
    monthlyPrice: 4.97,
    popular: false,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    planId: 2,
    name: 'VPS Pro',
    cpu: '4 Cores',
    cpuCores: 4,
    ram: '8 GB RAM',
    ramGb: 8,
    storage: '120 GB SSD',
    storageGb: 120,
    bandwidth: '8 TB Bandwidth',
    price: 14.99,
    monthlyPrice: 14.99,
    popular: true,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    planId: 3,
    name: 'VPS Enterprise',
    cpu: '8 Cores',
    cpuCores: 8,
    ram: '16 GB RAM',
    ramGb: 16,
    storage: '250 GB SSD',
    storageGb: 250,
    bandwidth: '12 TB Bandwidth',
    price: 29.99,
    monthlyPrice: 29.99,
    popular: false,
    color: 'from-indigo-600 to-purple-600',
  },
];

const ONE_CLICK_APPS = [
  { name: 'Docker Compose', category: 'DevOps', icon: '🐳' },
  { name: 'aaPanel', category: 'Control Panel', icon: '⚡' },
  { name: 'Ubuntu 24.04', category: 'Linux OS', icon: '🐧' },
  { name: 'Debian 12', category: 'Linux OS', icon: '🌀' },
  { name: 'AlmaLinux 9', category: 'Enterprise OS', icon: '🛡️' },
  { name: 'Windows Server', category: 'Windows OS', icon: '🪟' },
  { name: 'Nginx Engine', category: 'Web Server', icon: '🚀' },
  { name: 'Node.js LTS', category: 'Runtime', icon: '🟢' },
  { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
];

const TYPEWRITER_PHRASES = [
  'Cloud Infrastructure',
  'Ultra-Fast SSD VPS',
  '1-Click DevOps Apps',
  'Automated aaPanel Stacks',
  'Docker Cloud Instances',
  'Enterprise Virtualization',
];

export default function Home() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [plans, setPlans] = useState<any[]>(DEFAULT_HOME_PLANS);

  // Typewriter Animation State
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamically load active plans from database
  useEffect(() => {
    fetchVpsPlans()
      .then((dbPlans) => {
        if (Array.isArray(dbPlans) && dbPlans.length > 0) {
          const mapped = dbPlans.slice(0, 3).map((p, idx) => ({
            planId: p.planId,
            name: p.name,
            cpu: `${p.cpuCores} Cores`,
            cpuCores: p.cpuCores,
            ram: `${p.ramGb} GB RAM`,
            ramGb: p.ramGb,
            storage: `${p.storageGb} GB SSD`,
            storageGb: p.storageGb,
            bandwidth: `${Math.round(((p.bandwidthMbps || 1000) / 1000) * 4) || 4} TB Bandwidth`,
            price: Number(p.monthlyPrice) || 9.99,
            monthlyPrice: Number(p.monthlyPrice) || 9.99,
            popular: idx === 1 || p.name.toLowerCase().includes('pro'),
            color: idx === 0 ? 'from-blue-500 to-cyan-500' : idx === 1 ? 'from-blue-600 to-indigo-600' : 'from-indigo-600 to-purple-600',
          }));
          setPlans(mapped);
        }
      })
      .catch((err) => {
        console.warn('Could not load live plans for home page, using defaults:', err?.message);
      });
  }, []);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === currentPhrase) {
      // Pause at full word for 2.2 seconds before deleting
      timeout = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && displayText === '') {
      // Pause briefly before typing next word
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      timeout = setTimeout(() => {}, 300);
    } else {
      // Typing speed: 85ms forward, 40ms deleting
      const speed = isDeleting ? 40 : 85;
      timeout = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting
            ? currentPhrase.substring(0, prev.length - 1)
            : currentPhrase.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  const handleConfigure = (plan: any) => {
    navigate('/configure', { state: { selectedPlan: plan } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-poppins selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-16 sm:pt-20 pb-24 sm:pb-32">
        {/* Ambient Gradient Glow Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT: TEXT & CALL TO ACTIONS */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50/90 border border-blue-200/80 px-4 py-1.5 rounded-full shadow-xs backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span>Enterprise Cloud Platform • 99.9% Uptime SLA</span>
            </div>

            {/* Main Headline with Dynamic Typewriter Animation */}
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 leading-[1.12] tracking-tight min-h-[135px] sm:min-h-[175px]">
              Deploy Scalable <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 font-black">
                {displayText}
              </span>
              {/* Typewriter Cursor */}
              <span className="inline-block w-1 sm:w-1.5 h-8 sm:h-12 ml-1.5 bg-blue-600 rounded-xs animate-pulse align-middle" />
              <br />
              Built for Scale.
            </h1>

            {/* Description Subtext */}
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Analytical Technical Consulting (ATC) delivers next-generation data center virtualization, pure SSD cloud servers, and instant 1-click DevOps deployments engineered for production workloads.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/configure"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Deploy Cloud Server</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/pricing"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border border-slate-300 font-bold text-sm tracking-wide text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all text-center shadow-xs cursor-pointer"
              >
                View VPS Plans
              </Link>
            </div>

            {/* Quick Feature Trust Badges */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                Spin up in &lt; 60 seconds
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                Full Root & Admin Control
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                PCI-DSS Level 1 Encrypted Checkout
              </span>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE SERVER TERMINAL & TELEMETRY PREVIEW */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-3xl p-7 shadow-2xl shadow-blue-950/10 relative overflow-hidden backdrop-blur-xs">
              
              {/* Header: Clickable Google Reviews Link */}
              <div className="flex items-center justify-between pb-4 mb-1">
                <a 
                  href={GOOGLE_REVIEWS_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group hover:opacity-90 transition-all cursor-pointer"
                  title="View Analytical Technical Consulting on Google Maps & Reviews"
                >
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-500 flex items-center justify-center border border-amber-200/80 shadow-xs group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xl font-bold text-slate-950 tracking-tight group-hover:text-blue-600 transition-colors">4.9 / 5.0</h3>
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors ml-0.5" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Google Reviews
                      </span>
                    </div>
                  </div>
                </a>
              </div>

              {/* Live Interactive Animated Cloud Terminal */}
              <AnimatedCloudTerminal />

            </div>
          </div>

        </div>
      </section>

      {/* 2. ONE-CLICK APPS & OPERATING SYSTEMS SHOWCASE STRIP */}
      <section className="bg-slate-900 border-b border-slate-800 py-6 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-300 uppercase tracking-wider shrink-0">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Instant 1-Click Stacks & OS:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              {ONE_CLICK_APPS.map((app) => (
                <div 
                  key={app.name} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-200 hover:border-blue-500/80 transition-all"
                >
                  <span>{app.icon}</span>
                  <span>{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED VPS PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> High Performance VPS Hosting
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Predictable Cloud Pricing
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-normal">
            Scalable instances backed by high-speed SSD storage, dedicated hardware, and fast deployment.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className="w-12 h-6 bg-slate-200 rounded-full p-1 relative transition-colors focus:outline-hidden cursor-pointer"
            >
              <div className={`w-4 h-4 bg-blue-600 rounded-full transition-transform ${billingCycle === 'annually' ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-xs font-bold ${billingCycle === 'annually' ? 'text-slate-900' : 'text-slate-400'}`}>
              Annually <span className="text-emerald-700 text-[10px] bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full ml-1">Save 15%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const finalPrice = billingCycle === 'annually' ? +(plan.price * 0.85).toFixed(2) : plan.price;

            return (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-1.5 ${
                  plan.popular
                    ? 'border-blue-600 shadow-2xl shadow-blue-900/10 ring-2 ring-blue-600/30 md:scale-105 z-10'
                    : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                    Most Popular Choice
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-2xl font-black text-slate-950">{plan.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                      General Purpose
                    </span>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">${finalPrice.toFixed(2)}</span>
                      <span className="text-slate-500 text-xs font-bold"> / month</span>
                    </div>
                    {billingCycle === 'annually' && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">Billed annually (${(finalPrice * 12).toFixed(2)}/yr)</p>
                    )}
                  </div>

                  <ul className="space-y-3.5 text-xs text-slate-600 font-medium mb-8">
                    <li className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-blue-600 shrink-0" /> 
                      <span><strong className="text-slate-950 font-bold">{plan.cpu}</strong> vCPU Cores</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-blue-600 shrink-0" /> 
                      <span><strong className="text-slate-950 font-bold">{plan.ram}</strong> High-Speed Memory</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-blue-600 shrink-0" /> 
                      <span><strong className="text-slate-950 font-bold">{plan.storage}</strong> Enterprise SSD</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-600 shrink-0" /> 
                      <span><strong className="text-slate-950 font-bold">{plan.bandwidth}</strong> Premium Traffic</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> 
                      <span>Dedicated IPv4 & Full Root Access</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleConfigure(plan)}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span>Configure Server</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CORE CAPABILITIES SECTION */}
      <section className="bg-white border-y border-slate-200/90 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Engineered For Stability
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Enterprise Infrastructure Capabilities
            </h2>
            <p className="text-slate-600 text-sm font-normal">
              High-performance compute clusters optimized for developer workloads, databases, and continuous uptime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-3xl p-8 hover:border-blue-500/80 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-6 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2">Data Center Management</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                Design, deploy, and maintain cloud infrastructure with high availability, automated backup schedules, and failover clustering.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/90 rounded-3xl p-8 hover:border-blue-500/80 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-6 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2">Infrastructure Security</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                Systematic auditing, boundary defense, active firewall configurations, and isolated virtual network segmentation.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/90 rounded-3xl p-8 hover:border-blue-500/80 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-6 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2">Hardware Optimization</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                Precision hardware sizing and active workload balancing to eliminate resource throttling and ensure consistent performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-10 sm:p-16 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="space-y-3 relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Custom Enterprise Hosting</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Need a custom dedicated setup?</h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Our engineering team provides tailored server configurations, multi-node private cloud clusters, and direct IT consulting.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all text-center whitespace-nowrap"
            >
              Contact Infrastructure Team
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}