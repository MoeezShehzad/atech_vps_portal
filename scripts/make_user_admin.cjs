const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      import('./lib/prisma.js').then(async (m) => {
        const p = m.default || m.prisma;
        
        // 1. Rename Administrator to Admin if needed
        const adminRole = await p.role.findFirst({
          where: { roleName: { in: ['Admin', 'Administrator'] } }
        });
        
        let targetRoleId;
        if (adminRole) {
          targetRoleId = adminRole.roleId;
          if (adminRole.roleName !== 'Admin') {
            await p.role.update({
              where: { roleId: adminRole.roleId },
              data: { roleName: 'Admin' }
            });
            console.log('Renamed role to Admin');
          } else {
            console.log('Admin role already named Admin');
          }
        } else {
          const created = await p.role.create({
            data: { roleName: 'Admin', description: 'Full system administrative access' }
          });
          targetRoleId = created.roleId;
          console.log('Created Admin role');
        }

        // 2. Ensure moeezshahzad26@gmail.com has Admin role
        const user = await p.user.findUnique({
          where: { email: 'moeezshahzad26@gmail.com' },
          include: { userRoles: true }
        });
        
        if (!user) {
          console.error('User moeezshahzad26@gmail.com not found!');
          process.exit(1);
        }

        const hasRole = user.userRoles.some(ur => ur.roleId === targetRoleId);
        if (!hasRole) {
          await p.userRole.create({
            data: { userId: user.userId, roleId: targetRoleId }
          });
          console.log('Assigned Admin role to moeezshahzad26@gmail.com');
        } else {
          console.log('moeezshahzad26@gmail.com already has Admin role');
        }

        // 3. Verify
        const updated = await p.user.findUnique({
          where: { email: 'moeezshahzad26@gmail.com' },
          include: { userRoles: { include: { role: true } } }
        });
        console.log('SUCCESS! Active roles:', updated.userRoles.map(ur => ur.role.roleName));
        process.exit(0);
      }).catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
    "
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
