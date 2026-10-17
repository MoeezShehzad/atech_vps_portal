import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, FileText, CheckCircle, Scale, Lock, Clock, HelpCircle } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "October 17, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Legal Agreement</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  Master Terms of Service
                </h1>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Effective Date: {lastUpdated}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            PLEASE READ THESE MASTER TERMS OF SERVICE CAREFULLY. THIS AGREEMENT CONTAINS A 
            <strong className="text-slate-900 dark:text-white"> MANDATORY BINDING ARBITRATION CLAUSE </strong> 
            AND A <strong className="text-slate-900 dark:text-white">CLASS ACTION WAIVER</strong> THAT IMPACT YOUR LEGAL RIGHTS 
            REGARDING HOW DISPUTES ARE RESOLVED. BY CREATING AN ACCOUNT, PROVISIONING A VIRTUAL PRIVATE SERVER (VPS), 
            OR UTILIZING ANY SERVICES PROVIDED BY ANALYTICAL TECHNICAL CONSULTING INC., YOU FULLY AGREE TO BE BOUND BY THESE TERMS.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" /> Corporate Entity: Analytical Technical Consulting Inc.
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
              <Lock className="w-3.5 h-3.5" /> Enterprise Infrastructure Protection
            </span>
          </div>
        </div>

        {/* CONTENT ACCORDION / SECTIONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">

          {/* SECTION 1 */}
          <section id="section-1" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">1</span>
              Parties and Binding Acceptance
            </h2>
            <p>
              This Master Terms of Service Agreement (&quot;Agreement&quot;, &quot;Terms&quot;) constitutes a legally enforceable contract entered 
              into by and between <strong>Analytical Technical Consulting Inc.</strong> (&quot;ATC&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), 
              an Illinois corporation with its principal operational facilities located at 1360 Brentwood Trl, Bolingbrook, IL 60490, 
              United States, and the person, enterprise, or corporate entity (&quot;Customer&quot;, &quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) registering for, 
              purchasing, or using ATC cloud hosting, virtual machine compute infrastructure, storage arrays, networking, or consulting services.
            </p>
            <p>
              If you are entering into this Agreement on behalf of a corporation, partnership, or other legal entity, you represent and warrant 
              that you possess the full legal authority to bind such entity to these Terms. If you do not possess such legal authority, or if you 
              do not agree with all terms and conditions set forth herein, you must immediately terminate your account and cease all utilization 
              of ATC infrastructure.
            </p>
          </section>

          {/* SECTION 2 */}
          <section id="section-2" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">2</span>
              Infrastructure Scope and Provisioning
            </h2>
            <p>
              ATC provides unmanaged and managed Virtual Private Servers (&quot;VPS&quot;), enterprise virtualization clusters powered by Microsoft 
              Hyper-V Generation 2 architecture, enterprise NVMe storage volumes, dedicated IPv4/IPv6 networking, operating system templating, 
              and associated cloud virtualization automation (collectively, the &quot;Services&quot;).
            </p>
            <p>
              Unless explicitly purchased as an authorized &quot;Fully Managed Support Add-On&quot;, all VPS instances provisioned via our portal are 
              <strong> unmanaged</strong>. Customer acknowledges sole responsibility for installing, configuring, securing, maintaining, patching, 
              and administering all guest operating systems, application stacks, databases, firewalls, and data residing within Customer&apos;s allocated 
              virtual machine containers.
            </p>
          </section>

          {/* SECTION 3 */}
          <section id="section-3" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">3</span>
              Account Security, Authentication &amp; Credentials
            </h2>
            <p>
              Customer must provide true, accurate, current, and verifiable information during account registration. Maintenance of active, valid 
              billing information and contact email addresses is a continuous prerequisite for service continuity.
            </p>
            <p>
              Customer maintains exclusive and absolute responsibility for preserving the confidentiality of their portal authentication credentials, 
              SSH private keys, initial root/administrator passwords, API tokens, and two-factor authentication tokens. ATC personnel shall never request 
              Customer&apos;s guest root password. Any and all actions, modifications, data deletions, or network traffic originating from Customer&apos;s 
              account or provisioned IP addresses are deemed conclusively to be authorized by Customer.
            </p>
          </section>

          {/* SECTION 4 - ACCEPTABLE USE POLICY */}
          <section id="section-4" className="space-y-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-rose-900 dark:text-rose-300 font-poppins flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              Acceptable Use Policy (AUP) — Zero Tolerance
            </h2>
            <p className="text-rose-950 dark:text-rose-200">
              Customer expressly covenants and agrees that ATC cloud infrastructure shall NOT be used for any unlawful, abusive, malicious, 
              or harmful activities. Violation of this Section shall result in <strong>immediate, permanent service termination without prior notice, 
              total forfeiture of all prepaid fees, and referral to federal or international law enforcement authorities</strong>.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <strong>Prohibited Cyber Attacks:</strong> Denial of Service (DoS/DDoS) execution or amplification, port scanning, packet spoofing, SYN flood attacks, brute-force hacking attempts, or botnet command-and-control.
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <strong>Prohibited Email Abuse:</strong> Transmission of unsolicited commercial email (SPAM), bulk mail harvesting, open mail relay operations, deceptive phishing, or causing ATC IP addresses to be listed on RBL/DNSBL blacklists.
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <strong>Prohibited Content:</strong> Child sexual abuse material (CSAM - zero tolerance, immediate report to NCMEC/FBI), terrorism promotion, illegal weapons trafficking, distribution of non-consensual imagery, or malware hosting.
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <strong>Prohibited Resource Exploitation:</strong> Unauthorized high-intensity cryptocurrency mining, stress-testing tools, or sustained hardware pinning designed to destabilize hypervisor neighbors.
              </div>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-2">
              ATC reserves the unconditioned right to immediately isolate, null-route, or destroy any virtual machine exhibiting behavior 
              that threatens cluster stability or violates applicable municipal, state, federal, or international statutes.
            </p>
          </section>

          {/* SECTION 5 - DATA BACKUP DISCLAIMER */}
          <section id="section-5" className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-amber-950 dark:text-amber-300 font-poppins flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              Customer Sole Responsibility for Data &amp; Absolute Backup Disclaimer
            </h2>
            <p className="text-amber-950 dark:text-amber-200 font-semibold">
              CUSTOMER ACKNOWLEDGES THAT ATC IS NOT AN INSURER OF CUSTOMER&apos;S DATA. CUSTOMER AGREES TO MAINTAIN INDEPENDENT, OFF-SITE, 
              ENCRYPTED BACKUPS OF ALL SOFTWARE, DATABASES, AND FILES STORED ON ATC SYSTEMS.
            </p>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
              While ATC provides optional automated snapshot add-ons, RAID-backed NVMe storage clusters, and hypervisor-level checkpoint tooling, 
              ATC EXPRESSLY DISCLAIMS ANY AND ALL LIABILITY FOR ANY LOSS, DESTRUCTION, CORRUPTION, INACCESSIBILITY, OR COMPROMISE OF CUSTOMER DATA, 
              REGARDLESS OF THE CAUSE, INCLUDING BUT NOT LIMITED TO HARDWARE FAILURE, POWER OUTAGES, NETWORK INTERRUPTIONS, OPERATING SYSTEM 
              MALFUNCTIONS, HOSTING COMPONENT DEFECTS, RANSOMWARE, CYBERATTACKS, OR HUMAN ERROR. Customer assumes all risk of data loss.
            </p>
          </section>

          {/* SECTION 6 */}
          <section id="section-6" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">6</span>
              Service Level Agreement (SLA) &amp; Maintenance
            </h2>
            <p>
              ATC strives to maintain a 99.9% monthly network and hypervisor host availability target. Service credits for substantiated, unannounced 
              downtime exceeding our target may be requested within fourteen (14) calendar days of the qualifying outage and are calculated strictly 
              as a prorated credit toward future ATC service billing cycles.
            </p>
            <p>
              <strong>Maintenance Exclusions:</strong> SLA targets expressly exclude downtime resulting from: (a) scheduled maintenance announced at least 
              24 hours in advance; (b) emergency hypervisor security patching; (c) upstream transit provider, tier-1 internet backbone, or regional fiber cuts; 
              (d) Customer guest operating system misconfigurations or software faults; (e) DDoS attacks targeting Customer IP addresses; or (f) Force Majeure events.
              Under no circumstances shall aggregate SLA credits exceed fifty percent (50%) of Customer&apos;s monthly recurring fee for the affected service.
            </p>
          </section>

          {/* SECTION 7 */}
          <section id="section-7" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">7</span>
              Billing, Automatic Renewal, Invoicing &amp; Taxes
            </h2>
            <p>
              All cloud server packages and recurring add-ons are billed in advance on a recurring monthly or annual billing cycle. Customer authorizes 
              ATC and our secure third-party payment processing gateway (Stripe Inc.) to automatically charge Customer&apos;s primary payment method on file 
              for all subscription renewals, bandwidth overages, and provisioned add-on resources.
            </p>
            <p>
              Failure to successfully settle an invoice within three (3) calendar days of the due date will result in automatic service suspension. 
              Suspended instances remain subject to permanent disk reclamation and destruction seven (7) calendar days following invoice default. 
              ATC bears no liability whatsoever for data erased from forfeited, terminated virtual machines.
            </p>
          </section>

          {/* SECTION 8 - DISCLAIMER OF WARRANTIES */}
          <section id="section-8" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
              8. Complete Disclaimer of Warranties (&quot;AS IS&quot; &amp; &quot;AS AVAILABLE&quot;)
            </h2>
            <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, ALL SERVICES, HARDWARE, VIRTUAL MACHINES, PLATFORMS, NETWORKS, 
              STORAGE VOLUMES, AND DOCUMENTATION PROVIDED BY ANALYTICAL TECHNICAL CONSULTING INC. ARE PROVIDED STRICTLY ON AN 
              &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed">
              ATC EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, 
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, SYSTEM INTEGRATION, QUIET ENJOYMENT, OR UNINTERRUPTED, ERROR-FREE, 
              OR VIRUS-FREE OPERATION. ATC MAKES NO WARRANTY THAT THE SERVICES WILL MEET CUSTOMER&apos;S OPERATIONAL REQUIREMENTS, 
              THAT DEFECTS WILL BE REMEDIED, OR THAT SECURITY BREACHES OR UNAUTHORIZED INTRUSIONS WILL NOT OCCUR.
            </p>
          </section>

          {/* SECTION 9 - LIMITATION OF LIABILITY */}
          <section id="section-9" className="space-y-4 bg-slate-100 dark:bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins uppercase tracking-wide">
              9. Strict Limitation of Liability — Maximum Financial Cap
            </h2>
            <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
              IN NO EVENT SHALL ANALYTICAL TECHNICAL CONSULTING INC., ITS DIRECTORS, OFFICERS, SHAREHOLDERS, EMPLOYEES, AFFILIATES, AGENTS, 
              CONTRACTORS, OR LICENSORS BE LIABLE TO CUSTOMER OR ANY THIRD PARTY UNDER ANY CONTRACT, NEGLIGENCE, STRICT LIABILITY, TORT, 
              OR OTHER LEGAL OR EQUITABLE THEORY FOR:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
              <li>ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES;</li>
              <li>ANY LOSS OF BUSINESS, ANTICIPATED PROFITS, REVENUE, GOODWILL, CONTRACTS, OR COMMERCIAL OPPORTUNITIES;</li>
              <li>ANY LOSS, CORRUPTION, DESTRUCTION, OR RESTORATION COSTS OF DATA, CODE, OR DATABASES;</li>
              <li>ANY DOWNTIME, BUSINESS INTERRUPTION, OR SYSTEM FAILURE; OR</li>
              <li>ANY CLAIMS ARISING OUT OF HACKING, PHISHING, RANSOMWARE, OR SECURITY BREACHES ON CUSTOMER&apos;S GUEST INSTANCES.</li>
            </ul>
            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm pt-2">
              NOTWITHSTANDING ANYTHING TO THE CONTRARY HEREIN, THE TOTAL AGGREGATE CUMULATIVE LIABILITY OF ANALYTICAL TECHNICAL CONSULTING INC. 
              FOR ALL CLAIMS, DISPUTES, INJURIES, OR DAMAGES ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE USE OF OUR SERVICES, REGARDLESS 
              OF THE FORM OF ACTION, SHALL BE STRICTLY LIMITED TO AND SHALL NOT EXCEED THE TOTAL ACTUAL AMOUNT PAID BY CUSTOMER TO ATC FOR THE 
              SPECIFIC SERVICE IN QUESTION DURING THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE OCCURRENCE OF THE EVENT GIVING RISE TO LIABILITY, 
              OR ONE HUNDRED UNITED STATES DOLLARS ($100.00 USD), WHICHEVER IS LESS.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This limitation represents a fundamental allocation of commercial risk agreed upon between the parties in consideration for 
              the fees charged by ATC.
            </p>
          </section>

          {/* SECTION 10 - INDEMNIFICATION */}
          <section id="section-10" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">10</span>
              Comprehensive Indemnification
            </h2>
            <p>
              Customer agrees to defend, indemnify, and hold harmless Analytical Technical Consulting Inc., its parent companies, subsidiaries, 
              affiliates, officers, directors, employees, legal counsel, and agents from and against any and all claims, lawsuits, administrative 
              actions, proceedings, liabilities, losses, damages, judgments, penalties, fines, costs, and expenses (including reasonable attorneys&apos; 
              fees and court costs) arising out of or related to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
              <li>Customer&apos;s breach or violation of any provision of this Agreement or the Acceptable Use Policy;</li>
              <li>Customer&apos;s guest software, websites, applications, databases, or content hosted on ATC infrastructure;</li>
              <li>Any claim that Customer content infringes or misappropriates the patent, copyright, trademark, trade secret, or intellectual property rights of any third party;</li>
              <li>Any unauthorized access, privacy breach, or data leak originating from Customer&apos;s guest VM or compromised login credentials;</li>
              <li>Any cyberattack, spamming campaign, or abusive network traffic originating from or targeting Customer&apos;s assigned IP addresses; or</li>
              <li>Customer&apos;s violation of any municipal, state, federal, or international statute, regulation, or administrative rule.</li>
            </ul>
          </section>

          {/* SECTION 11 - BINDING ARBITRATION & CLASS ACTION WAIVER */}
          <section id="section-11" className="space-y-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-6 sm:p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-blue-950 dark:text-blue-200 font-poppins flex items-center gap-3">
              <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              11. Mandatory Binding Arbitration &amp; Class Action Waiver
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-blue-950 dark:text-blue-200">
              PLEASE READ THIS SECTION WITH UTMOST ATTENTION. IT MANDATES THAT ALL DISPUTES BE RESOLVED THROUGH BINDING INDIVIDUAL ARBITRATION 
              RATHER THAN IN A COURT OF LAW, AND RESTRICTS THE MANNER IN WHICH YOU CAN SEEK RELIEF FROM ATC.
            </p>
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>Pre-Arbitration Dispute Resolution:</strong> Prior to filing any arbitration demand, Customer agrees to first contact 
                ATC at <a href="mailto:legal@atechconsult.com" className="text-blue-600 underline font-semibold">legal@atechconsult.com</a> with 
                a detailed written description of the dispute. The parties shall engage in good-faith negotiations for a minimum period of thirty (30) 
                calendar days in an effort to reach an amicable informal settlement.
              </p>
              <p>
                <strong>Binding Arbitration:</strong> If the dispute is not resolved within thirty (30) days, it shall be finally settled by 
                binding individual arbitration administered by the American Arbitration Association (&quot;AAA&quot;) pursuant to its Commercial Arbitration Rules. 
                The arbitration shall be conducted before a single neutral arbitrator in Will County, Illinois, or virtually by mutual consent. 
                Judgment on the arbitration award may be entered in any court possessing jurisdiction.
              </p>
              <p className="font-bold text-slate-900 dark:text-white uppercase">
                CLASS ACTION WAIVER: CUSTOMER AND ATC AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS 
                A PLAINTIFF, CLASS REPRESENTATIVE, OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR 
                POSSESSES NO AUTHORITY TO CONSOLIDATE CLAIMS OF MULTIPLE PERSONS OR PRESIDE OVER ANY FORM OF CLASS ARBITRATION.
              </p>
              <p>
                <strong>Time Bar:</strong> Any cause of action or claim arising out of or related to this Agreement or the Services must be commenced 
                within exactly one (1) year after the cause of action accrued; otherwise, such cause of action or claim is permanently barred.
              </p>
            </div>
          </section>

          {/* SECTION 12 */}
          <section id="section-12" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">12</span>
              Governing Law, Jurisdiction &amp; Venue
            </h2>
            <p>
              This Agreement, and all claims or causes of action (whether in contract, tort, or statute) that may be based upon, arise out of, 
              or relate to this Agreement, shall be governed by and enforced in accordance with the internal substantive laws of the 
              <strong> State of Illinois</strong>, without giving effect to any choice of law or conflict of law rules that would cause the application 
              of the laws of any jurisdiction other than the State of Illinois.
            </p>
            <p>
              To the extent any court proceeding is permitted hereunder (such as obtaining preliminary injunctive relief or enforcing an arbitration award), 
              the parties irrevocably consent and submit to the exclusive personal jurisdiction and venue of the Circuit Court of Will County, Illinois, 
              or the United States District Court for the Northern District of Illinois (Eastern Division).
            </p>
          </section>

          {/* SECTION 13 */}
          <section id="section-13" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">13</span>
              DMCA Copyright Policy &amp; Takedown Procedure
            </h2>
            <p>
              ATC respects intellectual property rights and complies with the Digital Millennium Copyright Act (17 U.S.C. § 512, &quot;DMCA&quot;). 
              If you believe that material hosted on our network infringes your copyright, you may submit a formal DMCA notification to our 
              designated agent containing all statutory elements prescribed under 17 U.S.C. § 512(c)(3) at:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs space-y-1 font-mono">
              <p>DMCA Designated Copyright Agent</p>
              <p>Analytical Technical Consulting Inc.</p>
              <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
              <p>Email: legal@atechconsult.com / info@atechconsult.com</p>
            </div>
            <p className="text-xs text-slate-500">
              Repeat copyright infringers will have their accounts permanently terminated pursuant to our strict repeat-infringer policy.
            </p>
          </section>

          {/* SECTION 14 */}
          <section id="section-14" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">14</span>
              Force Majeure
            </h2>
            <p>
              Neither party shall be held liable or responsible to the other party, nor be deemed to have defaulted under or breached this Agreement, 
              for failure or delay in fulfilling or performing any term of this Agreement (other than Customer&apos;s obligation to pay recurring fees), 
              when such failure or delay is caused by or results from acts of God, flood, fire, earthquake, lightning, explosion, pandemic, war, 
              invasion, hostilities, terrorist threats or acts, civil unrest, labor disputes, telecommunications failures, regional power grid collapse, 
              upstream fiber cuts, cyber warfare, or acts of state or regulatory authorities.
            </p>
          </section>

          {/* SECTION 15 */}
          <section id="section-15" className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">15</span>
              Severability, Modifications &amp; Entire Agreement
            </h2>
            <p>
              If any provision or portion of this Agreement is determined by an arbitrator or court of competent jurisdiction to be invalid, illegal, 
              or unenforceable, such determination shall not affect any other provision of this Agreement, which shall remain in full force and effect.
            </p>
            <p>
              ATC reserves the right to modify these Terms at any time by posting the revised version on our website or transmitting notice via email. 
              Customer&apos;s continued use of the Services after the effective date of such modifications constitutes complete acceptance thereof. 
              This Agreement represents the entire understanding between the parties regarding the subject matter hereof and supersedes all prior negotiations, 
              agreements, or representations.
            </p>
          </section>

          {/* CORPORATE CONTACT FOOTER */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-300">Analytical Technical Consulting Inc. Legal Department</p>
            <p>1360 Brentwood Trl, Bolingbrook, IL 60490, United States</p>
            <p>Direct Inquiries: <a href="mailto:legal@atechconsult.com" className="text-blue-600 underline">legal@atechconsult.com</a> | General: <a href="mailto:info@atechconsult.com" className="text-blue-600 underline">info@atechconsult.com</a></p>
          </div>

        </div>

      </div>
    </div>
  );
}
