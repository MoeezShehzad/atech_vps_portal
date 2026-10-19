import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tag, Check, X, ShieldAlert, AlertCircle, Zap, Search, Server, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';

// Data Structures for IONOS-Style Options
const OS_OPTIONS = [
  { id: 'ubuntu-22', name: 'Ubuntu 22.04 LTS', category: 'Linux', icon: '🐧', fee: 0, imageId: 2 },
  { id: 'debian-12', name: 'Debian 12', category: 'Linux', icon: '🌀', fee: 0, imageId: 2 },
  { id: 'alma-9', name: 'AlmaLinux 9', category: 'Linux', icon: '💿', fee: 0, imageId: 2 },
  { id: 'rocky-9', name: 'Rocky Linux 9', category: 'Linux', icon: '⛰️', fee: 0, imageId: 2 },
  { id: 'win-2022', name: 'Windows Server 2022', category: 'Windows', icon: '🪟', fee: 10, imageId: 2 },
];

const DATACENTER_LOCATIONS = [
  { id: 'us-central', name: 'Illinois, United States (US Central)', flag: '🇺🇸' },
];

const BILLING_TERMS = [
  { id: '1m', label: '1 Month', desc: 'Flexible monthly billing, cancel anytime', monthlyPriceRatio: 1.0, discountText: '', nonRefundable: true },
  { id: '12m', label: '12 Months (1 Year)', desc: 'Billed full year upfront with 15% savings.', monthlyPriceRatio: 0.85, discountText: 'Save 15%', nonRefundable: true },
  { id: '24m', label: '24 Months (2 Years)', desc: 'Best multi-year value with 25% savings.', monthlyPriceRatio: 0.75, discountText: 'Save 25%', nonRefundable: true },
];

const ADDONS: { id: string; name: string; desc: string; price: number }[] = [];

