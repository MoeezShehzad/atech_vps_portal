const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    for i in \$(seq 1 60); do
      ping -c 1 -W 1 172.16.17.\$i >/dev/null 2>&1 && echo "Active: 172.16.17.\$i" &
    done
    wait
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
