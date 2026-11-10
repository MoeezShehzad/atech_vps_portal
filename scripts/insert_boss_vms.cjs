const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- Starting Data Insertion for Waseem Chaudhry (admin@linkedscam.com) ---');

  // 1. Verify User
  const user = await prisma.user.findFirst({
    where: { email: 'admin@linkedscam.com' }
  });
  if (!user) {
    throw new Error('User admin@linkedscam.com not found!');
  }
  console.log('✓ Found user: ID ' + user.userId + ' (' + user.fullName + ')');

  // 2. Check / Create Windows OS Image
  let osImage = await prisma.oSImage.findFirst({
    where: { name: { contains: 'Windows Server 2025' } }
  });
  if (!osImage) {
    osImage = await prisma.oSImage.create({
      data: {
        name: 'Windows Server 2025 Datacenter',
        osFamily: 'Windows',
        version: '2025',
        templatePath: 'D:\\\\00-MASTER-TEMPLATES\\\\Windows_Server_2025.vhdx',
        isActive: true,
      }
    });
    console.log('✓ Created OS Image: Windows Server 2025 (ID: ' + osImage.imageId + ')');
  } else {
    console.log('✓ OS Image already exists: ' + osImage.name + ' (ID: ' + osImage.imageId + ')');
  }

  // 3. Check / Create 40GB Dedicated VPS Plan
  let plan = await prisma.vPSPlan.findFirst({
    where: { name: 'Enterprise Dedicated - 40GB' }
  });
  if (!plan) {
    plan = await prisma.vPSPlan.create({
      data: {
        name: 'Enterprise Dedicated - 40GB',
        description: 'Dedicated enterprise Windows instance with 40GB RAM and 200GB SSD',
        cpuCores: 4,
        ramGb: 40,
        storageGb: 200,
        storageType: 'SSD',
        bandwidthMbps: 10000,
        ipv4Addresses: 1,
        backupEnabled: true,
        snapshotEnabled: true,
        monthlyPrice: 0.00,
        currency: 'USD',
        isActive: true,
      }
    });
    console.log('✓ Created Plan: Enterprise Dedicated - 40GB (ID: ' + plan.planId + ')');
  } else {
    console.log('✓ Plan already exists: ' + plan.name + ' (ID: ' + plan.planId + ')');
  }

  // 4. Host ID
  const host = await prisma.hyperVHost.findFirst();
  if (!host) {
    throw new Error('No Hyper-V host found in HyperV_Hosts table!');
  }
  console.log('✓ Hyper-V Host: ID ' + host.hostId + ' (' + host.hostname + ')');

  // 5. APPS_VM (00dc2903-0905-491a-8bf4-dcee14bf579d)
  const appsHypervId = '00dc2903-0905-491a-8bf4-dcee14bf579d';
  let appsVm = await prisma.virtualMachine.findFirst({
    where: { hypervVmId: appsHypervId }
  });

  if (!appsVm) {
    // Create Subscription for APPS_VM
    const subApps = await prisma.subscription.create({
      data: {
        userId: user.userId,
        planId: plan.planId,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        monthlyPrice: 0.00,
        currency: 'USD',
      }
    });

    // Create Invoice & Payment
    const invApps = await prisma.invoice.create({
      data: {
        userId: user.userId,
        subscriptionId: subApps.subscriptionId,
        invoiceNumber: 'INV-' + Date.now() + '-APPS',
        subtotal: 0.00,
        tax: 0.00,
        discount: 0.00,
        total: 0.00,
        currency: 'USD',
        status: 'PAID',
        issueDate: new Date(),
        paidDate: new Date(),
      }
    });

    await prisma.payment.create({
      data: {
        userId: user.userId,
        invoiceId: invApps.invoiceId,
        paymentGateway: 'INTERNAL_VIP',
        transactionId: 'TXN-APPSVM-' + Date.now(),
        amount: 0.00,
        currency: 'USD',
        status: 'COMPLETED',
        paymentDate: new Date(),
      }
    });

    // Create VM record
    appsVm = await prisma.virtualMachine.create({
      data: {
        userId: user.userId,
        subscriptionId: subApps.subscriptionId,
        planId: plan.planId,
        imageId: osImage.imageId,
        hostId: host.hostId,
        vmName: 'APPS_VM',
        hostname: 'apps-vm.atechconsult.internal',
        hypervVmId: appsHypervId,
        cpuCores: 4,
        ramGb: 40,
        storageGb: 200,
        status: 'RUNNING',
        provisioningStatus: 'COMPLETED',
        adminUser: 'Administrator',
        backupEnabled: true,
        startedAt: new Date(),
      }
    });
    console.log('✓ Inserted APPS_VM (VM ID: ' + appsVm.vmId + ')');
  } else {
    console.log('✓ APPS_VM already in database (VM ID: ' + appsVm.vmId + ')');
  }

  // Assign IP for APPS_VM: 172.16.17.50
  const existingIpApps = await prisma.iPPool.findFirst({
    where: { ipAddress: '172.16.17.50' }
  });
  if (existingIpApps) {
    await prisma.iPPool.update({
      where: { ipId: existingIpApps.ipId },
      data: { assignedVmId: appsVm.vmId, status: 'ASSIGNED' }
    });
    console.log('✓ Updated IP 172.16.17.50 assignment -> APPS_VM');
  } else {
    await prisma.iPPool.create({
      data: {
        ipAddress: '172.16.17.50',
        subnetMask: '255.255.255.0',
        gateway: '172.16.17.1',
        ipType: 'LOCAL_IPV4',
        status: 'ASSIGNED',
        assignedVmId: appsVm.vmId,
      }
    });
    console.log('✓ Created and assigned IP 172.16.17.50 -> APPS_VM');
  }

  // 6. DB_VM (6637aa50-4d33-4280-a67f-e585cdc547e8)
  const dbHypervId = '6637aa50-4d33-4280-a67f-e585cdc547e8';
  let dbVm = await prisma.virtualMachine.findFirst({
    where: { hypervVmId: dbHypervId }
  });

  if (!dbVm) {
    // Create Subscription for DB_VM
    const subDb = await prisma.subscription.create({
      data: {
        userId: user.userId,
        planId: plan.planId,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        monthlyPrice: 0.00,
        currency: 'USD',
      }
    });

    // Create Invoice & Payment
    const invDb = await prisma.invoice.create({
      data: {
        userId: user.userId,
        subscriptionId: subDb.subscriptionId,
        invoiceNumber: 'INV-' + Date.now() + '-DB',
        subtotal: 0.00,
        tax: 0.00,
        discount: 0.00,
        total: 0.00,
        currency: 'USD',
        status: 'PAID',
        issueDate: new Date(),
        paidDate: new Date(),
      }
    });

    await prisma.payment.create({
      data: {
        userId: user.userId,
        invoiceId: invDb.invoiceId,
        paymentGateway: 'INTERNAL_VIP',
        transactionId: 'TXN-DBVM-' + Date.now(),
        amount: 0.00,
        currency: 'USD',
        status: 'COMPLETED',
        paymentDate: new Date(),
      }
    });

    // Create VM record
    dbVm = await prisma.virtualMachine.create({
      data: {
        userId: user.userId,
        subscriptionId: subDb.subscriptionId,
        planId: plan.planId,
        imageId: osImage.imageId,
        hostId: host.hostId,
        vmName: 'DB_VM',
        hostname: 'db-vm.atechconsult.internal',
        hypervVmId: dbHypervId,
        cpuCores: 4,
        ramGb: 40,
        storageGb: 200,
        status: 'RUNNING',
        provisioningStatus: 'COMPLETED',
        adminUser: 'Administrator',
        backupEnabled: true,
        startedAt: new Date(),
      }
    });
    console.log('✓ Inserted DB_VM (VM ID: ' + dbVm.vmId + ')');
  } else {
    console.log('✓ DB_VM already in database (VM ID: ' + dbVm.vmId + ')');
  }

  // Assign IP for DB_VM: 172.16.17.51
  const existingIpDb = await prisma.iPPool.findFirst({
    where: { ipAddress: '172.16.17.51' }
  });
  if (existingIpDb) {
    await prisma.iPPool.update({
      where: { ipId: existingIpDb.ipId },
      data: { assignedVmId: dbVm.vmId, status: 'ASSIGNED' }
    });
    console.log('✓ Updated IP 172.16.17.51 assignment -> DB_VM');
  } else {
    await prisma.iPPool.create({
      data: {
        ipAddress: '172.16.17.51',
        subnetMask: '255.255.255.0',
        gateway: '172.16.17.1',
        ipType: 'LOCAL_IPV4',
        status: 'ASSIGNED',
        assignedVmId: dbVm.vmId,
      }
    });
    console.log('✓ Created and assigned IP 172.16.17.51 -> DB_VM');
  }

  console.log('--- Data Insertion Completed Successfully! ---');
}

run()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  // Transfer and run the migration script
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      return conn.end();
    }
    const writeStream = sftp.createWriteStream('/var/www/atechconsult.com/scripts/insert_boss_vms.cjs');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /var/www/atechconsult.com && node scripts/insert_boss_vms.cjs', (err, stream) => {
        if (err) {
          console.error('Exec error:', err);
          return conn.end();
        }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.end();
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123', readyTimeout: 30000 });