export default function ServerConfigure() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get passed plan from Pricing.tsx or use default
  const selectedPlan = location.state?.selectedPlan || {
    planId: 2,
    name: 'VPS L+',
    cpuCores: 6,
    ramGb: 8,
    storageGb: 240,
    storageType: 'SSD',
    monthlyPrice: 21,
    promoPriceMonthly: 6,
  };

  const isUpgrade = Boolean(location.state?.isUpgrade);

  // State Management
  const [selectedOs, setSelectedOs] = useState('ubuntu-22');
  const [selectedLocation, setSelectedLocation] = useState('us-central');
  const [selectedTerm, setSelectedTerm] = useState('12m');
  const [selectedAddons] = useState<string[]>([]);

  // 1-Click Apps Selection during checkout
  const [imageType, setImageType] = useState<'os' | 'apps'>('os');
  const [catalogApps, setCatalogApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [appSearch, setAppSearch] = useState('');

  useEffect(() => {
    apiCall('/apps')
      .then((data) => {
        if (data?.apps) setCatalogApps(data.apps);
      })
      .catch(() => {});
  }, []);

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Calculations
  const activeOsObj = OS_OPTIONS.find((os) => os.id === selectedOs);
  const activeTermObj = BILLING_TERMS.find((t) => t.id === selectedTerm);
  const selectedAppObj = catalogApps.find((a) => a.id === selectedAppId);

  const isYearly = selectedTerm === '12m';
  const isMultiYear = selectedTerm === '24m';
  const termMonths = isYearly ? 12 : (isMultiYear ? 24 : 1);
  const isNonRefundable = true;

  const basePriceMonthly =
    Number(
      selectedTerm === '1m'
        ? (selectedPlan.monthlyPrice ?? selectedPlan.price ?? 6)
        : selectedTerm === '24m'
          ? Number(((selectedPlan.monthlyPrice ?? selectedPlan.price ?? 6) * 0.75).toFixed(2))
          : (selectedPlan.promoPriceMonthly ?? Number(((selectedPlan.monthlyPrice ?? selectedPlan.price ?? 6) * 0.85).toFixed(2)))
    ) || 0;

  const osPrice = activeOsObj?.fee || 0;

  const addonsPriceTotal = selectedAddons.reduce((sum, addonId) => {
    const item = ADDONS.find((a) => a.id === addonId);
    return sum + (item ? item.price : 0);
  }, 0);

  // Effective monthly subtotal (plan + OS + addons)
  const monthlySubtotal = basePriceMonthly + osPrice + addonsPriceTotal;

  // Full contract term standard subtotal (12 months upfront for yearly)
  const fullTermSubtotal = Number((monthlySubtotal * termMonths).toFixed(2));

  // Calculate discount:
  // "the coupon code only applies for only one month not on complete year and then prices go back to normal after completing the period one month."
  let month1Discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENT') {
      month1Discount = Number(((monthlySubtotal * Number(appliedCoupon.discountValue)) / 100).toFixed(2));
    } else {
      month1Discount = Number(appliedCoupon.discountValue);
    }
    if (month1Discount > monthlySubtotal) month1Discount = monthlySubtotal;
  }

  // Total discount applied to this order is Month 1 discount only!
  const totalDiscount = month1Discount;

  // Total Due Today: Full year upfront minus the 1st month coupon discount
  const totalDueToday = Math.max(0, Number((fullTermSubtotal - totalDiscount).toFixed(2)));

  // Next recurring price (full regular price after completing introductory period)
  const recurringPrice = fullTermSubtotal;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/pricing/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          planId: selectedPlan.planId,
          amount: fullTermSubtotal,
          monthlyBaseRate: monthlySubtotal,
          term: selectedTerm,
          userId: (user as any)?.userId,
          isUpgrade,
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

  const handleCheckout = () => {
    const configurationOrder = {
      plan: selectedPlan,
      os: activeOsObj,
      appId: imageType === 'apps' && selectedAppId ? selectedAppId : undefined,
      app: imageType === 'apps' && selectedAppObj ? selectedAppObj : undefined,
      location: DATACENTER_LOCATIONS.find((l) => l.id === selectedLocation) || DATACENTER_LOCATIONS[0],
      term: activeTermObj,
      addons: selectedAddons.map((id) => ADDONS.find((a) => a.id === id)).filter(Boolean),
      appliedCoupon,
      month1Discount,
      discountAmount: totalDiscount,
      monthlySubtotal,
      fullTermSubtotal,
      totalDueToday,
      monthlyTotal: totalDueToday, // Legacy compatibility
      termMonths,
      isYearly,
      isNonRefundable,
      recurringPrice,
      isUpgrade,
    };
    navigate('/checkout', { state: { configurationOrder } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* HEADER NAV */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Plans
          </button>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Configure Your Server
          </span>
          <div className="text-xs text-slate-500 font-medium">Step 2 of 3</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* MAIN CONFIGURATION COLUMN */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 1. PLAN SUMMARY CARD */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Selected Base
                  </span>
                  <h2 className="text-2xl font-black text-slate-950 mt-1">{selectedPlan.name}</h2>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-950">${selectedPlan.monthlyPrice ?? selectedPlan.price}</span>
                  <span className="text-xs text-slate-500">/mo standard</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">vCPU Cores</span>
                  <span className="font-bold text-slate-900">{selectedPlan.cpuCores ?? selectedPlan.cpu} Cores</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">RAM</span>
                  <span className="font-bold text-slate-900">{selectedPlan.ramGb ? `${selectedPlan.ramGb} GB` : selectedPlan.ram}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Storage</span>
                  <span className="font-bold text-slate-900">{selectedPlan.storageGb ? `${selectedPlan.storageGb} GB ${selectedPlan.storageType || 'SSD'}` : selectedPlan.storage}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Network</span>
                  <span className="font-bold text-slate-900">
                    {selectedPlan.bandwidth || (selectedPlan.bandwidthMbps ? `${selectedPlan.bandwidthMbps >= 1000 ? `${selectedPlan.bandwidthMbps / 1000} Gbps` : `${selectedPlan.bandwidthMbps} Mbps`} Uplink` : '1 Gbps Uplink')}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. OPERATING SYSTEM / 1-CLICK APPS SELECTION */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">1. Image & Environment</h3>
                  <p className="text-xs text-slate-500">
                    Choose a pure operating system or deploy with enterprise applications pre-installed.
                  </p>
                </div>

                {/* Switcher Tabs */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setImageType('os');
                      setSelectedAppId('');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      imageType === 'os'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>Clean OS Distribution</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageType('apps');
                      if (!selectedAppId && catalogApps.length > 0) {
                        setSelectedAppId(catalogApps[0].id);
                      }
                      setSelectedOs('ubuntu-22');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      imageType === 'apps'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>1-Click Marketplace Apps</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      imageType === 'apps' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {catalogApps.length > 0 ? `${catalogApps.length}` : '20+'}
                    </span>
                  </button>
                </div>
              </div>

              {imageType === 'os' ? (
                /* Pure OS Distribution Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {OS_OPTIONS.map((os) => {
                    const isSelected = selectedOs === os.id;
                    return (
                      <button
                        key={os.id}
                        type="button"
                        onClick={() => setSelectedOs(os.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{os.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{os.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{os.category}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {os.fee === 0 ? 'Free' : `+$${os.fee}/mo`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* 1-Click Applications Grid */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search 1-Click Apps (e.g. WordPress, Docker, MySQL, WireGuard, Node, aaPanel)..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {catalogApps
                      .filter((app) => {
                        if (!appSearch.trim()) return true;
                        const q = appSearch.toLowerCase();
                        return (
                          app.name.toLowerCase().includes(q) ||
                          app.description?.toLowerCase().includes(q) ||
                          (app.tags && app.tags.some((t: string) => t.toLowerCase().includes(q)))
                        );
                      })
                      .map((app) => {
                        const isSelected = selectedAppId === app.id;
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              setSelectedAppId(app.id);
                              setSelectedOs('ubuntu-22');
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-600'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-950 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                  {app.name}
                                </span>
                                {isSelected ? (
                                  <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Selected
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    Port {app.defaultPort || 80}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {app.description}
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-medium">Auto-installs on boot</span>
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Free 1-Click
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Seamless 1-Click Provisioning:</strong> Selected application is automatically installed in the background upon virtual machine startup. No terminal commands or manual setup required!
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* 3. DATACENTER LOCATION */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950">2. Datacenter Region</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DATACENTER_LOCATIONS.map((loc) => {
                  const isSelected = selectedLocation === loc.id;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl">{loc.flag}</span>
                      <span className="text-xs font-bold text-slate-900">{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. BILLING CYCLE */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950">3. Contract Term</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BILLING_TERMS.map((term) => {
                  const isSelected = selectedTerm === term.id;
                  return (
                    <button
                      key={term.id}
                      onClick={() => setSelectedTerm(term.id)}
                      className={`relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {term.discountText && (
                        <span className="absolute -top-2.5 right-3 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          {term.discountText}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-extrabold text-slate-950">{term.label}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{term.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

          </div>

          {/* ORDER SUMMARY SIDEBAR (STICKY) */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl sticky top-24 space-y-6">
              <h3 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              {/* Item Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{selectedPlan.name} ({activeTermObj?.label})</span>
                  <span className="font-bold text-slate-900">${basePriceMonthly.toFixed(2)}/mo</span>
                </div>

                {imageType === 'apps' && selectedAppObj ? (
                  <>
                    <div className="flex justify-between text-slate-600 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                      <div>
                        <span className="font-bold text-blue-950 block">App: {selectedAppObj.name}</span>
                        <span className="text-[10px] text-blue-600 font-medium">Auto-installs on boot</span>
                      </div>
                      <span className="font-extrabold text-emerald-600">Free 1-Click</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Base OS: {activeOsObj?.name}</span>
                      <span className="font-bold text-slate-900">Included</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>OS: {activeOsObj?.name}</span>
                    <span className="font-bold text-slate-900">
                      {osPrice === 0 ? 'Included' : `+$${osPrice.toFixed(2)}/mo`}
                    </span>
                  </div>
                )}

                {selectedAddons.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add-ons</span>
                    {selectedAddons.map((id) => {
                      const item = ADDONS.find((a) => a.id === id);
                      return item ? (
                        <div key={id} className="flex justify-between text-slate-600">
                          <span>{item.name}</span>
                          <span className="font-bold text-slate-900">+${item.price.toFixed(2)}/mo</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Subtotal line before coupon */}
                <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-600 font-medium">
                  <span>{isYearly ? '12 Months Full Year Subtotal' : (isMultiYear ? '24 Months Subtotal' : '1 Month Subtotal')}</span>
                  <span className="font-bold text-slate-900">${fullTermSubtotal.toFixed(2)}</span>
                </div>

                {/* Promo Code Discount if Applied */}
                {appliedCoupon && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Promo: {appliedCoupon.code}</span>
                      </div>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {isYearly || isMultiYear
                        ? '★ Discount applies to Month 1 only. Months 2+ billed at standard rate.'
                        : '★ Discount applies to Month 1. Normal rate resumes on next renewal.'}
                    </p>
                    {appliedCoupon.offerPeriodText && (
                      <p className="text-[10px] text-slate-500 italic">
                        {appliedCoupon.offerPeriodText}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Promo Code Input Box */}
              <div className="pt-3 border-t border-slate-100">
                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-800">{appliedCoupon.code} applied!</span>
                        <span className="block text-[10px] text-emerald-600">
                          {appliedCoupon.discountType === 'PERCENT' ? `${appliedCoupon.discountValue}% off 1st month` : `$${appliedCoupon.discountValue} off 1st month`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
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
                        placeholder="Promo or coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-semibold">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* NON-REFUNDABLE NOTICE FOR ANNUAL / MULTI-YEAR PLANS */}
              {isNonRefundable && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Annual Plan • Non-Refundable</span>
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    Full payment for {termMonths} months is collected upfront today. Annual contract terms are strictly non-refundable once activated.
                  </p>
                </div>
              )}

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {isYearly ? 'Total Charged Today (Full Year)' : (isMultiYear ? 'Total Charged Today (2 Years)' : 'Total Due Today (1 Month)')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isYearly ? '12 months billed upfront' : (isMultiYear ? '24 months billed upfront' : 'Monthly billing cycle')}
                    </span>
                  </div>
                  <div className="text-right">
                    {totalDiscount > 0 && (
                      <span className="text-xs line-through text-slate-400 font-semibold mr-2 block">
                        ${fullTermSubtotal.toFixed(2)}
                      </span>
                    )}
                    <span className="text-3xl font-black text-slate-950">${totalDueToday.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-slate-500">
                  {isYearly ? (
                    <p>Renews annually at standard rate (${fullTermSubtotal.toFixed(2)}/yr). Non-refundable.</p>
                  ) : (
                    <p>Renews monthly at ${monthlySubtotal.toFixed(2)}/mo after Month 1.</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Checkout (${totalDueToday.toFixed(2)})</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}