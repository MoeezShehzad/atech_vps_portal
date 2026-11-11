const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPolicies() {
  console.log('Seeding PERFECT enterprise legal policies into database...');

  const now = new Date('2026-10-17T00:00:00.000Z');

  const policies = [
    {
      policyType: 'terms-of-service',
      title: 'Cloud Services – Terms and Conditions',
      version: 'v2.0',
      summaryOfChanges: 'Official ATC Cloud Services Terms and Conditions (all 18 legal articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: new Date('2026-11-11T00:00:00.000Z'),
      publishedAt: new Date('2026-11-11T00:00:00.000Z'),
      content: `## 1. Agreement and Acceptance

These Terms and Conditions govern the use of cloud computing, virtual machine hosting, infrastructure, storage, networking, and related technology services provided by Analytical Technical Consulting (ATC).

By subscribing to, accessing, or using ATC Cloud Services, the customer agrees to comply with these Terms and Conditions.

---

## 2. Cloud Services Provided

ATC may provide the following services:

- Cloud infrastructure and virtual machine hosting.
- Customizable CPU cores, RAM, and storage allocation.
- Operating system installation and configuration.
- Cloud storage and data management.
- Network configuration and connectivity.

**Server Monitoring and Infrastructure Management:** ATC provides continuous server monitoring, infrastructure management, and performance monitoring services. When customers subscribe to ATC-managed monitoring services, ATC allocates its technical resources to monitor client’s system availability, infrastructure health, performance, and operational issues.

**Backup and Disaster Recovery Services:** ATC provides backup management and disaster recovery services as specified in the customer's subscription plan. When these services are included, ATC utilizes its technical resources to monitor backup operations, verify backup status, oversee recovery readiness, and support disaster recovery (DR) activities in accordance with the agreed service scope and SLA. If the client does not subscribe to ATC's Disaster Recovery (DR) services, ATC shall not be responsible for restoring or reactivating the client's services, systems, or infrastructure within 24 hours or any other specified recovery timeframe. Recovery time commitments shall apply only when DR services are explicitly included in the client's subscription agreement or covered under a separately agreed Service Level Agreement (SLA).

**High Availability (HA) and Business Continuity Solutions:** ATC provides High Availability (HA) and business continuity solutions as specified in the customer's service agreement.

- **Primary Datacenter (PDC) HA Only:** If the client subscribes to HA services within the Primary Datacenter (PDC) only, ATC will be responsible for hardware-level failover within the PDC. Disaster Recovery (DR) services, including failover to a secondary disaster recovery site, are not included in this subscription.
- **PDC HA with DR HA:** If the client subscribes to both PDC High Availability and Disaster Recovery High Availability services, ATC will be responsible for managing the hardware failover and associated infrastructure recovery processes at both locations, in accordance with the agreed service scope.
- **Failover and Downtime:** Depending on the nature of the hardware failure, infrastructure configuration, and recovery requirements, some service interruption or downtime may occur during the activation of standby hardware within the PDC or the DR environment. ATC will perform the applicable failover procedures in accordance with the agreed SLA and recovery objectives.
- **Important:** Neither zero downtime nor uninterrupted service availability is guaranteed unless explicitly specified in the signed service agreement.

**Technical Support, Maintenance, and Troubleshooting Services:** Technical support, system maintenance, and troubleshooting services are not included in the standard ATC subscription unless explicitly specified in the service agreement. If a client requires additional technical assistance or services from ATC's technical resources, the client must submit a service request through the designated ticketing system. The requested services will be evaluated and billed separately in US Dollars (USD), based on the applicable service rates and agreed scope of work.

Service specifications will be determined by the customer's selected subscription or service agreement.

---

## 3. Customer Account and Responsibilities

Customers are responsible for:

- Providing accurate registration and billing information.
- Maintaining the confidentiality of account credentials.
- Protecting passwords, access keys, and administrative accounts.
- Managing users and assigning appropriate access permissions.
- Ensuring that their applications and data comply with applicable laws.
- Maintaining their own application-level security.
- Notifying ATC immediately of suspected unauthorized account access.

Customers are responsible for activities performed through their accounts, subject to applicable law.

---

## 4. Acceptable Use Policy

Customers must not use ATC Cloud Services for:

- Illegal activities or unauthorized access to computer systems.
- Distribution of malware, viruses, ransomware, or malicious software.
- Phishing, fraud, identity theft, or deceptive activities.
- Spamming or unauthorized bulk email distribution.
- Copyright infringement or distribution of unauthorized content.
- Denial-of-service attacks or activities that disrupt other customers.
- Unauthorized cryptocurrency mining or resource abuse, where prohibited by the service plan.
- Activities that compromise the security, stability, or availability of ATC infrastructure.

ATC reserves the right to investigate reported violations and restrict, suspend, or terminate services when reasonably necessary and legally permitted.

---

## 5. Service Availability and Maintenance

- ATC will make commercially reasonable efforts to maintain cloud infrastructure availability.
- Scheduled maintenance may be required for infrastructure upgrades, security updates, and hardware replacement.
- Customers will receive advance notice of planned maintenance when reasonably practicable.
- Emergency maintenance may be performed without advance notice when necessary to protect infrastructure.
- Actual uptime commitments, if any, will be defined in a separate Service Level Agreement (SLA).
- ATC does not guarantee uninterrupted or error-free service unless expressly agreed in writing.

---

## 6. Data Ownership and Privacy

- Customers retain ownership of their data, applications, and content.
- ATC does not claim ownership of customer data hosted on its infrastructure.
- ATC will handle customer data in accordance with its applicable privacy policy and contractual commitments.
- Customers are responsible for ensuring that they have the legal right to store and process the data they upload.
- ATC may access customer systems or data when necessary for authorized support, security investigations, maintenance, or compliance with applicable law.
- ATC will implement reasonable administrative, technical, and organizational safeguards to protect its infrastructure and customer information.

---

## 7. Backup and Data Recovery

- Customers are responsible for maintaining appropriate backups unless backup services are expressly included in their subscription.

Where ATC provides backup services:

- Backup frequency and retention periods will follow the selected service plan.
- Restoration requests will be handled according to the applicable service agreement.
- Backup availability and recovery objectives will be defined in the relevant SLA or service documentation.
- ATC recommends that customers maintain independent copies of critical business data.

---

## 8. Security Responsibilities

- ATC will maintain reasonable infrastructure-level security controls.
- Customers are responsible for securing their virtual machines, applications, databases, operating systems, and user accounts unless ATC has expressly agreed to manage those components.
- No cloud infrastructure can be guaranteed to be completely immune from cybersecurity threats.

---

## 9. Subscription Fees and Payment

- Cloud services are billed according to the selected subscription or service agreement.
- Fees, billing frequency, and payment deadlines will be communicated before service activation.
- Additional CPU, RAM, storage, bandwidth, backup, or technical support may incur additional charges.
- Customers are responsible for applicable taxes.
- Late or unpaid invoices may result in service restrictions or suspension following appropriate notice, subject to applicable law and the service agreement.

---

## 10. Resource Usage and Service Limits

Customers must operate within their allocated resources, including:

- CPU cores.
- RAM.
- Storage capacity.
- Network bandwidth.
- IP addresses.
- Other purchased infrastructure resources.

ATC may impose reasonable restrictions to protect shared infrastructure and maintain service stability.

Any additional resource requirements must be approved and may be subject to additional fees.

---

## 11. Suspension and Termination

ATC may suspend or terminate services in circumstances including:

- Nonpayment of outstanding invoices.
- Violation of these Terms and Conditions.
- Security threats or malicious activities.
- Unauthorized use of infrastructure.
- Legal or regulatory requirements.
- Activities that negatively affect infrastructure stability or other customers.

Where reasonably practicable, ATC will provide notice and an opportunity to resolve the issue before suspension or termination.

Upon termination, customers should retrieve their data before the applicable data retrieval period expires. Data deletion and retention will follow the service agreement, privacy policy, and applicable legal requirements.

---

## 12. Limitation of Liability

To the maximum extent permitted by applicable law, ATC will not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, business interruption, or loss of business opportunities.

ATC's aggregate liability will be governed by the applicable service agreement and subject to any limitations or exceptions required by law.

Nothing in these Terms excludes liability that cannot legally be excluded.

---

## 13. Third-Party Services

Certain services may depend on third-party software, hardware, telecommunications providers, licensing arrangements, or external infrastructure.

Such services may be subject to separate third-party terms and conditions. ATC is not responsible for third-party service interruptions beyond its reasonable control.

---

## 14. Changes to Services and Terms

ATC reserves the right to update its services, infrastructure, pricing, and these Terms and Conditions.

Material changes will be communicated to customers when required by applicable law or the service agreement.

Continued use of the services after the effective date of an update constitutes acceptance where legally permitted.

---

## 15. Force Majeure

ATC will not be responsible for delays or failures caused by circumstances beyond its reasonable control, including natural disasters, power outages, telecommunications failures, cyberattacks, government actions, war, and other extraordinary events.

---

## 16. Governing Law and Jurisdiction

These Terms and Conditions will be governed by the laws of the State of Illinois, United States, unless otherwise required by applicable law or specified in a separate written agreement.

Any disputes will be handled by the courts of competent jurisdiction, subject to applicable legal requirements.

---

## 17. Contact and Support

For cloud service inquiries, technical support, billing questions, or contractual matters, customers may contact:

**Analytical Technical Consulting (ATC)**  
Cloud Infrastructure and Technical Services  
**Email:** support@atechconsult.com  
**Website:** https://atechconsult.com

---

## 18. Final Agreement

These Terms and Conditions, together with the applicable subscription agreement, Service Level Agreement (SLA), Privacy Policy, and Acceptable Use Policy, constitute the governing terms for ATC Cloud Services.

By purchasing or using ATC Cloud Services, customers acknowledge that they have read, understood, and agreed to these Terms and Conditions.`
    },
    {
      policyType: 'privacy-policy',
      title: 'Enterprise Cloud Privacy Notice',
      version: 'v1.0',
      summaryOfChanges: 'Complete initial baseline GDPR, CCPA/CPRA, and NIST SP 800-88 enterprise privacy architecture (all 16 legal articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: "## 1 Institutional Scope & Regulatory Jurisdiction\n\nThis Cloud Privacy Notice applies to all cloud infrastructure services provided by **Analytical Technical Consulting (ATC)**,  an Illinois entity operating cloud infrastructure facilities located in  ** Illinois, United States**.\n\n              \n\nThis policy establishes institutional transparency regarding our data handling pursuant to the European Union General Data Protection  Regulation (Regulation (EU) 2016/679, \"GDPR\"), the UK Data Protection Act 2018, the California Consumer Privacy Act as amended by the  California Privacy Rights Act (Cal. Civ. Code § 1798.100 et seq., \"CCPA/CPRA\"), and comprehensive state privacy statutes in Virginia,  Colorado, Connecticut, and Utah.\n\n---\n\n## 2. ATC Enterprise Data Trust Commitments\n\nATC adheres strictly to four foundational enterprise data protection commitments:\n\n              \n                \n                  **Commitment 1: You Own Your Data**\n                  ATC never claims ownership or copyright over Customer Data. You own all data, applications, and source code stored in your virtual machines.\n                \n                \n                  **Commitment 2: Contractual Purpose Only**\n                  ATC processes Customer Data strictly as necessary to execute, route, and secure the cloud services contracted in your agreement.\n                \n                \n                  **Commitment 3: No Advertising Use**\n                  ATC never scans, indexes, mines, or analyzes Customer Data for advertising, marketing profiling, or consumer targeting purposes.\n                \n                \n                  **Commitment 4: Zero Selling of Data**\n                  ATC does not sell, rent, or lease your personal data, server logs, or telemetry to any third party or data broker.\n\n---\n\n## 3. Customer Data vs. Account Data Demarcation\n\nATC maintains a strict institutional boundary between:\n\n              \n                \n                  **A. Customer Data (Controller: Customer):**\n                  Data, files, code, software, and databases uploaded to or processed within Customer's virtual machines. \n                  ** ATC DOES NOT INSPECT, ACCESS, AUDIT, SHARE, OR SELL CUSTOMER DATA**. \n                  Under GDPR and CCPA, Customer is the sole Data Controller of Customer Data; ATC operates strictly as a neutral Data Processor.\n                \n                \n                  **B. Account & Telemetry Data (Controller: ATC):**\n                  Data collected from Customer to authenticate accounts, bill for services, prevent infrastructure abuse, and deliver customer support. \n                  ATC acts as the Data Controller solely for this administrative metadata.\n\n---\n\n## 4 Categories of Information We Collect\n\nWe collect information directly from you to deliver, bill, and protect enterprise cloud infrastructure:\n\n              \n\n                - **Identity & Account Profile Data:** Full legal name, corporate business name, physical corporate billing address, telephone number, and verified administrative email address;\n\n                - **Authentication & Access Credentials:** Cryptographically salted and hashed passwords (using bcrypt algorithms), customer-uploaded SSH public keys, and session tokens;\n\n                - **Billing & Financial Metadata:** Payment card brand, last four digits of payment card, expiration month/year, encrypted billing reference token, tax IDs, and transaction invoice records;\n\n                - **Telemetry & Infrastructure Diagnostics:** Source IP addresses used to access the portal, web browser user-agent strings, hypervisor API calls, bandwidth consumption metrics, CPU/RAM utilization logs, and firewall access attempts.\n\n---\n\n## 5 Lawful Bases for Data Processing\n\nUnder global data privacy laws, ATC processes personal data pursuant to clearly established lawful grounds:\n\n              \n                \n                  **Contractual Execution:**\n                  Provisioning virtual compute nodes, allocating dedicated IP addresses, calculating resource usage, and invoicing accounts.\n                \n                \n                  **Legitimate Security Interests:**\n                  Defending hypervisor clusters against DDoS attacks, detecting rogue port-scanning, deflecting brute-force attacks, and preventing fraudulent billing.\n                \n                \n                  **Statutory Legal Obligation:**\n                  Compliance with federal tax (IRS) regulations, Illinois corporate accounting laws, and statutory records retention requirements.\n                \n                \n                  **Customer Consent:**\n                  Opt-in notifications regarding scheduled maintenance windows, feature updates, or customer satisfaction reviews.\n\n---\n\n## 6. Payment Card Processing & PCI-DSS Level 1 Security Standards\n\nATC DOES NOT RECEIVE, PROCESS, STORE, OR TRANSMIT RAW CREDIT CARD NUMBERS, CVV SECURITY CODES, OR CARD TRACK DATA ON OUR HOST SERVERS.\n              \n              \n\nAll payment transactions are executed through our certified PCI-DSS Level 1 payment processing gateway.  Payment card details entered via our checkout interface are ingested directly into an encrypted PCI-DSS Level 1 vault.  ATC receives and maintains only a tokenized customer identifier, payment method ID,  card brand, and the last 4 digits of the payment instrument for billing records and recurring invoice generation.\n\n---\n\n## 7 Infrastructure Telemetry, Flow Logs & Perimeter Defense\n\nTo defend our virtualization nodes and maintain 99.9% availability, ATC captures operational telemetry:\n\n              \n\n                - **Firewall NetFlow Logs:** Inbound/outbound packet counts, port hit distributions, and dropped connection events to identify and null-route DDoS attacks;\n\n                - **Hypervisor VM Lifecycle Events:** State changes (provision, reboot, power-off, snapshot creation, disk resize) to diagnose cluster performance;\n\n                - **Audit Trails:** Management portal logins, API calls, and console access timestamps retained for ninety (90) calendar days for security accountability.\n\n---\n\n## 8 Audited Subprocessors & Controlled Third-Party Disclosures\n\nATC utilizes only vetted, industry-standard subprocessors who operate under strict Data Processing Agreements (DPAs)  mandating confidentiality and security standards equivalent to our own:\n\n              \n                \n                  **PCI-DSS Level 1 Payment Gateway (United States):**\n                  Tokenized payment processing, subscription billing, and fraud mitigation.\n                \n                \n                  **Enterprise Perimeter Security Systems:**\n                  Hardware perimeter firewall defense and stateful intrusion prevention.\n\n---\n\n## 9. Absolute Prohibition on the Sale or Rental of Personal Data\n\nANALYTICAL TECHNICAL CONSULTING (ATC) HAS NEVER SOLD, DOES NOT SELL, AND WILL NEVER SELL, RENT, LEASE, OR TRADE YOUR PERSONAL INFORMATION,  CUSTOMER DATA, TELEMETRY, OR IP USAGE TO THIRD PARTIES, DATA BROKERS, OR ADVERTISERS FOR MONETARY OR OTHER VALUABLE CONSIDERATION.\n\n              \n\nWe do not engage in cross-context behavioral advertising. Pursuant to California Civil Code § 1798.120, Customer does not need  to submit an opt-out request because ATC does not engage in the sale of personal information under any circumstance.\n\n---\n\n## 10 Government Demands & Subpoena Scrutiny\n\nATC enforces rigorous standards regarding government demands for customer records:\n\n              \n\n                - **Judicial Process Required:** ATC will NOT disclose Customer Data or account records without valid, binding legal process—such as a subpoena, court order signed by a judge of competent jurisdiction, or search warrant issued under the Federal Rules of Criminal Procedure or state equivalent;\n\n                - **Scrutiny of Legal Basis:** ATC reviews each demand to confirm that it complies with the law and will challenge or narrow overbroad or inappropriate requests;\n\n                - **Notice to Customer:** Unless explicitly prohibited by a valid statutory non-disclosure gag order issued under 18 U.S.C. § 2705(b), ATC will notify Customer in writing prior to disclosing account information to allow Customer an opportunity to challenge the legal process.\n\n---\n\n## 11. Data Retention & NIST SP 800-88 Cryptographic Sanitization\n\nWe retain account identification records for the duration of your active subscription, and for up to seven (7) years following  account closure strictly to satisfy statutory tax, IRS accounting, and anti-fraud reporting mandates.\n\n              \n                **Cryptographic & Block-Level Sanitization:**\n                When Customer destroys an instance or when an account is terminated, the underlying virtual hard disk files (VHDX) are permanently unlinked. \n                De-allocated storage blocks across our SSD arrays are zero-filled and cryptographically purged in compliance with \n                ** NIST Special Publication 800-88 Revision 1 (Guidelines for Media Sanitization)**. Once erased, customer data cannot be retrieved by any party.\n\n---\n\n## 12 Your Global Statutory Privacy Rights (GDPR & CCPA/CPRA)\n\nDepending on your jurisdiction, you possess enforceable legal rights regarding your personal data:\n\n              \n                \n                  **Right to Know & Access:**\n                  Request details regarding the categories and specific pieces of personal information ATC maintains about you.\n                \n                \n                  **Right to Rectification:**\n                  Correct inaccurate, outdated, or incomplete account and contact data.\n                \n                \n                  **Right to Erasure (Deletion):**\n                  Request deletion of your personal data, subject to legal compliance and statutory retention requirements.\n                \n                \n                  **Right to Non-Discrimination:**\n                  ATC will never deny service, charge differential rates, or downgrade hosting quality for exercising privacy rights.\n                \n              \n              \n\nTo submit a verifiable consumer request, contact our compliance office at privacy@atechconsult.com. We respond within forty-five (45) calendar days.\n\n---\n\n## 13 Cookies, Session Storage & Global Privacy Control (GPC)\n\nOur portal utilizes strictly essential first-party authentication session cookies required to verify login state and protect against  Cross-Site Request Forgery (CSRF). We do not deploy third-party advertising tracking cookies. We honor Global Privacy Control (GPC)  and Do Not Track (DNT) browser signals.\n\n---\n\n## 14 Defense-in-Depth Security Safeguards\n\nWe enforce multi-tiered defense-in-depth security measures to protect your account information:\n\n              \n\n                - Mandatory TLS 1.3 encryption across all web traffic and API endpoints;\n\n                - Hypervisor hardware-enforced memory isolation and virtualization protection;\n\n                - Perimeter stateful packet inspection firewalls, rate limiting, and intrusion detection systems;\n\n                - Physical access controls and biometric data center perimeter security.\n\n---\n\n## 15 Protection of Minors\n\nOur services are directed strictly to commercial enterprises and adult individuals aged eighteen (18) years or older.  We do not knowingly collect personal data from minors under 18. Any account identified as belonging to a minor will be terminated  and all associated personal data immediately expunged.\n\n---\n\n## 16 Policy Amendments & Data Protection Officer Contact\n\nATC reserves the right to amend this Privacy Notice periodically. Modifications take effect upon posting to our portal.  If you have inquiries regarding this notice or wish to exercise statutory data rights, contact our Data Protection Officer at:\n\n              \n                \n\nData Protection Officer — Privacy Compliance\n\n                \n\nAnalytical Technical Consulting (ATC)\n\n                \n\nIllinois, United States\n\n                \n\nDirect Email: privacy@atechconsult.com • General: info@atechconsult.com"
    },
    {
      policyType: 'refund-policy',
      title: 'Refund & Cancellation Policy',
      version: 'v1.0',
      summaryOfChanges: 'Complete initial baseline cloud billing, dispute protocol, non-refundable compute, and anti-chargeback policy (all 9 legal articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: "## 1 General Cloud Infrastructure Billing Policy\n\nIn accordance with standard enterprise cloud infrastructure governance,  ** all cloud compute resources, virtual machines, block storage volumes, and bandwidth allocations provided by Analytical Technical Consulting (ATC) are billed on a  prepaid subscription model and are strictly non-refundable once provisioned**.\n\n              \n\n**Infrastructure Reservation Principle:** When you deploy a virtual machine, our cluster dedicates physical CPU cores,  locks dedicated server RAM in physical host memory, provisions SSD storage arrays, and reserves dedicated IP routing through our switches.  These resources remain dedicated to your instance whether the guest operating system is actively booted or powered off.  Consequently, powered-off instances continue to accrue recurring hosting charges until permanently cancelled or destroyed by Customer.\n\n---\n\n## 2. No Money-Back Guarantee & Final Sale Policy\n\n**ATC does not offer a general money-back guarantee or trial refund period on paid subscriptions.** All orders for virtual private servers, compute packages, storage expansions, and network allocations are final upon order placement and resource reservation.\n\n              \n                \n                  **No Partial-Month Proration:** Unused time remaining in a prepaid monthly or annual billing cycle following a voluntary customer cancellation is non-refundable and will not be prorated.\n                \n                \n                  **Verified Billing Error Exception:** In the event of a verified duplicate charge or computational billing error attributable solely to ATC's billing system, Customer may submit a written review request to billing@atechconsult.com within seven (7) calendar days of the transaction timestamp. Any billing adjustment or credit is issued strictly at ATC's sole and absolute discretion.\n\n---\n\n## 3. Strictly Non-Refundable Products, Licenses & Add-Ons\n\nTHE FOLLOWING ASSETS INCUR IRREVOCABLE UPSTREAM COSTS AND ARE STRICTLY NON-REFUNDABLE UNDER ALL CIRCUMSTANCES:\n\n              \n                \n                  **Dedicated IPv4 Addresses:**\n                  Carrier allocation fees, registry routing costs, and subnet assignment fees are completely non-refundable once provisioned.\n                \n                \n                  **Commercial Software & OS Licenses:**\n                  Commercial operating system images, control panel licenses, and software add-on licenses cannot be refunded or prorated once issued.\n                \n                \n                  **Subscription Renewals:**\n                  Subsequent monthly or annual recurring renewal cycles are non-refundable once billed. Cancellations must occur prior to the renewal date.\n                \n                \n                  **Engineering & Setup Services:**\n                  Custom server migrations, technical consulting hours, hardware sizing, and architectural setup fees are non-refundable once delivered.\n\n---\n\n## 4 Self-Service Subscription Cancellation Protocol\n\nCustomers maintain complete self-service control over their subscriptions. You may cancel any active virtual server or add-on at any time  without cancellation penalties directly through the **ATC Client Portal Dashboard** or by submitting written notice to  billing@atechconsult.com.\n\n              \n                **24-Hour Advance Timing Rule:**\n                \n\nTo prevent the automated processing of subscription renewal charges by our payment gateway, cancellation requests must be executed  at least **twenty-four (24) hours prior** to the next scheduled invoice generation date. Once an invoice has been charged,  that billing cycle is deemed active and non-refundable.\n\n                \n\nUpon cancellation, Customer's virtual machine remains operational until the conclusion of the prepaid period, at which point the instance  is cleanly shut down, deleted, and all virtual hard disks sanitized.\n\n---\n\n## 5. Total Forfeiture of Refunds Upon Abuse or AUP Breach\n\nANY VIOLATION OF OUR ACCEPTABLE USE POLICY (AUP) OR MASTER TERMS OF SERVICE RESULTS IN THE IMMEDIATE, COMPLETE, AND IRREVOCABLE  FORFEITURE OF ALL REFUND ELIGIBILITY, UNUSED PREPAID BALANCES, AND SERVICE CREDITS.\n\n              \n\nIf an account or virtual server is suspended, null-routed, or terminated due to Denial of Service (DDoS) activity, unsolicited bulk email (SPAM),  malware or botnet hosting, unauthorized crypto-mining, port-scanning, copyright infringement, or fraudulent registration,  ** UNDER NO CIRCUMSTANCES WILL ANY REFUND BE GRANTED**. Customer shall remain fully liable for any damages, investigation expenses,  and carrier penalties incurred by ATC.\n\n---\n\n## 6. Mandatory Anti-Chargeback Policy & $50 Administrative Fee\n\nCUSTOMER COVENANTS THAT CUSTOMER WILL NOT INITIATE A PAYMENT DISPUTE, CHARGEBACK, OR REVERSAL WITH ANY CREDIT CARD ISSUER, BANK, \n                OR PAYMENT PROCESSOR WITHOUT FIRST PROVIDING WRITTEN NOTICE TO BILLING@ATECHCONSULT.COM AND ALLOWING FOURTEEN (14) BUSINESS DAYS \n                FOR ATC TO INVESTIGATE AND AMICABLY RESOLVE THE INQUIRY.\n              \n              \n\nFiling an unauthorized, retaliatory, or bad-faith chargeback constitutes a material, non-curable breach of contract.  In the event Customer initiates an unjustified chargeback or payment reversal:\n\n              \n\n                - **Immediate Server Destruction:** All virtual machines, dedicated IPs, and data volumes associated with the account will be immediately suspended and destroyed without prior notice;\n\n                - **Mandatory $50.00 Administrative Dispute Fee:** Customer agrees to pay ATC a mandatory Fifty United States Dollar ($50.00 USD) administrative fee per disputed charge to offset merchant bank investigation fines;\n\n                - **Forfeiture of Service Credits:** Any accumulated account credits, promotional discounts, or SLA allowances are immediately cancelled.\n\n---\n\n## 7 Collections Enforcement, Legal Fees & Fraud Blacklisting\n\nIn the event an unjustified chargeback is initiated or an account balance remains delinquent:\n\n              \n\n                - **Commercial Debt Collections:** The delinquent balance, accrued interest (at the maximum statutory rate of 1.5% per month), and dispute assessment fees will be referred to licensed commercial debt collection agencies and reported to major credit reporting bureaus;\n\n                - **Legal Fees Recovery:** Customer agrees to reimburse Analytical Technical Consulting (ATC) for all reasonable attorneys' fees, court costs, and collection expenses incurred by ATC in enforcing its legal rights under this Agreement;\n\n                - **Global Merchant Blacklisting:** The customer's legal name, corporate domain, verified telephone number, credit card hash, and IP blocks will be permanently blacklisted across our payment gateway and industry anti-fraud merchant databases.\n\n---\n\n## 8 Billing Error Adjustments & Settlement Timelines\n\nIn the rare event that a billing adjustment or refund is authorized in writing by our Billing Department pursuant to Section 2:\n\n              \n\n                - Approved adjustments are credited **strictly and exclusively** back to the original payment method (credit/debit card) utilized during checkout. ATC will not issue cash, wire transfers to alternate accounts, or checks;\n\n                - Adjustments typically appear on your cardholder bank statement within **five (5) to ten (10) business days** following dispatch, depending upon your financial institution's settlement schedule;\n\n                - A formal credit memorandum and confirmation receipt will be automatically transmitted to your account email address.\n\n---\n\n## 9 Invoicing Inquiries & Billing Department Contact\n\nIf you believe an invoice contains a computational error or requires clarification, submit a formal billing inquiry within  thirty (30) calendar days of invoice generation to:\n\n              \n                \n\nBilling & Financial Operations Department\n\n                \n\nAnalytical Technical Consulting (ATC)\n\n                \n\nIllinois, United States\n\n                \n\nDirect Inquiries: billing@atechconsult.com"
    }
  ];

  for (const pol of policies) {
    if (pol.isCurrent) {
      await prisma.legalPolicyVersion.updateMany({
        where: {
          policyType: pol.policyType,
          version: { not: pol.version },
        },
        data: {
          isCurrent: false,
          status: 'ARCHIVED',
        },
      });
    }

    const existing = await prisma.legalPolicyVersion.findFirst({
      where: {
        policyType: pol.policyType,
        version: pol.version,
      },
    });

    if (!existing) {
      await prisma.legalPolicyVersion.create({
        data: pol,
      });
      console.log(`✓ Seeded ${pol.policyType} (${pol.version}) with ${pol.content.length} characters`);
    } else {
      await prisma.legalPolicyVersion.update({
        where: { id: existing.id },
        data: {
          title: pol.title,
          content: pol.content,
          summaryOfChanges: pol.summaryOfChanges,
          isCurrent: true,
          status: 'PUBLISHED',
          effectiveAt: pol.effectiveAt,
          publishedAt: pol.publishedAt,
        },
      });
      console.log(`✓ Updated ${pol.policyType} (${pol.version}) with ${pol.content.length} characters`);
    }
  }

  console.log('All 3 legal policies are cleanly formatted and stored in the database! 🎉');
}

seedPolicies()
  .catch((e) => {
    console.error('Error seeding policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
