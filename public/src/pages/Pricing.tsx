import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVpsPlans, type VPSPlan, getRatesForPlan, calculatePlanCustomPrice } from '../services/pricingApi';
import { Camera, Check, ShieldCheck } from 'lucide-react';

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
    storageGb: 120,
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
    storageGb: 250,
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
    storageGb: 500,
    storageType: 'SSD',
    bandwidthMbps: 5000,
    ipv4Addresses: 2,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 5,
    monthlyPrice: 29.99,
    currency: 'USD',
    isActive: true,
  }),
  enrichDbPlan({
    planId: 4,
    name: 'VPS Ultra Compute',
    cpuCores: 16,
    ramGb: 32,
    storageGb: 1000,
    storageType: 'SSD',
    bandwidthMbps: 10000,
    ipv4Addresses: 2,
    backupEnabled: true,
    snapshotEnabled: true,
    maxSnapshots: 7,
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
  const [storage, setStorage] = useState<number>(250);

  const activeBasePlan = plans.find((p) => p.planId === selectedBasePlanId) || plans[0] || DEFAULT_FALLBACK_PLANS[1];

  // Sync builder sliders when user selects a different base plan
  const handleChooseBasePlan = (plan: ExtendedPlan) => {
    setSelectedBasePlanId(plan.planId);
    setCpu(plan.cpuCores);
    setRam(plan.ramGb);
    setStorage(plan.storageGb);
  };

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchVpsPlans();
        if (Array.isArray(data) && data.length > 0) {
          const enriched = data.map(enrichDbPlan);
          setPlans(enriched);
          const defaultPlan = enriched.find((p) => p.planId === selectedBasePlanId) || enriched[0];
          if (defaultPlan) {
            setCpu(defaultPlan.cpuCores);
            setRam(defaultPlan.ramGb);
            setStorage(defaultPlan.storageGb);
          }
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
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Affordable & Secure VPS Hosting
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm font-normal">
            Full virtualization, dedicated resources, and high-speed SSD storage.
          </p>

          {/* SMOOTH PILL SWITCH TOGGLE */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span
              className={`text-xs font-medium transition-colors cursor-pointer select-none ${
                billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </span>

            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-11 h-6 bg-slate-200 rounded-full p-1 relative transition-colors focus:outline-none"
              aria-label="Toggle Billing Cycle"
            >
              <div
                className={`w-4 h-4 bg-blue-600 rounded-full transition-transform duration-200 ease-in-out ${
                  billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs font-medium transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              <span>1-Year Term</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-medium">
                Save 15%
              </span>
            </span>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isSelected = selectedBasePlanId === plan.planId;
            const displayPrice =
              billingCycle === 'yearly'
                ? plan.promoPriceMonthly
                : plan.regularPriceMonthly;

            return (
              <div
                key={plan.planId}
                onClick={() => handleChooseBasePlan(plan)}
                className={`group relative rounded-2xl p-6 flex flex-col justify-between transition-all bg-white cursor-pointer select-none ${
                  isSelected
                    ? 'border-2 border-blue-600 shadow-xl ring-4 ring-blue-500/10 scale-102 z-10'
                    : 'border border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-md'
                }`}
              >
                {/* PROMO / TAG BADGES */}
                <div className="flex justify-between items-center mb-3 min-h-[22px]">
                  {plan.promoSaveText && billingCycle === 'yearly' ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-medium uppercase px-2 py-0.5 rounded-md border border-emerald-200">
                      {plan.promoSaveText}
                    </span>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-1.5">
                    {plan.tag && (
                      <span className="bg-blue-600 text-white text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md">
                        {plan.tag}
                      </span>
                    )}
                    {isSelected && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                    
                    {/* PRICE DISPLAY */}
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                          ${displayPrice}
                        </span>
                        <span className="text-xs font-normal text-slate-500">/mo</span>
                      </div>

                      {billingCycle === 'yearly' ? (
                        <p className="text-[11px] text-emerald-600 font-normal mt-0.5">
                          Billed annually (${plan.yearlyTotalPrice}/yr), save 15%
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">Billed monthly, cancel anytime</p>
                      )}
                    </div>
                  </div>

                  {/* SPECS LIST */}
                  <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3.5">
                    <li className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{plan.cpuCores} vCPU Cores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{plan.ramGb} GB RAM</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {plan.storageGb >= 1000
                          ? `${plan.storageGb >= 1024 && plan.storageGb % 1024 === 0 ? plan.storageGb / 1024 : Math.round(plan.storageGb / 1000)} TB`
                          : `${plan.storageGb} GB`}{' '}
                        {plan.storageType || 'SSD'}
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5 text-blue-600 font-normal">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{plan.maxSnapshots || 1} Snapshot{Number(plan.maxSnapshots) > 1 ? 's' : ''} Included</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-600 font-normal">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Full Root Access</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(plan);
                    }}
                    className={`w-full py-2 px-3 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Add to cart
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
                Scaling on top of <span className="font-bold text-blue-600">{activeBasePlan.name}</span> (${billingCycle === 'yearly' ? activeBasePlan.promoPriceMonthly : Number(activeBasePlan.monthlyPrice).toFixed(2)}/mo base)
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
                <span className="text-blue-600">
                  {storage >= 1000
                    ? `${(storage / 1000).toFixed(storage % 1000 === 0 ? 0 : 1)} TB`
                    : `${storage} GB`}
                </span>
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
                  ${(billingCycle === 'yearly' ? calculateCustomMonthly() * 0.85 : calculateCustomMonthly()).toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-slate-500">/mo</span>
                {billingCycle === 'yearly' && (
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Save 15%
                  </span>
                )}
                {customCalc.diffMonthly > 0 && (
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    +${(billingCycle === 'yearly' ? customCalc.diffMonthly * 0.85 : customCalc.diffMonthly).toFixed(2)} customized specs
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