const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      import('dotenv/config').then(async () => {
        const jwt = (await import('jsonwebtoken')).default;
        const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'atc_cloud_default_jwt_secret_must_change';
        const token = jwt.sign(
          { userId: 1, email: 'admin@atechconsult.com', roles: ['Admin'] },
          secret,
          { expiresIn: '1h' }
        );
        const resMe = await fetch('http://127.0.0.1:5000/api/users/me', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const jsonMe = await resMe.json();
        console.log('HTTP Status /api/users/me:', resMe.status);
        console.log('Profile Response:', JSON.stringify(jsonMe, null, 2));

        const resVms = await fetch('http://127.0.0.1:5000/api/vms', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const jsonVms = await resVms.json();
        console.log('HTTP Status /api/vms:', resVms.status);
        console.log('VMs count:', jsonVms?.count);
        console.log('VMs list:', JSON.stringify(jsonVms?.vms?.map?.(v => ({ id: v.id, name: v.name, status: v.status, ip: v.ipAddress })), null, 2));
        console.log('Active subscriptions count:', jsonVms?.activeSubscriptions?.length);
        console.log('Current workspace:', jsonVms?.currentWorkspace);
        const resCompProf = await fetch('http://127.0.0.1:5000/api/company/profile', {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('HTTP Status /api/company/profile:', resCompProf.status);
        console.log('Profile json:', await resCompProf.json());

        const resCompMemb = await fetch('http://127.0.0.1:5000/api/company/members', {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('HTTP Status /api/company/members:', resCompMemb.status);
        console.log('Members json:', await resCompMemb.json());

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
