/**
 * Update VM Credentials in Database (Safe metadata update for Web SSH / RDP)
 * 
 * Usage:
 *   node scripts/update_vm_credentials.cjs                       -> Lists all VMs and current SSH users
 *   node scripts/update_vm_credentials.cjs "<vmName>" "<user>" "<newPassword>" -> Updates credentials safely
 * 
 * Example:
 *   node scripts/update_vm_credentials.cjs "Mail_Server" "ubuntu" "yourPasswordHere"
 *   node scripts/update_vm_credentials.cjs "Web Hosting" "atc" "yourPasswordHere"
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Reversible encryption identical to cryptoService.js
const SECRET_SEED = process.env.VM_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'atc_cloud_super_secret_vm_key_2026';
const KEY = crypto.createHash('sha256').update(SECRET_SEED).digest();
const ALGO = 'aes-256-gcm';
const PREFIX = '$enc$gcm$v1$';

function encryptPassword(plaintext) {
  if (!plaintext) return '';
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${PREFIX}${iv.toString('hex')}$${authTag}$${encrypted}`;
  } catch (err) {
    return plaintext;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const [vmNameArg, userArg, passArg] = args;

  if (!vmNameArg) {
    console.log('================================================================');
    console.log('  CURRENT VIRTUAL MACHINES IN DATABASE');
    console.log('================================================================\n');

    const vms = await prisma.virtualMachine.findMany({
      include: {
        user: { select: { email: true, fullName: true } },
        ipPool: true,
      },
      orderBy: { vmId: 'asc' },
    });

    if (vms.length === 0) {
      console.log('No virtual machines found in database.');
    } else {
      vms.forEach((vm) => {
        const ip = vm.ipPool?.[0]?.ipAddress || 'No IP assigned';
        console.log(`[VM ID: ${vm.vmId}] "${vm.vmName}"`);
        console.log(`   Owner: ${vm.user?.fullName} (${vm.user?.email})`);
        console.log(`   SSH User: ${vm.adminUser || 'ubuntu'}`);
        console.log(`   IP Address: ${ip}`);
        console.log(`   Status: ${vm.status}`);
        console.log('----------------------------------------------------------------');
      });
    }

    console.log('\nTo update credentials for a machine, run:');
    console.log('  node scripts/update_vm_credentials.cjs "<VM_NAME>" "<SSH_USERNAME>" "<PASSWORD>"');
    console.log('\nExamples:');
    console.log('  node scripts/update_vm_credentials.cjs "Mail_Server" "ubuntu" "admin@123"');
    console.log('  node scripts/update_vm_credentials.cjs "Web Hosting" "atc" "admin@123"\n');
    await prisma.$disconnect();
    return;
  }

  if (!passArg) {
    console.error('❌ Please provide both the SSH Username and Password.');
    console.error('Usage: node scripts/update_vm_credentials.cjs "<VM_NAME>" "<SSH_USERNAME>" "<PASSWORD>"');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Find VM
  const vm = await prisma.virtualMachine.findFirst({
    where: {
      OR: [
        { vmName: vmNameArg },
        { vmName: { contains: vmNameArg } },
      ],
    },
  });

  if (!vm) {
    console.error(`❌ Virtual Machine "${vmNameArg}" not found in database.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  // Encrypt password securely
  const encryptedPassword = encryptPassword(passArg);

  // Update VM in database
  const updated = await prisma.virtualMachine.update({
    where: { vmId: vm.vmId },
    data: {
      adminUser: userArg.trim(),
      adminPassword: encryptedPassword,
    },
  });

  console.log('================================================================');
  console.log(`✓ Successfully updated database credentials for "${updated.vmName}" (VM ID: ${updated.vmId})`);
  console.log(`  SSH User: ${updated.adminUser}`);
  console.log('  Password: [Encrypted & Stored Securely]');
  console.log('  The Web Terminal / SSH Console will now use these credentials.');
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Error updating VM credentials:', err.message);
  prisma.$disconnect();
  process.exit(1);
});
