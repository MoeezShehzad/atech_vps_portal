import React, { useState, useEffect } from 'react';
import DynamicPolicyRenderer from '../components/DynamicPolicyRenderer';
import { 
  DollarSign, AlertCircle, RefreshCw, XCircle, CheckCircle2, 
  ShieldAlert, CreditCard, Mail, ChevronRight, Server, FileText, History, AlertTriangle 
} from 'lucide-react';

export default function RefundPolicy() {
  const fallbackLastUpdated = "October 17, 2026";
  const [dbPolicy, setDbPolicy] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [selectedVer, setSelectedVer] = useState<string>('');
  const [loadingVer, setLoadingVer] = useState(false);

  useEffect(() => {
    fetch('/api/policies/refund-policy')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.policy) setDbPolicy(data.policy);
      })
      .catch(() => {});

    fetch('/api/policies/refund-policy/versions')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.versions) setVersionHistory(data.versions);
      })
      .catch(() => {});
  }, []);

  const handleSelectVersion = async (ver: string) => {
    setSelectedVer(ver);
    if (!ver) {
      fetch('/api/policies/refund-policy')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.policy) setDbPolicy(data.policy);
        });
      return;
    }

    try {
      setLoadingVer(true);
      const res = await fetch(`/api/policies/refund-policy/versions/${encodeURIComponent(ver)}`);
      const data = await res.json();
      if (data && data.success && data.policy) setDbPolicy(data.policy);
    } catch (_) {
    } finally {
      setLoadingVer(false);
    }
  };

  const currentDisplayDate = dbPolicy?.effectiveAt
    ? new Date(dbPolicy.effectiveAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : fallbackLastUpdated;

  const currentDisplayVersion = dbPolicy?.version || 'v1.0';
  const [activeSection, setActiveSection] = useState('ref-1');

  const tableOfContents = [
    { id: 'ref-1', title: '1. General Infrastructure Billing Policy' },
    { id: 'ref-2', title: '2. No Money-Back Guarantee & Final Sale Policy' },
    { id: 'ref-3', title: '3. Strictly Non-Refundable Products & Services' },
    { id: 'ref-4', title: '4. Self-Service Cancellation Protocol' },
    { id: 'ref-5', title: '5. Automatic Forfeiture Upon Abuse or AUP Breach' },
    { id: 'ref-6', title: '6. Anti-Chargeback Policy & Mandatory $50 Fee' },
    { id: 'ref-7', title: '7. Collections, Legal Fees & Blacklisting' },
    { id: 'ref-8', title: '8. Billing Error Adjustments & Settlement' },
    { id: 'ref-9', title: '9. Invoicing Inquiries & Billing Contact' },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ARCHIVE NOTICE BANNER (IF VIEWING HISTORICAL VERSION) */}
        {dbPolicy && !dbPolicy.isCurrent && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <strong>Historical Archive Notice:</strong> You are viewing archived version{' '}
                <span className="font-mono font-bold">{dbPolicy.version}</span>.
                {dbPolicy.summaryOfChanges && (
                  <span className="block text-xs mt-0.5 text-amber-800 dark:text-amber-300">
                    Reason/Summary: {dbPolicy.summaryOfChanges}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectVersion('')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors cursor-pointer"
            >
              Switch to Live Version
            </button>
          </div>
        )}

        {/* HEADER NOTICE HERO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Billing, Cancellation &amp; Dispute Policy
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Refund &amp; Cancellation Policy
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                Version: {currentDisplayVersion}
              </span>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Effective: {currentDisplayDate}
              </span>
              {versionHistory.length > 1 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedVer}
                    onChange={(e) => handleSelectVersion(e.target.value)}
                    disabled={loadingVer}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Live Version ({versionHistory.find((v) => v.isCurrent)?.version || 'Current'})</option>
                    {versionHistory
                      .filter((v) => !v.isCurrent)
                      .map((v) => (
                        <option key={v.id} value={v.version}>
                          Archive {v.version} ({new Date(v.effectiveAt).toLocaleDateString()})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Analytical Technical Consulting (ATC) (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides high-performance, 
            dedicated enterprise cloud infrastructure. Because cloud compute resources, physical memory allocation, storage arrays, and network routing 
            are reserved exclusively for your instance upon provisioning, this Policy establishes our precise commercial terms regarding cancellations, 
            final-sale provisioning, non-refundable assets, and our zero-tolerance protocol against payment chargebacks.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-3.5 h-3.5" /> All Sales Final Upon Provisioning
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800">
              <ShieldAlert className="w-3.5 h-3.5" /> Strict Anti-Chargeback Clause
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              <CreditCard className="w-3.5 h-3.5" /> PCI-DSS Level 1 Merchant Settlement
            </span>
          </div>
        </div>

        {/* POLICY CONTENT RENDERING (DYNAMIC FROM DB OR STATIC FALLBACK) */}
        {dbPolicy?.content ? (
          <DynamicPolicyRenderer content={dbPolicy.content} policyTitle={dbPolicy.title} />
        ) : (
        /* TWO-COLUMN LAYOUT */
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP STICKY SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-2">
              Financial Sections
            </h3>
            <nav className="space-y-1">
              {tableOfContents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    activeSection === item.id 
                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${activeSection === item.id ? 'translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-300">Billing Department</p>
              <p>For invoice inquiries or cancellation confirmations:</p>
              <a href="mailto:billing@atechconsult.com" className="text-blue-600 dark:text-blue-400 font-bold underline block">
                billing@atechconsult.com
              </a>
            </div>
          </aside>

          {/* MAIN ARTICLES CONTAINER */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

            {/* SECTION 1 */}
            <section id="ref-1" className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">1</span>
                General Cloud Infrastructure Billing Policy
              </h2>
              <p>
                In accordance with standard enterprise cloud infrastructure governance, 
                <strong> all cloud compute resources, virtual machines, block storage volumes, and bandwidth allocations provided by Analytical Technical Consulting (ATC) are billed on a 
                prepaid subscription model and are strictly non-refundable once provisioned</strong>.
              </p>
              <p>
                <strong>Infrastructure Reservation Principle:</strong> When you deploy a virtual machine, our cluster dedicates physical CPU cores, 
                locks dedicated server RAM in physical host memory, provisions SSD storage arrays, and reserves dedicated IP routing through our switches. 
                These resources remain dedicated to your instance whether the guest operating system is actively booted or powered off. 
                Consequently, powered-off instances continue to accrue recurring hosting charges until permanently cancelled or destroyed by Customer.
              </p>
            </section>

            {/* SECTION 2 - NO MONEY-BACK GUARANTEE */}
            <section id="ref-2" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                2. No Money-Back Guarantee &amp; Final Sale Policy
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>ATC does not offer a general money-back guarantee or trial refund period on paid subscriptions.</strong> All orders for virtual private servers, compute packages, storage expansions, and network allocations are final upon order placement and resource reservation.
              </p>
              <div className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong>No Partial-Month Proration:</strong> Unused time remaining in a prepaid monthly or annual billing cycle following a voluntary customer cancellation is non-refundable and will not be prorated.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong>Verified Billing Error Exception:</strong> In the event of a verified duplicate charge or computational billing error attributable solely to ATC&apos;s billing system, Customer may submit a written review request to <a href="mailto:billing@atechconsult.com" className="text-blue-600 underline font-bold">billing@atechconsult.com</a> within seven (7) calendar days of the transaction timestamp. Any billing adjustment or credit is issued strictly at ATC&apos;s sole and absolute discretion.
                </div>
              </div>
            </section>

            {/* SECTION 3 - STRICTLY NON-REFUNDABLE */}
            <section id="ref-3" className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-amber-950 dark:text-amber-300 font-poppins flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                3. Strictly Non-Refundable Products, Licenses &amp; Add-Ons
              </h2>
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-bold uppercase tracking-wide">
                THE FOLLOWING ASSETS INCUR IRREVOCABLE UPSTREAM COSTS AND ARE STRICTLY NON-REFUNDABLE UNDER ALL CIRCUMSTANCES:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Dedicated IPv4 Addresses:</strong>
                  Carrier allocation fees, registry routing costs, and subnet assignment fees are completely non-refundable once provisioned.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Commercial Software &amp; OS Licenses:</strong>
                  Commercial operating system images, control panel licenses, and software add-on licenses cannot be refunded or prorated once issued.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Subscription Renewals:</strong>
                  Subsequent monthly or annual recurring renewal cycles are non-refundable once billed. Cancellations must occur prior to the renewal date.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Engineering &amp; Setup Services:</strong>
                  Custom server migrations, technical consulting hours, hardware sizing, and architectural setup fees are non-refundable once delivered.
                </div>
              </div>
            </section>

            {/* SECTION 4 - CANCELLATION */}
            <section id="ref-4" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">4</span>
                Self-Service Subscription Cancellation Protocol
              </h2>
              <p>
                Customers maintain complete self-service control over their subscriptions. You may cancel any active virtual server or add-on at any time 
                without cancellation penalties directly through the <strong>ATC Client Portal Dashboard</strong> or by submitting written notice to 
                <a href="mailto:billing@atechconsult.com" className="text-blue-600 underline font-semibold ml-1">billing@atechconsult.com</a>.
              </p>
              <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm space-y-2">
                <strong className="text-slate-900 dark:text-white block font-bold">24-Hour Advance Timing Rule:</strong>
                <p>
                  To prevent the automated processing of subscription renewal charges by our payment gateway, cancellation requests must be executed 
                  at least <strong>twenty-four (24) hours prior</strong> to the next scheduled invoice generation date. Once an invoice has been charged, 
                  that billing cycle is deemed active and non-refundable.
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Upon cancellation, Customer&apos;s virtual machine remains operational until the conclusion of the prepaid period, at which point the instance 
                  is cleanly shut down, deleted, and all virtual hard disks sanitized.
                </p>
              </div>
            </section>

            {/* SECTION 5 - FORFEITURE UPON ABUSE */}
            <section id="ref-5" className="space-y-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-rose-950 dark:text-rose-300 font-poppins flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                5. Total Forfeiture of Refunds Upon Abuse or AUP Breach
              </h2>
              <p className="text-xs sm:text-sm text-rose-950 dark:text-rose-200 font-bold uppercase tracking-wide">
                ANY VIOLATION OF OUR ACCEPTABLE USE POLICY (AUP) OR MASTER TERMS OF SERVICE RESULTS IN THE IMMEDIATE, COMPLETE, AND IRREVOCABLE 
                FORFEITURE OF ALL REFUND ELIGIBILITY, UNUSED PREPAID BALANCES, AND SERVICE CREDITS.
              </p>
              <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-300 leading-relaxed">
                If an account or virtual server is suspended, null-routed, or terminated due to Denial of Service (DDoS) activity, unsolicited bulk email (SPAM), 
                malware or botnet hosting, unauthorized crypto-mining, port-scanning, copyright infringement, or fraudulent registration, 
                <strong> UNDER NO CIRCUMSTANCES WILL ANY REFUND BE GRANTED</strong>. Customer shall remain fully liable for any damages, investigation expenses, 
                and carrier penalties incurred by ATC.
              </p>
            </section>

            {/* SECTION 6 - STRICT ANTI-CHARGEBACK CLAUSE */}
            <section id="ref-6" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                6. Mandatory Anti-Chargeback Policy &amp; $50 Administrative Fee
              </h2>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                CUSTOMER COVENANTS THAT CUSTOMER WILL NOT INITIATE A PAYMENT DISPUTE, CHARGEBACK, OR REVERSAL WITH ANY CREDIT CARD ISSUER, BANK, 
                OR PAYMENT PROCESSOR WITHOUT FIRST PROVIDING WRITTEN NOTICE TO BILLING@ATECHCONSULT.COM AND ALLOWING FOURTEEN (14) BUSINESS DAYS 
                FOR ATC TO INVESTIGATE AND AMICABLY RESOLVE THE INQUIRY.
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                Filing an unauthorized, retaliatory, or bad-faith chargeback constitutes a material, non-curable breach of contract. 
                In the event Customer initiates an unjustified chargeback or payment reversal:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                <li><strong>Immediate Server Destruction:</strong> All virtual machines, dedicated IPs, and data volumes associated with the account will be immediately suspended and destroyed without prior notice;</li>
                <li><strong>Mandatory $50.00 Administrative Dispute Fee:</strong> Customer agrees to pay ATC a mandatory Fifty United States Dollar ($50.00 USD) administrative fee per disputed charge to offset merchant bank investigation fines;</li>
                <li><strong>Forfeiture of Service Credits:</strong> Any accumulated account credits, promotional discounts, or SLA allowances are immediately cancelled.</li>
              </ul>
            </section>

            {/* SECTION 7 - COLLECTIONS & LEGAL ENFORCEMENT */}
            <section id="ref-7" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">7</span>
                Collections Enforcement, Legal Fees &amp; Fraud Blacklisting
              </h2>
              <p>
                In the event an unjustified chargeback is initiated or an account balance remains delinquent:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Commercial Debt Collections:</strong> The delinquent balance, accrued interest (at the maximum statutory rate of 1.5% per month), and dispute assessment fees will be referred to licensed commercial debt collection agencies and reported to major credit reporting bureaus;</li>
                <li><strong>Legal Fees Recovery:</strong> Customer agrees to reimburse Analytical Technical Consulting (ATC) for all reasonable attorneys&apos; fees, court costs, and collection expenses incurred by ATC in enforcing its legal rights under this Agreement;</li>
                <li><strong>Global Merchant Blacklisting:</strong> The customer&apos;s legal name, corporate domain, verified telephone number, credit card hash, and IP blocks will be permanently blacklisted across our payment gateway and industry anti-fraud merchant databases.</li>
              </ul>
            </section>

            {/* SECTION 8 - SETTLEMENT TIMELINES */}
            <section id="ref-8" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">8</span>
                Billing Error Adjustments &amp; Settlement Timelines
              </h2>
              <p>
                In the rare event that a billing adjustment or refund is authorized in writing by our Billing Department pursuant to Section 2:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li>Approved adjustments are credited <strong>strictly and exclusively</strong> back to the original payment method (credit/debit card) utilized during checkout. ATC will not issue cash, wire transfers to alternate accounts, or checks;</li>
                <li>Adjustments typically appear on your cardholder bank statement within <strong>five (5) to ten (10) business days</strong> following dispatch, depending upon your financial institution&apos;s settlement schedule;</li>
                <li>A formal credit memorandum and confirmation receipt will be automatically transmitted to your account email address.</li>
              </ul>
            </section>

            {/* SECTION 9 - CONTACT */}
            <section id="ref-9" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">9</span>
                Invoicing Inquiries &amp; Billing Department Contact
              </h2>
              <p>
                If you believe an invoice contains a computational error or requires clarification, submit a formal billing inquiry within 
                thirty (30) calendar days of invoice generation to:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs font-mono space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Billing &amp; Financial Operations Department</p>
                <p>Analytical Technical Consulting (ATC)</p>
                <p>Illinois, United States</p>
                <p>Direct Inquiries: billing@atechconsult.com</p>
              </div>
            </section>

            {/* CORPORATE FOOTER CONTACT */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-300">Analytical Technical Consulting (ATC) Finance &amp; Accounting</p>
              <p>Illinois, United States</p>
              <p>Billing Portal: <a href="mailto:billing@atechconsult.com" className="text-blue-600 underline">billing@atechconsult.com</a></p>
            </div>

          </div>

        </div>
        )}

      </div>
    </div>
  );
}
