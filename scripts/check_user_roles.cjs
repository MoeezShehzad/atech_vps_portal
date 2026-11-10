const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      import('./lib/prisma.js').then(async (m) => {
        const p = m.default || m.prisma;
        const roles = await p.role.findMany();
        console.log('ROLES IN DB:', JSON.stringify(roles, null, 2));
        const user = await p.user.findUnique({
          where: { email: 'moeezshahzad26@gmail.com' },
          include: { userRoles: { include: { role: true } } }
        });
        console.log('USER IN DB:', JSON.stringify(user, null, 2));
        process.exit(0);
      });
    "
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
