import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Eye, Database, Globe, UserCheck, 
  FileText, Bell, ChevronRight, Server, CheckCircle2, KeyRound,
  ShieldAlert, HardDrive, Cpu, Terminal
} from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "October 17, 2026";
  const [activeSection, setActiveSection] = useState('atcpriv-1');

  const tableOfContents = [
    { id: 'atcpriv-1', title: '1. Institutional Scope & Regulatory Jurisdiction' },
    { id: 'atcpriv-2', title: '2. The Four Foundational Privacy Commitments' },
    { id: 'atcpriv-3', title: '3. Customer Data vs Account Data Demarcation' },
    { id: 'atcpriv-4', title: '4. Information We Collect' },
    { id: 'atcpriv-5', title: '5. Lawful Bases for Processing' },
    { id: 'atcpriv-6', title: '6. Payment Processing & PCI-DSS Level 1' },
    { id: 'atcpriv-7', title: '7. Infrastructure Telemetry & Perimeter Security' },
    { id: 'atcpriv-8', title: '8. Controlled Subprocessors & Third Parties' },
    { id: 'atcpriv-9', title: '9. Absolute Prohibition on Sale of Data' },
    { id: 'atcpriv-10', title: '10. Government Demands & Subpoena Scrutiny' },
    { id: 'atcpriv-11', title: '11. Cryptographic Erasure & NIST SP 800-88' },
    { id: 'atcpriv-12', title: '12. Global Privacy Rights (GDPR & CCPA/CPRA)' },
    { id: 'atcpriv-13', title: '13. Essential Cookies & GPC Signal Handling' },
    { id: 'atcpriv-14', title: '14. Security Safeguards & Defense-in-Depth' },
    { id: 'atcpriv-15', title: '15. Protection of Minors' },
    { id: 'atcpriv-16', title: '16. Data Protection Officer & Legal Notices' },
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
        
        {/* PRIVACY HERO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Analytical Technical Consulting Inc. • Enterprise Privacy Architecture
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Cloud Privacy Notice
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Framework: ATC-DPA 2026.4
              </span>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Effective: {lastUpdated}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            At <strong>Analytical Technical Consulting Inc.</strong> (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), 
            we operate our enterprise cloud infrastructure under rigorous data privacy, sovereignty, and trust commitments. 
            This Cloud Privacy Notice delineates how we handle, process, and secure Customer Data and Account Information across our Microsoft Hyper-V 
            virtualization clusters, NVMe block storage networks, APIs, and portals in compliance with GDPR, UK GDPR, CCPA/CPRA, and federal U.S. data protection statutes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Customer Data Sovereignty (You Own Your Data)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <Lock className="w-3.5 h-3.5" /> PCI-DSS Level 1 Tokenized Billing
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              <Database className="w-3.5 h-3.5" /> NIST SP 800-88 Cryptographic Sanitization
            </span>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP STICKY SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-2">
              Privacy Notice Articles
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
              <p>For GDPR/CCPA verifications or subpoena requests:</p>
              <a href="mailto:privacy@atechconsult.com" className="text-emerald-600 dark:text-emerald-400 font-bold underline block">
                privacy@atechconsult.com
              </a>
            </div>
          </aside>

          {/* MAIN ARTICLES CONTAINER */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

            {/* SECTION 1 */}
            <section id="atcpriv-1" className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">1</span>
                Institutional Scope &amp; Regulatory Jurisdiction
              </h2>
              <p>
                This Cloud Privacy Notice applies to all cloud infrastructure services provided by <strong>Analytical Technical Consulting Inc.</strong>, 
                an Illinois corporation with its primary data center and operational facility located at 
                <strong> 1360 Brentwood Trl, Bolingbrook, IL 60490, United States</strong>.
              </p>
              <p>
                This policy establishes institutional transparency regarding our data handling pursuant to the European Union General Data Protection 
                Regulation (Regulation (EU) 2016/679, &quot;GDPR&quot;), the UK Data Protection Act 2018, the California Consumer Privacy Act as amended by the 
                California Privacy Rights Act (Cal. Civ. Code § 1798.100 et seq., &quot;CCPA/CPRA&quot;), and comprehensive state privacy statutes in Virginia, 
                Colorado, Connecticut, and Utah.
              </p>
            </section>

            {/* SECTION 2 - THE FOUR FOUNDATIONAL COMMITMENTS */}
            <section id="atcpriv-2" className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-300 font-poppins flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                2. ATC Enterprise Data Trust Commitments
              </h2>
              <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed font-semibold">
                ATC adheres strictly to four foundational enterprise data protection commitments:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <strong className="text-emerald-900 dark:text-emerald-200 block mb-1">Commitment 1: You Own Your Data</strong>
                  ATC never claims ownership or copyright over Customer Data. You own all data, applications, and source code stored in your virtual machines.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <strong className="text-emerald-900 dark:text-emerald-200 block mb-1">Commitment 2: Contractual Purpose Only</strong>
                  ATC processes Customer Data strictly as necessary to execute, route, and secure the cloud services contracted in your agreement.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <strong className="text-emerald-900 dark:text-emerald-200 block mb-1">Commitment 3: No Advertising Use</strong>
                  ATC never scans, indexes, mines, or analyzes Customer Data for advertising, marketing profiling, or consumer targeting purposes.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <strong className="text-emerald-900 dark:text-emerald-200 block mb-1">Commitment 4: Zero Selling of Data</strong>
                  ATC does not sell, rent, or lease your personal data, server logs, or telemetry to any third party or data broker.
                </div>
              </div>
            </section>

            {/* SECTION 3 - DEMARCATION */}
            <section id="atcpriv-3" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <Server className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                3. Customer Data vs. Account Data Demarcation
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed">
                ATC maintains a strict institutional boundary between:
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">A. Customer Data (Controller: Customer):</strong>
                  Data, files, code, software, and databases uploaded to or processed within Customer&apos;s virtual machines. 
                  <strong> ATC DOES NOT INSPECT, ACCESS, AUDIT, SHARE, OR SELL CUSTOMER DATA</strong>. 
                  Under GDPR and CCPA, Customer is the sole Data Controller of Customer Data; ATC operates strictly as a neutral Data Processor.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-1">B. Account &amp; Telemetry Data (Controller: ATC):</strong>
                  Data collected from Customer to authenticate accounts, bill for services, prevent infrastructure abuse, and deliver customer support. 
                  ATC acts as the Data Controller solely for this administrative metadata.
                </div>
              </div>
            </section>

            {/* SECTION 4 */}
            <section id="atcpriv-4" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">4</span>
                Categories of Information We Collect
              </h2>
              <p>We collect information directly from you to deliver, bill, and protect enterprise cloud infrastructure:</p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Identity &amp; Account Profile Data:</strong> Full legal name, corporate business name, physical corporate billing address, telephone number, and verified administrative email address;</li>
                <li><strong>Authentication &amp; Access Credentials:</strong> Cryptographically salted and hashed passwords (using bcrypt algorithms), customer-uploaded SSH public keys, and session tokens;</li>
                <li><strong>Billing &amp; Financial Metadata:</strong> Payment card brand, last four digits of payment card, expiration month/year, Stripe billing reference token, tax IDs, and transaction invoice records;</li>
                <li><strong>Telemetry &amp; Infrastructure Diagnostics:</strong> Source IP addresses used to access the portal, web browser user-agent strings, hypervisor API calls, bandwidth consumption metrics, CPU/RAM utilization logs, and firewall access attempts.</li>
              </ul>
            </section>

            {/* SECTION 5 */}
            <section id="atcpriv-5" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">5</span>
                Lawful Bases for Data Processing
              </h2>
              <p>Under global data privacy laws, ATC processes personal data pursuant to clearly established lawful grounds:</p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Contractual Execution:</strong>
                  Provisioning Hyper-V virtual compute, allocating dedicated IP addresses, calculating resource usage, and invoicing accounts.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Legitimate Security Interests:</strong>
                  Defending hypervisor clusters against DDoS attacks, detecting rogue port-scanning, deflecting brute-force attacks, and preventing fraudulent billing.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Statutory Legal Obligation:</strong>
                  Compliance with federal tax (IRS) regulations, Illinois corporate accounting laws, and statutory records retention requirements.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">Customer Consent:</strong>
                  Opt-in notifications regarding scheduled maintenance windows, feature updates, or customer satisfaction reviews.
                </div>
              </div>
            </section>

            {/* SECTION 6 - PAYMENT TOKENIZATION */}
            <section id="atcpriv-6" className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-300 font-poppins flex items-center gap-3">
                <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                6. Payment Card Processing &amp; PCI-DSS Level 1 Security Guarantee
              </h2>
              <div className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 font-bold uppercase tracking-wide">
                ATC DOES NOT RECEIVE, PROCESS, STORE, OR TRANSMIT RAW CREDIT CARD NUMBERS, CVV SECURITY CODES, OR CARD TRACK DATA ON OUR HOST SERVERS.
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 leading-relaxed">
                All payment transactions are executed through our certified payment processing partner, <strong>Stripe Inc.</strong>, an audited 
                PCI-DSS Level 1 Service Provider. Payment card details entered via our checkout interface are ingested directly into Stripe&apos;s 
                vault via encrypted Stripe Elements frames. ATC receives and maintains only a tokenized customer identifier, payment method ID, 
                card brand, and the last 4 digits of the payment instrument for billing records and recurring invoice generation.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="atcpriv-7" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">7</span>
                Infrastructure Telemetry, Flow Logs &amp; Perimeter Defense
              </h2>
              <p>
                To defend our virtualization nodes and maintain 99.9% availability, ATC captures operational telemetry:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li><strong>Firewall NetFlow Logs:</strong> Inbound/outbound packet counts, port hit distributions, and dropped connection events to identify and null-route DDoS attacks;</li>
                <li><strong>Hypervisor VM Lifecycle Events:</strong> State changes (provision, reboot, power-off, snapshot creation, disk resize) to diagnose cluster performance;</li>
                <li><strong>Audit Trails:</strong> Management portal logins, API calls, and console access timestamps retained for ninety (90) calendar days for security accountability.</li>
              </ul>
            </section>

            {/* SECTION 8 */}
            <section id="atcpriv-8" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">8</span>
                Audited Subprocessors &amp; Controlled Third-Party Disclosures
              </h2>
              <p>
                ATC utilizes only vetted, industry-standard subprocessors who operate under strict Data Processing Agreements (DPAs) 
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

            {/* SECTION 9 - ZERO SALE OF DATA */}
            <section id="atcpriv-9" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                9. Absolute Prohibition on the Sale or Rental of Personal Data
              </h2>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                ANALYTICAL TECHNICAL CONSULTING INC. HAS NEVER SOLD, DOES NOT SELL, AND WILL NEVER SELL, RENT, LEASE, OR TRADE YOUR PERSONAL INFORMATION, 
                CUSTOMER DATA, TELEMETRY, OR IP USAGE TO THIRD PARTIES, DATA BROKERS, OR ADVERTISERS FOR MONETARY OR OTHER VALUABLE CONSIDERATION.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">
                We do not engage in cross-context behavioral advertising. Pursuant to California Civil Code § 1798.120, Customer does not need 
                to submit an opt-out request because ATC does not engage in the sale of personal information under any circumstance.
              </p>
            </section>

            {/* SECTION 10 - GOVERNMENT DEMANDS */}
            <section id="atcpriv-10" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">10</span>
                Government Demands &amp; Subpoena Scrutiny
              </h2>
              <p>
                ATC enforces rigorous standards regarding government demands for customer records:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Judicial Process Required:</strong> ATC will NOT disclose Customer Data or account records without valid, binding legal process—such as a subpoena, court order signed by a judge of competent jurisdiction, or search warrant issued under the Federal Rules of Criminal Procedure or state equivalent;</li>
                <li><strong>Scrutiny of Legal Basis:</strong> ATC reviews each demand to confirm that it complies with the law and will challenge or narrow overbroad or inappropriate requests;</li>
                <li><strong>Notice to Customer:</strong> Unless explicitly prohibited by a valid statutory non-disclosure gag order issued under 18 U.S.C. § 2705(b), ATC will notify Customer in writing prior to disclosing account information to allow Customer an opportunity to challenge the legal process.</li>
              </ul>
            </section>

            {/* SECTION 11 - NIST SP 800-88 SANITIZATION */}
            <section id="atcpriv-11" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                11. Data Retention &amp; NIST SP 800-88 Cryptographic Sanitization
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

            {/* SECTION 12 - STATUTORY RIGHTS */}
            <section id="atcpriv-12" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">12</span>
                Your Global Statutory Privacy Rights (GDPR &amp; CCPA/CPRA)
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

            {/* SECTION 13 */}
            <section id="atcpriv-13" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">13</span>
                Cookies, Session Storage &amp; Global Privacy Control (GPC)
              </h2>
              <p>
                Our portal utilizes strictly essential first-party authentication session cookies required to verify login state and protect against 
                Cross-Site Request Forgery (CSRF). We do not deploy third-party advertising tracking cookies. We honor Global Privacy Control (GPC) 
                and Do Not Track (DNT) browser signals.
              </p>
            </section>

            {/* SECTION 14 */}
            <section id="atcpriv-14" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">14</span>
                Defense-in-Depth Security Safeguards
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
            <section id="atcpriv-15" className="space-y-4">
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
            <section id="atcpriv-16" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">16</span>
                Policy Amendments &amp; Data Protection Officer Contact
              </h2>
              <p>
                ATC reserves the right to amend this Privacy Notice periodically. Modifications take effect upon posting to our portal. 
                If you have inquiries regarding this notice or wish to exercise statutory data rights, contact our Data Protection Officer at:
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
