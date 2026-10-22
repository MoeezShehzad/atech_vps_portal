import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Server, 
  Shield, 
  Cpu, 
  Check, 
  Zap, 
  Globe, 
  ShieldCheck, 
  ChevronRight, 
  Star,
  Layers,
  Terminal,
  Activity,
  Sparkles,
  Lock,
  Database,
  PhoneCall,
  HardDrive,
  Workflow,
  Network,
  Gauge
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchVpsPlans } from '../services/pricingApi';
import AnimatedCloudTerminal from '../components/AnimatedCloudTerminal';
import LiquidGlassSphere from '../components/LiquidGlassSphere';

const GOOGLE_MAPS_REVIEWS_URL =
  'https://www.google.com/maps/place/Analytical+Technical+Consulting/@41.6493404,-88.1755207,17z/data=!3m1!4b1!4m6!3m5!1s0x258bf3e100baa53b:0xdad95528ab037483!8m2!3d41.6493364!4d-88.1729458!16s%2Fg%2F11y56zr_t0?entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D';

const CLIENT_REVIEWS = [
  {
    name: 'Marcus V.',
    role: 'Senior DevOps Engineer',
    rating: 5,
    initials: 'MV',
    color: 'from-blue-600 to-indigo-600',
    review:
      'ATC provided exceptional service setting up our cloud instances. SSD read and write speeds are fast, latency is minimal, and technical support was responsive when configuring our private subnets.',
  },
  {
    name: 'Elena R.',
    role: 'Software Architect',
    rating: 5,
    initials: 'ER',
    color: 'from-emerald-600 to-teal-600',
    review:
      'Migrated our backend services and database nodes to ATC. Server provisioning was fast, performance has been rock-solid, and we get clean root control without unnecessary overhead.',
  },
  {
    name: 'David M.',
    role: 'Systems Administrator',
    rating: 5,
    initials: 'DM',
    color: 'from-purple-600 to-pink-600',
    review:
      'Top-tier reliability and true bare-metal-backed virtualization. Server resources are dedicated and predictable. When we needed help with networking, their engineers answered promptly.',
  },
  {
    name: 'Sophia C.',
    role: 'Full-Stack Developer',
    rating: 5,
    initials: 'SC',
    color: 'from-amber-500 to-orange-600',
    review:
      'Customer support is genuinely helpful and knowledgeable. Needed custom storage partitioning and firewall adjustments; everything was handled smoothly. Very satisfied with the hosting experience.',
  },
  {
    name: 'James T.',
    role: 'Infrastructure Lead',
    rating: 5,
    initials: 'JT',
    color: 'from-cyan-600 to-blue-600',
    review:
      'Solid network throughput and consistent compute stability during our highest traffic periods. Dedicated storage without noisy neighbors has kept our web applications running fast.',
  },
  {
    name: 'Brian O.',
    role: 'IT Operations Consultant',
    rating: 5,
    initials: 'BO',
    color: 'from-indigo-600 to-violet-600',
    review:
      'Clean virtualization, honest pricing, and high server reliability. The infrastructure performance and quick provisioning make managing production environments straightforward.',
  },
];

const EDITORIAL_SERVICES = [
  {
    number: '01',
    title: 'Enterprise ERP & Systems',
    category: 'Business Infrastructure',
    description:
      'Scalable enterprise resource planning, database architecture, and production workflows deployed on dedicated virtualization matrices for uninterrupted operations.',
    points: ['ERP Migration & Optimization', 'Clustered Database Deployments', 'Custom Integration Topologies'],
    icon: Database,
  },
  {
    number: '02',
    title: 'Data Center Virtualization',
    category: 'Cloud Engineering',
    description:
      'High-availability data center hosting with pure enterprise SSD arrays, automated backup schedules, and private cloud failover architectures.',
    points: ['Private Virtual Data Centers', 'Live Hypervisor Failover', 'Dedicated Hardware Isolation'],
    icon: Server,
  },
  {
    number: '03',
    title: 'System Architecture & Security',
    category: 'Cybersecurity & Auditing',
    description:
      'Systematic boundary defense, zero-trust network segmentation, active firewall configuration, and multi-tenant security boundary auditing.',
    points: ['Boundary Defense & Firewalls', 'Isolated Subnet Routing', 'PCI-DSS Compliance Alignment'],
    icon: ShieldCheck,
  },
  {
    number: '04',
    title: 'Hardware Sizing & Workload Tuning',
    category: 'Performance Engineering',
    description:
      'Precision bare-metal profiling and active workload balancing to eliminate resource contention and unlock maximum NVMe throughput for demanding workloads.',
    points: ['Dedicated Compute Allocation', 'NVMe Read/Write Tuning', 'Latency Throttling Elimination'],
    icon: Cpu,
  },
];

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
    bandwidth: '40 GB Bandwidth',
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
    storage: '240 GB SSD',
    storageGb: 240,
    bandwidth: '16 TB Bandwidth',
    price: 29.99,
    monthlyPrice: 29.99,
    popular: false,
    color: 'from-indigo-600 to-purple-600',
  },
];

