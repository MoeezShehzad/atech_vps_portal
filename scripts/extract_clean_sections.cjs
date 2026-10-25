const { execSync } = require('child_process');
const fs = require('fs');

function htmlToMarkdown(htmlSnippet) {
  return htmlSnippet
    .replace(/<span[^>]*class="[^"]*rounded-full[^"]*"[^>]*>([0-9.]+)<\/span>/gi, '$1. ')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (m, p1) => {
      const clean = p1.replace(/<[^>]+>/g, '').trim();
      return `\n\n## ${clean}\n\n`;
    })
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (m, p1) => {
      const clean = p1.replace(/<[^>]+>/g, '').trim();
      return `\n\n### ${clean}\n\n`;
    })
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]+>/g, '') // remove remaining tags
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractAllSections(source, prefix) {
  const regex = new RegExp(`<section id="${prefix}-[0-9]+"([\\s\\S]*?)<\\/section>`, 'g');
  const matches = [];
  let m;
  while ((m = regex.exec(source)) !== null) {
    matches.push(m[0]);
  }
  return matches.map(htmlToMarkdown).join('\n\n---\n\n');
}

// 1. Terms of Service
const tosSource = fs.readFileSync('public/src/pages/TermsOfService.tsx', 'utf8');
const tosMarkdown = extractAllSections(tosSource, 'atc');
console.log('✓ Extracted Terms of Service:', tosMarkdown.split('## ').length - 1, 'sections. Total characters:', tosMarkdown.length);

// 2. Privacy Policy
const privSource = execSync('git show HEAD~1:public/src/pages/PrivacyPolicy.tsx', { encoding: 'utf8' });
const privMarkdown = extractAllSections(privSource, 'atcpriv');
console.log('✓ Extracted Privacy Policy:', privMarkdown.split('## ').length - 1, 'sections. Total characters:', privMarkdown.length);

// 3. Refund Policy
const refundSource = execSync('git show HEAD~1:public/src/pages/RefundPolicy.tsx', { encoding: 'utf8' });
const refundMarkdown = extractAllSections(refundSource, 'ref');
console.log('✓ Extracted Refund Policy:', refundMarkdown.split('## ').length - 1, 'sections. Total characters:', refundMarkdown.length);

// Build seed_policies.cjs
const seedCode = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPolicies() {
  console.log('Seeding COMPLETE enterprise legal policies into database...');

  const now = new Date('2026-10-17T00:00:00.000Z');

  const policies = [
    {
      policyType: 'terms-of-service',
      title: 'Cloud Platform Master Services Agreement',
      version: 'v1.0',
      summaryOfChanges: 'Full comprehensive enterprise terms of service (all 19 legal articles, unmanaged scope, SLA, arbitration, 90-day preservation).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(tosMarkdown)}
    },
    {
      policyType: 'privacy-policy',
      title: 'Enterprise Cloud Privacy Notice',
      version: 'v1.0',
      summaryOfChanges: 'Full comprehensive GDPR, CCPA/CPRA, and NIST SP 800-88 enterprise privacy architecture (all 16 legal articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(privMarkdown)}
    },
    {
      policyType: 'refund-policy',
      title: 'Refund & Cancellation Policy',
      version: 'v1.0',
      summaryOfChanges: 'Full comprehensive cloud billing, dispute protocol, non-refundable compute, and anti-chargeback policy (all 9 legal articles).',
      status: 'PUBLISHED',
      isCurrent: true,
      effectiveAt: now,
      publishedAt: now,
      content: ${JSON.stringify(refundMarkdown)}
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

  console.log('All 3 complete legal policies are now stored in the database! 🎉');
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
console.log('Successfully saved to scripts/seed_policies.cjs');
