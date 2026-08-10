import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type StepId = 'details' | 'review' | 'payment';

interface Step {
  id: StepId;
  label: string;
  stepNumber: number;
}

const STEPS: Step[] = [
  { id: 'details', label: 'Customer Details', stepNumber: 1 },
  { id: 'review', label: 'Order Review', stepNumber: 2 },
  { id: 'payment', label: 'Payment', stepNumber: 3 },
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve incoming server configuration from ServerConfigure.tsx or fallback defaults
  const orderData = location.state?.configurationOrder || {
    plan: {
      name: 'VPS L+',
      monthlyPrice: 21,
      promoPriceMonthly: 6,
      cpuCores: 6,
      ramGb: 8,
      storageGb: 240,
      storageType: 'NVMe',
    },
    os: { name: 'Ubuntu 22.04 LTS', fee: 0 },
    location: { name: 'United States (US East)', flag: '🇺🇸' },
    term: { label: '12 Months', id: '12m' },
    addons: [{ name: 'Cloud Backup Storage', price: 3.00 }],
    monthlyTotal: 9.00,
  };

  // State Management
  const [currentStep, setCurrentStep] = useState<StepId>('details');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    address: '',
    city: '',
    country: 'United States',
    zip: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const stepOrder: StepId[] = ['details', 'review', 'payment'];
  const currentIndex = stepOrder.indexOf(currentStep);

  const nextStep = () => {
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      navigate('/configure', { state: { selectedPlan: orderData.plan } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      
      {/* TOP BRAND NAVIGATION BAR (Matching exact design) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* ATC Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-md shadow-blue-500/20">
                ATC
              </div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                Analytical Technical Consulting
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors">Home</button>
            <button onClick={() => navigate('/about')} className="hover:text-slate-900 transition-colors">About Us</button>
            <button onClick={() => navigate('/services')} className="hover:text-slate-900 transition-colors">Services</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-slate-900 transition-colors">Pricing</button>
            <button onClick={() => navigate('/contact')} className="hover:text-slate-900 transition-colors">Contact</button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-full border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Get started
            </button>
          </div>

        </div>

        {/* SUB-HEADER STEP BAR (Matches Configure Header) */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              {currentStep === 'details' ? 'Back to Configuration' : 'Back'}
            </button>

            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Checkout & Deployment
            </span>

            <div className="text-xs text-slate-500 font-bold">Step 3 of 3</div>
          </div>
        </div>
      </header>

      {/* STEP PROGRESS TRACKER */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-xl mx-auto">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = step.id === currentStep;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <div className={`h-[2px] flex-1 transition-colors ${idx <= currentIndex ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
                <button
                  onClick={() => idx <= currentIndex && setCurrentStep(step.id)}
                  disabled={idx > currentIndex}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                      : isCompleted
                      ? 'text-slate-700 hover:text-slate-950'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : step.stepNumber}
                  </span>
                  <span>{step.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* MAIN DYNAMIC FORM SECTION */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* STEP 1: CUSTOMER DETAILS */}
            {currentStep === 'details' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">1. Customer Information</h2>
                  <p className="text-xs text-slate-500 mt-1">Provide your details to associate with this server instance.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                      placeholder="Alex"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                      placeholder="Morgan"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                      placeholder="alex.morgan@company.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1.5">Street Address *</label>
                    <input
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                      placeholder="1360 Brentwood Trl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">City *</label>
                    <input
                      type="text"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                      placeholder="Bolingbrook"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Postal Code *</label>
                    <input
                      type="text"
                      value={customerInfo.zip}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                      placeholder="60490"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t border-slate-100">
                  <button onClick={prevStep} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                    ← Back to Configuration
                  </button>
                  <button
                    onClick={nextStep}
                    className="px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all"
                  >
                    Continue to Order Review
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ORDER REVIEW */}
            {currentStep === 'review' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">2. Review Your Order</h2>
                  <p className="text-xs text-slate-500 mt-1">Confirm your deployment details before payment.</p>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                    <span>Server & Package Specifications</span>
                    <button
                      onClick={() => navigate('/configure', { state: { selectedPlan: orderData.plan } })}
                      className="text-blue-600 hover:text-blue-700 text-[11px] font-bold transition-colors"
                    >
                      Edit Package
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Instance Base</span>
                      <span className="font-bold text-slate-900">{orderData.plan.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Operating System</span>
                      <span className="font-bold text-slate-900">{orderData.os?.name || 'Ubuntu 22.04 LTS'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Datacenter Location</span>
                      <span className="font-bold text-slate-900">{orderData.location?.name || 'United States'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Billing Term</span>
                      <span className="font-bold text-slate-900">{orderData.term?.label || '12 Months'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-slate-50">
                  <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <span>Billing Contact</span>
                    <button onClick={() => setCurrentStep('details')} className="text-blue-600 hover:text-blue-700 text-[11px] font-bold transition-colors">
                      Edit
                    </button>
                  </div>
                  <p className="text-slate-900 font-bold">
                    {customerInfo.firstName || 'Alex'} {customerInfo.lastName || 'Morgan'} ({customerInfo.email || 'alex.morgan@company.com'})
                  </p>
                  <p className="text-slate-500 font-medium">
                    {customerInfo.address || '1360 Brentwood Trl'}, {customerInfo.city || 'Bolingbrook'}, {customerInfo.zip || '60490'}
                  </p>
                </div>

                <div className="pt-6 flex justify-between items-center border-t border-slate-100">
                  <button onClick={prevStep} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="px-6 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">3. Select Payment Method</h2>
                  <p className="text-xs text-slate-500 mt-1">Choose how you would like to pay for your service.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-600 ring-1 ring-blue-600 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>💳 Credit / Debit Card</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-600 ring-1 ring-blue-600 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>🅿️ PayPal</span>
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-4 text-xs pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                        placeholder="Alex Morgan"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Card Number</label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                        placeholder="4532 •••• •••• 8892"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Expiration (MM/YY)</label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                          placeholder="08/28"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">CVC Code</label>
                        <input
                          type="text"
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-medium placeholder:text-slate-400"
                          placeholder="312"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs space-y-2">
                    <p className="font-extrabold text-slate-900">PayPal Express Checkout</p>
                    <p className="text-slate-500">You will be redirected to PayPal to complete your payment securely.</p>
                  </div>
                )}

                <div className="pt-6 flex justify-between items-center border-t border-slate-100">
                  <button onClick={prevStep} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => alert('Order Placed Successfully! Deploying server...')}
                    className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Complete & Deploy (${orderData.monthlyTotal.toFixed(2)}/mo)
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR ORDER SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl sticky top-28 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-950">Order Summary</h3>
                <button
                  onClick={() => navigate('/configure', { state: { selectedPlan: orderData.plan } })}
                  className="text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors"
                >
                  Edit Cart
                </button>
              </div>

              {/* Item Details */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>{orderData.plan.name} ({orderData.term?.label || '12 Months'})</span>
                  <span className="font-bold text-slate-900">${orderData.plan.monthlyPrice?.toFixed(2)}/mo</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>OS: {orderData.os?.name || 'Ubuntu 22.04'}</span>
                  <span className="font-bold text-slate-900">
                    {orderData.os?.fee ? `$${orderData.os.fee}/mo` : 'Included'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Location: {orderData.location?.name || 'US East'}</span>
                  <span className="font-bold text-slate-900">Included</span>
                </div>

                {orderData.addons?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add-ons</span>
                    {orderData.addons.map((addon: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{addon.name}</span>
                        <span className="font-bold text-slate-900">+${addon.price?.toFixed(2)}/mo</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500">Total Due Monthly</span>
                  <span className="text-3xl font-black text-slate-950 tracking-tight">
                    ${orderData.monthlyTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Includes full root access & automated provisioning</p>
              </div>

              {/* Features Guarantee */}
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