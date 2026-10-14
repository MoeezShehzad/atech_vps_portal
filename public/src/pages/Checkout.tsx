import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';

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

  // 1. Connect real AuthContext state
  const { user, isAuthenticated, loading } = useAuth();

  // Retrieve incoming server configuration or fallback defaults
  const orderData = location.state?.configurationOrder || {
    plan: {
      name: 'VPS M+',
      monthlyPrice: 11,
      cpuCores: 4,
      ramGb: 6,
      storageGb: 160,
      storageType: 'NVMe',
    },
    os: { name: 'Ubuntu 22.04 LTS', fee: 0 },
    location: { name: 'United States (US East)', flag: '🇺🇸' },
    term: { label: '1 Month', id: '1m' },
    addons: [],
    monthlyTotal: 11.00,
  };

  // State Management
  const [currentStep, setCurrentStep] = useState<StepId>('details');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Form state for logged-in or guest users
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    zip: '',
    country: 'Pakistan',
    termsAccepted: false,
  });

  // Pre-fill fields whenever the authenticated user is loaded
  useEffect(() => {
    if (user) {
      const u = user as any; // Cast user to bypass strict type checking
      const nameParts = u.fullName ? u.fullName.split(' ') : ['', ''];
      setCustomerInfo((prev) => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: u.email || '',
        phone: u.phone || '',
        address: u.address || '',
        city: u.city || '',
        zip: u.postalCode || '',
        country: u.country || 'Pakistan',
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'paypal'>('card');
  const [selectedCardBrand, setSelectedCardBrand] = useState<'Visa' | 'Mastercard' | 'American Express'>('Visa');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    sortCode: '',
    accountNumber: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poNumber: '',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [deployPreference, setDeployPreference] = useState<'immediate' | 'later'>('immediate');
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    transactionId: string;
    invoiceNumber: string;
    amount: string;
    method: string;
    dueDate?: string;
    isDeployLater?: boolean;
  } | null>(null);

  const stepOrder: StepId[] = ['details', 'review', 'payment'];
  const currentIndex = stepOrder.indexOf(currentStep);

  // Auto-detect card brand from card number
  const handleCardNumberChange = (rawVal: string) => {
    const clean = rawVal.replace(/[^0-9]/g, '').slice(0, 16);
    // Auto-spacing every 4 digits
    const formatted = clean.replace(/(\d{4})/g, '$1 ').trim();

    if (clean.startsWith('4')) {
      setSelectedCardBrand('Visa');
    } else if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) {
      setSelectedCardBrand('Mastercard');
    } else if (/^3[47]/.test(clean)) {
      setSelectedCardBrand('American Express');
    }

    setCardDetails((prev) => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (rawVal: string) => {
    let clean = rawVal.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length >= 3) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardDetails((prev) => ({ ...prev, expiry: clean }));
  };

  const handleSortCodeChange = (rawVal: string) => {
    let clean = rawVal.replace(/[^0-9]/g, '').slice(0, 6);
    if (clean.length > 4) {
      clean = `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
    } else if (clean.length > 2) {
      clean = `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }
    setBankDetails((prev) => ({ ...prev, sortCode: clean }));
  };

  // FORM VALIDATION GUARD
  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (currentStep === 'details') {
      if (isAuthenticated) {
        if (!customerInfo.address.trim()) newErrors.address = 'Street address is required';
        if (!customerInfo.city.trim()) newErrors.city = 'City is required';
        if (!customerInfo.zip.trim()) newErrors.zip = 'Postal code is required';
      } else {
        if (!customerInfo.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!customerInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!customerInfo.email.trim()) newErrors.email = 'Email address is required';
        if (!customerInfo.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!customerInfo.password) newErrors.password = 'Password is required';
        if (customerInfo.password !== customerInfo.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!customerInfo.address.trim()) newErrors.address = 'Street address is required';
        if (!customerInfo.city.trim()) newErrors.city = 'City is required';
        if (!customerInfo.zip.trim()) newErrors.zip = 'Postal code is required';
        if (!customerInfo.termsAccepted) newErrors.termsAccepted = 'You must accept terms & conditions';
      }
    }

    if (currentStep === 'payment' && paymentMethod === 'card') {
      if (!cardDetails.name.trim()) newErrors.cardName = 'Cardholder name is required';
      const cleanNum = cardDetails.number.replace(/\s+/g, '');
      if (!cleanNum || cleanNum.length < 13) newErrors.cardNumber = 'Valid card number is required';
      if (!cardDetails.expiry.trim() || !cardDetails.expiry.includes('/')) newErrors.cardExpiry = 'Valid expiration (MM/YY) is required';
      if (!cardDetails.cvc.trim() || cardDetails.cvc.length < 3) newErrors.cardCvc = 'Valid CVC code is required';
    }

    if (currentStep === 'payment' && paymentMethod === 'bank_transfer') {
      if (!bankDetails.bankName.trim()) newErrors.bankName = 'Bank name is required';
      const cleanSort = bankDetails.sortCode.replace(/[^0-9]/g, '');
      if (cleanSort.length !== 6) newErrors.sortCode = 'Sort code must be 6 digits (e.g. 20-04-15)';
      const cleanAcc = bankDetails.accountNumber.replace(/[^0-9]/g, '');
      if (!cleanAcc || cleanAcc.length < 6) newErrors.accountNumber = 'Account number must be at least 6 digits';
      if (!bankDetails.dueDate) newErrors.dueDate = 'Payment last end date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    if (currentStep === 'details' && isAuthenticated) {
      try {
        await apiCall('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({
            address: customerInfo.address,
            city: customerInfo.city,
            postalCode: customerInfo.zip,
            country: customerInfo.country,
            phone: customerInfo.phone,
          }),
        });
      } catch (err) {
        console.error('Failed to sync billing address:', err);
      }
    }

    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    setErrors({});
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      navigate('/configure', { state: { selectedPlan: orderData.plan } });
    }
  };

  const handleCompleteAndDeploy = async () => {
    if (!validateStep()) return;

    if (!isAuthenticated) {
      alert('Please log in or register before finalizing your payment.');
      navigate('/login', { state: { returnTo: '/checkout' } });
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      if (paymentMethod === 'card') {
        const res = await apiCall('/payments/process-card', {
          method: 'POST',
          body: JSON.stringify({
            planId: orderData.plan?.planId || 1,
            amount: orderData.monthlyTotal,
            cardBrand: selectedCardBrand,
            cardNumber: cardDetails.number,
            cardExpiry: cardDetails.expiry,
            cardCvc: cardDetails.cvc,
            cardName: cardDetails.name || `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
            customerInfo,
          }),
        });

        if (res.success) {
          if (deployPreference === 'immediate') {
            try {
              const deployPayload = {
                vmName: `srv-vps-${Math.floor(1000 + Math.random() * 9000)}`,
                planId: orderData.plan?.planId || 1,
                imageId: orderData.os?.imageId || 1,
                customCpu: orderData.plan?.cpuCores,
                customRam: orderData.plan?.ramGb,
                customStorage: orderData.plan?.storageGb,
                username: 'ubuntu',
                password: 'root',
                authMethod: 'password',
                enableBackups: orderData.addons?.some((a: any) => a.name?.toLowerCase().includes('backup')),
              };
              await apiCall('/vms/deploy', {
                method: 'POST',
                body: JSON.stringify(deployPayload),
              });
            } catch (deployErr) {
              console.warn('[Auto-deploy during checkout notice]:', deployErr);
            }
          }

          setPaymentSuccessData({
            transactionId: res.transactionId,
            invoiceNumber: res.invoiceNumber,
            amount: res.amount,
            method: `${res.cardBrand} •••• ${res.last4}`,
            isDeployLater: deployPreference === 'later',
          });
        }
      } else if (paymentMethod === 'bank_transfer') {
        const res = await apiCall('/payments/process-bank-transfer', {
          method: 'POST',
          body: JSON.stringify({
            planId: orderData.plan?.planId || 1,
            amount: orderData.monthlyTotal,
            bankName: bankDetails.bankName,
            sortCode: bankDetails.sortCode,
            accountNumber: bankDetails.accountNumber,
            paymentDueDate: bankDetails.dueDate,
            poNumber: bankDetails.poNumber,
            customerInfo,
          }),
        });

        if (res.success) {
          setPaymentSuccessData({
            transactionId: res.transactionId,
            invoiceNumber: res.invoiceNumber,
            amount: res.amount,
            method: `Bank Wire (Sort: ${res.sortCode} / A/C: ${res.maskedAccount})`,
            dueDate: res.dueDate,
            isDeployLater: true,
          });
        }
      } else {
        alert('PayPal Express checkout simulation. Redirecting to payment authorization...');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed. Please check your credentials or payment limits.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* SUB-HEADER STEP BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

          <div className="text-xs text-slate-500 font-bold">Step {currentIndex + 1} of 3</div>
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
                
                {/* CASE 1: LOGGED-IN USER */}
                {isAuthenticated ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">1. Billing Details</h2>
                        <p className="text-xs text-slate-500 mt-1">Logged in as <span className="font-bold text-slate-900">{user?.email}</span></p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full">
                        Authenticated User
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          disabled
                          value={user?.fullName || ''}
                          className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                          placeholder="+92 300 1234567"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">City *</label>
                        <input
                          type="text"
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.city ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="Peshawar"
                        />
                        {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.city}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1.5">Street Address *</label>
                        <input
                          type="text"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.address ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="Street 1, Main Sector"
                        />
                        {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Postal / ZIP Code *</label>
                        <input
                          type="text"
                          value={customerInfo.zip}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.zip ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="25000"
                        />
                        {errors.zip && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.zip}</p>}
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
                ) : (
                  
                  /* CASE 2: GUEST USER */
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">1. Create Account & Billing Details</h2>
                        <p className="text-xs text-slate-500 mt-1">Set up your credentials to manage your server dashboard after payment.</p>
                      </div>
                      <button
                        onClick={() => navigate('/login?redirect=/checkout')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors self-start sm:self-auto"
                      >
                        Already have an account? Log in
                      </button>
                    </div>

                    {/* Account Setup Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">First Name *</label>
                        <input
                          type="text"
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.firstName ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="Alex"
                        />
                        {errors.firstName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Last Name *</label>
                        <input
                          type="text"
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.lastName ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="Morgan"
                        />
                        {errors.lastName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.lastName}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Email Address (Username) *</label>
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.email ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="alex.morgan@company.com"
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Phone Number *</label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.phone ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="+1 (555) 000-0000"
                        />
                        {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Create Password *</label>
                        <input
                          type="password"
                          value={customerInfo.password}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, password: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.password ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="••••••••••••"
                        />
                        {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.password}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Confirm Password *</label>
                        <input
                          type="password"
                          value={customerInfo.confirmPassword}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, confirmPassword: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.confirmPassword ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="••••••••••••"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.confirmPassword}</p>}
                      </div>

                      <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <label className="block font-bold text-slate-700 mb-1.5">Street Address *</label>
                        <input
                          type="text"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.address ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="1360 Brentwood Trl"
                        />
                        {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">City *</label>
                        <input
                          type="text"
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.city ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="Bolingbrook"
                        />
                        {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Postal / ZIP Code *</label>
                        <input
                          type="text"
                          value={customerInfo.zip}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.zip ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="60490"
                        />
                        {errors.zip && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.zip}</p>}
                      </div>

                      <div className="sm:col-span-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customerInfo.termsAccepted}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, termsAccepted: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-slate-600 text-xs font-medium">
                            I agree to the <a href="/terms" className="text-blue-600 underline">Terms of Service</a> & <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>
                          </span>
                        </label>
                        {errors.termsAccepted && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.termsAccepted}</p>}
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
                      <span className="font-bold text-slate-900">{orderData.term?.label || '1 Month'}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2 bg-slate-50">
                  <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                    <span>Account & Billing Contact</span>
                    <button onClick={() => setCurrentStep('details')} className="text-blue-600 hover:text-blue-700 text-[11px] font-bold transition-colors">
                      Edit
                    </button>
                  </div>
                  <p className="text-slate-900 font-bold">
                    {isAuthenticated ? user?.fullName : `${customerInfo.firstName} ${customerInfo.lastName}`} ({isAuthenticated ? user?.email : customerInfo.email})
                  </p>
                  <p className="text-slate-600 font-medium">
                    Phone: {customerInfo.phone || 'N/A'}
                  </p>
                  <p className="text-slate-500 font-medium">
                    {customerInfo.address}, {customerInfo.city}, {customerInfo.zip}
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
                  <p className="text-xs text-slate-500 mt-1">
                    Choose your preferred payment method. Transactions are secured with AES-256-GCM encryption & PCI-DSS compliance.
                  </p>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                    <span className="text-base">⚠️</span>
                    <div className="flex-1">
                      <p className="font-bold">Payment Transaction Failed</p>
                      <p className="mt-0.5">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Payment Method Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span className="font-extrabold">Credit / Debit Card</span>
                    <span className="text-[10px] text-slate-400 font-medium">Stripe / Visa / MC / Amex</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">🏦</span>
                    <span className="font-extrabold">Direct Bank Wire</span>
                    <span className="text-[10px] text-slate-400 font-medium">Sorting A/C & Net Terms</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">🅿️</span>
                    <span className="font-extrabold">PayPal</span>
                    <span className="text-[10px] text-slate-400 font-medium">Express Checkout</span>
                  </button>
                </div>

                {/* 1. CREDIT / DEBIT CARD PANEL (Matches Stripe Elements in Image 1) */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4 text-xs pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Cardholder Name *</label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                          errors.cardName ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                        }`}
                        placeholder="Cardholder Name"
                      />
                      {errors.cardName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cardName}</p>}
                    </div>

                    {/* Row 1: Card number (6 cols), Expiration (3 cols), Security code (3 cols) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Card Number */}
                      <div className="md:col-span-6">
                        <label className="block font-bold text-slate-700 mb-1.5">Card number *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardDetails.number}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            maxLength={19}
                            className={`w-full p-3 pr-28 rounded-xl bg-slate-50 border text-slate-900 font-mono tracking-wider focus:outline-none focus:bg-white transition-colors font-medium ${
                              errors.cardNumber ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                            }`}
                            placeholder="1234 1234 1234 1234"
                          />
                          {/* Embedded Brand Badges */}
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 select-none pointer-events-none">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border transition-all ${
                              selectedCardBrand === 'Visa'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                            }`}>
                              VISA
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border transition-all ${
                              selectedCardBrand === 'Mastercard'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                            }`}>
                              MC
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border transition-all ${
                              selectedCardBrand === 'American Express'
                                ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                            }`}>
                              AMEX
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight border bg-slate-100 text-slate-400 border-slate-200 opacity-60">
                              DISC
                            </span>
                          </div>
                        </div>
                        {errors.cardNumber && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cardNumber}</p>}
                      </div>

                      {/* Expiration Date */}
                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-700 mb-1.5">Expiration date *</label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          maxLength={5}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 font-mono focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.cardExpiry ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="MM / YY"
                        />
                        {errors.cardExpiry && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cardExpiry}</p>}
                      </div>

                      {/* Security code */}
                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-700 mb-1.5">Security code *</label>
                        <div className="relative">
                          <input
                            type="password"
                            value={cardDetails.cvc}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                            maxLength={4}
                            className={`w-full p-3 pr-10 rounded-xl bg-slate-50 border text-slate-900 font-mono focus:outline-none focus:bg-white transition-colors font-medium ${
                              errors.cardCvc ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                            }`}
                            placeholder="CVC"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none flex items-center gap-0.5">
                            💳<span className="text-[9px] font-mono font-bold">123</span>
                          </span>
                        </div>
                        {errors.cardCvc && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cardCvc}</p>}
                      </div>
                    </div>

                    {/* Row 2: Country & ZIP Code */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Country */}
                      <div className="md:col-span-6">
                        <label className="block font-bold text-slate-700 mb-1.5">Country *</label>
                        <div className="relative">
                          <select
                            value={customerInfo.country || 'United States'}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium appearance-none focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                          >
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Australia">Australia</option>
                            <option value="Pakistan">Pakistan</option>
                            <option value="United Arab Emirates">United Arab Emirates</option>
                            <option value="Saudi Arabia">Saudi Arabia</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Other">Other Country</option>
                          </select>
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* ZIP Code */}
                      <div className="md:col-span-6">
                        <label className="block font-bold text-slate-700 mb-1.5">ZIP code *</label>
                        <input
                          type="text"
                          value={customerInfo.zip}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs font-medium focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                          placeholder="12345"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DIRECT BANK WIRE TRANSFER (Sorting A/C, Net Terms) */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4 text-xs pt-2">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900">
                      <p className="font-extrabold flex items-center gap-2">
                        <span>🏛️</span> Direct Corporate Wire / Sorting A/C Payment
                      </p>
                      <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                        For enterprise and corporate accounts. Provide your banking coordinates below. An official invoice with Net-30 payment instructions will be dispatched to your billing contact. All account details are AES-256-GCM encrypted.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Bank Name *</label>
                      <input
                        type="text"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                          errors.bankName ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                        }`}
                        placeholder="e.g. JPMorgan Chase, Barclays, HSBC"
                      />
                      {errors.bankName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bankName}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Sorting A/C (Sort Code / Routing) *</label>
                        <input
                          type="text"
                          value={bankDetails.sortCode}
                          onChange={(e) => handleSortCodeChange(e.target.value)}
                          maxLength={8}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 font-mono tracking-wider focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.sortCode ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="20-04-15"
                        />
                        {errors.sortCode && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.sortCode}</p>}
                        <span className="text-[10px] text-slate-400 mt-1 block">6-digit standard sorting code</span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Bank Account Number *</label>
                        <input
                          type="text"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 16) })}
                          maxLength={16}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 font-mono tracking-wider focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.accountNumber ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                          placeholder="88392019"
                        />
                        {errors.accountNumber && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.accountNumber}</p>}
                        <span className="text-[10px] text-slate-400 mt-1 block">Encrypted with AES-256-GCM</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Payment Last End Date (Due Date) *</label>
                        <input
                          type="date"
                          value={bankDetails.dueDate}
                          onChange={(e) => setBankDetails({ ...bankDetails, dueDate: e.target.value })}
                          className={`w-full p-3 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium ${
                            errors.dueDate ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-600'
                          }`}
                        />
                        {errors.dueDate && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.dueDate}</p>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">PO / Reference Number (Optional)</label>
                        <input
                          type="text"
                          value={bankDetails.poNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, poNumber: e.target.value })}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white transition-colors font-medium"
                          placeholder="PO-2026-9901"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PAYPAL PANEL */}
                {paymentMethod === 'paypal' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs space-y-2">
                    <p className="font-extrabold text-slate-900 text-sm">🅿️ PayPal Express Checkout</p>
                    <p className="text-slate-500">
                      You will be redirected to PayPal sandbox to authorize payment using your balance or connected accounts.
                    </p>
                  </div>
                )}

                {/* DEPLOYMENT TIMING / SCHEDULE PREFERENCE */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>⏱️</span> When would you like to deploy your server?
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      User Flexibility
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeployPreference('immediate')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        deployPreference === 'immediate'
                          ? 'border-blue-600 bg-white text-blue-900 font-bold shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5 text-slate-900">
                        <span>⚡ Deploy Immediately</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-1 leading-relaxed">
                        Spin up your VM instance automatically on the cluster right after payment confirmation.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeployPreference('later')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        deployPreference === 'later'
                          ? 'border-blue-600 bg-white text-blue-900 font-bold shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold flex items-center gap-1.5 text-slate-900">
                        <span>⏳ Purchase Now & Deploy Later</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-1 leading-relaxed">
                        Reserve your package slot now. Configure your OS and spin up anytime from your dashboard when you get free.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="pt-6 flex justify-between items-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isProcessingPayment}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
                  >
                    ← Back to Review
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteAndDeploy}
                    disabled={isProcessingPayment}
                    className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{deployPreference === 'later' ? 'Processing Order...' : 'Processing & Deploying...'}</span>
                      </>
                    ) : (
                      <span>
                        {deployPreference === 'later'
                          ? `Purchase & Reserve Slot ($${orderData.monthlyTotal.toFixed(2)}/mo)`
                          : `Complete & Deploy ($${orderData.monthlyTotal.toFixed(2)}/mo)`}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS CONFIRMATION MODAL */}
            {paymentSuccessData && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-8 border border-slate-100 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                    ✓
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                      {paymentSuccessData.isDeployLater
                        ? 'Package Purchased & Slot Reserved!'
                        : 'Order Confirmed & Provisioning Initialized!'}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {paymentSuccessData.isDeployLater
                        ? 'Your subscription is now active! Your VPS package slot has been reserved. Whenever you get free, you can configure your OS, credentials, or 1-click apps and launch your machine from your dashboard.'
                        : 'Your payment has been successfully recorded and your cloud VPS is now spinning up.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3 font-medium">
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Invoice Number</span>
                      <span className="font-bold font-mono text-slate-900">{paymentSuccessData.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="font-bold font-mono text-slate-900 text-[11px]">{paymentSuccessData.transactionId}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Amount</span>
                      <span className="font-bold text-emerald-600">${Number(paymentSuccessData.amount).toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Payment Channel</span>
                      <span className="font-bold text-slate-900">{paymentSuccessData.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className="font-bold text-emerald-600">
                        {paymentSuccessData.isDeployLater ? 'Subscription Active (Ready to Deploy)' : 'Active & Provisioning'}
                      </span>
                    </div>
                    {paymentSuccessData.dueDate && (
                      <div className="flex justify-between pt-1 border-t border-slate-200/40">
                        <span className="text-slate-500">Payment Last End Date</span>
                        <span className="font-bold text-amber-600">{paymentSuccessData.dueDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                    📧 An official VAT invoice and payment confirmation has been dispatched to your email address.
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => navigate('/billing')}
                      className="py-3 px-4 rounded-xl border border-slate-300 font-extrabold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View Invoices
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all"
                    >
                      {paymentSuccessData.isDeployLater ? 'Go to Dashboard (Deploy Later) →' : 'Go to VPS Dashboard →'}
                    </button>
                  </div>
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
                  <span>{orderData.plan.name} ({orderData.term?.label || '1 Month'})</span>
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

                {orderData.appliedCoupon && (
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-emerald-600 font-bold">
                    <span>Coupon ({orderData.appliedCoupon.code}):</span>
                    <span>-${Number(orderData.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500">Total Due Monthly</span>
                  <div className="text-right">
                    {orderData.discountAmount > 0 && (
                      <span className="text-xs line-through text-slate-400 font-semibold mr-2 block">
                        ${(Number(orderData.monthlyTotal) + Number(orderData.discountAmount)).toFixed(2)}
                      </span>
                    )}
                    <span className="text-3xl font-black text-slate-950 tracking-tight">
                      ${Number(orderData.monthlyTotal).toFixed(2)}
                    </span>
                  </div>
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