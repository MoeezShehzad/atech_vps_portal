const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runIntegrationTest() {
  console.log('--- 1. Testing Policy Retrieval ---');
  const activeTOS = await prisma.legalPolicyVersion.findFirst({
    where: { policyType: 'terms-of-service', isCurrent: true, status: 'PUBLISHED' }
  });
  console.log('✓ Found Active TOS:', activeTOS?.title, `(${activeTOS?.version})`);
  if (!activeTOS) throw new Error('Active TOS not found in database!');

  console.log('--- 2. Testing Immutable Archival & Publishing Transaction ---');
  // Create a new version v1.1
  const v1_1 = await prisma.$transaction(async (tx) => {
    // 1. Archive current
    await tx.legalPolicyVersion.updateMany({
      where: { policyType: 'terms-of-service', isCurrent: true },
      data: { isCurrent: false, status: 'ARCHIVED', archivedAt: new Date() }
    });

    // 2. Insert new current
    return tx.legalPolicyVersion.create({
      data: {
        policyType: 'terms-of-service',
        title: 'Terms of Service & Cloud Agreement',
        version: 'v1.1-test',
        content: '## 1. Updated Test Terms\nThis is a test revision to verify archival integrity.',
        summaryOfChanges: 'Test revision for integration test verification.',
        status: 'PUBLISHED',
        isCurrent: true,
        effectiveAt: new Date(),
        publishedAt: new Date()
      }
    });
  });
  console.log('✓ Successfully published new version:', v1_1.version);

  // Check that previous version is now ARCHIVED and not current
  const archivedOld = await prisma.legalPolicyVersion.findFirst({
    where: { policyType: 'terms-of-service', version: 'v1.0' }
  });
  console.log(`✓ Verified old version v1.0 isCurrent = ${archivedOld.isCurrent}, status = ${archivedOld.status}, archivedAt = ${archivedOld.archivedAt}`);
  if (archivedOld.isCurrent !== false || archivedOld.status !== 'ARCHIVED' || !archivedOld.archivedAt) {
    throw new Error('Archival transaction failed: old version was not cleanly archived!');
  }

  // Restore v1.0 as current and delete test version
  console.log('--- 3. Restoring v1.0 and Cleaning Up Test Record ---');
  await prisma.$transaction(async (tx) => {
    await tx.legalPolicyVersion.delete({ where: { id: v1_1.id } });
    await tx.legalPolicyVersion.update({
      where: { id: archivedOld.id },
      data: { isCurrent: true, status: 'PUBLISHED', archivedAt: null }
    });
  });

  const restored = await prisma.legalPolicyVersion.findFirst({
    where: { policyType: 'terms-of-service', isCurrent: true }
  });
  console.log('✓ Successfully restored original live version:', restored.version);

  console.log('\nAll Policy Versioning, Archival, and Database tests passed with 100% SUCCESS! 🎉');
}

runIntegrationTest()
  .catch(err => {
    console.error('Integration test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
