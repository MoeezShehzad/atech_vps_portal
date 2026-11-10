const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    for ip in 172.16.17.49 172.16.17.17 172.16.17.50 172.16.17.51; do
      echo "=== Testing \$ip ==="
      nc -zv -w 2 \$ip 25 2>/dev/null && echo "\$ip port 25 OPEN" || true
      nc -zv -w 2 \$ip 465 2>/dev/null && echo "\$ip port 465 OPEN" || true
      nc -zv -w 2 \$ip 587 2>/dev/null && echo "\$ip port 587 OPEN" || true
      nc -zv -w 2 \$ip 993 2>/dev/null && echo "\$ip port 993 OPEN" || true
      nc -zv -w 2 \$ip 80 2>/dev/null && echo "\$ip port 80 OPEN" || true
    done
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
