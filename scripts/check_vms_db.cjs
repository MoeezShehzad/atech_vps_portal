const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    cd /var/www/atechconsult.com && node -e "
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      p.virtualMachine.findMany().then(v => {
        console.log('COUNT:', v.length);
        console.log(v);
        process.exit(0);
      }).catch(err => {
        console.error('ERR:', err);
        process.exit(1);
      });
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
