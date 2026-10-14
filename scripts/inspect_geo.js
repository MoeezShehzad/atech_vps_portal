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

  const query = 'SELECT CountryID AS id, RTRIM(CountryName) AS name, RTRIM(CountryCode) AS dialCode, UPPER(RTRIM(CountryISO)) AS code FROM [UM].[UM_Countries] WHERE (IsDeleted = 0 OR IsDeleted IS NULL) ORDER BY CountryName ASC';
  const rawRows = await prisma.$queryRawUnsafe(query);
  const q = 'india'.toLowerCase();
  const matched = rawRows.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.code.toLowerCase().includes(q) || 
    (c.dialCode && c.dialCode.includes(q))
  );
  console.log('Matched for india:', matched);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
