import prisma from '../../lib/prisma.js';

export async function runMigration() {
  console.log('[Migration] Ensuring User_Payment_Methods table and trial columns exist...');

  // 1. Add state to Users if missing
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'state')
    BEGIN
      ALTER TABLE Users ADD state VARCHAR(100) NULL;
      PRINT 'Added state column to Users';
    END
  `);

  // 2. Add trial tracking columns to Subscriptions if missing
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Subscriptions' AND COLUMN_NAME = 'trial_warning_sent')
    BEGIN
      ALTER TABLE Subscriptions ADD trial_warning_sent BIT DEFAULT 0;
      PRINT 'Added trial_warning_sent column to Subscriptions';
    END
  `);

  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Subscriptions' AND COLUMN_NAME = 'trial_converted_at')
    BEGIN
      ALTER TABLE Subscriptions ADD trial_converted_at DATETIME2 NULL;
      PRINT 'Added trial_converted_at column to Subscriptions';
    END
  `);

  // 3. Create User_Payment_Methods table if missing
  await prisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'User_Payment_Methods')
    BEGIN
      CREATE TABLE User_Payment_Methods (
        method_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id) ON DELETE CASCADE,
        card_brand VARCHAR(50) NOT NULL,
        last4 VARCHAR(4) NOT NULL,
        exp_month VARCHAR(2) NOT NULL,
        exp_year VARCHAR(4) NOT NULL,
        cardholder_name VARCHAR(150) NOT NULL,
        encrypted_card_number NVARCHAR(MAX) NOT NULL,
        encrypted_cvc NVARCHAR(MAX) NOT NULL,
        is_default BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      );
      PRINT 'Created User_Payment_Methods table';
    END
  `);

  console.log('[Migration] Migration completed successfully.');
}

if (process.argv[1]?.includes('add_trial_and_payment_methods.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]:', err);
      process.exit(1);
    });
}
