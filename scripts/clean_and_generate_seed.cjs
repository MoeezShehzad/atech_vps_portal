const { execSync } = require('child_process');
const fs = require('fs');

function cleanSectionHtml(html, defaultTitle) {
  // Extract h2 title
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

  // Remove the h2 from the body
  let body = html.replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, '');

  // Convert elements
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
      // Normalize whitespace inside paragraph
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
const tosTOC = [
  '1. Services Provision, Modifications & Unmanaged Scope',
  '2. Customer Obligations, Corporate Authority & Authentication',
  '3. Customer Data & Intellectual Property Sovereignty',
  '4. ATC Shared Security Responsibility Model',
  '5. Acceptable Use Policy (AUP) & High-Risk Activities',
  '6. Absolute Backup Disclaimer & Complete Immunity for Data Loss',
  '7. Service Level Agreement (SLA) & Sole Remedy',
  '8. Fees, Invoicing, Automated Billing & Taxes',
  '9. Service Suspension, Voluntary Deactivation & 90-Day Data Preservation Policy',
  '10. Term, Termination & NIST SP 800-88 Data Sanitization',
  '11. Complete Disclaimer of Warranties ("AS IS" & "AS AVAILABLE")',
  '12. Strict Limitation of Liability & Absolute Damages Cap',
  '13. Comprehensive Customer Indemnification',
  '14. Mandatory Binding Individual Arbitration & Class Action Waiver',
  '15. Governing Law, Exclusive Venue & One-Year Limitation Bar',
  '16. Safe Harbor, DMCA & Copyright Notice',
  '17. U.S. Export Controls & Trade Sanctions',
  '18. Force Majeure & Upstream Continuity',
  '19. Miscellaneous Legal Provisions & Defined Terms'
];

const tosSections = [];
for (let i = 1; i <= 19; i++) {
  const reg = new RegExp(`<section id="atc-${i}"[\\s\\S]*?<\\/section>`, 'i');
  const m = tosSource.match(reg);
  if (m) {
    tosSections.push(cleanSectionHtml(m[0], tosTOC[i - 1]));
  }
}
const fullTosMarkdown = tosSections.join('\n\n---\n\n');
console.log('✓ Cleaned TOS:', tosSections.length, 'sections. Length:', fullTosMarkdown.length);

// 2. PRIVACY POLICY
const privSource = execSync('git show 462e9721:public/src/pages/PrivacyPolicy.tsx', { encoding: 'utf8' });
console.log('Original Privacy source length at 462e9721:', privSource.length);

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
console.log('✓ Cleaned Privacy:', privSections.length, 'sections. Length:', fullPrivMarkdown.length);

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
console.log('✓ Cleaned Refund:', refSections.length, 'sections. Length:', fullRefMarkdown.length);

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
      summaryOfChanges: 'Complete initial baseline enterprise terms of service (all 19 legal articles, unmanaged scope, SLA, arbitration, 90-day preservation).',
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
console.log('scripts/seed_policies.cjs generated successfully with clean Markdown!');
