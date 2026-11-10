const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('cd /home/ubuntu/atech_vps_portal && pm2 status', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', (c) => {
      conn.end();
    });
  });
}).connect({ host: '172.21.39.51', port: 22, username: 'ubuntu', password: 'root' });
