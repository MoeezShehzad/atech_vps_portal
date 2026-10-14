import prisma from '../lib/prisma.js';

async function main() {
  const schemas = await prisma.$queryRawUnsafe('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA');
  console.log('Schemas in atech_vps_db:', schemas.map(s => s.SCHEMA_NAME));
  
  const tables = await prisma.$queryRawUnsafe(`
    SELECT TABLE_SCHEMA, TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_SCHEMA, TABLE_NAME
  `);
  console.log('Existing tables count:', tables.length);
  tables.forEach(t => console.log('  ' + t.TABLE_SCHEMA + '.' + t.TABLE_NAME));

  await prisma.$executeRawUnsafe(`
    IF OBJECT_ID(N'[dbo].[UM_Countries]', N'SN') IS NOT NULL
      DROP SYNONYM [dbo].[UM_Countries];
    CREATE SYNONYM [dbo].[UM_Countries] FOR [UM].[UM_Countries];
  `);
  console.log('Synonym [dbo].[UM_Countries] created.');
  const count = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS total FROM [dbo].[UM_Countries]');
  console.log('Total rows through [dbo].[UM_Countries]:', count[0]?.total);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
