const { Client } = require('ssh2');
const { execSync } = require('child_process');

function getUbuntuIp() {
  try {
    const arpOut = execSync('arp -a', { encoding: 'utf8' });
    const lines = arpOut.split('\n');
    for (const line of lines) {
      if (line.includes('00-15-5d-64-5c-00')) {
        const match = line.trim().match(/^(\d+\.\d+\.\d+\.\d+)/);
        if (match) return match[1];
      }
    }
  } catch (e) {}
  return '172.22.122.34';
}

const targetHost = getUbuntuIp();
console.log(`Connecting to Ubuntu VM (${targetHost}:22)...`);

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection ready. Running full deployment...');
  
  const script = [
    'set -e',
    'cd /home/ubuntu/atech_vps_portal',
    'echo "=== STASHING LOCAL RUNTIME CHANGES ==="',
    'git stash',
    'echo "=== PULLING LATEST COMMITS ==="',
    'CURRENT_BRANCH=$(git branch --show-current)',
    'echo "Current branch: $CURRENT_BRANCH"',
    'git pull origin $CURRENT_BRANCH',
    'echo "=== RESTORING RUNTIME CHANGES ==="',
    'git stash pop || true',
    'echo "=== RUNNING PRISMA SEED ==="',
    'node prisma/seed.js',
    'echo "=== UPDATING WINDOWS OS IMAGE IN DB ==="',
    'node scripts/update_windows_os_image.cjs',
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
  host: targetHost,
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
