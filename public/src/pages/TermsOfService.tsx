import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, Shield, AlertTriangle, FileText, CheckCircle2, Lock, 
  Server, Cpu, Database, ChevronRight, HelpCircle, ArrowUpRight,
  Layers, KeyRound, Globe, Ban, AlertOctagon
} from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "October 17, 2026";
  const [activeSection, setActiveSection] = useState('atc-1');

  const tableOfContents = [
    { id: 'atc-1', title: '1. Services Provision & Modifications' },
    { id: 'atc-2', title: '2. Customer Obligations & Consents' },
    { id: 'atc-3', title: '3. Customer Data & Intellectual Property' },
    { id: 'atc-4', title: '4. Shared Security Responsibility Model' },
    { id: 'atc-5', title: '5. Acceptable Use Policy & High-Risk Activities' },
    { id: 'atc-6', title: '6. Absolute Backup Disclaimer & Data Loss Immunity' },
    { id: 'atc-7', title: '7. Service Level Agreement (SLA) & Remedies' },
    { id: 'atc-8', title: '8. Fees, Invoicing, Billing & Taxes' },
    { id: 'atc-9', title: '9. Suspension & Emergency Security Actions' },
    { id: 'atc-10', title: '10. Term, Termination & Data Sanitization' },
    { id: 'atc-11', title: '11. Complete Disclaimer of Warranties ("AS IS")' },
    { id: 'atc-12', title: '12. Strict Limitation of Liability & Damages Cap' },
    { id: 'atc-13', title: '13. Comprehensive Customer Indemnification' },
    { id: 'atc-14', title: '14. Mandatory Binding Individual Arbitration' },
    { id: 'atc-15', title: '15. Governing Law, Exclusive Venue & Time Bar' },
    { id: 'atc-16', title: '16. Safe Harbor, DMCA & Copyright Enforcement' },
    { id: 'atc-17', title: '17. U.S. Export Controls & Trade Sanctions' },
    { id: 'atc-18', title: '18. Force Majeure & Operational Continuity' },
    { id: 'atc-19', title: '19. Miscellaneous & Legal Definitions' },
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
        
        {/* ENTERPRISE HERO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Analytical Technical Consulting Inc. • Master Services Agreement
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Cloud Platform Terms of Service
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Version: ATC-MSA 2026.4
              </span>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Effective: {lastUpdated}
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6 text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
            <strong className="font-bold uppercase tracking-wide block mb-1">Mandatory Dispute Resolution Notice:</strong>
            THIS AGREEMENT CONTAINS A <strong>MANDATORY BINDING INDIVIDUAL ARBITRATION CLAUSE</strong> (SECTION 14) AND A 
            <strong> WAIVER OF CLASS ACTION LAWSUITS AND JURY TRIALS</strong>. IT DICTATES HOW ANY DISPUTES BETWEEN YOU AND ANALYTICAL TECHNICAL 
            CONSULTING INC. ARE RESOLVED. BY ACCEDING TO THIS AGREEMENT, YOU SURRENDER ANY RIGHT TO PARTICIPATE IN A CLASS ACTION OR REPRESENTATIVE ACTION IN COURT.
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            This Cloud Platform Master Services Agreement (&quot;Agreement&quot;) is made and entered into by and between 
            <strong> Analytical Technical Consulting Inc.</strong> (&quot;ATC&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), an Illinois corporation having its principal corporate office 
            and data infrastructure operations at <strong>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</strong>, and the entity or individual agreeing to these terms 
            (&quot;Customer&quot;, &quot;you&quot;, or &quot;your&quot;). This Agreement governs your access to and use of all ATC cloud virtual machines, dedicated servers, hypervisor compute nodes, 
            enterprise NVMe block storage volumes, networks, IP allocations, software images, and technical infrastructure.
          </p>
        </div>

        {/* TWO-COLUMN LAYOUT: SIDEBAR TABLE OF CONTENTS + EXPANDED ARTICLES */}
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
              <p className="font-semibold text-slate-800 dark:text-slate-300">Enterprise Legal Department</p>
              <p>For compliance or legal service of process:</p>
              <a href="mailto:legal@atechconsult.com" className="text-blue-600 dark:text-blue-400 font-bold underline block">
                legal@atechconsult.com
              </a>
            </div>
          </aside>

          {/* MAIN ARTICLES CONTAINER */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

            {/* SECTION 1 */}
            <section id="atc-1" className="space-y-4 pt-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">1</span>
                Services Provision, Modifications &amp; Unmanaged Scope
              </h2>
              <p>
                <strong>1.1 Facility &amp; Compute Provision:</strong> During the Term of this Agreement, ATC will provide the cloud compute infrastructure, 
                Generation 2 enterprise hypervisor virtual machine partitions, dedicated CPU allocation threads, host physical memory reservation, 
                high-IOPS NVMe storage volumes, dedicated IP routing, and self-service management portal APIs (collectively, the &quot;Services&quot;) 
                in accordance with this Agreement and our published Service Level Agreement.
              </p>
              <p>
                <strong>1.2 Strict Unmanaged Infrastructure Scope:</strong> Following enterprise cloud infrastructure conventions, the Services 
                are provided strictly on an <strong>Unmanaged Infrastructure-as-a-Service (IaaS)</strong> basis. ATC manages and secures solely the underlying 
                physical data center chassis, host hypervisor operating systems, virtualization engines, and primary network switches. 
                Customer maintains exclusive and absolute responsibility for the deployment, configuration, kernel updates, security patching, 
                firewall filtering, and maintenance of all guest operating systems, container environments, applications, and web services.
              </p>
              <p>
                <strong>1.3 Platform Modifications:</strong> ATC may make commercially reasonable updates or modifications to the Services from time to time. 
                If ATC makes a material change to the core functionality or interfaces of the Services, ATC will notify Customer via the Portal or email.
              </p>
            </section>

            {/* SECTION 2 */}
            <section id="atc-2" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">2</span>
                Customer Obligations, Corporate Authority &amp; Authentication
              </h2>
              <p>
                <strong>2.1 Corporate Capacity:</strong> Customer represents and warrants that: (a) it possesses full legal power and corporate authority 
                to enter into this Agreement; (b) the individual clicking &quot;Accept&quot;, creating an account, or purchasing Services is authorized to bind 
                Customer; and (c) Customer is not a minor and has attained the age of eighteen (18) years.
              </p>
              <p>
                <strong>2.2 Verification &amp; Anti-Fraud:</strong> Customer must provide verified, accurate, and current registration information. 
                ATC enforces strict automated anti-fraud checks. Accounts established with fraudulent payment cards, fabricated identities, proxy spoofing, 
                or stolen corporate details will be <strong>terminated immediately without notice, permanently blacklisted, and submitted to federal law enforcement</strong>.
              </p>
              <p>
                <strong>2.3 Credential Custody:</strong> Customer is exclusively responsible for preserving the confidentiality of all login credentials, 
                portal passwords, SSH private keys, API authentication tokens, and guest root credentials. Under no circumstances will ATC staff request 
                Customer&apos;s root password. Any and all commands, configurations, data deletions, or network traffic originating under Customer&apos;s account 
                credentials or allocated IP addresses are conclusively deemed authorized by Customer.
              </p>
            </section>

            {/* SECTION 3 - CUSTOMER DATA */}
            <section id="atc-3" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">3</span>
                Customer Data &amp; Intellectual Property Sovereignty
              </h2>
              <p>
                <strong>3.1 Customer Data Ownership:</strong> As between the parties, Customer retains all intellectual property rights, ownership, 
                and title in and to all data, software code, media, databases, and customer records uploaded to or stored within Customer&apos;s virtual machines 
                (&quot;Customer Data&quot;). ATC claims zero ownership or intellectual property rights over Customer Data.
              </p>
              <p>
                <strong>3.2 Strict License Grant to ATC:</strong> Customer grants ATC only the minimal, non-exclusive technical license strictly necessary 
                to transmit, store, host, replicate, and process Customer Data solely to the extent required to provide and secure the Services under this Agreement.
              </p>
              <p>
                <strong>3.3 Passive Conduit &amp; Safe Harbor:</strong> Pursuant to Section 230 of the Communications Decency Act (47 U.S.C. § 230) and the 
                Digital Millennium Copyright Act (17 U.S.C. § 512), ATC operates solely as a passive infrastructure conduit and provider of interactive computer services. 
                ATC exercises zero editorial control, screening, or endorsement over Customer Data and disclaims all liability arising from any content transmitted 
                through or hosted upon Customer&apos;s virtual instances.
              </p>
            </section>

            {/* SECTION 4 - SHARED RESPONSIBILITY MODEL */}
            <section id="atc-4" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                4. ATC Shared Security Responsibility Model
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed">
                Cloud security is a shared responsibility between ATC and Customer. The demarcation of responsibilities is strictly established as follows:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                  <strong className="text-blue-600 dark:text-blue-400 block font-bold mb-1">ATC Responsibility: &quot;Security OF the Cloud&quot;</strong>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>Physical security of Bolingbrook, IL data center facility;</li>
                    <li>Hypervisor host operating system patching &amp; memory isolation;</li>
                    <li>Enterprise NVMe storage array hardware integrity;</li>
                    <li>Perimeter firewall switches &amp; upstream routing resilience.</li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                  <strong className="text-emerald-600 dark:text-emerald-400 block font-bold mb-1">Customer Responsibility: &quot;Security IN the Cloud&quot;</strong>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>Guest operating system configuration &amp; continuous patch management;</li>
                    <li>Internal guest firewalls, port closures, and intrusion detection;</li>
                    <li>Encryption of customer data at rest and in transit;</li>
                    <li>User access control, password hygiene, and credential rotation.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION 5 - AUP & HIGH-RISK ACTIVITIES */}
            <section id="atc-5" className="space-y-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-rose-900 dark:text-rose-300 font-poppins flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                5. Acceptable Use Policy (AUP) &amp; High-Risk Activities Prohibition
              </h2>
              <p className="text-xs sm:text-sm text-rose-950 dark:text-rose-200 leading-relaxed">
                Customer covenants that the Services shall NOT be utilized for any abusive, harmful, or unlawful activities. 
                Any violation entitles ATC to <strong>immediately isolate, throttle, suspend, or permanently terminate Customer&apos;s instances without prior notice, 
                without refund of any prepaid fees, and with immediate assessment of cleanup and administrative investigation fees</strong>.
              </p>
              
              <div className="space-y-2.5 pt-2 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                  <strong>Network Attacks &amp; Warfare:</strong> Initiation or participation in Denial of Service (DoS/DDoS) floods, port-scanning, IP spoofing, packet injection, brute-force cracking, botnet Command-and-Control (C2), or malicious scanning.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                  <strong>Unsolicited Email (SPAM):</strong> Distribution of unsolicited commercial email (SPAM), bulk harvesting, open mail relay operations, or causing ATC IP ranges or Autonomous System Numbers (ASNs) to appear on international DNSBL/RBL anti-spam blacklists.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                  <strong>Heinous Content:</strong> Child Sexual Abuse Material (CSAM — zero tolerance, immediately preserved and reported to the National Center for Missing &amp; Exploited Children and federal authorities), violent extremism, narcotics trafficking, human exploitation, or hosting malware, trojans, or ransomware.
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                  <strong>High-Risk Activities Prohibition:</strong> The Services are NOT fault-tolerant and are NOT designed, manufactured, or intended for use in hazardous environments requiring fail-safe performance (such as the operation of nuclear facilities, air traffic control, emergency medical life-support systems, or emergency 911 dispatch systems). Customer shall not use the Services for any High-Risk Activities.
                </div>
              </div>
            </section>

            {/* SECTION 6 - ABSOLUTE BACKUP DISCLAIMER */}
            <section id="atc-6" className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-amber-950 dark:text-amber-300 font-poppins flex items-center gap-3">
                <AlertOctagon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                6. Absolute Backup Disclaimer &amp; Complete Immunity for Data Loss
              </h2>
              <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-bold uppercase tracking-wide">
                CUSTOMER EXPRESSLY ACKNOWLEDGES THAT THE SERVICES DO NOT CONSTITUTE AN ARCHIVAL, ESCROW, OR BACKUP SERVICE.
              </div>
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
                Customer covenants and warrants that Customer maintains 100% sole and continuous responsibility for generating, maintaining, 
                and verifying independent, redundant, encrypted, off-site backups of all Customer Data, operating systems, databases, files, and applications. 
                Optional snapshot add-ons represent localized, point-in-time state captures and are not guaranteed against catastrophic storage array failure, corruption, or hypervisor defects.
              </p>
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-bold leading-relaxed">
                UNDER NO CIRCUMSTANCES, AND UNDER NO LEGAL THEORY (WHETHER IN CONTRACT, TORT, STRICT LIABILITY, OR NEGLIGENCE), SHALL ATC BE LIABLE 
                FOR ANY LOSS, DESTRUCTION, CORRUPTION, INACCESSIBILITY, COMPROMISE, OR RESTORATION EXPENSES OF CUSTOMER DATA, CODE, OR DATABASES, 
                REGARDLESS OF THE CAUSE, INCLUDING HARDWARE MALFUNCTION, POWER FAILURE, HOST REBOOT, OPERATING SYSTEM FAULT, RANSOMWARE, SECURITY BREACH, 
                ADMINISTRATIVE ERROR, OR TERMINATION FOR DEFAULT.
              </p>
            </section>

            {/* SECTION 7 */}
            <section id="atc-7" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">7</span>
                Service Level Agreement (SLA) &amp; Sole Remedy
              </h2>
              <p>
                ATC targets a 99.9% monthly network and hypervisor host availability metric. In the event of an unannounced, verified infrastructure outage 
                exceeding this standard, Customer may submit a written service credit claim within fourteen (14) calendar days of the event. 
                Service credits are applied strictly against future billing invoices and represent Customer&apos;s 
                <strong> sole and exclusive remedy</strong> for any failure of availability or performance.
              </p>
              <p>
                <strong>SLA Exclusions:</strong> SLA metrics expressly exclude unavailability caused by: (a) scheduled maintenance windows notified 
                in advance; (b) emergency hypervisor or security kernel patching; (c) transit carrier, tier-1 internet backbone, or physical fiber cuts; 
                (d) Customer guest operating system misconfigurations, kernel crashes, or software crashes; (e) DDoS attacks directed against Customer IP addresses; 
                or (f) Force Majeure events. Cumulative service credits in any calendar month shall under no circumstances exceed fifty percent (50%) 
                of Customer&apos;s base recurring monthly charge for the affected server.
              </p>
            </section>

            {/* SECTION 8 */}
            <section id="atc-8" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">8</span>
                Fees, Invoicing, Automated Billing &amp; Taxes
              </h2>
              <p>
                <strong>8.1 Prepayment &amp; Measurement:</strong> All cloud compute subscriptions and recurring add-ons are billed in advance on a recurring monthly or annual billing cycle. Customer authorizes 
                ATC and our PCI-DSS Level 1 payment processor to continuously store Customer&apos;s tokenized payment credentials and automatically 
                charge such payment method for recurring renewals, bandwidth overage tiers, and additional IP allocations.
              </p>
              <p>
                <strong>8.2 Default &amp; Reclamation:</strong> Invoices must be settled in full upon generation. If an automatic charge fails, ATC provides a 
                three (3) calendar day grace period. Upon the fourth (4th) calendar day of non-payment, the instance will be automatically suspended. 
                If default remains uncured on the seventh (7th) calendar day following invoice due date, 
                <strong> the instance will be permanently deleted and all virtual disks sanitized</strong>. ATC bears zero liability for data lost via default reclamation.
              </p>
              <p>
                <strong>8.3 Taxes:</strong> All listed prices are exclusive of federal, state, municipal, value-added (VAT), goods and services (GST), 
                or sales taxes, which shall be added to the invoice where applicable by law.
              </p>
            </section>

            {/* SECTION 9 */}
            <section id="atc-9" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">9</span>
                Emergency Security Actions &amp; Immediate Suspension
              </h2>
              <p>
                <strong>Emergency Suspension:</strong> ATC may immediately suspend Customer&apos;s use of the Services or isolate 
                Customer&apos;s virtual machines without prior notice (&quot;Emergency Suspension&quot;) if ATC reasonably determines that: 
                (a) there is an active security breach or vulnerability affecting Customer&apos;s instance; 
                (b) Customer&apos;s instance is generating abusive network traffic that disrupts our cluster or upstream transit providers; 
                (c) there is suspected unauthorized third-party access to Customer&apos;s account; or 
                (d) suspension is required to comply with an emergency law enforcement order or court directive. 
                ATC will lift the Emergency Suspension once the circumstances giving rise to it have been fully resolved to ATC&apos;s satisfaction.
              </p>
            </section>

            {/* SECTION 10 */}
            <section id="atc-10" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">10</span>
                Term, Termination &amp; NIST SP 800-88 Data Sanitization
              </h2>
              <p>
                This Agreement commences upon Customer&apos;s acceptance and continues until terminated. Customer may terminate for convenience at any time via 
                the Portal Dashboard. Upon termination: (a) all licenses immediately terminate; (b) Customer must immediately cease accessing the Services; 
                (c) Customer remains liable for all outstanding accrued charges; and (d) all virtual disk volumes (VHDX), snapshots, and allocations are 
                permanently purged and cryptographically zeroed in accordance with <strong>NIST Special Publication 800-88 Revision 1 (Guidelines for Media Sanitization)</strong>.
              </p>
            </section>

            {/* SECTION 11 - DISCLAIMER OF WARRANTIES */}
            <section id="atc-11" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                11. Complete Disclaimer of Warranties (&quot;AS IS&quot; &amp; &quot;AS AVAILABLE&quot;)
              </h2>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, EXCEPT AS EXPRESSLY PROVIDED IN OUR SERVICE LEVEL AGREEMENT, 
                ALL SERVICES, HARDWARE, VIRTUAL MACHINES, SERVERS, STORAGE ARRAYS, NETWORKING, OPERATING SYSTEM IMAGES, CONSOLES, AND DOCUMENTATION 
                PROVIDED BY ANALYTICAL TECHNICAL CONSULTING INC. ARE PROVIDED STRICTLY ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES 
                OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR ARISING BY COURSE OF DEALING OR USAGE IN TRADE.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">
                ATC EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY, 
                FITNESS FOR A PARTICULAR PURPOSE, SYSTEM INTEGRATION, TIMELINESS, SECURITY, OR UNINTERRUPTED, SECURE, OR ERROR-FREE OPERATION. 
                ATC DOES NOT WARRANT THAT THE SERVICES WILL MEET CUSTOMER&apos;S REQUIREMENTS, PREVENT UNAUTHORIZED INTRUSIONS, OR THAT DEFECTS IN SOFTWARE 
                OR NETWORKING WILL BE REMEDIED. CUSTOMER ASSUMES COMPLETE RISK FOR SELECTING, PROVISIONING, AND USING THE SERVICES.
              </p>
            </section>

            {/* SECTION 12 - STRICT LIMITATION OF LIABILITY */}
            <section id="atc-12" className="space-y-4 bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
                12. Strict Limitation of Liability &amp; Absolute Damages Cap
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

            {/* SECTION 13 - INDEMNIFICATION */}
            <section id="atc-13" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">13</span>
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
                <li>Customer Data, software, web applications, or data hosted on, stored within, or routed through Customer&apos;s virtual machines;</li>
                <li>Any allegation that Customer Data or network activities infringe, misappropriate, or violate the copyright, patent, trademark, trade secret, privacy, or intellectual property rights of any third party;</li>
                <li>Any cyberattack, port-scanning, DDoS flood, phishing, spam campaign, or malicious traffic originating from or targeting Customer&apos;s assigned IP addresses; or</li>
                <li>Customer&apos;s violation of any municipal, state, federal, or international statute, export regulation, or administrative rule.</li>
              </ul>
            </section>

            {/* SECTION 14 - BINDING ARBITRATION & CLASS ACTION WAIVER */}
            <section id="atc-14" className="space-y-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-6 sm:p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-blue-950 dark:text-blue-200 font-poppins flex items-center gap-3">
                <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                14. Mandatory Binding Individual Arbitration &amp; Class Action Waiver
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

            {/* SECTION 15 */}
            <section id="atc-15" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">15</span>
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

            {/* SECTION 16 */}
            <section id="atc-16" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">16</span>
                Safe Harbor, DMCA &amp; Copyright Notice
              </h2>
              <p>
                ATC complies strictly with the Digital Millennium Copyright Act (17 U.S.C. § 512). If you believe in good faith that materials hosted on our 
                infrastructure infringe your valid copyright, submit a formal statutory notice complying with 17 U.S.C. § 512(c)(3) to our designated DMCA Agent:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs font-mono space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">DMCA Designated Agent — Legal Compliance Department</p>
                <p>Analytical Technical Consulting Inc.</p>
                <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
                <p>Email: dmca@atechconsult.com • legal@atechconsult.com</p>
              </div>
            </section>

            {/* SECTION 17 */}
            <section id="atc-17" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">17</span>
                U.S. Export Controls &amp; Trade Sanctions
              </h2>
              <p>
                Customer represents and warrants that neither Customer nor any of its end users are located in, or residents of, any country subject 
                to United States embargo or trade sanctions (including Cuba, Iran, North Korea, Syria, or the Crimea/Donetsk/Luhansk regions of Ukraine), 
                or listed on the Specially Designated Nationals (SDN) List administered by OFAC or the U.S. Commerce Denied Persons List.
              </p>
            </section>

            {/* SECTION 18 */}
            <section id="atc-18" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">18</span>
                Force Majeure &amp; Upstream Continuity
              </h2>
              <p>
                Neither party shall be held liable for failure or delay in fulfilling obligations hereunder (except Customer&apos;s obligation to pay recurring fees), 
                when such failure arises from causes beyond reasonable control, including acts of God, flood, fire, earthquake, explosion, war, invasion, 
                terrorist acts, civil unrest, regional power grid failures, tier-1 internet backbone cable cuts, cyber warfare, pandemics, or state regulatory actions.
              </p>
            </section>

            {/* SECTION 19 */}
            <section id="atc-19" className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">19</span>
                Miscellaneous Legal Provisions &amp; Defined Terms
              </h2>
              <p>
                <strong>19.1 Severability:</strong> If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be severed 
                and all remaining provisions shall remain in full force and effect.
              </p>
              <p>
                <strong>19.2 Entire Agreement:</strong> This Agreement constitutes the complete and exclusive statement of the agreement between the parties 
                with respect to the subject matter hereof, superseding all prior proposals or understandings.
              </p>
            </section>

            {/* CORPORATE FOOTER CONTACT */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-300">Analytical Technical Consulting Inc. Legal Operations</p>
              <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
              <p>Legal Inquiries: <a href="mailto:legal@atechconsult.com" className="text-blue-600 underline font-semibold">legal@atechconsult.com</a> • Support: <a href="mailto:info@atechconsult.com" className="text-blue-600 underline font-semibold ml-1">info@atechconsult.com</a></p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
