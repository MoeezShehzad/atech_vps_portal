const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `cd /home/ubuntu/atech_vps_portal && node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function run() {
      await prisma.vPSPlan.updateMany({ where: { name: 'VPS Basic' }, data: { maxSnapshots: 1 } });
      await prisma.vPSPlan.updateMany({ where: { name: 'VPS Pro' }, data: { maxSnapshots: 2 } });
      await prisma.vPSPlan.updateMany({ where: { name: 'VPS Enterprise' }, data: { maxSnapshots: 7 } });
      await prisma.vPSPlan.updateMany({ where: { name: 'VPS Ultra Compute' }, data: { maxSnapshots: 5 } });
      const plans = await prisma.vPSPlan.findMany({ select: { name: true, maxSnapshots: true } });
      console.log('SUCCESS_DB_SNAPSHOTS:', plans);
      await prisma.\\$disconnect();
    }
    run().catch(e => { console.error(e); process.exit(1); });
  "`;
  conn.exec(remoteCmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log('Update maxSnapshots script finished with code:', code);
      conn.end();
    });
  });
}).on('error', err => {
  console.error('SSH Error:', err);
}).connect({
  host: '172.31.40.75',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
