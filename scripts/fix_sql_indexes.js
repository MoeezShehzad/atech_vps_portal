import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing uq_users_google_id constraint...');
  try {
    await prisma.$executeRawUnsafe(`
      IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'uq_users_google_id')
      BEGIN
        ALTER TABLE dbo.Users DROP CONSTRAINT uq_users_google_id;
      END
      ELSE IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'uq_users_google_id' AND object_id = OBJECT_ID('dbo.Users'))
      BEGIN
        DROP INDEX uq_users_google_id ON dbo.Users;
      END
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE NONCLUSTERED INDEX uq_users_google_id
      ON dbo.Users(google_id)
      WHERE google_id IS NOT NULL;
    `);
    console.log('Successfully recreated uq_users_google_id as filtered unique index!');
  } catch (err) {
    console.error('Error fixing uq_users_google_id:', err);
  }

  console.log('Fixing uq_virtual_machines_hyperv_id constraint...');
  try {
    await prisma.$executeRawUnsafe(`
      IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'uq_virtual_machines_hyperv_id')
      BEGIN
        ALTER TABLE dbo.VirtualMachines DROP CONSTRAINT uq_virtual_machines_hyperv_id;
      END
      ELSE IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'uq_virtual_machines_hyperv_id' AND object_id = OBJECT_ID('dbo.VirtualMachines'))
      BEGIN
        DROP INDEX uq_virtual_machines_hyperv_id ON dbo.VirtualMachines;
      END
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE NONCLUSTERED INDEX uq_virtual_machines_hyperv_id
      ON dbo.VirtualMachines(hyperv_vm_id)
      WHERE hyperv_vm_id IS NOT NULL;
    `);
    console.log('Successfully recreated uq_virtual_machines_hyperv_id as filtered unique index!');
  } catch (err) {
    console.error('Error fixing uq_virtual_machines_hyperv_id:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
