const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    echo "=== PING mail.atechconsult.com ==="
    ping -c 2 mail.atechconsult.com || true
    echo "=== DIG / NSLOOKUP ==="
    dig mail.atechconsult.com +short || nslookup mail.atechconsult.com || true
    echo "=== ARP TABLE ==="
    ip neigh show || arp -a || true
    echo "=== ROUTING ==="
    ip route || true
    echo "=== /etc/hosts ==="
    cat /etc/hosts
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
