const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to Ubuntu VM 172.24.210.109...');

conn.on('ready', () => {
  console.log('SSH connection ready. Running full deployment...');
  
  const script = [
    'set -e',
    'cd /home/ubuntu/atech_vps_portal',
    'echo "=== STASHING LOCAL RUNTIME CHANGES ==="',
    'git stash',
    'echo "=== PULLING LATEST COMMITS ==="',
    'git pull origin feature/pricing-formula-update-and-snapshots',
    'echo "=== RESTORING RUNTIME CHANGES ==="',
    'git stash pop || true',
    'echo "=== RUNNING PRISMA SEED ==="',
    'node prisma/seed.js',
    'echo "=== UPDATING DB SNAPSHOTS AND PRICING ==="',
    'node scripts/update_db_snapshots.cjs',
    'echo "=== BUILDING FRONTEND ON UBUNTU ==="',
    'cd /home/ubuntu/atech_vps_portal/public',
    'npm run build',
    'echo "=== RESTARTING PM2 SERVICES ==="',
    'cd /home/ubuntu/atech_vps_portal',
    'pm2 restart all',
    'sleep 2',
    'pm2 status'
  ].join('\n');

  conn.exec(script, (execErr, stream) => {
    if (execErr) {
      console.error('Exec error:', execErr);
      conn.end();
      process.exit(1);
    }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log('\nRemote deployment finished with exit code:', code);
      conn.end();
      process.exit(code || 0);
    });
  });
}).on('error', err => {
  console.error('SSH connect error:', err);
  process.exit(1);
}).connect({
  host: '172.24.210.109',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
