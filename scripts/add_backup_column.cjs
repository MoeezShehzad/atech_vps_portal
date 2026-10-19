const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding backup_enabled column if not exists...');
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID('VirtualMachines') 
      AND name = 'backup_enabled'
    )
    BEGIN
      ALTER TABLE VirtualMachines ADD backup_enabled BIT NOT NULL DEFAULT 0;
      PRINT 'Column backup_enabled added';
    END
    ELSE
    BEGIN
      PRINT 'Column backup_enabled already exists';
    END
  `);
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
