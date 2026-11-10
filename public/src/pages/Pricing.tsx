import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVpsPlans, type VPSPlan, getRatesForPlan, calculatePlanCustomPrice } from '../services/pricingApi';
import { Camera, Check } from 'lucide-react';

interface ExtendedPlan extends VPSPlan {
  tag?: string;
  promoSaveText?: string;
  promoPriceMonthly?: number;
  regularPriceMonthly?: number;
  yearlyTotalPrice?: number;
}

// Helper to format and enrich database plans for frontend presentation
const enrichDbPlan = (plan: VPSPlan): ExtendedPlan => {
  const regular = Number(plan.monthlyPrice) || 0;
  const promo = Number((regular * 0.85).toFixed(2)); // 15% discount for 1-year billing
  const yearlyTotal = Math.round(promo * 12);

  let tag: string | undefined;
  if (plan.planId === 2) tag = 'BESTSELLER';
  else if (plan.planId === 3) tag = 'BEST VALUE';
  else if (plan.planId === 4) tag = 'HIGH COMPUTE';

  return {
    ...plan,
    monthlyPrice: regular,
    regularPriceMonthly: regular,
    promoPriceMonthly: promo,
    yearlyTotalPrice: yearlyTotal,
    promoSaveText: 'Save 15%',
    tag,
  };
};

