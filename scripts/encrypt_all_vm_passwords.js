import prisma from '../lib/prisma.js';
import { encryptVmPassword } from '../services/cryptoService.js';

async function migrateLegacyPasswords() {
  console.log('[Migration] Starting encryption of legacy unencrypted VM passwords in database...');

  const vms = await prisma.virtualMachine.findMany({
    select: {
      vmId: true,
      vmName: true,
      adminUser: true,
      adminPassword: true,
    },
  });

  console.log(`[Migration] Found ${vms.length} VM records to inspect.`);

  let migratedCount = 0;

  for (const vm of vms) {
    if (!vm.adminPassword) continue;

    // Check if already encrypted
    if (vm.adminPassword.startsWith('$enc$gcm$v1$')) {
      console.log(`[Migration] VM #${vm.vmId} (${vm.vmName}) is already encrypted. Skipping.`);
      continue;
    }

    const encrypted = encryptVmPassword(vm.adminPassword);

    await prisma.virtualMachine.update({
      where: { vmId: vm.vmId },
      data: { adminPassword: encrypted },
    });

    console.log(`[Migration] VM #${vm.vmId} (${vm.vmName}) password successfully encrypted at rest.`);
    migratedCount++;
  }

  console.log(`[Migration] Complete! Encrypted ${migratedCount} VM password(s). Zero plaintext passwords remaining.`);
  process.exit(0);
}

migrateLegacyPasswords().catch((err) => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});