const ONE_CLICK_APPS = [
  { name: 'Docker Compose', category: 'DevOps', icon: '🐳' },
  { name: 'Ubuntu 24.04', category: 'Linux OS', icon: '🐧' },
  { name: 'Debian 12', category: 'Linux OS', icon: '🌀' },
  { name: 'AlmaLinux 9', category: 'Enterprise OS', icon: '🛡️' },
  { name: 'Nginx Engine', category: 'Web Server', icon: '🚀' },
  { name: 'Node.js LTS', category: 'Runtime', icon: '🟢' },
  { name: 'PostgreSQL', category: 'Database', icon: '🐘' },
  { name: 'Redis Cache', category: 'In-Memory DB', icon: '⚡' },
  { name: 'Next.js App', category: 'Frontend', icon: '▲' },
];

const TYPEWRITER_PHRASES = [
  'Virtual Private Servers',
  'Enterprise Data Centers',
  'Mission-Critical Workloads',
  'Dedicated Cloud Instances',
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
      timeout = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      timeout = setTimeout(() => {}, 300);
    } else {
      const speed = isDeleting ? 38 : 80;
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
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#050816] text-[#152033] dark:text-[#F5F7FF] font-sans selection:bg-blue-600 selection:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* ==============================================================================
          1. SIGNATURE HERO SECTION — GOLDEN RATIO ASYMMETRY (61.8% / 38.2%)
          Inspiration: Nexa AI Solutions Liquid Glass + CiTEC Editorial Composition
          ============================================================================== */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-20 sm:pb-32 border-b border-slate-200/80 dark:border-slate-800/80">
        
        {/* Atmospheric Backlight Orbs */}
        <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-blue-500/10 dark:bg-[#4263FF]/15 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-cyan-400/10 dark:bg-[#52D9FF]/10 rounded-full blur-[140px] pointer-events-none" />
        
        {/* Subtle Mathematical Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111a30_1px,transparent_1px),linear-gradient(to_bottom,#111a30_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_10%,#000_65%,transparent_100%)] opacity-40 dark:opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          {/* Asymmetric 61.8% / 38.2% Grid Guided by the Golden Ratio */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* LEFT: 61.8% Golden Ratio Content Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              
              {/* Refined Pill Badge with Verified Status */}
              <div className="inline-flex items-center gap-2.5 text-xs font-semibold text-blue-700 dark:text-[#52D9FF] bg-blue-50/90 dark:bg-[#111A30]/80 border border-blue-200/80 dark:border-blue-500/30 px-4 py-1.5 rounded-full shadow-xs backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-[#52D9FF]" />
                </span>
                <span className="tracking-wide">Enterprise Infrastructure & Systems Consulting</span>
              </div>

              {/* Editorial Signature Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-950 dark:text-[#F5F7FF]">
                  Technology That Moves <br className="hidden sm:inline" />
                  Your Business Forward.
                </h1>
                
                {/* Dynamic Typewriter Sub-headline */}
                <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-[#A6B0C3] flex items-center justify-center lg:justify-start gap-1 pt-1">
                  <span>Powering scalable</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-[#52D9FF] dark:from-[#52D9FF] dark:to-blue-400 font-bold">
                    {displayText}
                  </span>
                  <span className="inline-block w-1 h-6 bg-blue-600 dark:bg-[#52D9FF] animate-pulse ml-0.5" />
                </p>
              </div>

              {/* Factual Supporting Copy */}
              <p className="text-slate-600 dark:text-[#A6B0C3] text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                From enterprise infrastructure and data center virtualization to system architecture and business technology, Analytical Technical Consulting (ATC) helps organizations build reliable, scalable digital foundations.
              </p>

              {/* Primary & Secondary Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/contact"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Book a Consultation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <a
                  href="#services"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-[#111A30] border border-slate-300 dark:border-slate-700/80 font-bold text-sm tracking-wide text-slate-800 dark:text-[#F5F7FF] hover:bg-slate-50 dark:hover:bg-[#182442] hover:border-slate-400 dark:hover:border-blue-500/50 transition-all text-center shadow-xs cursor-pointer"
                >
                  Explore Our Services
                </a>
              </div>

              {/* Golden Ratio Metric Points */}
              <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  Sub-60s Provisioning
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  Full Root & Hypervisor Control
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  Dedicated IPv4 Included
                </span>
              </div>

            </div>

            {/* RIGHT: 38.2% Golden Ratio Signature Visual (Liquid Glass Sculpture) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-center py-6 sm:py-8">
                <LiquidGlassSphere />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================================
          2. ONE-CLICK STACKS & OS SHOWCASE STRIP
          ============================================================================== */}
      <section className="bg-slate-100/80 dark:bg-[#0A1024] border-b border-slate-200 dark:border-slate-800 py-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-[#A6B0C3] uppercase tracking-wider shrink-0">
              <Layers className="w-4 h-4 text-blue-600 dark:text-[#52D9FF]" />
              <span>Instant 1-Click Stacks & OS:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              {ONE_CLICK_APPS.map((app) => (
                <div 
                  key={app.name} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-750 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-500/80 transition-all shadow-xs"
                >
                  <span>{app.icon}</span>
                  <span>{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================================
          3. CITEC-INSPIRED EDITORIAL SERVICES SECTION
          Refined numbered layout (01, 02, 03, 04) with elegant separators & structured hierarchy
          ============================================================================== */}
      <section id="services" className="py-24 sm:py-32 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#050816] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Editorial Section Header */}
          <div className="max-w-3xl mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-[#52D9FF] uppercase tracking-widest">
              <span>01 / Solutions & Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-[#F5F7FF]">
              Engineered Capabilities for Resilient Enterprise Growth
            </h2>
            <p className="text-slate-600 dark:text-[#A6B0C3] text-base leading-relaxed font-normal">
              ATC delivers disciplined infrastructure consulting, virtualization engineering, and system design tailored for organizations requiring verifiable uptime and rock-solid stability.
            </p>
          </div>

          {/* Numbered Editorial Services Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
            {EDITORIAL_SERVICES.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <div
                  key={service.number}
                  className="group relative bg-[#FAFAF8] dark:bg-[#0A1024] border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-8 sm:p-10 hover:border-blue-500/70 dark:hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-950/10 dark:hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Refined Number & Category */}
                    <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-3xl font-black text-blue-600 dark:text-[#52D9FF]">
                          {service.number}
                        </span>
                        <span className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
                          {service.category}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-700/80 text-blue-600 dark:text-[#52D9FF] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ServiceIcon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Service Title & Detailed Description */}
                    <h3 className="text-2xl font-bold text-slate-950 dark:text-[#F5F7FF] mb-3 group-hover:text-blue-600 dark:group-hover:text-[#52D9FF] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 dark:text-[#A6B0C3] text-sm leading-relaxed mb-6 font-normal">
                      {service.description}
                    </p>

                    {/* Bullet Highlights */}
                    <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium mb-8">
                      {service.points.map((pt, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-[#52D9FF]" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Consultation Action Link */}
                  <div className="pt-5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#52D9FF] group-hover:translate-x-1 transition-transform"
                    >
                      <span>Inquire about this capability</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ==============================================================================
          4. NEXA-INSPIRED ATMOSPHERIC INFRASTRUCTURE SHOWCASE
          Interactive live CLI terminal + Hardware telemetry
          ============================================================================== */}
      <section className="py-24 sm:py-32 bg-[#F0F3F8] dark:bg-[#0A1024] border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300 relative overflow-hidden">
        {/* Soft atmospheric gradient glow */}
        <div className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-blue-600/10 dark:bg-[#4263FF]/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-[#52D9FF] bg-blue-50 dark:bg-[#111A30] border border-blue-200 dark:border-blue-500/30 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" /> Live Hypervisor Telemetry
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-[#F5F7FF] tracking-tight">
              Next-Generation Cloud Architecture
            </h2>
            <p className="text-slate-600 dark:text-[#A6B0C3] text-sm sm:text-base font-normal">
              High-performance compute nodes optimized for continuous developer workloads, mission-critical databases, and automated infrastructure deployments.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT: Interactive Simulated Typewriter Terminal */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Interactive Cloud Provisioning Node
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    SSH: PORT 22
                  </span>
                </div>

                <AnimatedCloudTerminal />
              </div>
            </div>

            {/* RIGHT: Architecture Telemetry Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              
              <div className="bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-[#52D9FF] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-[#F5F7FF]">Enterprise NVMe Storage</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A6B0C3] mt-1 leading-relaxed">
                    Dedicated storage arrays delivering 1,400+ MB/s read speeds and 0.2ms I/O latency for zero database throttling.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-[#F5F7FF]">1 Gbps Dedicated Uplinks</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A6B0C3] mt-1 leading-relaxed">
                    Carrier-neutral redundant backbones with automated DDoS filtering and isolated IPv4 routing.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/50">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-[#F5F7FF]">Uncontended ECC Memory</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A6B0C3] mt-1 leading-relaxed">
                    Error-Correcting Code RAM with strict physical hardware mapping ensures zero noisy neighbor interference.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111A30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-[#52D9FF] flex items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900/50">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-[#F5F7FF]">99% Availability Commitment</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A6B0C3] mt-1 leading-relaxed">
                    Honest target hypervisor availability backed by real-time hardware monitoring and automated health telemetry.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ==============================================================================
          5. PREDICTABLE CLOUD VPS PRICING SECTION
          ============================================================================== */}
      <section className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-[#52D9FF] bg-blue-50 dark:bg-[#111A30] border border-blue-200 dark:border-blue-500/30 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> High Performance Cloud Servers
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-[#F5F7FF] tracking-tight">
            Predictable Cloud Pricing
          </h2>
          <p className="text-slate-600 dark:text-[#A6B0C3] text-sm sm:text-base font-normal">
            Scalable VPS instances backed by enterprise SSD storage arrays, dedicated hardware cores, and rapid provisioning.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-950 dark:text-[#F5F7FF]' : 'text-slate-400'}`}>Monthly</span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full p-1 relative transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Toggle billing cycle"
            >
              <div className={`w-4 h-4 bg-blue-600 dark:bg-[#52D9FF] rounded-full transition-transform ${billingCycle === 'annually' ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-xs font-bold ${billingCycle === 'annually' ? 'text-slate-950 dark:text-[#F5F7FF]' : 'text-slate-400'}`}>
              Annually <span className="text-emerald-700 dark:text-emerald-400 text-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-bold px-2 py-0.5 rounded-full ml-1">Save 15%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const finalPrice = billingCycle === 'annually' ? +(plan.price * 0.85).toFixed(2) : plan.price;

            return (
              <div
                key={plan.name}
                className={`bg-white dark:bg-[#0A1024] rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-1.5 ${
                  plan.popular
                    ? 'border-blue-600 dark:border-[#52D9FF] shadow-2xl shadow-blue-900/10 dark:shadow-blue-500/10 ring-2 ring-blue-600/30 dark:ring-[#52D9FF]/30 md:scale-105 z-10'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                    Most Popular Choice
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-2xl font-black text-slate-950 dark:text-[#F5F7FF]">{plan.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#111A30] text-slate-600 dark:text-[#A6B0C3]">
                      General Purpose
                    </span>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-[#F5F7FF] tracking-tight">${finalPrice.toFixed(2)}</span>
                      <span className="text-slate-500 dark:text-[#A6B0C3] text-xs font-bold"> / month</span>
                    </div>
                    {billingCycle === 'annually' && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Billed annually (${(finalPrice * 12).toFixed(2)}/yr)</p>
                    )}
                  </div>

                  <ul className="space-y-3.5 text-xs text-slate-600 dark:text-[#A6B0C3] font-medium mb-8">
                    <li className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-blue-600 dark:text-[#52D9FF] shrink-0" /> 
                      <span><strong className="text-slate-950 dark:text-[#F5F7FF] font-bold">{plan.cpu}</strong> vCPU Cores</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-[#52D9FF] shrink-0" /> 
                      <span><strong className="text-slate-950 dark:text-[#F5F7FF] font-bold">{plan.ram}</strong> High-Speed Memory</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-blue-600 dark:text-[#52D9FF] shrink-0" /> 
                      <span><strong className="text-slate-950 dark:text-[#F5F7FF] font-bold">{plan.storage}</strong> Enterprise SSD</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-[#52D9FF] shrink-0" /> 
                      <span><strong className="text-slate-950 dark:text-[#F5F7FF] font-bold">{plan.bandwidth}</strong> Premium Traffic</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> 
                      <span>Dedicated IPv4 & Full Root Access</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleConfigure(plan)}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25'
                      : 'bg-slate-100 dark:bg-[#111A30] text-slate-800 dark:text-[#F5F7FF] hover:bg-slate-200 dark:hover:bg-[#182442]'
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

      {/* ==============================================================================
          6. VERIFIED CLIENT FEEDBACK CONTINUOUS MARQUEE
          ============================================================================== */}
      <section className="bg-slate-50/80 dark:bg-[#0A1024] border-t border-slate-200/80 dark:border-slate-800/80 py-20 overflow-hidden relative transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-[#52D9FF] bg-blue-50 dark:bg-[#111A30] border border-blue-200/80 dark:border-blue-500/30 px-3.5 py-1.5 rounded-full mb-3 shadow-xs">
                <span className="font-semibold text-slate-800 dark:text-[#F5F7FF]">Verified Client Experiences</span>
                <div className="flex items-center gap-0.5 text-amber-400 ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-[#F5F7FF] tracking-tight">
                Trusted by Developers & System Administrators
              </h2>
              <p className="text-slate-600 dark:text-[#A6B0C3] text-sm sm:text-base mt-2 max-w-xl font-normal">
                Here’s what engineers and administrators say about their experience with Analytical Technical Consulting infrastructure.
              </p>
            </div>

            {/* Subtle live indicator badge */}
            <div className="hidden sm:inline-flex items-center gap-2 text-xs text-slate-500 dark:text-[#A6B0C3] font-medium bg-white dark:bg-[#111A30] border border-slate-200/80 dark:border-slate-800 px-4 py-2 rounded-xl shadow-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hover card to pause</span>
            </div>
          </div>

          {/* Smooth Continuous Infinite Marquee Track */}
          <div className="relative overflow-hidden py-4 -mx-6 px-6">
            {/* Left & Right Smooth Edge Fade Overlays */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAFAF8] dark:from-[#0A1024] via-[#FAFAF8]/90 dark:via-[#0A1024]/90 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAFAF8] dark:from-[#0A1024] via-[#FAFAF8]/90 dark:via-[#0A1024]/90 to-transparent z-10" />

            <div className="animate-infinite-carousel">
              {[...CLIENT_REVIEWS, ...CLIENT_REVIEWS].map((review, idx) => (
                <div
                  key={idx}
                  className="w-[320px] sm:w-[380px] shrink-0 p-3"
                >
                  <div className="h-full bg-white dark:bg-[#111A30] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-blue-400/80 dark:hover:border-[#52D9FF]/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      {/* 5 Stars */}
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {/* Review text */}
                      <p className="text-slate-700 dark:text-[#A6B0C3] text-xs sm:text-sm leading-relaxed font-normal mb-6">
                        "{review.review}"
                      </p>
                    </div>

                    {/* Author Info */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${review.color} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                      >
                        {review.initials}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F5F7FF] group-hover:text-blue-600 dark:group-hover:text-[#52D9FF] transition-colors">
                          {review.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-[#A6B0C3] font-medium">
                          {review.role}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ==============================================================================
          7. SIGNATURE CONSULTATION CTA BANNER
          ============================================================================== */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-slate-950 via-[#0A1024] to-slate-900 border border-slate-800 rounded-3xl p-10 sm:p-16 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Technical Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none" />

          <div className="space-y-3 relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#52D9FF]">Enterprise IT Consulting</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Need a custom dedicated setup?</h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
              Our engineering team provides tailored server configurations, multi-node private cloud clusters, and direct IT consulting for your business.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-[#4263FF] hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all text-center whitespace-nowrap"
            >
              Contact Infrastructure Team
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
