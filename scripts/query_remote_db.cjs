const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    cd /var/www/atechconsult.com && node -e "
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      async function main() {
        const user = await p.user.findFirst({ where: { email: { contains: 'linkedscam' } } });
        console.log('USER:', JSON.stringify(user, null, 2));

        const usersAll = await p.user.findMany({ select: { userId: true, email: true, fullName: true } });
        console.log('ALL USERS:', JSON.stringify(usersAll, null, 2));

        const images = await p.oSImage.findMany();
        console.log('IMAGES:', JSON.stringify(images, null, 2));

        const plans = await p.vPSPlan.findMany();
        console.log('PLANS:', JSON.stringify(plans, null, 2));

        const hosts = await p.hyperVHost.findMany();
        console.log('HOSTS:', JSON.stringify(hosts, null, 2));

        const vms = await p.virtualMachine.findMany({
          include: {
            ipPool: true,
            subscription: true,
          }
        });
        console.log('VMS:', JSON.stringify(vms, null, 2));

        process.exit(0);
      }
      main().catch(e => { console.error(e); process.exit(1); });
    "
  `;
  conn.exec(query, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
