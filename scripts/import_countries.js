import fs from 'fs';
import readline from 'readline';
import prisma from '../lib/prisma.js';

async function main() {
  console.log('Extracting UM_Countries from prisma/geo_data.sql...');

  // 1. Ensure UM schema exists
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'UM')
    BEGIN
      EXEC('CREATE SCHEMA [UM]');
    END
  `);
  console.log('Schema [UM] verified.');

  // 2. Create Table if not exists
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[UM].[UM_Countries]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [UM].[UM_Countries](
        [ROWID] [uniqueidentifier] NULL,
        [CountryID] [int] IDENTITY(1,1) NOT NULL,
        [CountryName] [nvarchar](100) NOT NULL,
        [CountryCode] [nvarchar](10) NOT NULL,
        [CountryISO] [nvarchar](10) NOT NULL,
        [CountryLaborAge] [int] NULL,
        [IsActive] [bit] NULL,
        [IsDeleted] [bit] NULL,
        [AddressTypeID] [int] NULL,
        [CreatedDate] [smalldatetime] NULL,
        [CreatedBy] [int] NULL,
        [UpdatedDate] [smalldatetime] NULL,
        [UpdatedBy] [int] NULL,
        [ApproveDate] [datetime] NULL,
        [ApprovedBy] [int] NULL,
        [FirstLanguage] [int] NULL,
        [SecondLanguage] [int] NULL,
        [CountryCurrency] [nvarchar](20) NULL,
        CONSTRAINT [PK_UM_Countries] PRIMARY KEY CLUSTERED ([CountryID] ASC)
      );
    END
  `);
  console.log('Table [UM].[UM_Countries] verified.');

  // Check if data already populated
  const existingCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS total FROM [UM].[UM_Countries]');
  const totalInDb = existingCount[0]?.total || 0;
  console.log('Current rows in [UM].[UM_Countries]:', totalInDb);

  if (totalInDb >= 200) {
    console.log('Countries already populated. Skipping inserts.');
    process.exit(0);
  }

  // Stream read prisma/geo_data.sql with utf16le encoding (standard SSMS export)
  const fileStream = fs.createReadStream('prisma/geo_data.sql', { encoding: 'utf16le' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const inserts = [];
  for await (const line of rl) {
    if (line.includes('INSERT [UM].[UM_Countries]')) {
      inserts.push(line.trim());
    }
  }

  console.log(`Found ${inserts.length} INSERT statements for [UM].[UM_Countries].`);

  // Batch execute
  await prisma.$executeRawUnsafe('SET IDENTITY_INSERT [UM].[UM_Countries] ON;');
  
  for (let i = 0; i < inserts.length; i++) {
    const query = `
      SET IDENTITY_INSERT [UM].[UM_Countries] ON;
      ${inserts[i]}
    `;
    try {
      await prisma.$executeRawUnsafe(query);
    } catch (e) {
      // Ignore duplicates
      if (!e.message.includes('PRIMARY KEY') && !e.message.includes('duplicate')) {
        console.warn(`Warning on row ${i + 1}:`, e.message);
      }
    }
  }

  await prisma.$executeRawUnsafe('SET IDENTITY_INSERT [UM].[UM_Countries] OFF;');

  const finalCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS total FROM [UM].[UM_Countries]');
  console.log('Final rows in [UM].[UM_Countries]:', finalCount[0]?.total);

  // Sample top 5
  const sample = await prisma.$queryRawUnsafe('SELECT TOP 5 CountryID, CountryName, CountryCode, CountryISO FROM [UM].[UM_Countries]');
  console.log('Sample countries from database:', sample);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
