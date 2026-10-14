import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  HardDrive,
  Layers,
  Zap,
  Shield,
  ShieldCheck,
  Globe,
  Clock,
  Server,
  Tag,
  X,
  Lock,
  RotateCcw,
  Sparkles,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

// Operating System Distro Options
interface OsOption {
  id: string;
  name: string;
  version: string;
  category: 'Linux' | 'Windows';
  fee: number;
  imageId: number;
  badge?: string;
  recommended?: boolean;
}

const OS_OPTIONS: OsOption[] = [
  {
    id: 'ubuntu-24',
    name: 'Ubuntu Server',
    version: '24.04 LTS Noble',
    category: 'Linux',
    fee: 0,
    imageId: 2,
    badge: 'Golden Image',
    recommended: true,
  },
  {
    id: 'ubuntu-22',
    name: 'Ubuntu Server',
    version: '22.04 LTS Jammy',
    category: 'Linux',
    fee: 0,
    imageId: 2,
    badge: 'Stable LTS',
  },
  {
    id: 'debian-12',
    name: 'Debian Linux',
    version: '12 "Bookworm"',
    category: 'Linux',
    fee: 0,
    imageId: 2,
    badge: 'Lightweight',
  },
  {
    id: 'alma-9',
    name: 'AlmaLinux',
    version: '9.4 Enterprise',
    category: 'Linux',
    fee: 0,
    imageId: 2,
    badge: 'RHEL Compatible',
  },
  {
    id: 'rocky-9',
    name: 'Rocky Linux',
    version: '9.4 Production',
    category: 'Linux',
    fee: 0,
    imageId: 2,
    badge: 'Enterprise',
  },
  {
    id: 'win-2022',
    name: 'Windows Server',
    version: '2022 Standard GUI',
    category: 'Windows',
    fee: 10,
    imageId: 2,
    badge: 'GUI Remote Desktop',
  },
];

// Global Datacenter Regions
interface DatacenterLocation {
  id: string;
  name: string;
  regionCode: string;
  flag: string;
  ping: string;
  tier: string;
}

const DATACENTER_LOCATIONS: DatacenterLocation[] = [
  { id: 'us-east', name: 'United States (US East)', regionCode: 'us-east-1', flag: '🇺🇸', ping: '< 18ms', tier: 'Tier III+' },
  { id: 'us-west', name: 'United States (US West)', regionCode: 'us-west-1', flag: '🇺🇸', ping: '< 38ms', tier: 'Tier III+' },
  { id: 'de-fra', name: 'Germany (Frankfurt)', regionCode: 'eu-central-1', flag: '🇩🇪', ping: '< 24ms', tier: 'Tier IV' },
  { id: 'uk-lon', name: 'United Kingdom (London)', regionCode: 'eu-west-2', flag: '🇬🇧', ping: '< 28ms', tier: 'Tier III+' },
  { id: 'es-mad', name: 'Spain (Madrid)', regionCode: 'eu-south-2', flag: '🇪🇸', ping: '< 32ms', tier: 'Tier III+' },
  { id: 'sg-sin', name: 'Singapore (Asia Pacific)', regionCode: 'ap-southeast-1', flag: '🇸🇬', ping: '< 65ms', tier: 'Tier III+' },
];

// Billing Terms with real discount ratios
interface BillingTerm {
  id: string;
  months: number;
  label: string;
  desc: string;
  ratio: number;
  badge?: string;
  popular?: boolean;
}

const BILLING_TERMS: BillingTerm[] = [
  {
    id: '1m',
    months: 1,
    label: 'Monthly',
    desc: 'Pay month-to-month with complete cancellation flexibility',
    ratio: 1.0,
  },
  {
    id: '12m',
    months: 12,
    label: '12 Months (Annual)',
    desc: 'Best balance of value and flexibility with upfront savings',
    ratio: 0.85,
    badge: 'Save 15%',
    popular: true,
  },
  {
    id: '24m',
    months: 24,
    label: '24 Months (2-Year)',
    desc: 'Maximum rate lock guarantee & lowest long-term cost',
    ratio: 0.75,
    badge: 'Save 25% (Best Value)',
  },
];

// Addons with clear features
interface Addon {
  id: string;
  name: string;
  desc: string;
  price: number;
  iconType: 'backup' | 'ip' | 'panel' | 'ddos';
}

