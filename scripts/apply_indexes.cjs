const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const indexes = [
    { name: 'idx_vms_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_vms_user_id ON VirtualMachines(user_id);' },
    { name: 'idx_vms_subscription_id', sql: 'CREATE NONCLUSTERED INDEX idx_vms_subscription_id ON VirtualMachines(subscription_id);' },
    { name: 'idx_vms_status', sql: 'CREATE NONCLUSTERED INDEX idx_vms_status ON VirtualMachines(status);' },
    { name: 'idx_subscriptions_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_subscriptions_user_id ON Subscriptions(user_id);' },
    { name: 'idx_subscriptions_status', sql: 'CREATE NONCLUSTERED INDEX idx_subscriptions_status ON Subscriptions(status);' },
    { name: 'idx_subscriptions_next_billing', sql: 'CREATE NONCLUSTERED INDEX idx_subscriptions_next_billing ON Subscriptions(next_billing_date);' },
    { name: 'idx_invoices_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_invoices_user_id ON Invoices(user_id);' },
    { name: 'idx_invoices_subscription_id', sql: 'CREATE NONCLUSTERED INDEX idx_invoices_subscription_id ON Invoices(subscription_id);' },
    { name: 'idx_invoices_status', sql: 'CREATE NONCLUSTERED INDEX idx_invoices_status ON Invoices(status);' },
    { name: 'idx_payments_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_payments_user_id ON Payments(user_id);' },
    { name: 'idx_payments_invoice_id', sql: 'CREATE NONCLUSTERED INDEX idx_payments_invoice_id ON Payments(invoice_id);' },
    { name: 'idx_security_logs_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_security_logs_user_id ON Security_Logs(user_id);' },
    { name: 'idx_security_logs_timestamp', sql: 'CREATE NONCLUSTERED INDEX idx_security_logs_timestamp ON Security_Logs(timestamp);' },
    { name: 'idx_activity_logs_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_activity_logs_user_id ON Activity_Logs(user_id);' },
    { name: 'idx_activity_logs_vm_id', sql: 'CREATE NONCLUSTERED INDEX idx_activity_logs_vm_id ON Activity_Logs(vm_id);' },
    { name: 'idx_tickets_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_tickets_user_id ON Support_Tickets(user_id);' },
    { name: 'idx_tickets_status', sql: 'CREATE NONCLUSTERED INDEX idx_tickets_status ON Support_Tickets(status);' },
    { name: 'idx_ssh_keys_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_ssh_keys_user_id ON SSH_Keys(user_id);' },
    { name: 'idx_websites_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_websites_user_id ON Managed_Websites(user_id);' },
    { name: 'idx_payment_methods_user_id', sql: 'CREATE NONCLUSTERED INDEX idx_payment_methods_user_id ON User_Payment_Methods(user_id);' }
  ];

  for (const idx of indexes) {
    try {
      const checkSql = `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.name}') BEGIN ${idx.sql} END`;
      await prisma.$executeRawUnsafe(checkSql);
      console.log(`[OK] Index ${idx.name} ready`);
    } catch (e) {
      console.warn(`[WARN] Index ${idx.name}: ${e.message}`);
    }
  }

  console.log('Database indexing process completed successfully.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
