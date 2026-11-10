const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e "
      import('dotenv/config').then(async () => {
        console.log('=== SMTP CONFIG ===');
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_PORT:', process.env.SMTP_PORT);
        console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
        console.log('SMTP_NOREPLY_USER:', process.env.SMTP_NOREPLY_USER);
        const emailService = await import('./services/emailService.js');
        const { transporterNoReply, transporterSupport } = emailService;
        try {
          console.log('Verifying transporterNoReply...');
          await transporterNoReply.verify();
          console.log('transporterNoReply VERIFIED SUCCESS');
        } catch(err) {
          console.error('transporterNoReply FAILED:', err.message, err.code, err.response);
        }
        try {
          console.log('Verifying transporterSupport...');
          await transporterSupport.verify();
          console.log('transporterSupport VERIFIED SUCCESS');
        } catch(err) {
          console.error('transporterSupport FAILED:', err.message, err.code, err.response);
        }
        process.exit(0);
      });
    "
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
