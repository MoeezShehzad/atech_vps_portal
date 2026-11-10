const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to Ubuntu VM (172.28.70.228:22) as ubuntu...');

conn.on('ready', () => {
  console.log('SSH connection established! Running deployment on Ubuntu VM...');

  const script = `
    set -e
    cd /home/ubuntu/atech_vps_portal
    echo "=== PULLING LATEST CODE ==="
    git fetch origin feature/profile-uploads-sidebar
    git checkout feature/profile-uploads-sidebar
    git pull origin feature/profile-uploads-sidebar
    echo "=== BUILDING FRONTEND ==="
    cd public
    npm run build
    cd ..
    echo "=== RESTARTING PM2 SERVICES ==="
    pm2 restart all
    sleep 2
    pm2 status
  `;

  conn.exec(script, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      process.exit(1);
    }
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\nDeployment finished with exit code: ${code}`);
      conn.end();
      process.exit(code || 0);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
}).connect({
  host: '172.28.70.228',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000,
});
