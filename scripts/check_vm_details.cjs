const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    cd /var/www/atechconsult.com && node -e "
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      async function main() {
        const replacer = (key, val) => typeof val === 'bigint' ? val.toString() : val;
        const jobs = await p.provisioningJob.findMany({ where: { vmId: 3 } });
        console.log('JOBS:', JSON.stringify(jobs, replacer, 2));
        const logs = await p.activityLog.findMany({ where: { vmId: 3 } });
        console.log('LOGS:', JSON.stringify(logs, replacer, 2));
        const ips = await p.iPPool.findMany();
        console.log('IPS:', JSON.stringify(ips, replacer, 2));
        process.exit(0);
      }
      main().catch(e => { console.error(e); process.exit(1); });
    "
  `;
  conn.exec(query, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
