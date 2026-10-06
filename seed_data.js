// ==============================================================================
// Script: seed_data.js
// Purpose: Seed MS SQL Server with VPS Plans, OS Images (ISO path), Hyper-V Host & IP Pool
// ==============================================================================

import prisma from './lib/prisma.js';

async function seed() {
  console.log('--- SEEDING MS SQL SERVER DATA ---');

  // 1. VPS Plans
  const plans = [
    {
      name: 'VPS Basic',
      description: 'Ideal for small apps, staging, and lightweight web hosting',
      cpuCores: 2,
      ramGb: 4,
      storageGb: 50,
      storageType: 'NVMe',
      bandwidthMbps: 1000,
      ipv4Addresses: 1,
      backupEnabled: false,
      snapshotEnabled: true,
      monthlyPrice: 6.99,
      currency: 'USD',
      isActive: true,
    },
    {
      name: 'VPS Pro',
      description: 'Optimized for high-traffic web applications, APIs & production databases',
      cpuCores: 4,
      ramGb: 8,
      storageGb: 120,
      storageType: 'NVMe',
      bandwidthMbps: 2000,
      ipv4Addresses: 1,
      backupEnabled: true,
      snapshotEnabled: true,
      monthlyPrice: 14.99,
      currency: 'USD',
      isActive: true,
    },
    {
      name: 'VPS Enterprise',
      description: 'Heavy compute power with dedicated CPU threads and high throughput',
      cpuCores: 8,
      ramGb: 16,
      storageGb: 250,
      storageType: 'NVMe',
      bandwidthMbps: 5000,
      ipv4Addresses: 2,
      backupEnabled: true,
      snapshotEnabled: true,
      monthlyPrice: 29.99,
      currency: 'USD',
      isActive: true,
    },
    {
      name: 'VPS Ultra Compute',
      description: 'Massive multi-core processing power for AI workloads and big data',
      cpuCores: 16,
      ramGb: 32,
      storageGb: 500,
      storageType: 'NVMe',
      bandwidthMbps: 10000,
      ipv4Addresses: 2,
      backupEnabled: true,
      snapshotEnabled: true,
      monthlyPrice: 59.99,
      currency: 'USD',
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.vPSPlan.findUnique({ where: { name: plan.name } });
    if (!existing) {
      await prisma.vPSPlan.create({ data: plan });
      console.log(`[SEED] Created Plan: ${plan.name} ($${plan.monthlyPrice}/mo)`);
    } else {
      console.log(`[SEED] Plan already exists: ${plan.name}`);
    }
  }

  // 2. OS Images (Connecting ISO path on D: drive)
  const images = [
    {
      name: 'Ubuntu 22.04.5 LTS (Live Server)',
      osFamily: 'Linux',
      version: '22.04.5',
      templatePath: 'D:\\00_Master_Template\\ubuntu-22.04.5-live-server-amd64.iso',
      isActive: true,
    },
    {
      name: 'Ubuntu 24.04 LTS (Noble Numbat)',
      osFamily: 'Linux',
      version: '24.04',
      templatePath: 'D:\\00_Master_Template\\ubuntu-24.04-live-server-amd64.iso',
      isActive: true,
    },
    {
      name: 'Debian 12 Bookworm',
      osFamily: 'Linux',
      version: '12.5',
      templatePath: 'D:\\00_Master_Template\\debian-12-generic.iso',
      isActive: true,
    },
    {
      name: 'Windows Server 2022 Datacenter',
      osFamily: 'Windows',
      version: '2022',
      templatePath: 'D:\\00_Master_Template\\win-server-2022.iso',
      isActive: true,
    },
  ];

  for (const img of images) {
    const existing = await prisma.oSImage.findFirst({ where: { name: img.name } });
    if (!existing) {
      await prisma.oSImage.create({ data: img });
      console.log(`[SEED] Created OS Image: ${img.name} -> ${img.templatePath}`);
    } else {
      // Update templatePath to make sure it matches exact D: drive ISO
      await prisma.oSImage.update({
        where: { imageId: existing.imageId },
        data: { templatePath: img.templatePath },
      });
      console.log(`[SEED] Updated OS Image: ${img.name}`);
    }
  }

  // 3. Hyper-V Host
  const hostExisting = await prisma.hyperVHost.findUnique({
    where: { hostname: 'host1.atech.internal' },
  });
  if (!hostExisting) {
    await prisma.hyperVHost.create({
      data: {
        hostname: 'host1.atech.internal',
        ipAddress: '172.25.80.1',
        status: 'ONLINE',
        location: 'Main DC - Cluster 01',
      },
    });
    console.log('[SEED] Created Hyper-V Host: host1.atech.internal');
  } else {
    console.log('[SEED] Hyper-V Host already exists');
  }

  // 4. IP Pool
  for (let i = 10; i <= 25; i++) {
    const ip = `192.168.10.${i}`;
    const existingIp = await prisma.iPPool.findUnique({ where: { ipAddress: ip } });
    if (!existingIp) {
      await prisma.iPPool.create({
        data: {
          ipAddress: ip,
          subnetMask: '255.255.255.0',
          gateway: '192.168.10.1',
          ipType: 'IPV4',
          status: 'AVAILABLE',
        },
      });
    }
  }
  console.log('[SEED] Seeded IP Pool (192.168.10.10 - 192.168.10.25)');

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error('[SEED ERROR]', e);
  await prisma.$disconnect();
  process.exit(1);
});
