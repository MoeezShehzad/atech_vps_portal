const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = "echo root | sudo -S sed -i 's/LISTEN_ADDRESS=127.0.0.1/LISTEN_ADDRESS=0.0.0.0/' /etc/default/guacd && echo root | sudo -S systemctl restart guacd && echo root | sudo -S systemctl status guacd && ss -tulpn | grep 4822";
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => { conn.end(); process.exit(code); });
  });
}).connect({ host: '172.21.39.51', port: 22, username: 'ubuntu', password: 'root', readyTimeout: 10000 });
