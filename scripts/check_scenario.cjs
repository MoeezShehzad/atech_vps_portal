const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const os = await prisma.oSImage.findMany();
    console.log('OS Images in DB:');
    console.dir(os, { depth: null });

    const plans = await prisma.vPSPlan.findMany();
    console.log('Plans in DB:');
    console.dir(plans.map(p => ({ id: p.planId, name: p.name, ram: p.ramGb, cpu: p.cpuCores, price: p.monthlyPrice })), { depth: null });

    const hosts = await prisma.hyperVHost.findMany();
    console.log('Hosts in DB:');
    console.dir(hosts, { depth: null });

    const user = await prisma.user.findFirst({ where: { email: 'admin@linkedscam.com' } });
    console.log('User admin@linkedscam.com:', user);

    const vms = await prisma.virtualMachine.findMany({
      include: {
        ipPool: true,
        user: { select: { email: true } },
        plan: { select: { name: true } },
        image: { select: { name: true, osFamily: true } },
      }
    });
    console.log('VirtualMachines in DB:');
    console.dir(vms, { depth: null });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
