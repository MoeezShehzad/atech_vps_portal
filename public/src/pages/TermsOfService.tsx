import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, Shield, AlertTriangle, FileText, CheckCircle2, Lock, 
  Server, Cpu, Database, ChevronRight, HelpCircle, ArrowUpRight
} from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "October 17, 2026";
  const [activeSection, setActiveSection] = useState('sec-1');

  const tableOfContents = [
    { id: 'sec-1', title: '1. Overview & Agreement' },
    { id: 'sec-2', title: '2. Provisioning & Unmanaged Infrastructure' },
    { id: 'sec-3', title: '3. Customer Account & Credentials' },
    { id: 'sec-4', title: '4. Customer Content & Data Sovereignty' },
    { id: 'sec-5', title: '5. Acceptable Use Policy (AUP)' },
    { id: 'sec-6', title: '6. Absolute Backup & Data Loss Disclaimer' },
    { id: 'sec-7', title: '7. Service Levels, Uptime & Maintenance' },
    { id: 'sec-8', title: '8. Financial Terms, Renewals & Taxes' },
    { id: 'sec-9', title: '9. Suspension & Immediate Termination' },
    { id: 'sec-10', title: '10. Complete Disclaimer of Warranties' },
    { id: 'sec-11', title: '11. Strict Limitation of Liability & Damages Cap' },
    { id: 'sec-12', title: '12. Comprehensive Customer Indemnification' },
    { id: 'sec-13', title: '13. Binding Arbitration & Class Action Waiver' },
    { id: 'sec-14', title: '14. Governing Law, Venue & Time Limit' },
    { id: 'sec-15', title: '15. DMCA & Copyright Enforcement' },
    { id: 'sec-16', title: '16. Export Control & Sanctions' },
    { id: 'sec-17', title: '17. Force Majeure & Operational Immunity' },
    { id: 'sec-18', title: '18. General Legal Provisions & Contact' },
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
        
        {/* ENTERPRISE NOTICE HERO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Scale className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Master Services Agreement (MSA)
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Terms of Service
                </h1>
              </div>
            </div>
            <div className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Revision: 2026.4 • Effective: {lastUpdated}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6 text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
            <strong className="font-bold uppercase tracking-wide block mb-1">Important Notice Concerning Dispute Resolution:</strong>
            THESE TERMS CONTAIN A <strong>MANDATORY BINDING INDIVIDUAL ARBITRATION CLAUSE</strong> (SECTION 13) AND A 
            <strong> CLASS ACTION WAIVER</strong>. EXCEPT AS SPECIFICALLY EXEMPTED, YOU AND ANALYTICAL TECHNICAL CONSULTING INC. AGREE TO RESOLVE 
            ALL DISPUTES THROUGH BINDING, INDIVIDUAL ARBITRATION AND WAIVE ANY RIGHT TO A JURY TRIAL OR TO PARTICIPATE IN A CLASS ACTION LAWSUIT.
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            This Master Services Agreement governs your access to and use of all cloud virtual machines, dedicated servers, hypervisor compute nodes, 
            enterprise NVMe block storage volumes, networks, IP allocations, software images, and technical infrastructure operated by 
            <strong> Analytical Technical Consulting Inc.</strong> (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). 
            By registering an account, clicking &quot;I Agree&quot;, provisioning a server, or utilizing our network, you unconditionally accept and 
            agree to be legally bound by this Agreement.
          </p>
        </div>

        {/* TWO-COLUMN LAYOUT: SIDEBAR TABLE OF CONTENTS + EXPANDED MSA CLAUSES */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP STICKY SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-2">
              Agreement Structure
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
              <p className="font-semibold text-slate-800 dark:text-slate-300">Need Legal Clarification?</p>
              <p>Email our Legal &amp; Compliance Officers directly at:</p>
              <a href="mailto:legal@atechconsult.com" className="text-blue-600 dark:text-blue-400 font-bold underline block">
                legal@atechconsult.com
              </a>
            </div>
          </aside>

          {/* MAIN ARTICLES CONTAINER */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

            {/* SECTION 1 */}
            <section id="sec-1" className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">1</span>
                Overview, Corporate Identity &amp; Binding Acceptance
              </h2>
              <p>
                This Master Services Agreement (&quot;Agreement&quot;) is entered into by and between <strong>Analytical Technical Consulting Inc.</strong>, 
                an active Illinois corporation registered with the Secretary of State of Illinois, having its principal operational data center and office facility 
                at <strong>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</strong> (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), and the 
                individual or enterprise entity (&quot;Customer&quot;, &quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) executing an order, registering an account, or accessing our services.
              </p>
              <p>
                <strong>Authority to Contract:</strong> If you are entering into this Agreement on behalf of a corporation, organization, company, or government body, 
                you represent and warrant that you possess the full legal and corporate authority to bind such entity to each covenant, term, limitation, and warranty disclaimer 
                herein. If you do not possess such legal authority, or if you do not unconditionally agree to all terms of this Agreement, you must not access, 
                provision, or utilize ATC cloud hosting infrastructure.
              </p>
            </section>

            {/* SECTION 2 */}
            <section id="sec-2" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">2</span>
                Scope of Cloud Services &amp; Unmanaged Infrastructure Model
              </h2>
              <p>
                ATC supplies infrastructure-as-a-service (&quot;IaaS&quot;), including Generation 2 Microsoft Hyper-V virtualized instances, virtual processor 
                threads (vCPU), random access memory (RAM), enterprise NVMe high-throughput block storage, virtual networking switches, dedicated and shared IPv4/IPv6 address blocks, 
                and automated self-service management tooling (collectively, the &quot;Services&quot;).
              </p>
              <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm space-y-2">
                <strong className="text-slate-900 dark:text-white block font-bold">Strict Unmanaged Support Model:</strong>
                <p>
                  Unless explicitly contracted under an executed Enterprise Managed SLA add-on, <strong>all services are provided strictly on an unmanaged basis</strong>. 
                  ATC maintains the physical server host chassis, host hypervisor operating environment, hypervisor virtualization software, and core data center networking switches. 
                  Customer assumes 100% exclusive responsibility for:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Installation, licensing, kernel patching, and maintenance of guest operating systems;</li>
                  <li>Configuration of internal guest software firewalls (e.g. UFW, iptables, Windows Firewall);</li>
                  <li>Installation, maintenance, and security hardening of web engines, databases, applications, and third-party software stacks;</li>
                  <li>Prevention, detection, and remediation of software vulnerabilities, malware, trojans, ransomware, and unauthorized intrusions within Customer&apos;s virtual instances.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 3 */}
            <section id="sec-3" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">3</span>
                Customer Account, Identity Verification &amp; Security Credentials
              </h2>
              <p>
                Customer warrants that all information provided during registration—including legal name, verified physical address, valid corporate domain, 
                tax ID, and contact phone number—is accurate, truthful, and complete. ATC employs automated and manual fraud-screening algorithms. 
                Any account registered using deceptive proxies, disposable emails, fabricated identities, or stolen credit instruments will be 
                <strong> immediately terminated, null-routed, and reported to national fraud registries</strong>.
              </p>
              <p>
                <strong>Credential Confidentiality:</strong> Customer retains exclusive liability for safeguarding all portal authentication credentials, 
                SSH public/private key pairs, initial root/administrator passwords, API keys, and session tokens. Under no circumstance will ATC staff request 
                Customer&apos;s guest root password. Customer agrees to immediately notify ATC in writing of any suspected unauthorized account compromise. 
                ATC shall bear zero liability for any loss, unauthorized manipulation, destruction of data, or billing incurred resulting from compromised credentials.
              </p>
            </section>

            {/* SECTION 4 */}
            <section id="sec-4" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">4</span>
                Customer Content, Passive Conduit Immunity &amp; Data Sovereignty
              </h2>
              <p>
                Customer retains 100% intellectual property ownership, copyright, and title to all software, source code, media, databases, and customer records 
                deployed within Customer&apos;s instances (&quot;Customer Content&quot;). Customer grants ATC only the minimal, limited technical license strictly required 
                to transmit, host, execute, mirror, and route Customer Content as necessary to perform the Services under this Agreement.
              </p>
              <p>
                <strong>Passive Conduit &amp; Safe Harbor:</strong> Pursuant to Section 230 of the Communications Decency Act (47 U.S.C. § 230) and the 
                Digital Millennium Copyright Act (17 U.S.C. § 512), ATC operates strictly as a passive intermediary and provider of interactive computer services. 
                ATC exercises zero editorial control over, does not endorse, and expressly disclaims any legal liability for any Customer Content, communications, 
                websites, API endpoints, or services transmitted or made available via Customer&apos;s virtual machines.
              </p>
            </section>

            {/* SECTION 5 - ACCEPTABLE USE POLICY */}
            <section id="sec-5" className="space-y-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-rose-900 dark:text-rose-300 font-poppins flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                5. Acceptable Use Policy (AUP) — Unilateral Immediate Termination
              </h2>
              <p className="text-rose-950 dark:text-rose-200 text-xs sm:text-sm leading-relaxed">
                Customer covenants that ATC infrastructure shall NOT be used for any malicious, disruptive, abusive, or unlawful activities. 
                Any violation of this Section constitutes a material, non-curable breach of this Agreement, granting ATC the unconditioned right to 
                <strong> immediately shut down, disconnect, isolate, or permanently destroy the offending virtual machine without prior notice, 
                without refund of prepaid balances, and with immediate assessment of cleanup and administrative investigation fees</strong>.
              </p>
              
              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <strong className="text-rose-950 dark:text-rose-200 block mb-1">A. Network Attacks &amp; Disruptive Warfare:</strong>
                  Initiation, amplification, facilitation, or participation in any Denial of Service (DoS/DDoS) attack, port-scanning, IP address spoofing, SYN flood, ping flood, packet sniffing, brute-force dictionary attacks, or maintaining botnet command-and-control (C2) channels.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <strong className="text-rose-950 dark:text-rose-200 block mb-1">B. Unsolicited Bulk Communications (SPAM):</strong>
                  Transmission of unsolicited bulk commercial email (SPAM), operating open mail relays, email address harvesting, deceptive header manipulation, or any email practice resulting in ATC IP addresses or autonomous system numbers (ASNs) being placed on Spamhaus, SORBS, Barracuda, or other DNSBL/RBL blacklists.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <strong className="text-rose-950 dark:text-rose-200 block mb-1">C. Unlawful &amp; Heinous Content:</strong>
                  Child Sexual Abuse Material (CSAM — zero tolerance, immediate preservation and referral to the National Center for Missing &amp; Exploited Children and federal authorities), promotion of violent terrorism, illegal weapon trafficking, human trafficking, unlicensed narcotics, distribution of non-consensual imagery, or hosting malware, ransomware, exploits, or spyware.
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <strong className="text-rose-950 dark:text-rose-200 block mb-1">D. Hypervisor Resource Monopolization &amp; Mining:</strong>
                  Unauthorized, unthrottled proof-of-work cryptocurrency mining, distributed computing networks designed to bypass fair-share schedulers, hardware stress-testing suites, or continuous artificial CPU pinning designed to degrade host system responsiveness for adjacent virtual machines.
                </div>
              </div>
            </section>

            {/* SECTION 6 - ABSOLUTE BACKUP DISCLAIMER */}
            <section id="sec-6" className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-amber-950 dark:text-amber-300 font-poppins flex items-center gap-3">
                <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                6. Absolute Backup Disclaimer &amp; Zero Liability for Data Loss
              </h2>
              <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-bold uppercase tracking-wide">
                CUSTOMER EXPRESSLY ACKNOWLEDGES THAT THE SERVICES DO NOT CONSTITUTE AN ARCHIVAL OR DISASTER BACKUP SERVICE.
              </div>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
                Customer covenants and agrees that Customer maintains 100% sole responsibility for creating, maintaining, and verifying 
                independent, redundant, encrypted, off-site backups of all Customer Content, operating systems, databases, files, and applications. 
                Even where Customer purchases optional automated snapshot add-ons or checkpoint tooling, Customer acknowledges that snapshots 
                represent point-in-time state captures and are not guaranteed against catastrophic storage array failure, corruption, or hypervisor defects.
              </p>
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-bold leading-relaxed">
                UNDER NO CIRCUMSTANCES, AND UNDER NO LEGAL THEORY (WHETHER IN CONTRACT, TORT, STRICT LIABILITY, OR NEGLIGENCE), SHALL ATC BE LIABLE 
                FOR ANY LOSS, DESTRUCTION, CORRUPTION, INACCESSIBILITY, COMPROMISE, OR RESTORATION EXPENSES OF CUSTOMER DATA, DATABASES, CODE, OR ASSETS, 
                REGARDLESS OF THE CAUSE, INCLUDING HARDWARE MALFUNCTION, POWER FAILURE, HOST REBOOT, OPERATING SYSTEM FAULT, RANSOMWARE, SECURITY BREACH, 
                ADMINISTRATIVE ERROR, OR TERMINATION FOR DEFAULT.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="sec-7" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">7</span>
                Service Levels, Uptime Targets &amp; Scheduled Maintenance
              </h2>
              <p>
                ATC targets a 99.9% monthly network and hypervisor host availability metric. In the event of an unannounced, verified infrastructure outage 
                exceeding this standard, Customer may submit a written service credit claim within fourteen (14) calendar days of the event. 
                Service credits are applied strictly against future billing invoices and represent Customer&apos;s 
                <strong> sole and exclusive remedy</strong> for any failure of availability or performance.
              </p>
              <p>
                <strong>SLA Exclusions:</strong> Uptime metrics expressly exclude unavailability caused by: (a) scheduled maintenance windows notified 
                in advance; (b) emergency hypervisor or security kernel patching; (c) transit carrier, tier-1 internet backbone, or physical fiber cuts; 
                (d) Customer guest operating system misconfigurations, kernel crashes, or software crashes; (e) DDoS attacks directed against Customer IP addresses; 
                or (f) Force Majeure events. Cumulative service credits in any calendar month shall under no circumstances exceed fifty percent (50%) 
                of Customer&apos;s base recurring monthly charge for the affected server.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="sec-8" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">8</span>
                Financial Terms, Automated Renewals, Invoicing &amp; Taxes
              </h2>
              <p>
                All cloud compute subscriptions and recurring add-ons are billed in advance on a recurring monthly or annual billing cycle. Customer authorizes 
                ATC and our PCI-DSS Level 1 payment processor (Stripe Inc.) to continuously store Customer&apos;s tokenized payment credentials and automatically 
                charge such payment method for recurring renewals, bandwidth overage tiers, and additional IP allocations.
              </p>
              <p>
                <strong>Default &amp; Reclamation:</strong> Invoices must be settled in full upon generation. If an automatic charge fails, ATC provides a 
                three (3) calendar day grace period. Upon the fourth (4th) calendar day of non-payment, the instance will be automatically suspended. 
                If default remains uncured on the seventh (7th) calendar day following invoice due date, 
                <strong> the instance will be permanently deleted and all virtual disks sanitized</strong>. ATC bears zero liability for data lost via default reclamation.
              </p>
              <p>
                <strong>Taxes:</strong> All listed prices are exclusive of federal, state, municipal, value-added (VAT), goods and services (GST), 
                or sales taxes, which shall be added to the invoice where applicable by law.
              </p>
            </section>

            {/* SECTION 9 */}
            <section id="sec-9" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">9</span>
                Suspension, Account Termination &amp; Data Erasure
              </h2>
              <p>
                ATC reserves the right to immediately suspend, throttle, or terminate your access to the Services, in whole or in part, with or without prior notice: 
                (a) if Customer breaches any provision of this Agreement or the AUP; (b) if Customer fails to satisfy any invoice due; (c) if ATC reasonably believes 
                Customer&apos;s virtual machine is compromised, running malware, or generating harmful traffic; or (d) if compelled by law enforcement, court subpoena, 
                or regulatory directive.
              </p>
              <p>
                Upon account termination for any cause: (i) all rights and licenses granted to Customer immediately cease; (ii) Customer must immediately cease all access; 
                (iii) Customer remains fully liable for all accrued and unpaid fees; and (iv) ATC shall immediately delete and sanitize all virtual machine disk images, 
                backups, and snapshots in accordance with NIST SP 800-88 standards.
              </p>
            </section>

            {/* SECTION 10 - DISCLAIMER OF WARRANTIES */}
            <section id="sec-10" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                10. Complete Disclaimer of Warranties (&quot;AS IS&quot; &amp; &quot;AS AVAILABLE&quot;)
              </h2>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, ALL SERVICES, HARDWARE, VIRTUAL MACHINES, SERVERS, STORAGE ARRAYS, NETWORKING, 
                OPERATING SYSTEM IMAGES, CONSOLES, AND DOCUMENTATION PROVIDED BY ANALYTICAL TECHNICAL CONSULTING INC. ARE PROVIDED STRICTLY ON AN 
                &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR ARISING BY COURSE OF DEALING 
                OR USAGE IN TRADE.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">
                ATC EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, INTEGRATION, TIMELINESS, SECURITY, OR UNINTERRUPTED, SECURE, OR ERROR-FREE OPERATION. 
                ATC DOES NOT WARRANT THAT THE SERVICES WILL MEET CUSTOMER&apos;S REQUIREMENTS, BE COMPATIBLE WITH CUSTOMER SOFTWARE, PREVENT UNAUTHORIZED INTRUSIONS, 
                OR THAT DEFECTS IN SOFTWARE OR NETWORKING WILL BE REMEDIED. CUSTOMER ASSUMES COMPLETE RISK FOR SELECTING, PROVISIONING, AND USING THE SERVICES.
              </p>
            </section>

            {/* SECTION 11 - STRICT LIMITATION OF LIABILITY */}
            <section id="sec-11" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                11. Strict Limitation of Liability &amp; Absolute Damages Cap
              </h2>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                IN NO EVENT AND UNDER NO LEGAL OR EQUITABLE THEORY—WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE AND GROSS NEGLIGENCE TO THE EXTENT PERMITTED BY LAW), 
                STRICT LIABILITY, INDEMNITY, BREACH OF STATUTORY DUTY, OR OTHERWISE—SHALL ANALYTICAL TECHNICAL CONSULTING INC., ITS DIRECTORS, OFFICERS, 
                SHAREHOLDERS, EMPLOYEES, AFFILIATES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE TO CUSTOMER OR ANY THIRD PARTY FOR:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                <li>ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES;</li>
                <li>ANY LOSS OF ACTUAL OR ANTICIPATED PROFITS, REVENUE, CONTRACTS, GOODWILL, OR BUSINESS OPPORTUNITY;</li>
                <li>ANY LOSS, DESTRUCTION, CORRUPTION, COMPROMISE, OR RESTORATION COST OF DATA, CODE, OR DATABASES;</li>
                <li>ANY DOWNTIME, COMMERCIAL LOSS, OR THIRD-PARTY CLAIMS ARISING FROM SERVICE INTERRUPTIONS; OR</li>
                <li>ANY LOSSES RESULTING FROM SECURITY VULNERABILITIES, RANSOMWARE, VIRUSES, OR UNAUTHORIZED INTRUSIONS.</li>
              </ul>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 mt-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                FINANCIAL LIABILITY CEILING: NOTWITHSTANDING ANYTHING TO THE CONTRARY IN THIS AGREEMENT, THE TOTAL AGGREGATE CUMULATIVE LIABILITY OF 
                ANALYTICAL TECHNICAL CONSULTING INC. FOR ANY AND ALL CLAIMS, DISPUTES, OR CAUSES OF ACTION WHATSOEVER, REGARDLESS OF FORM, SHALL BE 
                STRICTLY LIMITED TO AND SHALL NOT EXCEED THE TOTAL ACTUAL AMOUNT PAID BY CUSTOMER TO ATC UNDER THIS AGREEMENT DURING THE THREE (3) MONTHS 
                IMMEDIATELY PRECEDING THE INCIDENT GIVING RISE TO LIABILITY, OR ONE HUNDRED UNITED STATES DOLLARS ($100.00 USD), WHICHEVER IS LESS.
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The parties acknowledge and agree that this limitation represents an essential and fundamental element of the bargain between the parties, 
                and that ATC would not provide the Services at the agreed prices without these agreed liability limitations.
              </p>
            </section>

            {/* SECTION 12 - INDEMNIFICATION */}
            <section id="sec-12" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">12</span>
                Comprehensive Customer Indemnification
              </h2>
              <p>
                Customer shall defend, indemnify, and hold completely harmless Analytical Technical Consulting Inc., its corporate parent, affiliates, subsidiaries, 
                directors, officers, employees, legal representatives, and licensors from and against any and all claims, lawsuits, administrative proceedings, 
                demands, damages, losses, liabilities, fines, penalties, settlements, costs, and expenses (including reasonable attorneys&apos; fees and court costs) 
                arising out of or related to:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li>Customer&apos;s access to, use of, or inability to use the Services;</li>
                <li>Customer&apos;s breach or alleged breach of any provision, covenant, or warranty in this Agreement or the AUP;</li>
                <li>Customer Content, software, web applications, or data hosted on, stored within, or routed through Customer&apos;s virtual machines;</li>
                <li>Any allegation that Customer Content or network activities infringe, misappropriate, or violate the copyright, patent, trademark, trade secret, privacy, or intellectual property rights of any third party;</li>
                <li>Any cyberattack, port-scanning, DDoS flood, phishing, spam campaign, or malicious traffic originating from or targeting Customer&apos;s assigned IP addresses; or</li>
                <li>Customer&apos;s violation of any municipal, state, federal, or international statute, export regulation, or administrative rule.</li>
              </ul>
              <p className="text-xs text-slate-500">
                ATC reserves the right, at Customer&apos;s expense, to assume the exclusive defense and control of any matter subject to indemnification by Customer, 
                and Customer agrees to cooperate fully with ATC in asserting any available defenses.
              </p>
            </section>

            {/* SECTION 13 - BINDING ARBITRATION & CLASS ACTION WAIVER */}
            <section id="sec-13" className="space-y-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-blue-950 dark:text-blue-200 font-poppins flex items-center gap-3">
                <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                13. Mandatory Binding Individual Arbitration &amp; Class Action Waiver
              </h2>
              <div className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                PLEASE READ THIS SECTION WITH UTMOST SCRUTINY. IT MANDATES ARBITRATION OF DISPUTES AND ELIMINATES YOUR RIGHT TO PURSUE A COURT TRIAL OR PARTICIPATE IN A CLASS ACTION.
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>Pre-Dispute Informal Negotiation:</strong> Prior to initiating arbitration, Customer agrees to send a written notice of dispute to 
                  <a href="mailto:legal@atechconsult.com" className="text-blue-600 underline font-semibold ml-1">legal@atechconsult.com</a> containing: 
                  (i) Customer&apos;s account ID; (ii) a detailed description of the claim; and (iii) the specific monetary relief requested. 
                  The parties shall engage in good-faith negotiations for a minimum of thirty (30) calendar days prior to initiating any formal proceedings.
                </p>
                <p>
                  <strong>Binding Arbitration:</strong> If the dispute is not settled informally within thirty (30) days, it shall be resolved strictly and exclusively 
                  by binding individual arbitration administered by the <strong>American Arbitration Association (&quot;AAA&quot;)</strong> under its Commercial Arbitration Rules, 
                  conducted before a single neutral arbitrator in Will County, Illinois (or virtually by mutual consent). The arbitrator&apos;s award shall be final, binding, 
                  and enforceable in any court of competent jurisdiction.
                </p>
                <p className="font-bold text-slate-900 dark:text-white uppercase bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                  CLASS ACTION WAIVER: CUSTOMER AND ATC UNCONDITIONALLY AGREE THAT ALL CLAIMS MUST BE BROUGHT SOLELY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF, 
                  CLASS REPRESENTATIVE, OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR SHALL HAVE NO JURISDICTION 
                  OR AUTHORITY TO CONSOLIDATE CLAIMS OR PRESIDE OVER ANY CLASS PROCEEDING.
                </p>
                <p>
                  <strong>Jury Trial Waiver:</strong> EACH PARTY VOLUNTARILY, KNOWINGLY, AND IRREVOCABLY WAIVES ALL RIGHTS TO A TRIAL BY JURY IN ANY LEGAL PROCEEDING 
                  ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICES.
                </p>
              </div>
            </section>

            {/* SECTION 14 */}
            <section id="sec-14" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">14</span>
                Governing Law, Exclusive Venue &amp; One-Year Limitation Bar
              </h2>
              <p>
                This Agreement, and all claims, disputes, or controversies arising out of or related hereto (whether based in contract, tort, statute, or equity), 
                shall be governed by, construed, and enforced in accordance with the substantive internal laws of the <strong>State of Illinois</strong>, 
                without regard to principles of conflicts of law.
              </p>
              <p>
                To the extent any judicial proceeding is permitted hereunder (such as enforcing an arbitration award or seeking equitable emergency injunctions), 
                the parties submit exclusively to the personal jurisdiction and venue of the <strong>Circuit Court of the Twelfth Judicial Circuit, Will County, Illinois</strong>, 
                or the <strong>United States District Court for the Northern District of Illinois (Eastern Division)</strong>.
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                One-Year Statute of Limitations: Any cause of action or claim arising out of or related to this Agreement or the Services must be filed 
                within exactly one (1) year after the underlying cause of action accrued; otherwise, such claim is permanently and irrevocably barred.
              </p>
            </section>

            {/* SECTION 15 */}
            <section id="sec-15" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">15</span>
                DMCA Copyright Notice &amp; Repeat Infringer Policy
              </h2>
              <p>
                ATC complies strictly with the Digital Millennium Copyright Act (17 U.S.C. § 512). If you believe in good faith that materials hosted on our 
                infrastructure infringe your valid copyright, you may submit a formal notification complying with 17 U.S.C. § 512(c)(3) to our designated DMCA Agent:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs font-mono space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">DMCA Designated Agent — Legal Compliance Department</p>
                <p>Analytical Technical Consulting Inc.</p>
                <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
                <p>Email: dmca@atechconsult.com / legal@atechconsult.com</p>
              </div>
              <p className="text-xs text-slate-500">
                ATC enforces a strict repeat-infringer termination policy and terminates accounts of any subscriber determined to be a repeat copyright infringer.
              </p>
            </section>

            {/* SECTION 16 */}
            <section id="sec-16" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">16</span>
                Export Compliance &amp; Sanctions
              </h2>
              <p>
                Customer represents and warrants that neither Customer nor any of its end users are: (a) located in, or a resident of, any country subject 
                to United States embargo or trade sanctions (including Cuba, Iran, North Korea, Syria, or the Crimea/Donetsk/Luhansk regions of Ukraine); 
                or (b) listed on any U.S. government prohibited parties list, including the Specially Designated Nationals (SDN) List administered by the 
                Office of Foreign Assets Control (OFAC) or the U.S. Department of Commerce Denied Persons List.
              </p>
            </section>

            {/* SECTION 17 */}
            <section id="sec-17" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">17</span>
                Force Majeure &amp; Upstream Immunity
              </h2>
              <p>
                Neither party shall be held liable for failure or delay in fulfilling obligations hereunder (except Customer&apos;s obligation to pay recurring fees), 
                when such failure arises from causes beyond reasonable control, including acts of God, flood, fire, earthquake, explosion, war, invasion, 
                terrorist acts, civil unrest, regional power grid failures, tier-1 internet backbone cable cuts, cyber warfare, pandemics, or state regulatory actions.
              </p>
            </section>

            {/* SECTION 18 */}
            <section id="sec-18" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">18</span>
                Severability, Modifications &amp; Entire Agreement
              </h2>
              <p>
                If any provision of this Agreement is held by an arbitrator or court of competent jurisdiction to be invalid, illegal, or unenforceable, 
                such provision shall be modified to the minimum extent necessary to make it enforceable, and all remaining provisions shall remain in full force. 
                This Agreement constitutes the entire agreement between the parties regarding the subject matter hereof, superseding all prior proposals or representations.
              </p>
              <p>
                ATC reserves the right to amend this Agreement at any time by publishing the amended version on our portal. Customer&apos;s continued use of the Services 
                following publication constitutes full acceptance of the revised Agreement.
              </p>
            </section>

            {/* CORPORATE FOOTER CONTACT */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-300">Analytical Technical Consulting Inc. Legal Operations</p>
              <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
              <p>
                Legal Enquiries: <a href="mailto:legal@atechconsult.com" className="text-blue-600 underline">legal@atechconsult.com</a> • 
                Support: <a href="mailto:info@atechconsult.com" className="text-blue-600 underline ml-1">info@atechconsult.com</a>
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
