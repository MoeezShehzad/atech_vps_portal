import prisma from '../lib/prisma.js';

async function main() {
  console.log('1. Checking and adding logo_url to Organizations...');
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Organizations') 
      AND name = 'logo_url'
    )
    BEGIN
      ALTER TABLE Organizations ADD logo_url NVARCHAR(MAX) NULL;
    END
  `);
  console.log('Done logo_url.');

  console.log('2. Checking and adding avatar_url to Users...');
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (
      SELECT 1 FROM sys.columns 
      WHERE object_id = OBJECT_ID('Users') 
      AND name = 'avatar_url'
    )
    BEGIN
      ALTER TABLE Users ADD avatar_url NVARCHAR(MAX) NULL;
    END
  `);
  console.log('Done avatar_url.');

  console.log('3. Verifying organization query...');
  const orgs = await prisma.organization.findMany();
  console.log('Organizations count:', orgs.length, JSON.stringify(orgs, null, 2));

  console.log('4. Verifying user admin@atechconsult.com...');
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@atechconsult.com' },
    include: {
      ownedOrganizations: true,
      virtualMachines: true,
      subscriptions: true
    }
  });

  console.log('Admin user summary:', {
    userId: adminUser?.userId,
    email: adminUser?.email,
    accountType: adminUser?.accountType,
    companyName: adminUser?.companyName,
    orgs: adminUser?.ownedOrganizations,
    vmsCount: adminUser?.virtualMachines?.length,
    vms: adminUser?.virtualMachines?.map(v => ({ id: v.vmId, name: v.vmName, status: v.status }))
  });

  // Check if organization exists for adminUser
  let org = await prisma.organization.findFirst({
    where: { ownerId: adminUser.userId }
  });

  if (!org) {
    console.log('Creating organization for admin@atechconsult.com...');
    org = await prisma.organization.create({
      data: {
        name: adminUser.companyName || 'Analytical Technical Consulting Ltd',
        ownerId: adminUser.userId,
        companySize: '1-9',
        billingEmail: adminUser.email
      }
    });
    console.log('Created org:', org.orgId);
  } else {
    console.log('Found org for adminUser:', org.orgId);
  }

  // Ensure admin user is also in OrganizationMembers as owner
  const member = await prisma.organizationMember.findFirst({
    where: { orgId: org.orgId, userId: adminUser.userId }
  });
  if (!member) {
    console.log('Adding organization member...');
    await prisma.organizationMember.create({
      data: {
        orgId: org.orgId,
        userId: adminUser.userId,
        invitedEmail: adminUser.email,
        role: 'owner',
        status: 'active',
        joinedAt: new Date()
      }
    });
  }

  // Make sure Web Hosting and Mail_Server have active subscriptions and are tied to adminUser.userId
  const targetVms = await prisma.virtualMachine.findMany({
    where: {
      OR: [
        { vmName: 'Web Hosting' },
        { vmName: 'Mail_Server' }
      ]
    }
  });
  console.log('Target VMs found:', targetVms.map(v => ({ id: v.vmId, name: v.vmName, userId: v.userId, subId: v.subscriptionId })));

  for (const vm of targetVms) {
    if (vm.userId !== adminUser.userId) {
      console.log(`Updating ${vm.vmName} userId from ${vm.userId} to ${adminUser.userId}...`);
      await prisma.virtualMachine.update({
        where: { vmId: vm.vmId },
        data: { userId: adminUser.userId }
      });
    }
    // Also check subscription
    if (vm.subscriptionId) {
      await prisma.subscription.update({
        where: { subscriptionId: vm.subscriptionId },
        data: { userId: adminUser.userId, status: 'ACTIVE' }
      });
    }
  }

  console.log('Finished successfully.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('ERROR in main:', err);
  prisma.$disconnect();
  process.exit(1);
});
