const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      const nodemailer = require('nodemailer');
      const accounts = [
        { user: 'no-reply@atechconsult.com', pass: 'Q)9zVhm9BQ' },
        { user: 'customer-support@atechconsult.com', pass: 'uTJ5+5CbUG' },
        { user: 'billing@atechconsult.com', pass: '{tSvuZA9Wj' },
        { user: 'alerts@atechconsult.com', pass: 'yykFkq[55g' }
      ];

      async function testAccount(acc) {
        const transporter = nodemailer.createTransport({
          host: '172.16.17.49',
          port: 465,
          secure: true,
          auth: { user: acc.user, pass: acc.pass },
          tls: { servername: 'mail.atechconsult.com', rejectUnauthorized: false }
        });
        try {
          await transporter.verify();
          console.log('SUCCESS:', acc.user);
        } catch(e) {
          console.error('FAILED:', acc.user, e.message);
        }
      }

      async function main() {
        for (const acc of accounts) {
          await testAccount(acc);
        }
        process.exit(0);
      }
      main();
    "
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
