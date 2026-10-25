const { execSync } = require('child_process');
const fs = require('fs');

function cleanSectionHtml(html, defaultTitle) {
  let title = defaultTitle;
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) {
    const rawH2 = h2Match[1]
      .replace(/<span[^>]*class="[^"]*rounded-full[^"]*"[^>]*>([0-9.]+)<\/span>/gi, '$1. ')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, '&')
      .replace(/&apos;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (rawH2.length > 2) {
      title = rawH2;
    }
  }

  let body = html.replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, '');

  body = body
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (m, p1) => {
      const clean = p1.replace(/<[^>]+>/g, '').trim();
      return `\n\n### ${clean}\n\n`;
    })
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, p1) => {
      const clean = p1.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return `- ${clean}\n`;
    })
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (m, p1) => {
      const clean = p1
        .replace(/\r?\n\s*/g, ' ')
        .replace(/&quot;/gi, '"')
        .replace(/&amp;/gi, '&')
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/<[^>]+>/g, '')
        .trim();
      return clean.length > 0 ? `\n\n${clean}\n\n` : '';
    })
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&apos;/gi, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `## ${title}\n\n${body}`;
}

// 1. TERMS OF SERVICE
const tosSource = fs.readFileSync('public/src/pages/TermsOfService.tsx', 'utf8');

const originalTosSections = [];
for (let i = 1; i <= 19; i++) {
  const reg = new RegExp(`<section id="atc-${i}"[\\s\\S]*?<\\/section>`, 'i');
  const m = tosSource.match(reg);
  if (m) {
    originalTosSections.push(m[0]);
  }
}

// Now assemble the 21 sections
const finalTosSections = [
  cleanSectionHtml(originalTosSections[0], '1. Services Provision, Modifications & Unmanaged Scope'),
  "## 2. Cloud Computing Services – Licensing & Compliance Disclaimer\n\nATC provides cloud computing infrastructure and related services only. ATC is not responsible for the licensing, installation, management, or compliance of any operating systems, software applications, third-party tools, or other devices and services used by the customer, unless otherwise agreed in writing.\n\nIf required, ATC can assist customers in procuring the necessary software licenses on their behalf, subject to applicable terms, conditions, and costs.\n\nCustomers are solely responsible for ensuring that all software, operating systems, and applications used on ATC’s cloud infrastructure are properly licensed and comply with the applicable licensing agreements and legal requirements.\n\nIf ATC discovers, or receives a complaint or notification from any software vendor, organization, copyright holder, or authorized representative regarding the use of unlicensed software, ATC reserves the right to suspend or shut down the affected device or service without prior notice until the necessary licenses have been obtained and compliance has been verified.\n\nCustomers are responsible for any costs, liabilities, or consequences arising from their use of unlicensed software.",
  cleanSectionHtml(originalTosSections[1], '3. Customer Obligations, Corporate Authority & Authentication'),
  cleanSectionHtml(originalTosSections[2], '4. Customer Data & Intellectual Property Sovereignty'),
  cleanSectionHtml(originalTosSections[3], '5. ATC Shared Security Responsibility Model'),
  cleanSectionHtml(originalTosSections[4], '6. Acceptable Use Policy (AUP) & High-Risk Activities'),
  cleanSectionHtml(originalTosSections[5], '7. Absolute Backup Disclaimer & Complete Immunity for Data Loss'),
  cleanSectionHtml(originalTosSections[6], '8. Service Level Agreement (SLA) & Sole Remedy'),
  cleanSectionHtml(originalTosSections[7], '9. Fees, Invoicing, Automated Billing & Taxes'),
  cleanSectionHtml(originalTosSections[8], '10. Service Suspension, Voluntary Deactivation & 90-Day Data Preservation Policy'),
  cleanSectionHtml(originalTosSections[9], '11. Term, Termination & NIST SP 800-88 Data Sanitization'),
  cleanSectionHtml(originalTosSections[10], '12. Complete Disclaimer of Warranties ("AS IS" & "AS AVAILABLE")'),
  cleanSectionHtml(originalTosSections[11], '13. Strict Limitation of Liability & Absolute Damages Cap'),
  cleanSectionHtml(originalTosSections[12], '14. Comprehensive Customer Indemnification'),
  cleanSectionHtml(originalTosSections[13], '15. Mandatory Binding Individual Arbitration & Class Action Waiver'),
  cleanSectionHtml(originalTosSections[14], '16. Governing Law, Exclusive Venue & One-Year Limitation Bar'),
  cleanSectionHtml(originalTosSections[15], '17. Safe Harbor, DMCA & Copyright Notice'),
  "## 18. Suspension of Services, Copyright Disputes & Software Audits\n\nATC shall not be held liable for any claims, disputes, losses, or damages arising from the suspension or shutdown of cloud computing services due to suspected or confirmed software licensing violations or copyright infringement.\n\nIf a copyright holder, software owner, licensing organization, or its authorized representative raises a claim or dispute regarding the use of unlicensed software, ATC reserves the right to suspend or terminate the affected cloud computing services until the customer resolves the matter directly with the relevant copyright holder, software owner, or licensing organization and provides satisfactory evidence of compliance.\n\nATC shall operate in accordance with applicable United States federal laws, rules, and regulations, as well as other applicable legal requirements.\n\nCustomers are responsible for resolving all licensing and copyright-related disputes arising from their use of ATC’s cloud computing services. ATC shall not be responsible for disputes resulting from the customer’s unauthorized use of software or other third-party intellectual property, to the extent permitted by applicable law.",
  cleanSectionHtml(originalTosSections[16], '19. U.S. Export Controls & Trade Sanctions'),
  cleanSectionHtml(originalTosSections[17], '20. Force Majeure & Upstream Continuity'),
  cleanSectionHtml(originalTosSections[18], '21. Miscellaneous Legal Provisions & Defined Terms')
];

