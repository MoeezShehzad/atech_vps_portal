import prisma from '../lib/prisma.js';

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Promo_Codes' AND COLUMN_NAME = 'validFrom'
      )
      BEGIN
        ALTER TABLE [dbo].[Promo_Codes] ADD [validFrom] DATETIME2 NULL;
        PRINT 'Added validFrom column';
      END
    `);
    console.log('Successfully ensured validFrom column in Promo_Codes.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
