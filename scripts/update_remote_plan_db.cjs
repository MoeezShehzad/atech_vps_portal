const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.vPSPlan.updateMany({
    where: { name: 'VPS Basic' },
    data: { maxSnapshots: 1, monthlyPrice: 6.99, storageGb: 120 }
  });
  await prisma.vPSPlan.updateMany({
    where: { name: 'VPS Pro' },
    data: { maxSnapshots: 2, monthlyPrice: 14.98, storageGb: 250 }
  });
  await prisma.vPSPlan.updateMany({
    where: { name: 'VPS Enterprise' },
    data: { maxSnapshots: 3, monthlyPrice: 29.99, storageGb: 250 }
  });
  await prisma.vPSPlan.updateMany({
    where: { name: 'VPS Ultra Compute' },
    data: { maxSnapshots: 5, monthlyPrice: 59.99, storageGb: 500 }
  });
  
  const plans = await prisma.vPSPlan.findMany({
    select: { planId: true, name: true, monthlyPrice: true, storageGb: true, maxSnapshots: true },
    orderBy: { planId: 'asc' }
  });
  console.log('CURRENT_DATABASE_PLANS_ON_UBUNTU:', JSON.stringify(plans, null, 2));
  await prisma.$disconnect();
}

run().catch(err => {
  console.error('Prisma update error:', err);
  process.exit(1);
});
`;

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }
    const remotePath = '/home/ubuntu/atech_vps_portal/scripts/temp_plan_update.cjs';
    const stream = sftp.createWriteStream(remotePath);
    stream.on('close', () => {
      console.log('Uploaded temp_plan_update.cjs to remote Ubuntu VM.');
      conn.exec('cd /home/ubuntu/atech_vps_portal && node scripts/temp_plan_update.cjs && rm -f scripts/temp_plan_update.cjs && pm2 restart all', (eErr, eStream) => {
        if (eErr) {
          console.error('Exec error:', eErr);
          conn.end();
          return;
        }
        eStream.on('data', d => process.stdout.write(d.toString()));
        eStream.stderr.on('data', d => process.stderr.write(d.toString()));
        eStream.on('close', code => {
          console.log('\nFinished execution with code:', code);
          conn.end();
        });
      });
    });
    stream.write(scriptContent);
    stream.end();
  });
}).on('error', err => {
  console.error('SSH Error:', err);
}).connect({
  host: '172.24.210.109',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
