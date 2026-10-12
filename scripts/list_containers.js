import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
});

conn.connect({
  host: '172.27.47.192',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
