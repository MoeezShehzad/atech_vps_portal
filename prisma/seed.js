import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INITIALIZING PRODUCTION DATABASE SEED ---');

  // 1. Roles
  const roles = [
    { roleName: 'Administrator', description: 'Full system administrative access' },
    { roleName: 'Customer Support', description: 'Customer tickets and user management' },
    { roleName: 'Billing Manager', description: 'Invoices, payments, and billing management' },
    { roleName: 'DevOps Engineer', description: 'Infrastructure, Hyper-V, and server monitoring' },
    { roleName: 'Customer', description: 'Standard client account' },
  ];

  for (const r of roles) {
    const existing = await prisma.role.findUnique({ where: { roleName: r.roleName } });
    if (!existing) {
      await prisma.role.create({ data: r });
      console.log(`[SEED] Created Role: ${r.roleName}`);
    } else {
      console.log(`[SEED] Role already exists: ${r.roleName}`);
    }
  }

  // 2. VPS Plans
  const plans = [
    {
      name: 'VPS Basic',
      description: 'Ideal for small apps, staging, and lightweight web hosting',
      cpuCores: 2,
      ramGb: 4,
      storageGb: 50,
      storageType: 'SSD',
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
      storageType: 'SSD',
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
      storageType: 'SSD',
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
      storageType: 'SSD',
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

  // 3. OS Images
  const images = [
    {
      name: 'Ubuntu 22.04 LTS (Jammy Jellyfish)',
      osFamily: 'Linux',
      version: '22.04',
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
      console.log(`[SEED] Created OS Image: ${img.name}`);
    } else {
      console.log(`[SEED] OS Image already exists: ${img.name}`);
    }
  }

  // 4. Hyper-V Parent Host
  const hostExisting = await prisma.hyperVHost.findUnique({
    where: { hostname: 'host1.atech.internal' },
  });
  if (!hostExisting) {
    await prisma.hyperVHost.create({
      data: {
        hostname: 'host1.atech.internal',
        ipAddress: '192.168.10.10',
        status: 'ONLINE',
        location: 'Dell PowerEdge R740 - DC01',
      },
    });
    console.log('[SEED] Created Hyper-V Host: host1.atech.internal (192.168.10.10)');
  } else {
    console.log('[SEED] Hyper-V Host already exists');
  }

  // 5. Default Administrator User
  const adminEmail = 'admin@atechconsult.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const adminRole = await prisma.role.findUnique({ where: { roleName: 'Administrator' } });

  if (!existingAdmin) {
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const newAdmin = await prisma.user.create({
      data: {
        fullName: 'ATC Super Admin',
        email: adminEmail,
        passwordHash: passwordHash,
        emailVerified: true,
        isActive: true,
      },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: newAdmin.userId,
          roleId: adminRole.roleId,
        },
      });
    }

    console.log(`[SEED] Created Administrator Account:`);
    console.log(`       Email:    ${adminEmail}`);
    console.log(`       Password: ${defaultPassword}`);
  } else {
    console.log(`[SEED] Administrator account already exists: ${adminEmail}`);
    // Ensure admin role is assigned
    if (adminRole) {
      const hasRole = await prisma.userRole.findFirst({
        where: { userId: existingAdmin.userId, roleId: adminRole.roleId },
      });
      if (!hasRole) {
        await prisma.userRole.create({
          data: { userId: existingAdmin.userId, roleId: adminRole.roleId },
        });
        console.log(`[SEED] Assigned Administrator role to ${adminEmail}`);
      }
    }
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
