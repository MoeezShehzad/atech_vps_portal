const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE [dbo].[VirtualMachines]
      SET [hyperv_vm_id] = 'legacy-null-' + CAST([vm_id] AS VARCHAR)
      WHERE [hyperv_vm_id] IS NULL
    `);
    console.log('1. Populated NULL hyperv_vm_id values.');
  } catch (e) {
    console.log('Update nulls notice:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`
      IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'uq_virtual_machines_hyperv_id')
      BEGIN
          ALTER TABLE [dbo].[VirtualMachines] DROP CONSTRAINT [uq_virtual_machines_hyperv_id];
      END
    `);
    console.log('2. Dropped old unique constraint.');
  } catch (e) {
    console.log('Drop constraint notice:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_virtual_machines_hyperv_id')
      BEGIN
          CREATE UNIQUE NONCLUSTERED INDEX [uq_virtual_machines_hyperv_id] 
          ON [dbo].[VirtualMachines]([hyperv_vm_id]) 
          WHERE [hyperv_vm_id] IS NOT NULL;
      END
    `);
    console.log('3. Created filtered unique index.');
  } catch (e) {
    console.log('Create index notice:', e.message);
  }

  console.log('Ubuntu DB constraint fix successfully finished!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
