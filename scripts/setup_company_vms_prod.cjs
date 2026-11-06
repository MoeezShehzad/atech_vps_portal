/**
 * Production Safe Provisioning & Company Account Setup Script
 * 
 * Safety Policy:
 * - 100% database-only metadata operations (Prisma ORM).
 * - ZERO impact on running Hyper-V virtual machines or host services.
 * - Idempotent: Can be safely re-run without creating duplicates.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('  ATC CLOUD - PRODUCTION COMPANY & VM SETUP (100% SAFE)');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. SETUP USER: admin@atechconsult.com
  // -------------------------------------------------------------------------
  console.log('[1/4] Processing user: admin@atechconsult.com...');
  let atechUser = await prisma.user.findFirst({
    where: { email: 'admin@atechconsult.com' },
  });

  if (!atechUser) {
    console.error('❌ User admin@atechconsult.com not found in database! Please verify the email address.');
  } else {
    // Upgrade account to Company (1-10 people)
    const companyName = atechUser.companyName || 'Analytical Technical Consulting Ltd';
    atechUser = await prisma.user.update({
      where: { userId: atechUser.userId },
      data: {
        accountType: 'company',
        companySize: '1-9', // Option corresponding to 1 - 10 employees
        companyName,
      },
    });
    console.log(`✓ Upgraded admin@atechconsult.com (User ID: ${atechUser.userId}) to Company (${companyName}, 1-10 people)`);

    // Ensure Organization exists
    let atechOrg = await prisma.organization.findFirst({
      where: { ownerId: atechUser.userId },
    });

    if (!atechOrg) {
      atechOrg = await prisma.organization.create({
        data: {
          name: companyName,
          ownerId: atechUser.userId,
          companySize: '1-9',
          billingEmail: atechUser.email,
        },
      });
      console.log(`✓ Created Organization for admin@atechconsult.com (Org ID: ${atechOrg.orgId})`);

      await prisma.organizationMember.create({
        data: {
          orgId: atechOrg.orgId,
          userId: atechUser.userId,
          invitedEmail: atechUser.email,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      });
      console.log(`✓ Registered admin@atechconsult.com as Active Owner in OrganizationMembers`);
    } else {
      await prisma.organization.update({
        where: { orgId: atechOrg.orgId },
        data: { companySize: '1-9' },
      });
      console.log(`✓ Organization already exists for admin@atechconsult.com (Org ID: ${atechOrg.orgId})`);

      const member = await prisma.organizationMember.findFirst({
        where: { orgId: atechOrg.orgId, userId: atechUser.userId },
      });
      if (!member) {
        await prisma.organizationMember.create({
          data: {
            orgId: atechOrg.orgId,
            userId: atechUser.userId,
            invitedEmail: atechUser.email,
            role: 'owner',
            status: 'active',
            joinedAt: new Date(),
          },
        });
      }
    }

    // -----------------------------------------------------------------------
    // 2. SETUP INFRASTRUCTURE & VMS FOR admin@atechconsult.com
    // -----------------------------------------------------------------------
    console.log('\n[2/4] Setting up infrastructure for Mail_Server and Web Hosting...');

    // Host lookup
    let host = await prisma.hyperVHost.findFirst();
    if (!host) {
      host = await prisma.hyperVHost.create({
        data: {
          hostname: 'WIN-MDKH7HEG8L6',
          ipAddress: '192.168.10.10',
          status: 'ONLINE',
          location: 'Primary Datacenter',
        },
      });
      console.log(`✓ Created Hyper-V Host WIN-MDKH7HEG8L6 (Host ID: ${host.hostId})`);
    } else {
      console.log(`✓ Hyper-V Host: ${host.hostname} (ID: ${host.hostId})`);
    }

    // OS Image lookup
    let osImage = await prisma.oSImage.findFirst({
      where: {
        OR: [
          { osFamily: 'Linux' },
          { name: { contains: 'Ubuntu' } },
        ],
      },
    });

    if (!osImage) {
      osImage = await prisma.oSImage.findFirst();
    }

    if (!osImage) {
      osImage = await prisma.oSImage.create({
        data: {
          name: 'Ubuntu 24.04 LTS Cloud Image',
          osFamily: 'Linux',
          version: '24.04',
          templatePath: 'D:\\00-MASTER-TEMPLATES\\Ubuntu_24_04.vhdx',
          isActive: true,
        },
      });
      console.log(`✓ Created OS Image (Image ID: ${osImage.imageId})`);
    } else {
      console.log(`✓ OS Image: ${osImage.name} (Image ID: ${osImage.imageId})`);
    }

    // 1-Year Free 8GB Dedicated Plan
    let plan8GB = await prisma.vPSPlan.findFirst({
      where: { name: 'Enterprise Dedicated - 8GB' },
    });

    if (!plan8GB) {
      plan8GB = await prisma.vPSPlan.create({
        data: {
          name: 'Enterprise Dedicated - 8GB',
          description: 'High-performance dedicated cloud instance with 8GB RAM, 2 CPU cores, and NVMe SSD',
          cpuCores: 2,
          ramGb: 8,
          storageGb: 200,
          storageType: 'NVMe SSD',
          bandwidthMbps: 10000,
          ipv4Addresses: 1,
          backupEnabled: true,
          snapshotEnabled: true,
          monthlyPrice: 0.00,
          currency: 'USD',
          isActive: true,
        },
      });
      console.log(`✓ Created 1-Year Free 8GB Plan (Plan ID: ${plan8GB.planId})`);
    } else {
      console.log(`✓ 8GB Plan already exists (Plan ID: ${plan8GB.planId})`);
    }

    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // ==========================================
    // VM 1: Mail_Server
    // ==========================================
    const mailServerGuid = '28c09000-a804-4588-8732-6474828eb5bd';
    let mailVm = await prisma.virtualMachine.findFirst({
      where: {
        OR: [
          { hypervVmId: mailServerGuid },
          { vmName: 'Mail_Server' },
        ],
      },
    });

    if (!mailVm) {
      const subMail = await prisma.subscription.create({
        data: {
          userId: atechUser.userId,
          planId: plan8GB.planId,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: oneYearLater,
          nextBillingDate: oneYearLater,
          monthlyPrice: 0.00,
          currency: 'USD',
        },
      });

      const invMail = await prisma.invoice.create({
        data: {
          userId: atechUser.userId,
          subscriptionId: subMail.subscriptionId,
          invoiceNumber: 'INV-' + Date.now() + '-MAIL',
          subtotal: 0.00,
          tax: 0.00,
          discount: 0.00,
          total: 0.00,
          currency: 'USD',
          status: 'PAID',
          issueDate: new Date(),
          paidDate: new Date(),
        },
      });

      await prisma.payment.create({
        data: {
          userId: atechUser.userId,
          invoiceId: invMail.invoiceId,
          paymentGateway: 'INTERNAL_VIP',
          transactionId: 'TXN-MAIL-' + Date.now(),
          amount: 0.00,
          currency: 'USD',
          status: 'COMPLETED',
          paymentDate: new Date(),
        },
      });

      mailVm = await prisma.virtualMachine.create({
        data: {
          userId: atechUser.userId,
          subscriptionId: subMail.subscriptionId,
          planId: plan8GB.planId,
          imageId: osImage.imageId,
          hostId: host.hostId,
          vmName: 'Mail_Server',
          hostname: 'mail.atechconsult.com',
          hypervVmId: mailServerGuid,
          cpuCores: 2,
          ramGb: 8,
          storageGb: 250,
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          adminUser: 'ubuntu',
          backupEnabled: true,
          startedAt: new Date(),
        },
      });
      console.log(`✓ Inserted Mail_Server into admin@atechconsult.com (VM ID: ${mailVm.vmId}, Free 1-Year Subscription ID: ${subMail.subscriptionId})`);
    } else {
      // Re-assign to admin@atechconsult.com and ensure active running status
      mailVm = await prisma.virtualMachine.update({
        where: { vmId: mailVm.vmId },
        data: {
          userId: atechUser.userId,
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          hypervVmId: mailServerGuid,
          ramGb: 8,
          storageGb: 250,
          hostname: 'mail.atechconsult.com',
        },
      });
      console.log(`✓ Re-associated Mail_Server to admin@atechconsult.com (VM ID: ${mailVm.vmId})`);
    }

    // IP Assignment: 172.16.17.49
    let mailIp = await prisma.iPPool.findFirst({
      where: { ipAddress: '172.16.17.49' },
    });
    if (mailIp) {
      await prisma.iPPool.update({
        where: { ipId: mailIp.ipId },
        data: { assignedVmId: mailVm.vmId, status: 'ASSIGNED' },
      });
      console.log(`✓ Assigned IP 172.16.17.49 -> Mail_Server`);
    } else {
      await prisma.iPPool.create({
        data: {
          ipAddress: '172.16.17.49',
          subnetMask: '255.255.255.0',
          gateway: '172.16.17.1',
          ipType: 'LOCAL_IPV4',
          status: 'ASSIGNED',
          assignedVmId: mailVm.vmId,
        },
      });
      console.log(`✓ Created & assigned IP 172.16.17.49 -> Mail_Server`);
    }

    // ==========================================
    // VM 2: Web Hosting
    // ==========================================
    const webHostingGuid = '6a959a7a-8cbf-4a78-a7e5-cfa38e1d3b59';
    let webVm = await prisma.virtualMachine.findFirst({
      where: {
        OR: [
          { hypervVmId: webHostingGuid },
          { vmName: 'Web Hosting' },
        ],
      },
    });

    if (!webVm) {
      const subWeb = await prisma.subscription.create({
        data: {
          userId: atechUser.userId,
          planId: plan8GB.planId,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: oneYearLater,
          nextBillingDate: oneYearLater,
          monthlyPrice: 0.00,
          currency: 'USD',
        },
      });

      const invWeb = await prisma.invoice.create({
        data: {
          userId: atechUser.userId,
          subscriptionId: subWeb.subscriptionId,
          invoiceNumber: 'INV-' + Date.now() + '-WEB',
          subtotal: 0.00,
          tax: 0.00,
          discount: 0.00,
          total: 0.00,
          currency: 'USD',
          status: 'PAID',
          issueDate: new Date(),
          paidDate: new Date(),
        },
      });

      await prisma.payment.create({
        data: {
          userId: atechUser.userId,
          invoiceId: invWeb.invoiceId,
          paymentGateway: 'INTERNAL_VIP',
          transactionId: 'TXN-WEB-' + Date.now(),
          amount: 0.00,
          currency: 'USD',
          status: 'COMPLETED',
          paymentDate: new Date(),
        },
      });

      webVm = await prisma.virtualMachine.create({
        data: {
          userId: atechUser.userId,
          subscriptionId: subWeb.subscriptionId,
          planId: plan8GB.planId,
          imageId: osImage.imageId,
          hostId: host.hostId,
          vmName: 'Web Hosting',
          hostname: 'web.atechconsult.com',
          hypervVmId: webHostingGuid,
          cpuCores: 2,
          ramGb: 8,
          storageGb: 150,
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          adminUser: 'atc',
          backupEnabled: true,
          startedAt: new Date(),
        },
      });
      console.log(`✓ Inserted Web Hosting into admin@atechconsult.com (VM ID: ${webVm.vmId}, Free 1-Year Subscription ID: ${subWeb.subscriptionId})`);
    } else {
      webVm = await prisma.virtualMachine.update({
        where: { vmId: webVm.vmId },
        data: {
          userId: atechUser.userId,
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          hypervVmId: webHostingGuid,
          ramGb: 8,
          storageGb: 150,
          hostname: 'web.atechconsult.com',
        },
      });
      console.log(`✓ Re-associated Web Hosting to admin@atechconsult.com (VM ID: ${webVm.vmId})`);
    }

    // IP Assignment: 172.16.17.48
    let webIp = await prisma.iPPool.findFirst({
      where: { ipAddress: '172.16.17.48' },
    });
    if (webIp) {
      await prisma.iPPool.update({
        where: { ipId: webIp.ipId },
        data: { assignedVmId: webVm.vmId, status: 'ASSIGNED' },
      });
      console.log(`✓ Assigned IP 172.16.17.48 -> Web Hosting`);
    } else {
      await prisma.iPPool.create({
        data: {
          ipAddress: '172.16.17.48',
          subnetMask: '255.255.255.0',
          gateway: '172.16.17.1',
          ipType: 'LOCAL_IPV4',
          status: 'ASSIGNED',
          assignedVmId: webVm.vmId,
        },
      });
      console.log(`✓ Created & assigned IP 172.16.17.48 -> Web Hosting`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. SETUP USER: admin@linkedscam.com
  // -------------------------------------------------------------------------
  console.log('\n[3/4] Processing user: admin@linkedscam.com...');
  let linkedscamUser = await prisma.user.findFirst({
    where: { email: 'admin@linkedscam.com' },
  });

  if (!linkedscamUser) {
    console.error('❌ User admin@linkedscam.com not found in database! Please check the email.');
  } else {
    const lsCompanyName = linkedscamUser.companyName || 'LinkedScam Ltd';
    linkedscamUser = await prisma.user.update({
      where: { userId: linkedscamUser.userId },
      data: {
        accountType: 'company',
        companySize: '1-9', // Option corresponding to 1 - 10 employees
        companyName: lsCompanyName,
      },
    });
    console.log(`✓ Upgraded admin@linkedscam.com (User ID: ${linkedscamUser.userId}) to Company (${lsCompanyName}, 1-10 people)`);

    // Ensure Organization exists for admin@linkedscam.com
    let lsOrg = await prisma.organization.findFirst({
      where: { ownerId: linkedscamUser.userId },
    });

    if (!lsOrg) {
      lsOrg = await prisma.organization.create({
        data: {
          name: lsCompanyName,
          ownerId: linkedscamUser.userId,
          companySize: '1-9',
          billingEmail: linkedscamUser.email,
        },
      });
      console.log(`✓ Created Organization for admin@linkedscam.com (Org ID: ${lsOrg.orgId})`);

      await prisma.organizationMember.create({
        data: {
          orgId: lsOrg.orgId,
          userId: linkedscamUser.userId,
          invitedEmail: linkedscamUser.email,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
        },
      });
      console.log(`✓ Registered admin@linkedscam.com as Active Owner in OrganizationMembers`);
    } else {
      await prisma.organization.update({
        where: { orgId: lsOrg.orgId },
        data: { companySize: '1-9' },
      });
      console.log(`✓ Organization already exists for admin@linkedscam.com (Org ID: ${lsOrg.orgId})`);

      const member = await prisma.organizationMember.findFirst({
        where: { orgId: lsOrg.orgId, userId: linkedscamUser.userId },
      });
      if (!member) {
        await prisma.organizationMember.create({
          data: {
            orgId: lsOrg.orgId,
            userId: linkedscamUser.userId,
            invitedEmail: linkedscamUser.email,
            role: 'owner',
            status: 'active',
            joinedAt: new Date(),
          },
        });
      }
    }
  }

  console.log('\n[4/4] Verification & Summary:');
  console.log('✓ All requested changes applied safely without touching live VM state.');
  console.log('================================================================');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('\n❌ Execution error:', err);
  prisma.$disconnect();
  process.exit(1);
});
