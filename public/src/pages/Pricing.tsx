import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVpsPlans, type VPSPlan } from '../services/pricingApi';

interface ExtendedPlan extends VPSPlan {
  tag?: string;
  promoSaveText?: string;
  promoPriceMonthly?: number;
  regularPriceMonthly?: number;
  yearlyTotalPrice?: number;
}

// IONOS Live Pricing & Specs Structure
const IONOS_VPS_PLANS: ExtendedPlan[] = [
  {
    planId: 1,
    name: 'VPS M+',
    cpuCores: 4,
    ramGb: 4,
    storageGb: 120,
    storageType: 'NVMe',
    bandwidthMbps: 1000,
    ipv4Addresses: 1,
    backupEnabled: false,
    snapshotEnabled: true,
    maxSnapshots: 3,
    monthlyPrice: 11,
    promoPriceMonthly: 4,
    regularPriceMonthly: 11,
    yearlyTotalPrice: 105, // 3 mos @ $4 + 9 mos @ $11
    promoSaveText: 'Save 16%',
    currency: 'USD',
    isActive: true,
  },
  {
    planId: 2,
    name: 'VPS L+',
    cpuCores: 6,
    ramGb: 8,
    storageGb: 240,
    storageType: 'NVMe',
    bandwidthMbps: 1000,
    ipv4Addresses: 1,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 5,
    monthlyPrice: 21,
    promoPriceMonthly: 6,
    regularPriceMonthly: 21,
    yearlyTotalPrice: 207, // 3 mos @ $6 + 9 mos @ $21
    promoSaveText: 'Save 18%',
    tag: 'BESTSELLER',
    currency: 'USD',
    isActive: true,
  },
  {
    planId: 3,
    name: 'VPS XL+',
    cpuCores: 8,
    ramGb: 16,
    storageGb: 480,
    storageType: 'NVMe',
    bandwidthMbps: 1000,
    ipv4Addresses: 1,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 10,
    monthlyPrice: 44,
    promoPriceMonthly: 11,
    regularPriceMonthly: 44,
    yearlyTotalPrice: 429, // 3 mos @ $11 + 9 mos @ $44
    promoSaveText: 'Save 19%',
    tag: 'BEST VALUE',
    currency: 'USD',
    isActive: true,
  },
  {
    planId: 4,
    name: 'VPS XXL+',
    cpuCores: 12,
    ramGb: 24,
    storageGb: 720,
    storageType: 'NVMe',
    bandwidthMbps: 1000,
    ipv4Addresses: 1,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 15,
    monthlyPrice: 68,
    promoPriceMonthly: 18,
    regularPriceMonthly: 68,
    yearlyTotalPrice: 666, // 3 mos @ $18 + 9 mos @ $68
    promoSaveText: 'Save 18%',
    currency: 'USD',
    isActive: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ExtendedPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Custom Builder States
  const [cpu, setCpu] = useState<number>(4);
  const [ram, setRam] = useState<number>(8);
  const [storage, setStorage] = useState<number>(240);
  const [bandwidth, setBandwidth] = useState<number>(1);
  const [includeBackup, setIncludeBackup] = useState<boolean>(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchVpsPlans();
        if (Array.isArray(data) && data.length > 0) {
          // Merge API data with IONOS marketing badges
          const merged = data.map((plan, index) => ({
            ...plan,
            ...IONOS_VPS_PLANS[index % IONOS_VPS_PLANS.length],
          }));
          setPlans(merged);
        } else {
          setPlans(IONOS_VPS_PLANS);
        }
      } catch (err) {
        setPlans(IONOS_VPS_PLANS);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const calculateCustomMonthly = () => {
    const base = cpu * 2.5 + ram * 1.5 + storage * 0.05 + bandwidth * 2.0;
    return base + (includeBackup ? 3.0 : 0);
  };

  const handleSelectPreset = (plan: ExtendedPlan) => {
  navigate('/configure', { state: { selectedPlan: plan } });
};

  const handleSelectCustom = () => {
    const customConfig = {
      cpuCores: cpu,
      ramGb: ram,
      storageGb: storage,
      bandwidthTb: bandwidth,
      backupEnabled: includeBackup,
      monthlyPrice: calculateCustomMonthly(),
      billingCycle,
    };
    navigate('/dashboard', { state: { customConfig } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 py-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* HEADER & TOGGLE */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            IONOS VPS PERFORMANCE
          </span>
          <h1 className="text-4xl font-extrabold text-slate-950 sm:text-5xl tracking-tight">
            Affordable & Secure VPS Hosting
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-base">
            Full virtualization, unmetered bandwidth, and high-speed NVMe SSD storage.
          </p>

          {/* MONTHLY / YEARLY TOGGLE */}
          <div className="pt-6 flex justify-center items-center gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Term
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>1-Year Term</span>
                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                  Promo
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isBestseller = plan.tag === 'BESTSELLER';
            const displayPrice =
              billingCycle === 'yearly'
                ? plan.promoPriceMonthly
                : plan.regularPriceMonthly;

            return (
              <div
                key={plan.planId}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all bg-white ${
                  isBestseller
                    ? 'border-2 border-blue-600 shadow-xl scale-105 z-10'
                    : 'border border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* PROMO / TAG BADGES */}
                <div className="flex justify-between items-center mb-4">
                  {plan.promoSaveText && billingCycle === 'yearly' ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-200">
                      {plan.promoSaveText}
                    </span>
                  ) : (
                    <div />
                  )}

                  {plan.tag && (
                    <span className="bg-blue-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                      {plan.tag}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                    
                    {/* PRICE DISPLAY */}
                    <div className="mt-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-950">
                          ${displayPrice}
                        </span>
                        <span className="text-sm font-medium text-slate-500">/mo</span>
                      </div>

                      {billingCycle === 'yearly' ? (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                          for 3 months, then ${plan.regularPriceMonthly}/mo
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">Billed monthly, cancel anytime</p>
                      )}
                    </div>
                  </div>

                  {/* SPECS LIST */}
                  <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.cpuCores} vCores</span> CPU
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.ramGb} GB</span> RAM
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.storageGb} GB</span> {plan.storageType} SSD
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">1 Gbps</span> Unlimited Traffic
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPreset(plan)}
                  className={`mt-6 w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all ${
                    isBestseller
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  Add to cart
                </button>
              </div>
            );
          })}
        </div>

        {/* BUILDER SECTION */}
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Custom VPS Calculator</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>vCore CPU</span>
                <span className="text-blue-600">{cpu} Cores</span>
              </div>
              <input
                type="range" min="1" max="16" value={cpu}
                onChange={(e) => setCpu(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>RAM Memory</span>
                <span className="text-blue-600">{ram} GB</span>
              </div>
              <input
                type="range" min="1" max="32" value={ram}
                onChange={(e) => setRam(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>NVMe Storage</span>
                <span className="text-blue-600">{storage} GB</span>
              </div>
              <input
                type="range" min="10" max="1000" step="10" value={storage}
                onChange={(e) => setStorage(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Bandwidth</span>
                <span className="text-blue-600">{bandwidth} TB</span>
              </div>
              <input
                type="range" min="1" max="10" value={bandwidth}
                onChange={(e) => setBandwidth(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs uppercase text-slate-400 font-extrabold block">Total Estimate</span>
              <span className="text-2xl font-black text-slate-950">
                ${calculateCustomMonthly().toFixed(2)} /mo
              </span>
            </div>
            <button
              onClick={handleSelectCustom}
              className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
            >
              Deploy Custom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}