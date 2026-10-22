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
  HardDrive,
  Network,
  Gauge,
  ChevronUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchVpsPlans } from '../services/pricingApi';
import AnimatedCloudTerminal from '../components/AnimatedCloudTerminal';

// Nexa Visual Assets
import nexaSphereImg from '../assets/nexa_liquid_sphere.jpg';
import nexaCloudsImg from '../assets/nexa_atmospheric_clouds.jpg';
import datacenterBgImg from '../assets/datacenter_infrastructure_bg.jpg';
import serverRacksImg from '../assets/datacenter_server_racks.jpg';
import fiberNetworkImg from '../assets/bg_fiber_network.jpg';
import serverHallImg from '../assets/bg_server_hall.jpg';
import serverHardwareImg from '../assets/bg_server_hardware.jpg';
import nocRoomImg from '../assets/bg_noc_room.jpg';

// Reusable high-resolution infrastructure background layer with edge fades for seamless section blending
function SectionBg({ src, opacity = 0.55, position = 'center' }: { src: string; opacity?: number; position?: string }) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity, objectPosition: position }}
      />
      {/* Top & bottom fades so sections blend into each other */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#030611] via-transparent to-[#030611]" />
      {/* Soft readability veil */}
      <div className="absolute inset-0 pointer-events-none bg-[#030611]/35" />
    </>
  );
}

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

