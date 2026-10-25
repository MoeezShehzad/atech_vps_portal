const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPolicies() {
  console.log('Seeding initial legal policies...');

  const now = new Date('2026-10-17T00:00:00.000Z');

  const policies = [
    {
      policyType: 'terms-of-service',
      title: 'Terms of Service & Cloud Infrastructure Agreement',
      version: 'v1.0',
      summaryOfChanges: 'Initial baseline enterprise terms of service with 90-day data preservation, SLA, and arbitration clauses.',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: `## 1. Services Provision & Modifications
Analytical Technical Consulting (ATC) provides high-performance cloud virtualization, Hyper-V virtual private servers (VPS), dedicated compute slices, and enterprise networking infrastructure. Services are provided pursuant to the specific SLA and tier configured during checkout.

## 2. Customer Obligations & Consents
Customer represents and warrants that all registration information submitted is accurate, verifiable, and maintained current. Customer is solely responsible for all activity conducted on or through customer virtual machine instances.

## 3. Customer Data & Intellectual Property
Customer retains full ownership, title, and all intellectual property rights to any Customer Data, software, or files stored within ATC virtual machines. ATC exercises zero proprietary claims over Customer workloads.

## 4. Shared Security Responsibility Model
ATC secures the physical data center, virtualization hypervisors, host operating systems, and core network perimeters. The customer remains strictly responsible for the guest operating system, firewall rules, credentials, software patching, and application security.

## 5. Acceptable Use Policy (AUP)
ATC strictly prohibits malicious scanning, unauthorized intrusion attempts, DDoS amplification, torrent seeding, phishing distribution, and illicit activities. Any violation results in immediate service termination without refund.

## 6. Service Suspension, Voluntary Deactivation & 90-Day Data Preservation
In the event of voluntary deactivation or overdue invoice non-payment, ATC maintains customer VM disk snapshots for a guaranteed 90-day preservation window. Customers may reactivate their virtual servers at any time within this 90-day period.

## 7. Service Level Agreement (SLA) & Remedies
ATC targets 99.9% network and hypervisor uptime. Uptime exclusions include scheduled maintenance windows, customer software crashes, and upstream upstream Tier-1 carrier transit outages.

## 8. Billing, Taxes & Invoicing
All subscription plans renew automatically on the billing anniversary date unless cancelled prior to renewal. All fees are exclusive of applicable state and federal taxes.

## 9. Disclaimer of Warranties ("AS IS")
Except as expressly stated in the SLA, all cloud services and compute instances are provided on an "AS IS" and "AS AVAILABLE" basis without warranty of any kind.

## 10. Governing Law & Dispute Resolution
This Agreement is governed by the laws of the State of Illinois, United States. Any disputes arising hereunder shall be resolved through binding individual arbitration.`
    },
    {
      policyType: 'privacy-policy',
      title: 'Enterprise Cloud Privacy Notice',
      version: 'v1.0',
      summaryOfChanges: 'Initial baseline GDPR, CCPA/CPRA, and NIST SP 800-88 compliant privacy notice.',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: `## 1. Institutional Scope & Regulatory Jurisdiction
This Cloud Privacy Notice applies to all cloud infrastructure services operated by Analytical Technical Consulting (ATC), an Illinois entity operating cloud virtualization facilities located in Illinois, United States. We operate in strict compliance with GDPR, UK GDPR, and CCPA/CPRA.

## 2. Four Foundational Data Trust Commitments
- **Commitment 1: You Own Your Data.** ATC never claims ownership or copyright over Customer Data.
- **Commitment 2: Zero Sale of Data.** We never monetize, rent, or sell your account data, telemetry, or storage.
- **Commitment 3: Zero Inspect of Workloads.** ATC employees and agents do not inspect, index, or browse customer virtual disk contents.
- **Commitment 4: Cryptographic Erasure.** Terminated instances are sanitized according to NIST SP 800-88 standards.

## 3. Customer Data vs Account Data Demarcation
- **Account Data:** Name, email, billing contact, verified phone number, and transaction identifiers used strictly to manage your billing and customer identity.
- **Customer Data:** Operating system images, databases, and files stored within your VPS. This data remains private and encrypted under customer control.

## 4. Information We Collect
We collect identity information (name, email), billing records via tokenized Stripe integration, technical connection logs (IP address, authentication timestamps), and resource performance telemetry (CPU, RAM, network bandwidth).

## 5. Lawful Bases for Processing (GDPR)
We process information strictly under lawful contractual necessity (providing cloud infrastructure), legitimate interest (preventing network abuse and fraud), and compliance with legal tax obligations.

## 6. Payment Processing & PCI-DSS
All credit card numbers are tokenized directly with Stripe. ATC servers never store, process, or transmit raw credit card numbers or CVV codes.

## 7. Data Retention & Deletion
Upon account closure or instance deletion, virtual machine storage volumes undergo cryptographic wiping within 7 business days following the expiration of the 90-day preservation grace period.`
    },
    {
      policyType: 'refund-policy',
      title: 'Refund, Cancellation & Dispute Policy',
      version: 'v1.0',
      summaryOfChanges: 'Initial baseline non-refundable compute policy with billing error resolution and anti-chargeback terms.',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: `## 1. General Infrastructure Billing Policy
All VPS instances, dedicated cores, bandwidth allocations, and IP address leases are provisioned immediately upon transaction confirmation. Compute resources are reserved exclusively for your account.

## 2. Final Sale & No Money-Back Guarantee
Because compute resources, hypervisor cores, and public IPv4 addresses incur immediate upstream data center costs upon provisioning, all sales and renewal payments are final and non-refundable.

## 3. Strictly Non-Refundable Items
- Hourly and monthly VPS compute allocations
- Static IPv4 and IPv6 subnet reservations
- Operating system template setup fees
- Add-on storage volumes and backup storage slots

## 4. Self-Service Cancellation Protocol
Customers may cancel their subscription at any time via the Customer Portal. Cancellation stops future recurring billing immediately while permitting active use through the end of the paid billing period.

## 5. Billing Error Adjustments
If you believe a duplicate charge or billing calculation error occurred, please submit a billing ticket within thirty (30) days of the invoice date. Valid billing overcharges will be promptly credited or refunded.

## 6. Anti-Chargeback Policy
Initiating an unwarranted chargeback or payment dispute without first contacting ATC Support constitutes a breach of contract and results in immediate instance suspension and a $50 administrative recovery fee.`
    }
  ];

  for (const pol of policies) {
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
      console.log(`✓ Seeded ${pol.policyType} (${pol.version})`);
    } else {
      console.log(`- ${pol.policyType} (${pol.version}) already exists`);
    }
  }

  console.log('Legal policy seeding completed successfully!');
}

seedPolicies()
  .catch((e) => {
    console.error('Error seeding policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
