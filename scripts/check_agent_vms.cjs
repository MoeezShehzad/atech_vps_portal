const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    curl -s "http://192.168.10.10:5050/api/hyperv/status?vmName=APPS_VM"
    echo ''
    curl -s "http://192.168.10.10:5050/api/hyperv/status?vmName=DB_VM"
    echo ''
  `;
  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