const NEXA_SERVICES = [
  {
    id: '01',
    title: 'Enterprise ERP & Systems',
    subtitle: 'Mission-Critical Workloads',
    description:
      'High-performance database clustering, ERP migrations, and custom enterprise workflow topologies engineered for uninterrupted operational scale.',
    icon: Database,
    accent: 'from-blue-500 to-indigo-600',
  },
  {
    id: '02',
    title: 'Data Center Virtualization',
    subtitle: 'Next-Gen Hypervisors',
    description:
      'Dedicated private cloud instances with pure enterprise SSD arrays, automated backup routines, and hardware-isolated multi-tenant security.',
    icon: Server,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    id: '03',
    title: 'System Architecture & Security',
    subtitle: 'Zero-Trust Defense',
    description:
      'Systematic boundary defense, isolated virtual networks, custom firewall filtering, and comprehensive security auditing aligned with strict compliance.',
    icon: ShieldCheck,
    accent: 'from-indigo-500 to-purple-600',
  },
  {
    id: '04',
    title: 'Hardware Sizing & Tuning',
    subtitle: 'Maximum NVMe Throughput',
    description:
      'Precision bare-metal profiling and active resource scheduling to eliminate CPU throttling and guarantee low-latency storage I/O under peak load.',
    icon: Cpu,
    accent: 'from-sky-400 to-blue-500',
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

export default function Home() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [plans, setPlans] = useState<any[]>(DEFAULT_HOME_PLANS);
  const [activeHeroPill, setActiveHeroPill] = useState<number>(0);

  // Load plans from API if available
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
        console.warn('Using default plans:', err?.message);
      });
  }, []);

  const handleConfigure = (plan: any) => {
    navigate('/configure', { state: { selectedPlan: plan } });
  };

  const heroPills = [
    { label: 'Cloud Infrastructure & VPS', desc: 'Instant sub-60s NVMe deployments' },
    { label: 'Data Center Virtualization', desc: 'Hardware-isolated private cloud' },
    { label: 'System Architecture & Security', desc: 'Zero-trust network segmentation' },
  ];

  return (
    <div className="min-h-screen bg-[#030611] text-[#F5F7FF] font-sans selection:bg-cyan-500 selection:text-black transition-colors duration-500 overflow-x-hidden relative">
      
      {/* Background Cybernetic Matrix & Subtle Data Center Floor Grid */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#0c1a35_1px,transparent_1px),linear-gradient(to_bottom,#0c1a35_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 z-0" />

      {/* ==============================================================================
          1. 100% NEXA-INSPIRED SIGNATURE HERO SECTION
          Composition directly modeled from reference:
          - Deep obsidian canvas with atmospheric organic cloud framing
          - Centered brand label: "Analytical Technical Consulting"
          - Large elegant headline: "Craft Your Infrastructure"
          - Massive central 3D liquid-glass sphere with electric blue liquid swirls
          - Floating curved pill stack connected via organic bezier lines
          - Bottom-right callout: "Solve your tasks and speed up deployments by 99% ^"
          ============================================================================== */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-24 sm:pb-32 border-b border-white/10 bg-[#030611] z-10">
        
        {/* High-Tech Enterprise Data Center Infrastructure Background Layer */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-40 bg-cover bg-center transition-opacity duration-700 mix-blend-luminosity scale-105"
          style={{ backgroundImage: `url(${datacenterBgImg})` }}
        />
        {/* Soft Vignette Mask for Data Center Layer so text and sphere pop out crisp */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#030611]/90 via-transparent to-[#030611]" />

        {/* Atmospheric Organic Clouds Framing Layer (From Nexa Reference) */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-45 dark:opacity-80 mix-blend-screen bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${nexaCloudsImg})` }}
        />

        {/* Ambient Electric-Blue Deep Space Bloom */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#4263FF]/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#55DFFF]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center">
          
          {/* Centered Brand Intro Label (Nexa: "Nexa AI Solutions") */}
          <div className="text-center space-y-3 mb-6">
            <span className="text-xs sm:text-sm font-medium tracking-[0.25em] text-[#A4AEC3] uppercase flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Analytical Technical Consulting
            </span>
            
            {/* Centered Large Headline (Nexa: "Craft Your Intelligence") */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-[#F5F7FF] leading-[1.08] max-w-4xl mx-auto">
              Craft Your <span className="font-semibold text-white drop-shadow-[0_0_35px_rgba(85,223,255,0.3)]">Infrastructure</span>
            </h1>
            
            <p className="text-[#A4AEC3] text-sm sm:text-base max-w-xl mx-auto font-normal pt-1">
              Enterprise technology, cloud virtualization, and high-performance server architectures engineered around your production workloads.
            </p>
          </div>

          {/* Central Nexa Visual Stage: 3D Liquid-Glass Sphere + Floating Connected Pills */}
          <div className="relative w-full max-w-5xl my-6 sm:my-10 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[520px]">
            
            {/* Massive Central 3D Liquid-Glass Sphere */}
            <div className="relative w-[320px] sm:w-[460px] md:w-[500px] aspect-square rounded-full flex items-center justify-center group">
              
              {/* Outer Radial Glow */}
              <div className="absolute inset-0 rounded-full bg-[#4263FF]/30 blur-3xl transform scale-110 pointer-events-none animate-pulse" />
              
              {/* The Photorealistic 3D Liquid Glass Sphere Image */}
              <img
                src={nexaSphereImg}
                alt="Nexa 3D Liquid Glass Sphere"
                className="relative w-full h-full object-cover rounded-full shadow-2xl shadow-blue-500/25 border border-white/15 select-none pointer-events-none transition-transform duration-700 group-hover:scale-102"
              />

              {/* Specular Glint Highlight Animation */}
              <div className="absolute top-[18%] left-[24%] w-16 sm:w-24 h-8 sm:h-12 rounded-full bg-white/40 blur-md rotate-[-25deg] pointer-events-none" />
            </div>

            {/* Floating Interactive Pill Badges (Positioned to the Right of Sphere, Exactly Like Nexa Reference) */}
            <div className="lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:right-4 xl:right-10 flex flex-col gap-3 mt-8 lg:mt-0 z-20 w-full sm:w-auto items-center lg:items-start">
              
              {/* Connecting Organic Line (SVG Bezier Path visible on desktop) */}
              <svg 
                className="hidden lg:block absolute -left-28 top-8 w-28 h-28 pointer-events-none text-[#55DFFF]/50" 
                viewBox="0 0 110 110" 
                fill="none"
              >
                <path 
                  d="M 0 55 C 45 55, 65 20, 110 20" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeDasharray="3 3"
                />
                <circle cx="110" cy="20" r="3.5" fill="#55DFFF" />
              </svg>

              {heroPills.map((pill, idx) => {
                const isActive = activeHeroPill === idx;
                return (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => setActiveHeroPill(idx)}
                    onMouseEnter={() => setActiveHeroPill(idx)}
                    className={`px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer text-left shadow-lg ${
                      isActive
                        ? 'bg-white text-slate-950 scale-105 shadow-xl shadow-cyan-400/25 ring-2 ring-cyan-400'
                        : 'bg-[#070D1D]/85 text-[#A4AEC3] hover:text-white border border-white/10 backdrop-blur-md hover:border-cyan-400/60'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Nexa Bottom-Right Metric Callout ("Solve your tasks and speed up processes by 99% ^") */}
            <div className="lg:absolute lg:bottom-4 lg:right-4 xl:right-12 mt-8 lg:mt-0 text-center lg:text-right space-y-1">
              <p className="text-xs text-[#A4AEC3] font-medium max-w-[210px] leading-snug mx-auto lg:ml-auto">
                Accelerate deployments and scale infrastructure by
              </p>
              <div className="flex items-center justify-center lg:justify-end gap-1 text-3xl sm:text-4xl font-extrabold text-[#55DFFF] drop-shadow-[0_0_15px_rgba(85,223,255,0.4)]">
                <span>99%</span>
                <ChevronUp className="w-6 h-6 stroke-[3]" />
              </div>
            </div>

          </div>

          {/* Action Row: CTAs & Trust Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/contact"
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-102 transition-all flex items-center gap-2"
            >
              <span>Book a Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              to="/pricing"
              className="px-8 py-3.5 bg-[#0C1428]/90 text-[#F5F7FF] border border-white/15 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#111A30] hover:border-cyan-400/50 transition-all shadow-md"
            >
              View Cloud VPS Plans
            </Link>
          </div>

        </div>
      </section>

      {/* ==============================================================================
          2. ONE-CLICK OS & DEVOPS SHOWCASE STRIP
          ============================================================================== */}
      <section className="bg-[#050B18] border-b border-white/10 py-10 relative z-10 overflow-hidden">
        <img
          src={fiberNetworkImg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-60"
          style={{ objectPosition: 'center 55%' }}
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#030611]/95 via-[#030611]/60 to-[#030611]/30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[#A4AEC3] uppercase tracking-wider shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-1" />
              <Layers className="w-4 h-4 text-[#55DFFF]" />
              <span>Instant 1-Click Stacks & OS:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              {ONE_CLICK_APPS.map((app) => (
                <div 
                  key={app.name} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C152B]/90 border border-white/10 hover:border-cyan-400/60 text-xs font-medium text-[#F5F7FF] hover:text-cyan-300 transition-all shadow-md shadow-black/40 hover:-translate-y-0.5"
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
          3. 100% NEXA-INSPIRED SERVICES SECTION
          Dark atmospheric cards, electric-blue lighting, clean minimalist composition
          ============================================================================== */}
      <section id="services" className="py-24 sm:py-32 border-b border-white/10 bg-[#030611] relative z-10 overflow-hidden">
        
        {/* High-resolution hyperscale data center hall background */}
        <SectionBg src={serverHallImg} opacity={0.6} />

        {/* Soft atmospheric blue glow */}
        <div className="absolute top-1/2 left-0 w-[550px] h-[550px] bg-[#4263FF]/15 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="max-w-2xl mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#55DFFF] flex items-center gap-2">
              <span className="w-2 h-0.5 bg-[#55DFFF]" /> Core Specializations
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-[#F5F7FF] tracking-tight">
              Enterprise Technology <br />
              <span className="font-semibold text-white drop-shadow-[0_0_25px_rgba(85,223,255,0.25)]">Built for High Resilience</span>
            </h2>
            <p className="text-[#A4AEC3] text-sm sm:text-base leading-relaxed">
              Analytical Technical Consulting (ATC) engineers reliable digital foundations—spanning cloud virtualization, system architecture, database clusters, and hardware performance tuning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {NEXA_SERVICES.map((srv) => {
              const IconComp = srv.icon;
              return (
                <div
                  key={srv.id}
                  className="group relative bg-[#070D1D]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 hover:border-[#55DFFF]/60 hover:shadow-2xl hover:shadow-blue-500/15 hover:-translate-y-1.5 transition-all duration-400 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/5">
                      <span className="font-mono text-sm font-bold text-[#55DFFF]">
                        {srv.id} // {srv.subtitle}
                      </span>
                      <div className="w-11 h-11 rounded-2xl bg-[#0C1428] border border-white/10 text-[#55DFFF] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white transition-all duration-300">
                        <IconComp className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#55DFFF] transition-colors">
                      {srv.title}
                    </h3>
                    
                    <p className="text-[#A4AEC3] text-sm leading-relaxed mb-6 font-normal">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#55DFFF] group-hover:translate-x-1.5 transition-transform"
                    >
                      <span>Inquire about this service</span>
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
          4. INTERACTIVE ATMOSPHERIC INFRASTRUCTURE SHOWCASE
          ============================================================================== */}
      <section className="py-24 sm:py-32 bg-[#050B18] border-b border-white/10 relative z-10 overflow-hidden">
        
        {/* High-resolution server hardware macro background */}
        <SectionBg src={serverHardwareImg} opacity={0.55} />

        {/* Soft atmospheric gradient glow */}
        <div className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-[#4263FF]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#55DFFF] bg-[#0C1428] border border-white/10 px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Live Cloud Node Provisioning
            </div>
            <h2 className="text-3xl sm:text-5xl font-light text-[#F5F7FF] tracking-tight">
              Next-Generation <span className="font-semibold text-white drop-shadow-[0_0_25px_rgba(85,223,255,0.25)]">Cloud Architecture</span>
            </h2>
            <p className="text-[#A4AEC3] text-sm sm:text-base font-normal">
              High-performance compute nodes optimized for continuous developer workloads, mission-critical databases, and automated infrastructure deployments.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT: Interactive Simulated Typewriter Terminal */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="bg-[#070D1D]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Interactive Hypervisor CLI Session
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                    SSH: PORT 22
                  </span>
                </div>

                <AnimatedCloudTerminal />
              </div>
            </div>

            {/* RIGHT: Architecture Telemetry Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              
              <div className="bg-[#0C1428]/90 border border-white/10 hover:border-cyan-400/50 rounded-2xl p-5 shadow-lg transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-950/70 text-[#55DFFF] flex items-center justify-center shrink-0 border border-blue-800/60 shadow-inner">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F7FF]">Enterprise NVMe Storage</h4>
                  <p className="text-xs text-[#A4AEC3] mt-1 leading-relaxed">
                    Dedicated storage arrays delivering 1,400+ MB/s read speeds and 0.2ms I/O latency for zero database throttling.
                  </p>
                </div>
              </div>

              <div className="bg-[#0C1428]/90 border border-white/10 hover:border-emerald-400/50 rounded-2xl p-5 shadow-lg transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/70 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/60 shadow-inner">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F7FF]">1 Gbps Dedicated Uplinks</h4>
                  <p className="text-xs text-[#A4AEC3] mt-1 leading-relaxed">
                    Carrier-neutral redundant backbones with automated DDoS filtering and isolated IPv4 routing.
                  </p>
                </div>
              </div>

              <div className="bg-[#0C1428]/90 border border-white/10 hover:border-purple-400/50 rounded-2xl p-5 shadow-lg transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-950/70 text-purple-400 flex items-center justify-center shrink-0 border border-purple-800/60 shadow-inner">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F7FF]">Uncontended ECC Memory</h4>
                  <p className="text-xs text-[#A4AEC3] mt-1 leading-relaxed">
                    Error-Correcting Code RAM with strict physical hardware mapping ensures zero noisy neighbor interference.
                  </p>
                </div>
              </div>

              <div className="bg-[#0C1428]/90 border border-white/10 hover:border-cyan-400/50 rounded-2xl p-5 shadow-lg transition-all flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/70 text-[#55DFFF] flex items-center justify-center shrink-0 border border-cyan-800/60 shadow-inner">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5F7FF]">99% Availability Commitment</h4>
                  <p className="text-xs text-[#A4AEC3] mt-1 leading-relaxed">
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
      <section className="py-24 sm:py-32 bg-[#030611] relative z-10 border-b border-white/10 overflow-hidden">
        
        {/* High-resolution enterprise server rack blades background */}
        <SectionBg src={serverRacksImg} opacity={0.5} />
        
        {/* Ambient glow behind cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55DFFF] bg-[#0C1428] border border-white/10 px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> High Performance Cloud Servers
            </div>
            <h2 className="text-3xl sm:text-5xl font-light text-[#F5F7FF] tracking-tight">
              Predictable <span className="font-semibold text-white drop-shadow-[0_0_25px_rgba(85,223,255,0.25)]">Cloud Pricing</span>
            </h2>
            <p className="text-[#A4AEC3] text-sm sm:text-base font-normal">
              Scalable VPS instances backed by enterprise SSD storage arrays, dedicated hardware cores, and rapid provisioning.
            </p>

            {/* Billing Switcher Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                className="w-12 h-6 bg-[#0C1428] border border-white/20 rounded-full p-1 relative transition-colors focus:outline-hidden cursor-pointer"
                aria-label="Toggle billing cycle"
              >
                <div className={`w-4 h-4 bg-[#55DFFF] shadow-[0_0_8px_#55DFFF] rounded-full transition-transform ${billingCycle === 'annually' ? 'translate-x-6' : ''}`} />
              </button>
              <span className={`text-xs font-bold ${billingCycle === 'annually' ? 'text-white' : 'text-slate-500'}`}>
                Annually <span className="text-emerald-400 text-[10px] bg-emerald-950/60 border border-emerald-800 font-bold px-2 py-0.5 rounded-full ml-1">Save 15%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const finalPrice = billingCycle === 'annually' ? +(plan.price * 0.85).toFixed(2) : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-1.5 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-[#091533] to-[#070D1D] border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 ring-4 ring-cyan-500/15 md:scale-105 z-10'
                      : 'bg-[#070D1D]/90 backdrop-blur-2xl border-white/10 hover:border-white/25 shadow-xl'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg shadow-cyan-500/30">
                      Most Popular Choice
                    </span>
                  )}

                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0C1428] border border-white/10 text-[#A4AEC3]">
                        General Purpose
                      </span>
                    </div>

                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">${finalPrice.toFixed(2)}</span>
                        <span className="text-[#A4AEC3] text-xs font-bold"> / month</span>
                      </div>
                      {billingCycle === 'annually' && (
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1">Billed annually (${(finalPrice * 12).toFixed(2)}/yr)</p>
                      )}
                    </div>

                    <ul className="space-y-3.5 text-xs text-[#A4AEC3] font-medium mb-8">
                      <li className="flex items-center gap-3">
                        <Cpu className="w-4 h-4 text-[#55DFFF] shrink-0" /> 
                        <span><strong className="text-white font-bold">{plan.cpu}</strong> vCPU Cores</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-[#55DFFF] shrink-0" /> 
                        <span><strong className="text-white font-bold">{plan.ram}</strong> High-Speed Memory</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-[#55DFFF] shrink-0" /> 
                        <span><strong className="text-white font-bold">{plan.storage}</strong> Enterprise SSD</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-[#55DFFF] shrink-0" /> 
                        <span><strong className="text-white font-bold">{plan.bandwidth}</strong> Premium Traffic</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> 
                        <span>Dedicated IPv4 & Full Root Access</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfigure(plan)}
                    className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-[#0C1428] text-white border border-white/10 hover:bg-[#111A30] hover:border-cyan-400/50'
                    }`}
                  >
                    <span>Configure Server</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==============================================================================
          6. VERIFIED CLIENT FEEDBACK CONTINUOUS MARQUEE
          ============================================================================== */}
      <section className="bg-[#050B18] border-t border-white/10 py-20 overflow-hidden relative z-10">
        {/* High-resolution network operations center background */}
        <SectionBg src={nocRoomImg} opacity={0.55} position="center right" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#55DFFF] bg-[#0C1428] border border-white/10 px-3.5 py-1.5 rounded-full mb-3 shadow-md">
                <span className="font-semibold text-white">Verified Client Experiences</span>
                <div className="flex items-center gap-0.5 text-amber-400 ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-[#F5F7FF] tracking-tight">
                Trusted by Developers & <span className="font-semibold text-white drop-shadow-[0_0_25px_rgba(85,223,255,0.25)]">System Administrators</span>
              </h2>
              <p className="text-[#A4AEC3] text-sm sm:text-base mt-2 max-w-xl font-normal">
                Here’s what engineers and administrators say about their experience with Analytical Technical Consulting infrastructure.
              </p>
            </div>

            <div className="hidden sm:inline-flex items-center gap-2 text-xs text-[#A4AEC3] font-medium bg-[#0C1428] border border-white/10 px-4 py-2 rounded-xl shadow-md shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hover card to pause</span>
            </div>
          </div>

          <div className="relative overflow-hidden py-4 -mx-6 px-6">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#050B18] via-[#050B18]/90 to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#050B18] via-[#050B18]/90 to-transparent z-10" />

            <div className="animate-infinite-carousel">
              {[...CLIENT_REVIEWS, ...CLIENT_REVIEWS].map((review, idx) => (
                <div
                  key={idx}
                  className="w-[320px] sm:w-[380px] shrink-0 p-3"
                >
                  <div className="h-full bg-[#070D1D]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:border-[#55DFFF]/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      <p className="text-[#A4AEC3] text-xs sm:text-sm leading-relaxed font-normal mb-6">
                        "{review.review}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${review.color} text-white font-bold text-xs flex items-center justify-center shadow-md shrink-0`}
                      >
                        {review.initials}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#55DFFF] transition-colors">
                          {review.name}
                        </h4>
                        <p className="text-[11px] text-[#A4AEC3] font-medium">
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
          7. NEXA-STYLE SIGNATURE CONSULTATION BANNER
          ============================================================================== */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="bg-gradient-to-r from-[#030611] via-[#081229] to-[#030611] border border-cyan-500/30 rounded-3xl p-10 sm:p-16 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
          
          {/* High-resolution data center corridor inside the CTA card */}
          <img
            src={datacenterBgImg}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-50"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#030611]/95 via-[#030611]/70 to-[#030611]/30" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35 pointer-events-none" />

          <div className="space-y-3 relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#55DFFF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Enterprise IT Consulting
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
              Ready to <span className="font-semibold text-white drop-shadow-[0_0_25px_rgba(85,223,255,0.3)]">Build Beyond the Ordinary?</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
              Our engineering team provides tailored server configurations, multi-node private cloud clusters, and direct IT consulting for your business.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/contact"
              className="px-8 py-4 rounded-full bg-white text-slate-950 hover:bg-cyan-50 hover:text-blue-600 font-bold text-xs uppercase tracking-wider shadow-lg shadow-white/10 hover:shadow-cyan-400/30 transition-all text-center whitespace-nowrap"
            >
              Let's talk
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
