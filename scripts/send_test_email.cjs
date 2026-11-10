const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e '
      import("dotenv/config").then(async () => {
        const { transporterNoReply } = await import("./services/emailService.js");
        console.log("Sending test email to moeezshahzad26@gmail.com...");
        const info = await transporterNoReply.sendMail({
          from: "no-reply@atechconsult.com",
          to: "moeezshahzad26@gmail.com",
          subject: "ATC Cloud - Email System Active & Operational",
          text: "Hello Moeez, This is a confirmation test email from the ATC Cloud VPS Portal mail server. All notification dispatchers are now active and verified.",
          html: "<h3>ATC Cloud Platform</h3><p>Hello Moeez,</p><p>This is a confirmation test email from the ATC Cloud VPS Portal mail server. All notification dispatchers and email pipelines are now active and verified!</p>"
        });
        console.log("EMAIL SENT SUCCESS! MessageId:", info.messageId, "Response:", info.response);
        process.exit(0);
      }).catch(err => {
        console.error("Email send error:", err);
        process.exit(1);
      });
    '
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
