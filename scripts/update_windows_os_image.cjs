const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Update OSImage records
  const updateResult = await prisma.oSImage.updateMany({
    where: {
      OR: [
        { name: { contains: '2022' } },
        { version: '2022' },
        { name: { contains: 'Windows Server' } }
      ]
    },
    data: {
      name: 'Windows Server 2025 Datacenter',
      version: '2025'
    }
  });
  console.log('OSImage updated rows:', updateResult.count);

  // 2. Update any existing VM instance OS labels if applicable
  const vmCount = await prisma.virtualMachine.count();
  console.log('Total virtual machines in DB:', vmCount);

  const images = await prisma.oSImage.findMany({
    where: { osFamily: 'Windows' }
  });
  console.log('Windows OS Images in DB:', images);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
