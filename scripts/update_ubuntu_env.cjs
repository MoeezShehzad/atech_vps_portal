const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    sed -i 's/172.28.64.1/172.31.32.1/g' /home/ubuntu/atech_vps_portal/.env
    echo "=== UPDATED .ENV ==="
    grep DATABASE_URL /home/ubuntu/atech_vps_portal/.env
    echo "=== RESTARTING BACKEND ==="
    cd /home/ubuntu/atech_vps_portal
    pm2 restart atech-backend
    sleep 2
    node prisma/seed.js || true
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log('Update finished with code:', code);
      conn.end();
    });
  });
}).on('error', err => {
  console.error('SSH Error:', err);
}).connect({
  host: '172.31.40.75',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
