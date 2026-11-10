const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('pwd && ls -la && pm2 list', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
      process.exit(0);
    });
  });
}).connect({ host: '172.26.50.172', port: 22, username: 'ubuntu', password: 'root' });