const ADDONS: Addon[] = [
  {
    id: 'cloud-backup',
    name: 'Cloud Backup Storage (Acronis)',
    desc: 'Daily automated block-level backup with 1-click restore point rollback',
    price: 3.0,
    iconType: 'backup',
  },
  {
    id: 'extra-ipv4',
    name: 'Dedicated Secondary IPv4 Address',
    desc: 'Clean static IP address with custom PTR and reverse DNS management',
    price: 2.5,
    iconType: 'ip',
  },
  {
    id: 'plesk-obsidian',
    name: 'Plesk Web Admin Control Panel',
    desc: 'Full web hosting management console, supporting up to 10 websites',
    price: 5.0,
    iconType: 'panel',
  },
  {
    id: 'ddos-shield',
    name: 'Enterprise DDoS Shield Pro',
    desc: 'Always-on Layer 3/4/7 automated volumetric DDoS traffic mitigation',
    price: 4.0,
    iconType: 'ddos',
  },
];

export default function ServerConfigure() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve incoming selected plan from Pricing.tsx or use sensible default
  const selectedPlan = location.state?.selectedPlan || {
    planId: 2,
    name: 'VPS Pro',
    cpuCores: 4,
    ramGb: 8,
    storageGb: 120,
    storageType: 'NVMe',
    monthlyPrice: 14.99,
    regularPriceMonthly: 14.99,
    promoPriceMonthly: 12.74,
  };

  // State Management
  const [selectedOs, setSelectedOs] = useState<string>('ubuntu-24');
  const [osCategoryFilter, setOsCategoryFilter] = useState<'All' | 'Linux' | 'Windows'>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('us-east');
  const [selectedTerm, setSelectedTerm] = useState<string>('12m');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Deployment timing & server naming preference (Flexibility for user comfort)
  const [deployPreference, setDeployPreference] = useState<'immediate' | 'later'>('immediate');
  const [hostname, setHostname] = useState<string>(
    `vps-${selectedPlan.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'srv'}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [authChoice, setAuthChoice] = useState<'auto_password' | 'custom_password'>('auto_password');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Toggle Addon
  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Find active selections
  const activeOsObj = OS_OPTIONS.find((os) => os.id === selectedOs) || OS_OPTIONS[0];
  const activeLocationObj = DATACENTER_LOCATIONS.find((l) => l.id === selectedLocation) || DATACENTER_LOCATIONS[0];
  const activeTermObj = BILLING_TERMS.find((t) => t.id === selectedTerm) || BILLING_TERMS[1];

  // Pricing calculations
  const rawBasePrice = Number(selectedPlan.regularPriceMonthly ?? selectedPlan.monthlyPrice ?? 14.99);
  const discountedMonthlyBase = Number((rawBasePrice * activeTermObj.ratio).toFixed(2));
  const osPrice = activeOsObj.fee;

  const addonsPriceTotal = selectedAddons.reduce((sum, addonId) => {
    const item = ADDONS.find((a) => a.id === addonId);
    return sum + (item ? item.price : 0);
  }, 0);

  const subtotalMonthly = discountedMonthlyBase + osPrice + addonsPriceTotal;

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENT') {
      discountAmount = Number(((subtotalMonthly * appliedCoupon.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Number(appliedCoupon.discountValue);
    }
    if (discountAmount > subtotalMonthly) discountAmount = subtotalMonthly;
  }

  const effectiveMonthlyTotal = Math.max(0, Number((subtotalMonthly - discountAmount).toFixed(2)));
  const totalBilledToday = Number((effectiveMonthlyTotal * activeTermObj.months).toFixed(2));
  const totalAnnualSavings = Math.max(0, Number(((rawBasePrice - discountedMonthlyBase) * activeTermObj.months).toFixed(2)));

  // Coupon handlers
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/pricing/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          planId: selectedPlan.planId,
          amount: subtotalMonthly,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setAppliedCoupon(data);
      } else {
        setAppliedCoupon(null);
        setCouponError(data?.error || 'Invalid or expired promo code');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Failed to validate promo code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Proceed to Checkout
  const handleCheckout = () => {
    const cleanHost = hostname.trim() || `srv-vps-${Math.floor(1000 + Math.random() * 9000)}`;
    const configurationOrder = {
      plan: {
        ...selectedPlan,
        monthlyPrice: discountedMonthlyBase,
      },
      os: activeOsObj,
      location: activeLocationObj,
      term: activeTermObj,
      addons: selectedAddons.map((id) => ADDONS.find((a) => a.id === id)),
      appliedCoupon,
      discountAmount,
      monthlyTotal: effectiveMonthlyTotal,
      totalBilledToday,
      deployPreference,
      hostname: cleanHost,
      rootPassword: authChoice === 'custom_password' ? customPassword : '',
      adminUsername: activeOsObj.category === 'Windows' ? 'Administrator' : 'ubuntu',
    };
    navigate('/checkout', { state: { configurationOrder } });
  };

  const filteredOsOptions = OS_OPTIONS.filter((os) => {
    if (osCategoryFilter === 'All') return true;
    return os.category === osCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors">
      
      {/* TOP SUBHEADER & BREADCRUMB BAR */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Back button & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Plans</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                <span>Pricing</span>
                <span>/</span>
                <span className="text-slate-900 dark:text-slate-200 font-bold">Configure Instance</span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
                <span className="hidden sm:inline">1. Plan Selection</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/60 shadow-xs">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <span>Configuration</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">→</span>
              <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                <span className="hidden sm:inline">Checkout & Deploy</span>
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Page Title & Intro */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Performance Cloud Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Configure Your Virtual Server
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fine-tune your operating system, global deployment location, and automated provisioning schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONFIGURATION COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. PLAN SUMMARY CARD */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-cyan-500/10 dark:from-blue-600/10 dark:to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/60">
                      Selected Base Plan
                    </span>
                    {selectedPlan.tag && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                        {selectedPlan.tag}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white mt-1.5 flex items-center gap-2">
                    <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span>{selectedPlan.name}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <div className="flex items-baseline sm:justify-end gap-1">
                      <span className="text-3xl font-black text-slate-950 dark:text-white">
                        ${discountedMonthlyBase}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/mo</span>
                    </div>
                    {activeTermObj.ratio < 1 && (
                      <span className="text-[11px] line-through text-slate-400 font-semibold block">
                        ${rawBasePrice.toFixed(2)} /mo standard
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                    title="Change base tier"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Change</span>
                  </button>
                </div>
              </div>

              {/* Hardware Spec Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-xs font-medium mb-1">
                    <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Compute</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedPlan.cpuCores} vCPU Cores
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dedicated Threading</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-xs font-medium mb-1">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Memory</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedPlan.ramGb} GB RAM
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">High-Speed DDR4/DDR5</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-xs font-medium mb-1">
                    <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Storage</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedPlan.storageGb} GB {selectedPlan.storageType || 'NVMe'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Enterprise SSD RAID-10</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-xs font-medium mb-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Network</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    1 Gbps Unmetered
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">1x Static Public IPv4</span>
                </div>
              </div>
            </section>

            {/* 2. OPERATING SYSTEM SELECTION */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-black">
                      1
                    </span>
                    <span>Select Operating System</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Clean, official pre-configured cloud images optimized for virtualization.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto">
                  {(['All', 'Linux', 'Windows'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setOsCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        osCategoryFilter === cat
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredOsOptions.map((os) => {
                  const isSelected = selectedOs === os.id;
                  return (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => setSelectedOs(os.id)}
                      className={`relative flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/80 dark:ring-blue-500/80 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* OS Distro Badge Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                            os.category === 'Windows'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {os.category === 'Windows' ? '🪟' : os.id.includes('ubuntu') ? '🐧' : os.id.includes('debian') ? '🌀' : '🛡️'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{os.name}</p>
                            {os.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {os.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{os.version}</p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2.5">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            os.fee === 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {os.fee === 0 ? 'Free' : `+$${os.fee}/mo`}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. DATACENTER REGION */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  <span>Select Datacenter Region</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose a location closest to your target audience for minimal network latency and peak throughput.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {DATACENTER_LOCATIONS.map((loc) => {
                  const isSelected = selectedLocation === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSelectedLocation(loc.id)}
                      className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/80 dark:ring-blue-500/80 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{loc.flag}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{loc.ping}</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{loc.name}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                        <span>{loc.regionCode}</span>
                        <span>{loc.tier}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. BILLING CYCLE / CONTRACT TERM */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-black">
                    3
                  </span>
                  <span>Contract Term & Discount</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Commit to a longer term to lock in significant recurring savings on compute and bandwidth.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BILLING_TERMS.map((term) => {
                  const isSelected = selectedTerm === term.id;
                  const termMonthly = (rawBasePrice * term.ratio).toFixed(2);
                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedTerm(term.id)}
                      className={`relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/80 dark:ring-blue-500/80 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {term.badge && (
                        <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                          {term.badge}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-extrabold text-slate-950 dark:text-white">{term.label}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{term.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-black text-slate-950 dark:text-white">${termMonthly}</span>
                          <span className="text-[11px] text-slate-400">/mo</span>
                        </div>
                        {term.ratio < 1 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Save {Math.round((1 - term.ratio) * 100)}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 5. PROVISIONING TIMING & SERVER CREDENTIALS (USER FLEXIBILITY) */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-black">
                    4
                  </span>
                  <span>Provisioning Timing & Server Setup</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose whether to deploy your instance instantly or hold it in inventory to launch whenever you are ready.
                </p>
              </div>

              {/* Timing Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setDeployPreference('immediate')}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    deployPreference === 'immediate'
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/80 dark:ring-blue-500/80'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    {deployPreference === 'immediate' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Deploy Immediately</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Auto-launch VM into your dashboard in ~60 seconds upon successful checkout.
                  </p>
                </div>

                <div
                  onClick={() => setDeployPreference('later')}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    deployPreference === 'later'
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/80 dark:ring-blue-500/80'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    {deployPreference === 'later' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Deploy Later (Self-Deploy)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Reserve plan & park slot in your account. Spin up anytime when you are free.
                  </p>
                </div>
              </div>

              {/* Server Hostname & Auth Setup */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Server Hostname (Optional)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="e.g. web-srv-01"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-colors"
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono ml-2 hidden sm:inline">
                      .atech-vps.net
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Administrator Authentication
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      authChoice === 'auto_password'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="authChoice"
                        checked={authChoice === 'auto_password'}
                        onChange={() => setAuthChoice('auto_password')}
                        className="accent-blue-600"
                      />
                      <span>Auto-generate secure root password</span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      authChoice === 'custom_password'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="authChoice"
                        checked={authChoice === 'custom_password'}
                        onChange={() => setAuthChoice('custom_password')}
                        className="accent-blue-600"
                      />
                      <span>Set custom root password</span>
                    </label>
                  </div>

                  {authChoice === 'custom_password' && (
                    <div className="mt-3 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Enter strong root password (min. 8 characters)"
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 6. OPTIONAL ADD-ONS & SECURITY */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-black">
                    5
                  </span>
                  <span>Optional Features & Security Add-Ons</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Empower your server with automated backup recovery, additional public IPs, and enterprise management.
                </p>
              </div>

              <div className="space-y-3">
                {ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600/80 dark:ring-blue-500/80 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                        />
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                          {addon.iconType === 'backup' && <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                          {addon.iconType === 'ip' && <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                          {addon.iconType === 'panel' && <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                          {addon.iconType === 'ddos' && <Shield className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{addon.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{addon.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white shrink-0 ml-4">
                        +${addon.price.toFixed(2)}/mo
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl sticky top-24 space-y-6 transition-all">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  Encrypted
                </span>
              </div>

              {/* Item Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{selectedPlan.name} ({activeTermObj.label})</span>
                  <span className="font-bold text-slate-900 dark:text-white">${discountedMonthlyBase.toFixed(2)}/mo</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">OS: {activeOsObj.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {osPrice === 0 ? 'Included' : `+$${osPrice.toFixed(2)}/mo`}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Region: {activeLocationObj.name.split('(')[0].trim()}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Tier III+</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Deployment</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {deployPreference === 'immediate' ? 'Instant Auto-Deploy' : 'Hold in Inventory'}
                  </span>
                </div>

                {/* Add-ons List */}
                {selectedAddons.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Active Add-ons
                    </span>
                    {selectedAddons.map((id) => {
                      const item = ADDONS.find((a) => a.id === id);
                      return item ? (
                        <div key={id} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span className="truncate pr-2">{item.name}</span>
                          <span className="font-bold text-slate-900 dark:text-white shrink-0">+${item.price.toFixed(2)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Applied Promo Code */}
                {appliedCoupon && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon: {appliedCoupon.code}</span>
                    </div>
                    <span>-${discountAmount.toFixed(2)}/mo</span>
                  </div>
                )}
              </div>

              {/* Promo Code Input Box */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        {appliedCoupon.code} applied! ({appliedCoupon.discountType === 'PERCENT' ? `${appliedCoupon.discountValue}% off` : `$${appliedCoupon.discountValue} off`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md cursor-pointer"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo or voucher code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3.5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Monthly Equivalent</span>
                    {totalAnnualSavings > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Save ${totalAnnualSavings.toFixed(2)} on term
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <span className="text-xs line-through text-slate-400 font-semibold mr-2 block">
                        ${subtotalMonthly.toFixed(2)}
                      </span>
                    )}
                    <span className="text-3xl font-black text-slate-950 dark:text-white">
                      ${effectiveMonthlyTotal.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/mo</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Total Billed Today ({activeTermObj.months} {activeTermObj.months === 1 ? 'Month' : 'Months'}):
                  </span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ${totalBilledToday.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Button: Proceed to Checkout */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Continue to Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Guarantees & Trust Features */}
              <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    ✓
                  </span>
                  <span>30-Day Money-Back Guarantee</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    ✓
                  </span>
                  <span>Instant Cluster Deployment (~60s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                    ✓
                  </span>
                  <span>24/7/365 Tier-3 Expert Support</span>
                </li>
              </ul>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}