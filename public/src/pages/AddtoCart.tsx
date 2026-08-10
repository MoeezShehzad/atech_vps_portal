import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Data Structures for IONOS-Style Options
const OS_OPTIONS = [
  { id: 'ubuntu-22', name: 'Ubuntu 22.04 LTS', category: 'Linux', icon: '🐧', fee: 0 },
  { id: 'debian-12', name: 'Debian 12', category: 'Linux', icon: '🌀', fee: 0 },
  { id: 'alma-9', name: 'AlmaLinux 9', category: 'Linux', icon: '💿', fee: 0 },
  { id: 'rocky-9', name: 'Rocky Linux 9', category: 'Linux', icon: '⛰️', fee: 0 },
  { id: 'win-2022', name: 'Windows Server 2022', category: 'Windows', icon: '🪟', fee: 10 },
];

const DATACENTER_LOCATIONS = [
  { id: 'us-east', name: 'United States (US East)', flag: '🇺🇸' },
  { id: 'us-west', name: 'United States (US West)', flag: '🇺🇸' },
  { id: 'de-fra', name: 'Germany (Frankfurt)', flag: '🇩🇪' },
  { id: 'uk-lon', name: 'United Kingdom (London)', flag: '🇬🇧' },
  { id: 'es-mad', name: 'Spain (Madrid)', flag: '🇪🇸' },
];

const BILLING_TERMS = [
  { id: '1m', label: '1 Month', desc: 'Maximum flexibility, cancel anytime', monthlyPriceRatio: 1.0, discountText: '' },
  { id: '12m', label: '12 Months', desc: '3 months promo pricing + standard rate', monthlyPriceRatio: 0.85, discountText: 'Save up to 18%' },
  { id: '24m', label: '24 Months', desc: 'Best long-term value guaranteed', monthlyPriceRatio: 0.75, discountText: 'Save up to 25%' },
];

const ADDONS = [
  { id: 'cloud-backup', name: 'Cloud Backup Storage (Acronis)', desc: '$0.12 / GB block storage backup', price: 3.00 },
  { id: 'extra-ipv4', name: 'Additional Public IPv4 Address', desc: '1 Dedicated IP address included', price: 2.50 },
  { id: 'plesk-obsidian', name: 'Plesk Web Admin Edition', desc: 'Web server control panel (up to 10 domains)', price: 5.00 },
];

export default function ServerConfigure() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get passed plan from Pricing.tsx or use default
  const selectedPlan = location.state?.selectedPlan || {
    planId: 2,
    name: 'VPS L+',
    cpuCores: 6,
    ramGb: 8,
    storageGb: 240,
    storageType: 'NVMe',
    monthlyPrice: 21,
    promoPriceMonthly: 6,
  };

  // State Management
  const [selectedOs, setSelectedOs] = useState('ubuntu-22');
  const [selectedLocation, setSelectedLocation] = useState('us-east');
  const [selectedTerm, setSelectedTerm] = useState('12m');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Toggle Addon
  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Calculations
  const activeOsObj = OS_OPTIONS.find((os) => os.id === selectedOs);
  const activeTermObj = BILLING_TERMS.find((t) => t.id === selectedTerm);

  const basePrice =
    selectedTerm === '1m' ? selectedPlan.monthlyPrice : selectedPlan.promoPriceMonthly;

  const osPrice = activeOsObj?.fee || 0;

  const addonsPriceTotal = selectedAddons.reduce((sum, addonId) => {
    const item = ADDONS.find((a) => a.id === addonId);
    return sum + (item ? item.price : 0);
  }, 0);

  const monthlyTotal = basePrice + osPrice + addonsPriceTotal;

  const handleCheckout = () => {
  const configurationOrder = {
    plan: selectedPlan,
    os: activeOsObj,
    location: DATACENTER_LOCATIONS.find((l) => l.id === selectedLocation),
    term: activeTermObj,
    addons: selectedAddons.map((id) => ADDONS.find((a) => a.id === id)),
    monthlyTotal,
  };
    console.log('Final Order Configuration:', configurationOrder);
    // Navigating with state attached
  navigate('/checkout', { state: { configurationOrder } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* HEADER NAV */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
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
                  <span className="text-2xl font-black text-slate-950">${selectedPlan.monthlyPrice}</span>
                  <span className="text-xs text-slate-500">/mo standard</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">vCPU Cores</span>
                  <span className="font-bold text-slate-900">{selectedPlan.cpuCores} Cores</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">RAM</span>
                  <span className="font-bold text-slate-900">{selectedPlan.ramGb} GB</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Storage</span>
                  <span className="font-bold text-slate-900">{selectedPlan.storageGb} GB {selectedPlan.storageType}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Traffic</span>
                  <span className="font-bold text-slate-900">1 Gbps Unlimited</span>
                </div>
              </div>
            </section>

            {/* 2. OPERATING SYSTEM SELECTION */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950">1. Select Operating System</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OS_OPTIONS.map((os) => {
                  const isSelected = selectedOs === os.id;
                  return (
                    <button
                      key={os.id}
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

            {/* 5. RECOMMENDED ADD-ONS */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950">4. Optional Features & Security</h3>
              <div className="space-y-3">
                {ADDONS.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{addon.name}</p>
                          <p className="text-[11px] text-slate-500">{addon.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">+${addon.price.toFixed(2)}/mo</span>
                    </label>
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
                  <span>{selectedPlan.name} ({selectedTerm})</span>
                  <span className="font-bold text-slate-900">${basePrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>OS: {activeOsObj?.name}</span>
                  <span className="font-bold text-slate-900">
                    {osPrice === 0 ? 'Included' : `$${osPrice.toFixed(2)}`}
                  </span>
                </div>

                {selectedAddons.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add-ons</span>
                    {selectedAddons.map((id) => {
                      const item = ADDONS.find((a) => a.id === id);
                      return item ? (
                        <div key={id} className="flex justify-between text-slate-600">
                          <span>{item.name}</span>
                          <span className="font-bold text-slate-900">${item.price.toFixed(2)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500">Total Due Monthly</span>
                  <span className="text-3xl font-black text-slate-950">${monthlyTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400">Excl. applicable local taxes</p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Checkout</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              {/* Guarantee / Features */}
              <ul className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> 30-day money-back guarantee
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Instant server deployment (~60 sec)
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}