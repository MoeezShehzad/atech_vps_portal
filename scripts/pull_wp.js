import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Pre-pulling wordpress:php8.2-apache on worker VM...');
  conn.exec('docker pull wordpress:php8.2-apache', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log('WordPress image pull completed with code:', code);
      conn.end();
      process.exit(code);
    });
  });
});

conn.connect({
  host: '172.27.47.192',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000,
});
