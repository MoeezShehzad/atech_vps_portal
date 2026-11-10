const fs = require('fs');

// 1. Update AccountSettings.tsx
let code = fs.readFileSync('public/src/components/AccountSettings.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1a. Update icons import
if (!code.includes('CreditCard,')) {
  code = code.replace(
    "import { User, Phone, Lock, CheckCircle, AlertCircle, Loader2, Camera, MapPin, ShieldCheck, Key, Plus, Trash2, Copy, Check, Download, Terminal, Mail, Eye, EyeOff } from 'lucide-react';",
    "import { User, Phone, Lock, CheckCircle, AlertCircle, Loader2, Camera, MapPin, ShieldCheck, Key, Plus, Trash2, Copy, Check, Download, Terminal, Mail, Eye, EyeOff, CreditCard, Power, Clock, AlertTriangle, Zap, Shield } from 'lucide-react';"
  );
}

// 1b. Add SubscriptionInfo interface and states
const stateMarker = 'const [generatedKey, setGeneratedKey] = useState<';
const subStates = `
  // Subscription & Deactivation State
  interface SubscriptionInfo {
    subscriptionId: number;
    planName: string;
    monthlyPrice: number;
    currency: string;
    status: string;
    isSuspended: boolean;
    retentionDaysRemaining?: number | null;
    retentionExpiresAt?: string | null;
    startDate?: string;
    nextBillingDate?: string;
  }
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchSubscriptionInfo = async () => {
    try {
      setLoadingSub(true);
      const res = await apiCall('/billing/overview');
      if (res && res.subscriptions && res.subscriptions.length > 0) {
        const primary = res.subscriptions.find((s: any) => ['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(s.status?.toUpperCase())) || res.subscriptions[0];
        setSubInfo(primary);
      } else {
        setSubInfo(null);
      }
    } catch (err) {
      console.warn('Failed to load subscription info:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!subInfo) return;
    try {
      setSubActionLoading(true);
      const res = await apiCall('/billing/deactivate-subscription', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: subInfo.subscriptionId }),
      });
      setMessage({
        type: 'success',
        text: res.message || 'Subscription successfully deactivated. Your servers are cleanly powered down and data is preserved for 90 days.',
      });
      setShowDeactivateModal(false);
      await fetchSubscriptionInfo();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate subscription.' });
    } finally {
      setSubActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subInfo) return;
    try {
      setSubActionLoading(true);
      const res = await apiCall('/billing/reactivate-subscription', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: subInfo.subscriptionId }),
      });
      setMessage({
        type: 'success',
        text: res.message || 'Subscription successfully reactivated! Your servers are ready to power on.',
      });
      await fetchSubscriptionInfo();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reactivate subscription.' });
    } finally {
      setSubActionLoading(false);
    }
  };
`;

if (!code.includes('handleDeactivateSubscription')) {
  code = code.replace(
    '  useEffect(() => {\n    fetchProfile();\n    fetchSSHKeys();\n    fetchCountries();\n  }, [isAuthenticated]);',
    subStates + '\n  useEffect(() => {\n    fetchProfile();\n    fetchSSHKeys();\n    fetchCountries();\n    fetchSubscriptionInfo();\n  }, [isAuthenticated]);'
  );
}

// 1c. Add UI section at the bottom of settings (before modals)
const uiMarker = '        )}\n      </div>\n\n      {/* Add SSH Key Modal */}';
const subUi = `        )}
      </div>

      {/* Subscription & Data Preservation Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Subscription & Plan Management
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your active compute plan, auto-renewal settings, and 90-day data preservation.
            </p>
          </div>
          {subInfo && (
            <div>
              {subInfo.status?.toUpperCase() === 'SUSPENDED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3 h-3" /> Suspended (Data Preserved)
                </span>
              ) : subInfo.status?.toUpperCase() === 'TRIAL' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <Zap className="w-3 h-3" /> 30-Day Free Trial
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" /> Active Plan
                </span>
              )}
            </div>
          )}
        </div>

        {loadingSub ? (
          <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading subscription status...</span>
          </div>
        ) : subInfo ? (
          <div className="space-y-4">
            {/* Plan Details Card */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{subInfo.planName}</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    $\${subInfo.monthlyPrice?.toFixed(2)} {subInfo.currency || 'USD'}/mo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {subInfo.status?.toUpperCase() === 'SUSPENDED'
                    ? \`90-Day Preservation active. Retained for \${subInfo.retentionDaysRemaining ?? 90} more days.\`
                    : \`Renews on \${subInfo.nextBillingDate ? formatDate(subInfo.nextBillingDate) : 'End of Cycle'}\`}
                </p>
              </div>

              {subInfo.status?.toUpperCase() === 'SUSPENDED' ? (
                <button
                  type="button"
                  onClick={handleReactivateSubscription}
                  disabled={subActionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={\`w-3.5 h-3.5 \${subActionLoading ? 'animate-spin' : ''}\`} />
                  {subActionLoading ? 'Reactivating...' : 'Reactivate Subscription'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(true)}
                  disabled={subActionLoading}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Power className="w-3.5 h-3.5 text-rose-600" />
                  Deactivate Subscription
                </button>
              )}
            </div>

            {/* Explanatory Policy Callout */}
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-300 text-xs">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Linode-Style 90-Day Data Preservation Policy
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Need to pause your project or take a break? You can deactivate your subscription at any time. When deactivated, your server is cleanly shut down, no further card charges will occur, and your disks, code, and databases are safely preserved for up to 90 days. You can reactivate with 1 click anytime to resume immediately.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <CreditCard className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Active Subscription</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              You do not currently have an active compute subscription. Deploy an instance from the dashboard to get started.
            </p>
          </div>
        )}
      </div>

      {/* Deactivate Subscription Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3>Deactivate Subscription</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Are you sure you want to deactivate your <strong>{subInfo?.planName || 'Cloud VPS'}</strong> subscription?
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2 mb-5">
              <div className="font-semibold text-slate-800 dark:text-slate-200">What happens when you deactivate:</div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero future charges:</strong> Your payment method will not be billed again.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Clean shutdown:</strong> Your instances will be gracefully stopped to free RAM and CPU.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>90-Day Data Safe:</strong> All your disk data (.vhdx), files, and databases are 100% preserved for 90 days.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>1-Click Reactivation:</strong> You can return anytime and resume with all your work intact.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={subActionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Keep Subscription Active
              </button>
              <button
                type="button"
                onClick={handleDeactivateSubscription}
                disabled={subActionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {subActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Deactivate Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SSH Key Modal */}`;

if (!code.includes('Subscription & Plan Management')) {
  code = code.replace(uiMarker, subUi);
  fs.writeFileSync('public/src/components/AccountSettings.tsx', code, 'utf8');
  console.log('Successfully added Subscription section to AccountSettings.tsx');
}

// 2. Update BillingAndInvoices.tsx
let billingUiCode = fs.readFileSync('public/src/components/BillingAndInvoices.tsx', 'utf8').replace(/\r\n/g, '\n');

// 2a. Add Power icon import
if (!billingUiCode.includes('Power,')) {
  billingUiCode = billingUiCode.replace(
    'Lock\n} from \'lucide-react\';',
    'Lock,\n  Power\n} from \'lucide-react\';'
  );
}

// 2b. Add deactivating state and handler
if (!billingUiCode.includes('deactivatingSubId')) {
  billingUiCode = billingUiCode.replace(
    'const [cancellingTrialId, setCancellingTrialId] = useState<number | null>(null);',
    `const [cancellingTrialId, setCancellingTrialId] = useState<number | null>(null);
  const [deactivatingSubId, setDeactivatingSubId] = useState<number | null>(null);

  const handleDeactivateSub = async (subscriptionId: number) => {
    if (!window.confirm('Are you sure you want to deactivate your subscription? Your server will be gracefully shut down, you will not be billed, and all files/disks are preserved for 90 days.')) {
      return;
    }
    try {
      setDeactivatingSubId(subscriptionId);
      const res = await apiCall('/billing/deactivate-subscription', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId }),
      });
      toast.success(res.message || 'Subscription deactivated. 90-day data preservation active.');
      fetchBillingData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate subscription.');
    } finally {
      setDeactivatingSubId(null);
    }
  };`
  );
}

// 2c. Replace empty span with Deactivate button in table
const emptySpan = `<span className="text-slate-400 text-xs">—</span>`;
const deactivateBtn = `<button
                            type="button"
                            onClick={() => handleDeactivateSub(sub.subscriptionId)}
                            disabled={deactivatingSubId === sub.subscriptionId}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            title="Deactivate subscription & gracefully shut down servers with 90-day data preservation"
                          >
                            <Power className="w-3 h-3" />
                            {deactivatingSubId === sub.subscriptionId ? 'Deactivating...' : 'Deactivate'}
                          </button>`;

if (billingUiCode.includes(emptySpan)) {
  billingUiCode = billingUiCode.replace(emptySpan, deactivateBtn);
  fs.writeFileSync('public/src/components/BillingAndInvoices.tsx', billingUiCode, 'utf8');
  console.log('Successfully added Deactivate button to BillingAndInvoices.tsx table');
}
