const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up fake and dummy IP addresses from IP_Pool...');
  
  // Delete all unassigned fake/dummy IPs
  const res = await prisma.iPPool.deleteMany({
    where: {
      assignedVmId: null,
      OR: [
        { ipAddress: { startsWith: '192.168.' } },
        { ipAddress: { startsWith: '172.168.' } },
        { ipAddress: { startsWith: '172.20.' } },
        { ipAddress: { startsWith: '172.18.' } },
        { ipAddress: { startsWith: '172.27.' } },
        { ipAddress: 'DHCP Pending' },
        { ipAddress: 'DHCP Leasing...' },
      ],
    },
  });

  console.log(`Deleted ${res.count} fake/dummy IP records.`);

  const remaining = await prisma.iPPool.findMany();
  console.log('Remaining pool count:', remaining.length);
  console.log(remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
