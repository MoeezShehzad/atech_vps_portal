const { execSync } = require('child_process');
const fs = require('fs');

function cleanHtmlToMarkdown(htmlSnippet) {
  return htmlSnippet
    .replace(/<section[^>]*>/gi, '')
    .replace(/<\/section>/gi, '\n\n')
    .replace(/<h2[^>]*>[\s\S]*?<span[^>]*>([0-9.]+)<\/span>[\s\S]*?([\w\s&;,.'"-]+)<\/h2>/gi, '## $1 $2\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (match, p1) => {
      const cleanTitle = p1.replace(/<[^>]+>/g, '').trim();
      return `## ${cleanTitle}\n`;
    })
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (match, p1) => {
      const cleanTitle = p1.replace(/<[^>]+>/g, '').trim();
      return `### ${cleanTitle}\n`;
    })
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]+>/g, '') // remove any leftover JSX/HTML tags
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

console.log('Extracting full legal policies from repository...');

// 1. Terms of Service
const tosSource = fs.readFileSync('public/src/pages/TermsOfService.tsx', 'utf8');
const tosMatch = tosSource.match(/\{activeSection === item\.id \? 'translate-x-0\.5' : 'opacity-0 group-hover:opacity-100'\}\`\} \/>\r?\n\s*<\/button>\r?\n\s*\)\)\}\r?\n\s*<\/nav>[\s\S]*?<\/aside>[\s\S]*?<div className="lg:col-span-8[^>]*>([\s\S]*?)<\/div>\r?\n\s*<\/div>/);

let fullTosContent = '';
if (tosMatch) {
  fullTosContent = cleanHtmlToMarkdown(tosMatch[1]);
  console.log('✓ Extracted Terms of Service. Length:', fullTosContent.length);
} else {
  console.log('Warning: tosMatch not found directly, falling back to section match');
  const sectionsMatch = tosSource.match(/<section id="atc-1"[\s\S]*?<\/section>\s*<\/div>/);
  if (sectionsMatch) {
    fullTosContent = cleanHtmlToMarkdown(sectionsMatch[0]);
    console.log('✓ Extracted TOS via fallback. Length:', fullTosContent.length);
  }
}

// 2. Privacy Policy (from git commit before our edits)
const privacySource = execSync('git show HEAD~1:public/src/pages/PrivacyPolicy.tsx', { encoding: 'utf8' });
const privacyMatch = privacySource.match(/<div className="lg:col-span-8[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
let fullPrivacyContent = '';
if (privacyMatch) {
  fullPrivacyContent = cleanHtmlToMarkdown(privacyMatch[1]);
  console.log('✓ Extracted Privacy Policy. Length:', fullPrivacyContent.length);
}

// 3. Refund Policy (from git commit before our edits)
const refundSource = execSync('git show HEAD~1:public/src/pages/RefundPolicy.tsx', { encoding: 'utf8' });
const refundMatch = refundSource.match(/<div className="lg:col-span-8[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
let fullRefundContent = '';
if (refundMatch) {
  fullRefundContent = cleanHtmlToMarkdown(refundMatch[1]);
  console.log('✓ Extracted Refund Policy. Length:', fullRefundContent.length);
}

// Save all to full seed script
const seedScriptContent = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPolicies() {
  console.log('Seeding FULL enterprise legal policies into database...');

  const now = new Date('2026-10-17T00:00:00.000Z');

  const policies = [
    {
      policyType: 'terms-of-service',
      title: 'Cloud Platform Master Services Agreement',
      version: 'v1.0',
      summaryOfChanges: 'Complete initial baseline enterprise terms of service (all 19 articles, SLA, arbitration, and 90-day preservation).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(fullTosContent)}
    },
    {
      policyType: 'privacy-policy',
      title: 'Enterprise Cloud Privacy Notice',
      version: 'v1.0',
      summaryOfChanges: 'Complete initial baseline GDPR, CCPA/CPRA, and NIST SP 800-88 compliant privacy notice (all 16 articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(fullPrivacyContent)}
    },
    {
      policyType: 'refund-policy',
      title: 'Refund & Cancellation Policy',
      version: 'v1.0',
      summaryOfChanges: 'Complete initial baseline infrastructure billing, dispute resolution, and anti-chargeback policy (all 9 articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(fullRefundContent)}
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
      console.log(\`✓ Seeded \${pol.policyType} (\${pol.version}) with full \${pol.content.length} characters\`);
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
      console.log(\`✓ Updated \${pol.policyType} (\${pol.version}) with full \${pol.content.length} characters\`);
    }
  }

  console.log('All full legal policies successfully stored in database!');
}

seedPolicies()
  .catch((e) => {
    console.error('Error seeding full policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

fs.writeFileSync('scripts/seed_policies.cjs', seedScriptContent, 'utf8');
console.log('scripts/seed_policies.cjs successfully updated with ALL full policies!');
