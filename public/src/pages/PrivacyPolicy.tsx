import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Eye, Database, Globe, UserCheck, 
  FileText, Bell, ChevronRight, Server, CheckCircle2 
} from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "October 17, 2026";
  const [activeSection, setActiveSection] = useState('priv-1');

  const tableOfContents = [
    { id: 'priv-1', title: '1. Commitment & Regulatory Scope' },
    { id: 'priv-2', title: '2. Distinction: Customer Content vs Account Data' },
    { id: 'priv-3', title: '3. Categories of Personal Data Collected' },
    { id: 'priv-4', title: '4. Lawful Bases for Processing' },
    { id: 'priv-5', title: '5. Payment Card Processing & PCI-DSS' },
    { id: 'priv-6', title: '6. Telemetry, Network Logs & Security' },
    { id: 'priv-7', title: '7. Subprocessors & Third-Party Sharing' },
    { id: 'priv-8', title: '8. Absolute Zero Sale of Personal Data' },
    { id: 'priv-9', title: '9. Law Enforcement & Subpoena Guidelines' },
    { id: 'priv-10', title: '10. Data Retention & NIST 800-88 Sanitization' },
    { id: 'priv-11', title: '11. Your Statutory Privacy Rights (GDPR & CCPA)' },
    { id: 'priv-12', title: '12. Cookies, Tracking & GPC Signals' },
    { id: 'priv-13', title: '13. Cross-Border Data Transfers' },
    { id: 'priv-14', title: '14. Security Safeguards & Encryption' },
    { id: 'priv-15', title: '15. Protection of Minors' },
    { id: 'priv-16', title: '16. Revisions & Data Protection Officer' },
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
        
        {/* HEADER NOTICE HERO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Global Privacy Statement
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Privacy Policy
                </h1>
              </div>
            </div>
            <div className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Revision: 2026.4 • Effective: {lastUpdated}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Analytical Technical Consulting Inc. (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to 
            protecting the privacy and confidentiality of our customers&apos; information. This Privacy Policy details the standards, practices, 
            and technical controls governing the collection, utilization, disclosure, retention, and cryptographic disposal of personal data across 
            our websites, APIs, and cloud hosting infrastructure pursuant to the California Consumer Privacy Act (CCPA/CPRA), General Data Protection 
            Regulation (GDPR/UK GDPR), and applicable United States privacy statutes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-3.5 h-3.5" /> PCI-DSS Level 1 Tokenization
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <Globe className="w-3.5 h-3.5" /> Zero Selling or Renting of Data
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              <Database className="w-3.5 h-3.5" /> NIST SP 800-88 Sanitization
            </span>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP STICKY SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-2">
              Privacy Articles
            </h3>
            <nav className="space-y-1">
              {tableOfContents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    activeSection === item.id 
                      ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${activeSection === item.id ? 'translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-300">Data Protection Officer</p>
              <p>For data export, deletion, or privacy verification:</p>
              <a href="mailto:privacy@atechconsult.com" className="text-emerald-600 dark:text-emerald-400 font-bold underline block">
                privacy@atechconsult.com
              </a>
            </div>
          </aside>

          {/* MAIN ARTICLES CONTAINER */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

            {/* SECTION 1 */}
            <section id="priv-1" className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">1</span>
                Commitment, Scope &amp; Applicable Laws
              </h2>
              <p>
                This Privacy Policy applies to all services provided by <strong>Analytical Technical Consulting Inc.</strong> (&quot;ATC&quot;), 
                having its corporate headquarters and primary operations in Bolingbrook, Illinois, United States. 
                Whether you access our services as an individual developer, commercial enterprise, or institutional subscriber, 
                we process your personal data strictly in conformity with applicable international and state data protection frameworks, including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li>The European Union General Data Protection Regulation (Regulation (EU) 2016/679, &quot;GDPR&quot;) and the UK GDPR;</li>
                <li>The California Consumer Privacy Act as amended by the California Privacy Rights Act (Cal. Civ. Code § 1798.100 et seq., &quot;CCPA/CPRA&quot;);</li>
                <li>State privacy acts in Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), and Utah (UCPA); and</li>
                <li>United States federal telecommunications and data confidentiality regulations.</li>
              </ul>
            </section>

            {/* SECTION 2 - CRITICAL DISTINCTION */}
            <section id="priv-2" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <Server className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                2. Fundamental Distinction: Customer Content vs. Account Data
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed">
                Like Tier-1 infrastructure providers (DigitalOcean, AWS, Linode), ATC maintains a rigorous operational distinction between:
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">A. Customer Content (Data Controller: Customer):</strong>
                  Any files, code, software, databases, applications, or personal data stored within, processed by, or transmitted across 
                  Customer&apos;s provisioned virtual private servers or NVMe storage blocks. 
                  <strong> ATC DOES NOT INSPECT, ACCESS, AUDIT, SHARE, OR SELL CUSTOMER CONTENT</strong>. Customer remains the sole Data Controller 
                  under GDPR/CCPA for all data stored within their virtual machines. ATC acts strictly as a neutral Data Processor.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">B. Account &amp; Telemetry Data (Data Controller: ATC):</strong>
                  Information collected directly from Customer to create, authenticate, bill, secure, and deliver the Services (such as name, 
                  email address, IP access logs, and billing tokens). This policy governs our collection and processing of Account &amp; Telemetry Data.
                </div>
              </div>
            </section>

            {/* SECTION 3 */}
            <section id="priv-3" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">3</span>
                Categories of Information We Collect
              </h2>
              <p>
                We collect personal information directly from you when you register, order services, open a support ticket, or interact with our portal:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Identity &amp; Contact Data:</strong> Full legal name, corporate business entity, physical billing address, telephone number, verified email address, and username;</li>
                <li><strong>Authentication Security Credentials:</strong> Cryptographically salted and hashed passwords (using industry-standard bcrypt/argon2), SSH public keys uploaded by customer, and session tokens;</li>
                <li><strong>Billing &amp; Tax Information:</strong> Payment card brand, last four digits of card, expiration month/year, Stripe billing reference token, VAT/tax identification numbers, and transactional payment history;</li>
                <li><strong>Technical &amp; Telemetry Metadata:</strong> Internet Protocol (IP) addresses used to access the portal, browser type, operating system, hypervisor hyper-call latency, bandwidth consumption, CPU/RAM utilization metrics, and hardware node uptime logs.</li>
              </ul>
            </section>

            {/* SECTION 4 */}
            <section id="priv-4" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">4</span>
                Lawful Bases for Data Processing
              </h2>
              <p>Under GDPR and global privacy frameworks, ATC processes personal data pursuant to clearly defined lawful bases:</p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Contractual Necessity:</strong>
                  To provision virtual compute resources, allocate dedicated networking IPs, invoice accounts, and fulfill obligations under our Terms of Service.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Legitimate Business Interests:</strong>
                  To safeguard infrastructure stability, defend against DDoS attacks, detect fraud, monitor network perimeter firewalls, and prevent abusive bot behavior.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Legal Obligation:</strong>
                  To satisfy federal and state tax reporting, commercial accounting standards, and statutory records retention requirements.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Customer Consent:</strong>
                  Where you voluntarily opt in to non-essential communications, scheduled maintenance newsletters, or optional beta test programs.
                </div>
              </div>
            </section>

            {/* SECTION 5 - PAYMENT TOKENIZATION */}
            <section id="priv-5" className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-300 font-poppins flex items-center gap-3">
                <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                5. Payment Card Processing &amp; PCI-DSS Level 1 Guarantee
              </h2>
              <div className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 font-bold uppercase tracking-wide">
                ATC DOES NOT RECEIVE, PROCESS, STORE, OR TRANSMIT RAW CREDIT CARD NUMBERS, CVV SECURITY CODES, OR CARD TRACK DATA ON OUR HOSTS.
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 leading-relaxed">
                All payment transactions are conducted through our certified payment processor, <strong>Stripe Inc.</strong>, an audited 
                PCI-DSS Level 1 Service Provider. Payment card data entered via our portal checkout interface is ingested directly into Stripe&apos;s 
                hardened vault via encrypted Stripe Elements frames. ATC receives and maintains only a tokenized customer identifier, payment method ID, 
                card brand, and the last 4 digits of the payment instrument for billing records and recurring invoice generation.
              </p>
            </section>

            {/* SECTION 6 */}
            <section id="priv-6" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">6</span>
                Telemetry, Network Logs &amp; Perimeter Defense
              </h2>
              <p>
                To safeguard our high-performance cluster and maintain network availability, ATC automatically captures and retains operational log telemetry:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li><strong>Firewall &amp; Flow Logs:</strong> Inbound and outbound packet flows, port hits, SYN rates, and dropped packet telemetry to detect and deflect volumetric DDoS attacks;</li>
                <li><strong>Hypervisor Health Logs:</strong> Virtual machine state transitions (start, stop, reboot, snapshot, rebuild) and resource allocations to diagnose hardware faults;</li>
                <li><strong>Console &amp; API Audits:</strong> Web console connections, API token requests, and administrative actions for security auditing and accountability.</li>
              </ul>
              <p className="text-xs text-slate-500">
                Telemetry logs are retained for a rolling ninety (90) calendar days for security and forensic analysis, after which they are automatically expunged.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="priv-7" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">7</span>
                Subprocessors &amp; Controlled Third-Party Disclosures
              </h2>
              <p>
                ATC utilizes only vetted, industry-leading subprocessors who operate under strict Data Processing Agreements (DPAs) 
                mandating confidentiality and security standards equivalent to our own:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block">Stripe Inc. (United States):</strong>
                  Payment processing, subscription billing, and fraud mitigation.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block">Sophos &amp; Cisco Systems:</strong>
                  Hardware perimeter firewall defense and stateful intrusion prevention.
                </div>
              </div>
            </section>

            {/* SECTION 8 - ZERO SALE OF DATA */}
            <section id="priv-8" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                8. Absolute Zero Sale or Rental of Personal Information
              </h2>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                ANALYTICAL TECHNICAL CONSULTING INC. HAS NEVER SOLD, DOES NOT SELL, AND WILL NEVER SELL, RENT, LEASE, OR TRADE YOUR PERSONAL INFORMATION, 
                CUSTOMER CONTENT, TELEMETRY, OR IP USAGE TO THIRD PARTIES, DATA BROKERS, OR ADVERTISERS FOR MONETARY OR OTHER VALUABLE CONSIDERATION.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">
                We do not engage in cross-context behavioral advertising. Pursuant to California Civil Code § 1798.120, Customer does not need 
                to submit an opt-out request because ATC does not engage in the sale of personal information under any circumstance.
              </p>
            </section>

            {/* SECTION 9 - LAW ENFORCEMENT */}
            <section id="priv-9" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">9</span>
                Government, Subpoena &amp; Law Enforcement Request Guidelines
              </h2>
              <p>
                ATC is committed to protecting customer confidentiality. ATC scrutinizes every government and law enforcement demand for customer records 
                to ensure strict conformity with constitutional standards and statutory authority:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Judicial Process Required:</strong> ATC will NOT disclose Customer Content or account data without valid, binding legal process—such as a subpoena, court order signed by a judge of competent jurisdiction, or search warrant issued under the Federal Rules of Criminal Procedure or state equivalent;</li>
                <li><strong>No Warrantless or Foreign Disclosures:</strong> Non-U.S. government entities must follow established international Mutual Legal Assistance Treaties (MLAT) or formal letters rogatory;</li>
                <li><strong>Notice to Customer:</strong> Unless explicitly prohibited by a valid statutory non-disclosure gag order issued under 18 U.S.C. § 2705(b), ATC will notify Customer in writing prior to disclosing account information to allow Customer an opportunity to challenge the legal process.</li>
              </ul>
            </section>

            {/* SECTION 10 - DATA RETENTION & SANITIZATION */}
            <section id="priv-10" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                10. Data Retention &amp; NIST SP 800-88 Storage Sanitization
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed">
                We retain account identification records for the duration of your active subscription, and for up to seven (7) years following 
                account closure strictly to satisfy statutory tax, IRS accounting, and anti-fraud reporting mandates.
              </p>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 mt-2 text-xs sm:text-sm">
                <strong className="text-slate-900 dark:text-white block mb-1">Cryptographic &amp; Block-Level Sanitization:</strong>
                When Customer destroys an instance or when an account is terminated, the underlying virtual hard disk files (VHDX) are permanently unlinked. 
                De-allocated storage blocks across our NVMe arrays are zero-filled and cryptographically purged in compliance with 
                <strong> NIST Special Publication 800-88 Revision 1 (Guidelines for Media Sanitization)</strong>. Once erased, customer data cannot be retrieved by any party.
              </div>
            </section>

            {/* SECTION 11 - STATUTORY RIGHTS */}
            <section id="priv-11" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">11</span>
                Your Statutory Privacy Rights (GDPR &amp; CCPA/CPRA)
              </h2>
              <p>Depending on your jurisdiction, you possess enforceable legal rights regarding your personal data:</p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block">Right to Know &amp; Access:</strong>
                  Request details regarding the categories and specific pieces of personal information ATC maintains about you.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block">Right to Rectification:</strong>
                  Correct inaccurate, outdated, or incomplete account and contact data.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block">Right to Erasure (Deletion):</strong>
                  Request deletion of your personal data, subject to legal compliance and statutory retention requirements.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block">Right to Non-Discrimination:</strong>
                  ATC will never deny service, charge differential rates, or downgrade hosting quality for exercising privacy rights.
                </div>
              </div>
              <p className="text-xs text-slate-500">
                To submit a verifiable consumer request, contact our compliance office at <a href="mailto:privacy@atechconsult.com" className="text-emerald-600 underline font-semibold">privacy@atechconsult.com</a>. We respond within forty-five (45) calendar days.
              </p>
            </section>

            {/* SECTION 12 */}
            <section id="priv-12" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">12</span>
                Cookies, Session Storage &amp; Global Privacy Control (GPC)
              </h2>
              <p>
                Our portal utilizes strictly essential first-party authentication session cookies required to verify login state and protect against 
                Cross-Site Request Forgery (CSRF). We do not deploy third-party advertising tracking cookies. We honor Global Privacy Control (GPC) 
                and Do Not Track (DNT) browser signals.
              </p>
            </section>

            {/* SECTION 13 */}
            <section id="priv-13" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">13</span>
                Cross-Border International Data Transfers
              </h2>
              <p>
                ATC hosts infrastructure within the United States. If you access our services from the European Economic Area (EEA), United Kingdom, 
                or Switzerland, your account information will be transferred to and processed in the United States. Where required by GDPR, 
                we execute European Commission Standard Contractual Clauses (SCCs) to ensure equivalent data protection.
              </p>
            </section>

            {/* SECTION 14 */}
            <section id="priv-14" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">14</span>
                Enterprise Security Safeguards
              </h2>
              <p>
                We enforce multi-tiered defense-in-depth security measures to protect your account information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li>Mandatory TLS 1.3 encryption across all web traffic and API endpoints;</li>
                <li>Hypervisor hardware-enforced memory isolation and virtualization protection;</li>
                <li>Perimeter stateful packet inspection firewalls, rate limiting, and intrusion detection systems;</li>
                <li>Physical access controls and biometric data center perimeter security.</li>
              </ul>
            </section>

            {/* SECTION 15 */}
            <section id="priv-15" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">15</span>
                Protection of Minors
              </h2>
              <p>
                Our services are directed strictly to commercial enterprises and adult individuals aged eighteen (18) years or older. 
                We do not knowingly collect personal data from minors under 18. Any account identified as belonging to a minor will be terminated 
                and all associated personal data immediately expunged.
              </p>
            </section>

            {/* SECTION 16 */}
            <section id="priv-16" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">16</span>
                Policy Amendments &amp; Data Protection Officer Contact
              </h2>
              <p>
                ATC reserves the right to amend this Privacy Policy periodically. Modifications take effect upon posting to our portal. 
                If you have inquiries regarding this policy or wish to exercise statutory data rights, contact our Data Protection Officer at:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs font-mono space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Data Protection Officer — Privacy Compliance</p>
                <p>Analytical Technical Consulting Inc.</p>
                <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
                <p>Direct Email: privacy@atechconsult.com • General: info@atechconsult.com</p>
              </div>
            </section>

            {/* CORPORATE FOOTER CONTACT */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-300">Analytical Technical Consulting Inc. Data Privacy Office</p>
              <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
              <p>Telephone: +1 630-696-7721 • Email: privacy@atechconsult.com</p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
