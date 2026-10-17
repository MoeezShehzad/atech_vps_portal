import React from 'react';
import { DollarSign, AlertCircle, RefreshCw, XCircle, CheckCircle2, ShieldAlert, CreditCard, Mail } from 'lucide-react';

export default function RefundPolicy() {
  const lastUpdated = "October 17, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Financial Terms</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Refund, Cancellation &amp; Dispute Policy
                </h1>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Effective Date: {lastUpdated}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Analytical Technical Consulting Inc. (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) strives to deliver 
            uncompromising cloud infrastructure, enterprise hypervisor performance, and high-availability hosting. 
            This Refund, Cancellation &amp; Dispute Policy delineates the exact commercial terms governing cancellations, refund eligibility, 
            non-refundable infrastructure resources, and our strict dispute resolution protocols.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> 7-Day Money-Back Guarantee (First-Time VPS Orders)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-medium border border-rose-200 dark:border-rose-800">
              <ShieldAlert className="w-3.5 h-3.5" /> Strict Anti-Chargeback Policy
            </span>
          </div>
        </div>

        {/* POLICY SECTIONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

          {/* SECTION 1 - 7-DAY MONEY BACK */}
          <section id="section-1" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">1</span>
              7-Day Money-Back Guarantee
            </h2>
            <p>
              We provide a <strong>7-Day Money-Back Guarantee</strong> on new, first-time virtual private server (VPS) compute subscriptions. 
              If you are not entirely satisfied with the performance or reliability of your cloud instance within the first seven (7) calendar days 
              following your initial service provisioning timestamp, you may request a full refund of your base VPS subscription fee.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white">Eligibility Criteria for 7-Day Guarantee:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Applies strictly to <strong>first-time customers</strong> ordering their first VPS instance.</li>
                <li>Refund request must be submitted via email to <a href="mailto:billing@atechconsult.com" className="text-blue-600 underline">billing@atechconsult.com</a> within exactly 168 hours (7 days) of the initial provisioning date.</li>
                <li>The customer&apos;s account must be in good standing, with zero billing defaults.</li>
                <li>The virtual machine must NOT have engaged in any violation of our Acceptable Use Policy (AUP).</li>
              </ul>
            </div>
          </section>

          {/* SECTION 2 - NON-REFUNDABLE ASSETS */}
          <section id="section-2" className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-amber-950 dark:text-amber-300 font-poppins flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              2. Non-Refundable Products, Add-Ons &amp; Services
            </h2>
            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-semibold">
              The following products and services incur irrevocable upstream provider costs and administrative allocation overhead upon order placement, and are STRICTLY NON-REFUNDABLE under all circumstances:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <strong>Dedicated IPv4 Addresses:</strong> Allocation and ARIN registry routing fees are non-refundable once allocated to your network interface.
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <strong>Software &amp; OS Licenses:</strong> Commercial operating system licenses (Microsoft Windows Server), control panels (cPanel/Plesk), or proprietary add-ons.
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <strong>Subscription Renewals:</strong> Monthly or annual recurring billing renewals are non-refundable once the billing renewal cycle executes.
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <strong>Consulting &amp; Setup Services:</strong> Custom infrastructure architecture, hardware sizing, database migration, or engineering hours performed by ATC specialists.
              </div>
            </div>
          </section>

          {/* SECTION 3 - CANCELLATION */}
          <section id="section-3" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">3</span>
              Subscription Cancellation Procedure
            </h2>
            <p>
              Customers may cancel their subscription at any time without penalty or termination fee directly through the 
              <strong> ATC Client Portal Dashboard</strong> or by dispatching written notice to <a href="mailto:billing@atechconsult.com" className="text-blue-600 underline">billing@atechconsult.com</a>.
            </p>
            <p>
              <strong>Timing Requirement:</strong> To prevent automatic subscription renewal charges, cancellation requests must be executed 
              at least <strong>twenty-four (24) hours prior</strong> to the scheduled renewal invoice execution date. Once an automated renewal 
              charge has been processed by our payment gateway, that billing cycle is deemed active and non-refundable.
            </p>
            <p className="text-xs text-slate-500">
              Upon cancellation, Customer&apos;s virtual machine will remain accessible until the exact end of the paid billing period, at which 
              point the instance will be shut down and permanently deleted from our NVMe storage clusters.
            </p>
          </section>

          {/* SECTION 4 - VOID OF REFUND UPON AUP BREACH */}
          <section id="section-4" className="space-y-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-rose-950 dark:text-rose-300 font-poppins flex items-center gap-3">
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              4. Immediate Forfeiture of Refunds Upon Abuse
            </h2>
            <p className="text-xs sm:text-sm text-rose-950 dark:text-rose-200 font-semibold">
              ANY VIOLATION OF OUR ACCEPTABLE USE POLICY (AUP) OR MASTER TERMS OF SERVICE RESULTS IN THE IMMEDIATE, UNCONDITIONAL FORFEITURE 
              OF ALL REFUND ELIGIBILITY, SERVICE CREDITS, AND PREPAID BALANCES.
            </p>
            <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-300 leading-relaxed">
              If an account or virtual server is suspended, null-routed, or terminated as a result of Denial of Service (DDoS) activity, 
              unsolicited mass email (SPAM), malware distribution, network port scanning, brute-force attacks, copyright infringement, 
              or illegal content hosting, NO REFUND WILL BE ISSUED UNDER ANY CIRCUMSTANCES.
            </p>
          </section>

          {/* SECTION 5 - STRICT CHARGEBACK & DISPUTE POLICY */}
          <section id="section-5" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              5. Mandatory Pre-Dispute Notice &amp; Anti-Chargeback Policy
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              CUSTOMER EXPRESSLY AGREES TO CONTACT ANALYTICAL TECHNICAL CONSULTING INC. IN WRITING AT BILLING@ATECHCONSULT.COM AND PROVIDE A 
              MINIMUM OF FOURTEEN (14) BUSINESS DAYS TO INVESTIGATE AND RESOLVE ANY BILLING DISCREPANCY BEFORE FILING A CHARGEBACK OR PAYMENT DISPUTE 
              WITH ANY CREDIT CARD ISSUER, BANK, OR PAYMENT PROCESSOR.
            </p>
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
              <p>
                Initiating an unauthorized, fraudulent, or retaliatory chargeback without prior written notice represents a material breach 
                of this contract. In the event Customer initiates a chargeback or payment reversal:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Immediate Service Termination:</strong> All cloud virtual machines, IP addresses, and customer data associated with the account will be immediately suspended and scheduled for permanent destruction without notice.</li>
                <li><strong>Administrative Chargeback Fee:</strong> Customer agrees that ATC shall levy a mandatory <strong>Fifty United States Dollar ($50.00 USD)</strong> administrative dispute processing fee per disputed charge to offset bank assessment fees.</li>
                <li><strong>Collections &amp; Legal Enforcement:</strong> Delinquent chargeback balances, administrative fees, and any damages incurred by ATC will be submitted to third-party commercial debt collection agencies and reported to major credit reporting bureaus. Customer shall be liable for all reasonable legal fees and collection expenses.</li>
                <li><strong>Permanent Fraud Blacklisting:</strong> The customer&apos;s identity, email domain, and IP addresses will be permanently blacklisted across our merchant network and industry anti-fraud registries.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 6 - REFUND PROCESSING TIMELINE */}
          <section id="section-6" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">6</span>
              Refund Processing Timelines &amp; Method
            </h2>
            <p>
              Once a refund request is authorized by our billing department:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
              <li>Refunds are credited <strong>strictly and exclusively</strong> back to the original Stripe payment method (credit card, debit card) used during checkout. We do not issue cash refunds or redirect refunds to third-party bank accounts.</li>
              <li>Refund processing through the banking networks typically requires between <strong>five (5) and ten (10) business days</strong> to reflect on your cardholder statement, depending on your card issuer&apos;s settlement schedule.</li>
              <li>A formal credit invoice and Stripe refund confirmation receipt will be automatically transmitted to your primary account email.</li>
            </ul>
          </section>

          {/* BILLING INQUIRIES FOOTER */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-300">Analytical Technical Consulting Inc. Billing &amp; Accounting Department</p>
            <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
            <p>Billing &amp; Refund Inquiries: <a href="mailto:billing@atechconsult.com" className="text-blue-600 underline">billing@atechconsult.com</a> | Telephone: +1 630-696-7721</p>
          </div>

        </div>

      </div>
    </div>
  );
}
