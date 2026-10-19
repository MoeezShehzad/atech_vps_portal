const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to Ubuntu Portal VM...');

conn.on('ready', () => {
  console.log('Connected! Executing deployment on VM...');
  const remoteCmd = `
    cd /home/ubuntu/atech_vps_portal &&
    git fetch origin develop &&
    git reset --hard origin/develop &&
    npx prisma generate &&
    npm --prefix public run build &&
    pm2 restart all &&
    pm2 status
  `;

  conn.exec(remoteCmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\nDeployment command finished with exit code ${code}`);
      conn.end();
      process.exit(code || 0);
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection error:', err.message);
  process.exit(1);
}).connect({
  host: process.env.VM_IP || '172.20.208.223',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
