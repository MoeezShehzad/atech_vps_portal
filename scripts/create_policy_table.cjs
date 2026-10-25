const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  const ddl = `
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Legal_Policy_Versions')
    BEGIN
        CREATE TABLE [dbo].[Legal_Policy_Versions] (
            [id] INT IDENTITY(1,1) NOT NULL,
            [policy_type] VARCHAR(50) NOT NULL,
            [title] NVARCHAR(255) NOT NULL,
            [version] VARCHAR(30) NOT NULL,
            [content] NVARCHAR(MAX) NOT NULL,
            [summary_of_changes] NVARCHAR(MAX) NULL,
            [status] VARCHAR(20) NOT NULL CONSTRAINT [DF_Legal_Policy_Versions_status] DEFAULT 'PUBLISHED',
            [is_current] BIT NOT NULL CONSTRAINT [DF_Legal_Policy_Versions_is_current] DEFAULT 0,
            [effective_at] DATETIME2 NOT NULL CONSTRAINT [DF_Legal_Policy_Versions_effective_at] DEFAULT SYSUTCDATETIME(),
            [published_at] DATETIME2 NULL,
            [archived_at] DATETIME2 NULL,
            [last_notified_at] DATETIME2 NULL,
            [notified_count] INT NOT NULL CONSTRAINT [DF_Legal_Policy_Versions_notified_count] DEFAULT 0,
            [created_by_id] INT NULL,
            [created_at] DATETIME2 NOT NULL CONSTRAINT [DF_Legal_Policy_Versions_created_at] DEFAULT SYSUTCDATETIME(),
            [updated_at] DATETIME2 NOT NULL CONSTRAINT [DF_Legal_Policy_Versions_updated_at] DEFAULT SYSUTCDATETIME(),
            CONSTRAINT [PK_Legal_Policy_Versions] PRIMARY KEY CLUSTERED ([id] ASC)
        );

        CREATE NONCLUSTERED INDEX [ix_policy_type_current] ON [dbo].[Legal_Policy_Versions] ([policy_type] ASC, [is_current] ASC);
        CREATE NONCLUSTERED INDEX [ix_policy_type_version] ON [dbo].[Legal_Policy_Versions] ([policy_type] ASC, [version] ASC);
        
        PRINT 'Created Legal_Policy_Versions table successfully.';
    END
    ELSE
    BEGIN
        PRINT 'Legal_Policy_Versions table already exists.';
    END
  `;

  await prisma.$executeRawUnsafe(ddl);
  console.log('Legal_Policy_Versions table confirmed/created safely!');

  const check = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM Legal_Policy_Versions`);
  console.log('Table query test passed:', check);
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
