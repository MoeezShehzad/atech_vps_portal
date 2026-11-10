const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    echo "=== 1. GIT PULL ==="
    git pull origin develop
    echo "=== 2. BUILD FRONTEND ==="
    cd public && npm run build
    cd ..
    echo "=== 3. RESTART PM2 ==="
    pm2 restart atech-portal
    echo "=== DEPLOY COMPLETE ==="
  `;

  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      process.exit(1);
    }
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err.message);
  process.exit(1);
}).connect({
  host: '172.16.17.48',
  port: 22,
  username: 'atc',
  password: 'admin@123',
  readyTimeout: 30000,
});
