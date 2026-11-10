const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `grep -i "SMTP" /var/www/atechconsult.com/.env`;
  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
