import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Globe, UserCheck, FileText, Bell } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "October 17, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Data Protection &amp; Trust</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Global Privacy Policy
                </h1>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Effective Date: {lastUpdated}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Analytical Technical Consulting Inc. (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to 
            protecting the privacy and security of your personal data. This Global Privacy Policy outlines the standards, procedures, 
            and legal safeguards we observe under the California Consumer Privacy Act (CCPA/CPRA), the General Data Protection Regulation (GDPR), 
            and federal United States data protection principles when you interact with our websites, client portals, APIs, and cloud hosting infrastructure.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-3.5 h-3.5" /> PCI-DSS Level 1 Tokenized Billing
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
              <Globe className="w-3.5 h-3.5" /> Zero Selling of Personal Data
            </span>
          </div>
        </div>

        {/* POLICY ARTICLES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

          {/* ARTICLE 1 */}
          <section id="article-1" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">1</span>
              Categories of Information We Collect
            </h2>
            <p>
              We collect information strictly necessary to provide, bill, secure, and operate enterprise cloud infrastructure. This information falls into the following categories:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">A. Account Identity Data</strong>
                Full legal name, company/organization name, email address, physical billing address, telephone number, and hashed authentication credentials (passwords are irreversibly hashed using industry-standard bcrypt algorithms).
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">B. Infrastructure &amp; Technical Logs</strong>
                Customer IP addresses, hypervisor performance telemetry (CPU, RAM, bandwidth usage), firewall access logs, hypervisor console session metadata, and system diagnostic errors.
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">C. Payment &amp; Transaction Records</strong>
                Card brand, card expiration month/year, last 4 digits of payment card, transaction IDs, tax identifiers, and invoicing history. (See Article 3 regarding raw credit card numbers).
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <strong className="text-slate-900 dark:text-white block mb-1">D. Support &amp; Communications</strong>
                Transcripts of technical support tickets, email inquiries, customer service records, and phone consultation notes.
              </div>
            </div>
          </section>

          {/* ARTICLE 2 */}
          <section id="article-2" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">2</span>
              Lawful Basis &amp; Purpose of Processing
            </h2>
            <p>
              Under global data privacy laws, ATC processes your information pursuant to clear lawful bases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
              <li><strong>Contractual Performance:</strong> To provision your Hyper-V virtual machines, allocate dedicated IP blocks, assign storage volumes, process invoice settlements, and deliver technical support.</li>
              <li><strong>Legitimate Interests:</strong> To detect, mitigate, and defend against network abuse, DDoS attacks, port scanning, fraudulent transactions, bot activity, and infrastructure vulnerabilities.</li>
              <li><strong>Legal Compliance:</strong> To satisfy corporate accounting, tax reporting (IRS), and statutory records retention mandates under United States federal and Illinois state law.</li>
              <li><strong>Consent:</strong> For opt-in transactional notifications, maintenance alerts, or customer satisfaction reviews (which you may withdraw at any time).</li>
            </ul>
          </section>

          {/* ARTICLE 3 - PAYMENT SECURITY */}
          <section id="article-3" className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-6 sm:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-300 font-poppins flex items-center gap-3">
              <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              3. Payment Card Data &amp; PCI-DSS Level 1 Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 font-semibold">
              ATC DOES NOT RECEIVE, PROCESS, STORE, OR TRANSMIT RAW CREDIT CARD NUMBERS, CVV SECURITY CODES, OR CARD TRACK DATA ON OUR SERVERS.
            </p>
            <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 leading-relaxed">
              All payment transactions are handled through our certified payment partner, <strong>Stripe Inc.</strong>, a certified 
              PCI-DSS Level 1 Service Provider. Payment card details entered via our checkout interface are tokenized directly within 
              Stripe&apos;s isolated, encrypted environment via Stripe Elements. ATC only retains an encrypted customer reference token, 
              card brand, and the last four digits of the card for invoice generation and recurring billing identification.
            </p>
          </section>

          {/* ARTICLE 4 */}
          <section id="article-4" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">4</span>
              Customer Virtual Machine Content &amp; Confidentiality
            </h2>
            <p>
              ATC operates as a neutral infrastructure provider. Customer retains 100% ownership and copyright of all software, databases, 
              proprietary code, web applications, and digital assets deployed within Customer&apos;s allocated virtual machines (&quot;Guest Content&quot;).
            </p>
            <p>
              ATC personnel do NOT monitor, inspect, audit, or access the internal file systems or guest operating systems of your virtual machines 
              unless: (a) explicitly requested in writing by Customer to resolve a critical technical support ticket; or (b) strictly compelled to 
              comply with a valid, non-appealable United States federal or state court search warrant or subpoena.
            </p>
          </section>

          {/* ARTICLE 5 - DATA RETENTION & SANITIZATION */}
          <section id="article-5" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">5</span>
              Data Retention &amp; Hardware Sanitization
            </h2>
            <p>
              We retain account data for the duration of your active customer relationship, and for up to seven (7) years following account 
              termination to comply with statutory legal, tax, accounting, and anti-fraud regulations.
            </p>
            <p>
              <strong>Virtual Hard Disk Sanitization:</strong> When a virtual private server is destroyed, cancelled, or reclaimed due to 
              non-payment, the underlying virtual hard disk files (VHDX) are permanently unlinked and destroyed from our storage area networks (SAN) 
              and NVMe datastores. De-allocated storage blocks are zeroed prior to re-allocation in compliance with NIST SP 800-88 Revision 1 guidelines.
            </p>
          </section>

          {/* ARTICLE 6 - DISCLOSURE POLICY */}
          <section id="article-6" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
              6. Information Sharing &amp; Third-Party Disclosures
            </h2>
            <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
              ANALYTICAL TECHNICAL CONSULTING INC. DOES NOT SELL, RENT, LEASE, OR TRADE YOUR PERSONAL DATA TO THIRD PARTIES OR DATA BROKERS FOR COMMERCIAL OR MARKETING PURPOSES.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed">
              We share personal data exclusively with vetted service providers operating under strict confidentiality and data protection agreements:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li><strong>Payment Processors:</strong> Stripe Inc., for payment settlement and fraud detection;</li>
              <li><strong>Transit &amp; Telecommunications Carriers:</strong> For routing and IP block allocation;</li>
              <li><strong>Law Enforcement &amp; Legal Authorities:</strong> ONLY when legally compelled by a valid court order, subpoena, or search warrant issued by a United States federal or state court possessing competent jurisdiction. ATC scrutinizes every legal demand to verify its lawful authority before disclosure.</li>
            </ul>
          </section>

          {/* ARTICLE 7 - RIGHTS */}
          <section id="article-7" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">7</span>
              Your Global Privacy Rights (GDPR &amp; CCPA/CPRA)
            </h2>
            <p>
              Depending on your state or national residency, you may possess specific legal rights regarding your personal information:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-1">Right to Access &amp; Portability:</strong>
                Request a structured export of the personal information ATC maintains regarding your account.
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-1">Right to Correction (Rectification):</strong>
                Request modification of incomplete or inaccurate profile, billing, or contact data.
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-1">Right to Deletion (Erasure):</strong>
                Request deletion of your personal data, subject to statutory tax and financial audit retention requirements.
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-1">Non-Discrimination:</strong>
                ATC will never deny services, charge differential pricing, or provide inferior hosting quality for exercising your privacy rights.
              </div>
            </div>
            <p className="text-xs text-slate-500">
              To exercise these statutory rights, please submit a verifiable consumer request to <a href="mailto:privacy@atechconsult.com" className="text-blue-600 underline font-semibold">privacy@atechconsult.com</a>. We will respond within forty-five (45) calendar days.
            </p>
          </section>

          {/* ARTICLE 8 */}
          <section id="article-8" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">8</span>
              Protection of Minors
            </h2>
            <p>
              Our cloud infrastructure, VPS portal, and consulting services are directed exclusively to business enterprises and adult individuals 
              aged eighteen (18) years or older. We do not knowingly solicit or collect personal information from individuals under the age of eighteen. 
              If we discover that a minor has provided us with personal data, we will immediately delete such information and terminate the associated account.
            </p>
          </section>

          {/* ARTICLE 9 */}
          <section id="article-9" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">9</span>
              Policy Updates &amp; Amendments
            </h2>
            <p>
              ATC reserves the right to amend or update this Global Privacy Policy periodically to reflect technological changes, statutory legal developments, 
              or updates to our cloud infrastructure architecture. All modifications become effective upon publication on our website. 
              We encourage you to review this policy periodically.
            </p>
          </section>

          {/* PRIVACY OFFICER FOOTER */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-300">Data Protection Officer &amp; Privacy Compliance</p>
            <p>Analytical Technical Consulting Inc.</p>
            <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
            <p>Privacy Inquiries: <a href="mailto:privacy@atechconsult.com" className="text-blue-600 underline">privacy@atechconsult.com</a> | General: <a href="mailto:info@atechconsult.com" className="text-blue-600 underline">info@atechconsult.com</a></p>
          </div>

        </div>

      </div>
    </div>
  );
}
