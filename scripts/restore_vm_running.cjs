const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      async function run() {
        const vm = await p.virtualMachine.updateMany({
          where: { vmName: 'srv-vps-2961' },
          data: {
            status: 'RUNNING',
            provisioningStatus: 'COMPLETED',
            hypervVmId: '72e43dcd-371e-4b30-8167-2bf0b67d28f1',
            terminatedAt: null,
            ipAddress: '172.16.17.18'
          }
        });
        console.log('Restored VM status to RUNNING:', vm);

        const ip = await p.iPPool.upsert({
          where: { ipAddress: '172.16.17.18' },
          update: { status: 'ASSIGNED', assignedVmId: 3 },
          create: {
            ipAddress: '172.16.17.18',
            subnetMask: '255.255.255.0',
            gateway: '172.16.17.1',
            ipType: 'LOCAL_IPV4',
            status: 'ASSIGNED',
            assignedVmId: 3
          }
        });
        console.log('Assigned IP to pool:', ip);
      }
      run().finally(() => p.\\$disconnect());
    "
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
