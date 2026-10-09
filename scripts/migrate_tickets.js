import prisma from '../lib/prisma.js';

async function main() {
  console.log('Migrating Support_Tickets columns for lifecycle and lineage...');
  try {
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Support_Tickets') AND name = 'parent_ticket_id')
        ALTER TABLE dbo.Support_Tickets ADD parent_ticket_id INT NULL;
    `);
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Support_Tickets') AND name = 'is_follow_up')
        ALTER TABLE dbo.Support_Tickets ADD is_follow_up BIT NOT NULL DEFAULT 0;
    `);
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Support_Tickets') AND name = 'awaiting_action_since')
        ALTER TABLE dbo.Support_Tickets ADD awaiting_action_since DATETIME2 NULL;
    `);
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Support_Tickets') AND name = 'reminder_level')
        ALTER TABLE dbo.Support_Tickets ADD reminder_level INT NOT NULL DEFAULT 0;
    `);
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Support_Tickets') AND name = 'last_automated_action')
        ALTER TABLE dbo.Support_Tickets ADD last_automated_action NVARCHAR(255) NULL;
    `);
    console.log('Migration completed successfully in SQL Server!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
