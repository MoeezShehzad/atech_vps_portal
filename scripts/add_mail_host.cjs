const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    echo admin@123 | sudo -S bash -c "
      if ! grep -q 'mail.atechconsult.com' /etc/hosts; then
        echo '172.16.17.49 mail.atechconsult.com' >> /etc/hosts
        echo 'Added mail.atechconsult.com to /etc/hosts'
      else
        sed -i 's/.*mail.atechconsult.com.*/172.16.17.49 mail.atechconsult.com/' /etc/hosts
        echo 'Updated mail.atechconsult.com in /etc/hosts'
      fi
    "
    grep mail.atechconsult.com /etc/hosts
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
