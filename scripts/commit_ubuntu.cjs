const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec("cd /home/ubuntu/atech_vps_portal && git add . && git commit -m 'sync: ui polish'", (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.28.70.228', port: 22, username: 'ubuntu', password: 'root' });
