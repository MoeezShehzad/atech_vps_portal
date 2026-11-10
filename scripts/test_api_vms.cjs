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
          { userId: 13, email: 'moeezshahzad26@gmail.com', roles: ['ROLE_ADMIN', 'ADMIN'] },
          secret,
          { expiresIn: '1h' }
        );
        const res = await fetch('http://127.0.0.1:5000/api/vms', {
          headers: { Authorization: 'Bearer ' + token }
        });
        const json = await res.json();
        console.log('HTTP Status:', res.status);
        console.log('GET /api/vms result count:', Array.isArray(json) ? json.length : json);
        if (Array.isArray(json) && json.length > 0) {
          console.log('First VM:', JSON.stringify(json[0], null, 2));
        }
        process.exit(0);
      }).catch(err => {
        console.error('Test error:', err);
        process.exit(1);
      });
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