// Standard Database Fallback if Network/API is offline
const DEFAULT_FALLBACK_PLANS: ExtendedPlan[] = [
  enrichDbPlan({
    planId: 1,
    name: 'VPS Basic',
    cpuCores: 2,
    ramGb: 4,
    storageGb: 50,
    storageType: 'SSD',
    bandwidthMbps: 1000,
    ipv4Addresses: 1,
    backupEnabled: false,
    snapshotEnabled: true,
    maxSnapshots: 1,
    monthlyPrice: 6.99,
    currency: 'USD',
    isActive: true,
  }),
  enrichDbPlan({
    planId: 2,
    name: 'VPS Pro',
    cpuCores: 4,
    ramGb: 8,
    storageGb: 120,
    storageType: 'SSD',
    bandwidthMbps: 2000,
    ipv4Addresses: 1,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 2,
    monthlyPrice: 14.99,
    currency: 'USD',
    isActive: true,
  }),
  enrichDbPlan({
    planId: 3,
    name: 'VPS Enterprise',
    cpuCores: 8,
    ramGb: 16,
    storageGb: 250,
    storageType: 'SSD',
    bandwidthMbps: 5000,
    ipv4Addresses: 2,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 7,
    monthlyPrice: 29.99,
    currency: 'USD',
    isActive: true,
  }),
  enrichDbPlan({
    planId: 4,
    name: 'VPS Ultra Compute',
    cpuCores: 16,
    ramGb: 32,
    storageGb: 500,
    storageType: 'SSD',
    bandwidthMbps: 10000,
    ipv4Addresses: 2,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 5,
    monthlyPrice: 59.99,
    currency: 'USD',
    isActive: true,
  }),
];

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ExtendedPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Selected base plan for the custom calculator
  const [selectedBasePlanId, setSelectedBasePlanId] = useState<number>(2); // Default to VPS Pro

  // Custom Builder States
  const [cpu, setCpu] = useState<number>(4);
  const [ram, setRam] = useState<number>(8);
  const [storage, setStorage] = useState<number>(120);

  const activeBasePlan = plans.find((p) => p.planId === selectedBasePlanId) || plans[0] || DEFAULT_FALLBACK_PLANS[1];

  // Sync builder sliders when user selects a different base plan
  const handleChooseBasePlan = (plan: ExtendedPlan) => {
    setSelectedBasePlanId(plan.planId);
    setCpu(Math.max(plan.cpuCores, cpu));
    setRam(Math.max(plan.ramGb, ram));
    setStorage(Math.max(plan.storageGb, storage));
  };

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchVpsPlans();
        if (Array.isArray(data) && data.length > 0) {
          const enriched = data.map(enrichDbPlan);
          setPlans(enriched);
        } else {
          setPlans(DEFAULT_FALLBACK_PLANS);
        }
      } catch (err) {
        setPlans(DEFAULT_FALLBACK_PLANS);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const customCalc = calculatePlanCustomPrice(activeBasePlan, {
    cpuCores: cpu,
    ramGb: ram,
    storageGb: storage,
  });

  const calculateCustomMonthly = () => customCalc.totalMonthlyPrice;

  const handleSelectPreset = (plan: ExtendedPlan) => {
    navigate('/configure', { state: { selectedPlan: plan } });
  };

  const handleSelectCustom = () => {
    const isCustomized = cpu > activeBasePlan.cpuCores || ram > activeBasePlan.ramGb || storage > activeBasePlan.storageGb;
    const customMonthly = calculateCustomMonthly();
    const customPlan: ExtendedPlan = {
      ...activeBasePlan,
      name: isCustomized ? `${activeBasePlan.name} (Customized)` : activeBasePlan.name,
      cpuCores: cpu,
      ramGb: ram,
      storageGb: storage,
      storageType: 'SSD',
      monthlyPrice: customMonthly,
      regularPriceMonthly: customMonthly,
      promoPriceMonthly: Number((customMonthly * 0.85).toFixed(2)),
      currency: 'USD',
      isActive: true,
      tag: isCustomized ? 'CUSTOM' : activeBasePlan.tag,
    };
    navigate('/configure', { state: { selectedPlan: customPlan } });
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
          <h1 className="text-4xl font-extrabold text-slate-950 sm:text-5xl tracking-tight">
            Affordable & Secure VPS Hosting
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-base">
            Full virtualization, unmetered bandwidth, and high-speed SSD storage.
          </p>

          {/* SMOOTH PILL SWITCH TOGGLE */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-bold transition-colors cursor-pointer select-none ${
                billingCycle === 'monthly' ? 'text-slate-950' : 'text-slate-400'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 bg-slate-200 rounded-full p-1 relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              aria-label="Toggle Billing Cycle"
            >
              <div
                className={`w-4 h-4 bg-blue-600 rounded-full transition-transform duration-200 ease-in-out ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs font-bold transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'text-slate-950' : 'text-slate-400'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              <span>1-Year Term</span>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Save 15%
              </span>
            </span>
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
                          Billed annually (${plan.yearlyTotalPrice}/yr), save 15%
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">Billed monthly, cancel anytime</p>
                      )}
                    </div>
                  </div>

                  {/* SPECS LIST */}
                  <ul className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.cpuCores} vCPU Cores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.ramGb} GB</span> RAM
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.storageGb} GB</span> {plan.storageType || 'SSD'}
                    </li>
                    <li className="flex items-center gap-2 text-blue-600 font-semibold">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{plan.maxSnapshots || 1} Snapshot{Number(plan.maxSnapshots) > 1 ? 's' : ''} Included</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleSelectPreset(plan)}
                    className={`w-full py-2.5 px-4 rounded-full font-bold text-xs transition-all ${
                      isBestseller
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Add to cart
                  </button>
                  <button
                    onClick={() => handleChooseBasePlan(plan)}
                    className={`w-full py-1.5 px-3 rounded-full font-semibold text-[11px] transition-all border ${
                      selectedBasePlanId === plan.planId
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {selectedBasePlanId === plan.planId ? '✓ Customizer Active' : 'Customize Specs'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* BUILDER SECTION */}
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Custom VPS Calculator</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scaling on top of <span className="font-bold text-blue-600">{activeBasePlan.name}</span> (${Number(activeBasePlan.monthlyPrice).toFixed(2)}/mo base)
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Includes <strong>{activeBasePlan.maxSnapshots || 1} snapshot{(activeBasePlan.maxSnapshots || 1) > 1 ? 's' : ''}</strong></span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>vCore CPU</span>
                <span className="text-blue-600">{cpu} Cores</span>
              </div>
              <input
                type="range" min={activeBasePlan.cpuCores} max="32" value={cpu}
                onChange={(e) => setCpu(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                +${customCalc.rates.cpuPerCoreMonth.toFixed(2)}/core/mo
              </span>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>RAM Memory</span>
                <span className="text-blue-600">{ram} GB</span>
              </div>
              <input
                type="range" min={activeBasePlan.ramGb} max="64" value={ram}
                onChange={(e) => setRam(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                +${customCalc.rates.ramPerGbMonth.toFixed(3)}/GB/mo
              </span>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>SSD Storage</span>
                <span className="text-blue-600">{storage} GB</span>
              </div>
              <input
                type="range" min={activeBasePlan.storageGb} max="2000" step="10" value={storage}
                onChange={(e) => setStorage(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                +${customCalc.rates.storagePerGbMonth.toFixed(3)}/GB/mo
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase text-slate-400 font-extrabold block">Total Estimate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950">
                  ${calculateCustomMonthly().toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-slate-500">/mo</span>
                {customCalc.diffMonthly > 0 && (
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    +${customCalc.diffMonthly.toFixed(2)} customized specs
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleSelectCustom}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-md"
            >
              Deploy Custom Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}