const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      const nodemailer = require('nodemailer');
      async function test(port, secure) {
        console.log(\\\`Testing 172.16.17.49 on port \${port} (secure: \${secure})...\\\`);
        const transporter = nodemailer.createTransport({
          host: '172.16.17.49',
          port: port,
          secure: secure,
          auth: {
            user: 'no-reply@atechconsult.com',
            pass: 'Q)9zVhm9BQ'
          },
          tls: {
            servername: 'mail.atechconsult.com',
            rejectUnauthorized: false
          }
        });
        try {
          await transporter.verify();
          console.log(\\\`SUCCESS on port \${port}!\\\`);
          return true;
        } catch(e) {
          console.error(\\\`FAILED on port \${port}:\\\`, e.message);
          return false;
        }
      }

      async function main() {
        await test(465, true);
        await test(587, false);
        await test(25, false);
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