const fullTosMarkdown = finalTosSections.join('\n\n---\n\n');
console.log('✓ Cleaned TOS with 2 new licensing clauses:', finalTosSections.length, 'sections. Total Length:', fullTosMarkdown.length);

// 2. PRIVACY POLICY
const privSource = execSync('git show 462e9721:public/src/pages/PrivacyPolicy.tsx', { encoding: 'utf8' });
const privTOC = [
  '1. Institutional Scope & Regulatory Jurisdiction',
  '2. ATC Enterprise Data Trust Commitments',
  '3. Customer Data vs Account Data Demarcation',
  '4. Information We Collect & Ingestion Telemetry',
  '5. Lawful Bases for Processing Under GDPR & UK GDPR',
  '6. Payment Processing, PCI-DSS Level 1 & Zero Card Storage',
  '7. Infrastructure Telemetry, Log Retention & Perimeter Security',
  '8. Controlled Subprocessors, Upstream Data Centers & Transit',
  '9. Absolute Prohibition on Sale or Commercialization of Data',
  '10. Government Demands, Law Enforcement & Subpoena Scrutiny',
  '11. Cryptographic Erasure & NIST SP 800-88 Sanitization',
  '12. Global Data Protection Rights (GDPR, UK GDPR, CCPA/CPRA)',
  '13. Essential Cookies, Zero Advertising Trackers & GPC Signal Handling',
  '14. Technical Security Safeguards & Defense-in-Depth',
  '15. Protection of Minors & COPPA Non-Targeting',
  '16. Data Protection Officer (DPO) & Formal Inquiries'
];

const privSections = [];
for (let i = 1; i <= 16; i++) {
  const reg = new RegExp(`<section id="atcpriv-${i}"[\\s\\S]*?<\\/section>`, 'i');
  const m = privSource.match(reg);
  if (m) {
    privSections.push(cleanSectionHtml(m[0], privTOC[i - 1]));
  }
}
const fullPrivMarkdown = privSections.join('\n\n---\n\n');

// 3. REFUND POLICY
const refundSource = execSync('git show HEAD~1:public/src/pages/RefundPolicy.tsx', { encoding: 'utf8' });
const refTOC = [
  '1. General Infrastructure Billing Policy',
  '2. No Money-Back Guarantee & Final Sale Policy',
  '3. Strictly Non-Refundable Products & Services',
  '4. Self-Service Cancellation Protocol & Immediate Billing Cessation',
  '5. Automatic Forfeiture Upon Abuse or AUP Breach',
  '6. Anti-Chargeback Policy & Mandatory $50 Administrative Recovery Fee',
  '7. Collections, Legal Recovery Fees & Global Blacklisting',
  '8. Billing Error Adjustments & Administrative Settlement',
  '9. Invoicing Inquiries & Billing Department Contact'
];

const refSections = [];
for (let i = 1; i <= 9; i++) {
  const reg = new RegExp(`<section id="ref-${i}"[\\s\\S]*?<\\/section>`, 'i');
  const m = refundSource.match(reg);
  if (m) {
    refSections.push(cleanSectionHtml(m[0], refTOC[i - 1]));
  }
}
const fullRefMarkdown = refSections.join('\n\n---\n\n');

// Generate updated scripts/seed_policies.cjs
const seedCode = `const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPolicies() {
  console.log('Seeding PERFECT enterprise legal policies into database...');

  const now = new Date('2026-10-17T00:00:00.000Z');

  const policies = [
    {
      policyType: 'terms-of-service',
      title: 'Cloud Platform Master Services Agreement',
      version: 'v1.0',
      summaryOfChanges: 'Complete initial baseline enterprise terms of service (all 21 legal articles including Software Licensing & Copyright Compliance Disclaimers).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(fullTosMarkdown)}
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
      content: ${JSON.stringify(fullPrivMarkdown)}
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
      content: ${JSON.stringify(fullRefMarkdown)}
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
      console.log(\`✓ Seeded \${pol.policyType} (\${pol.version}) with \${pol.content.length} characters\`);
    } else {
      await prisma.legalPolicyVersion.update({
        where: { id: existing.id },
        data: {
          title: pol.title,
          content: pol.content,
          summaryOfChanges: pol.summaryOfChanges,
          isCurrent: true,
          status: 'PUBLISHED',
        },
      });
      console.log(\`✓ Updated \${pol.policyType} (\${pol.version}) with \${pol.content.length} characters\`);
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
`;

fs.writeFileSync('scripts/seed_policies.cjs', seedCode, 'utf8');
console.log('scripts/seed_policies.cjs generated successfully with 21 TOS articles!');
