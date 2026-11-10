const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  const policies = await prisma.legalPolicyVersion.findMany();
  console.log('Seeded policies count:', policies.length);
  for (const p of policies) {
    console.log(`- Type: ${p.policyType} | Ver: ${p.version} | Current: ${p.isCurrent} | Status: ${p.status} | Title: ${p.title}`);
  }
}

testQuery()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
