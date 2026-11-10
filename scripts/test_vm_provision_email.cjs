const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e '
      import("dotenv/config").then(async () => {
        const { sendVmProvisionedEmail } = await import("./services/emailService.js");
        console.log("Sending VM provisioned email for srv-vps-2961...");
        const res = await sendVmProvisionedEmail({
          email: "moeezshahzad26@gmail.com",
          fullName: "Moeez Shahzad",
          vmName: "srv-vps-2961",
          ipAddress: "172.16.17.18",
          username: "ubuntu",
          password: "root",
          os: "Ubuntu Server 24.04 LTS"
        });
        console.log("RESULT:", JSON.stringify(res));
        process.exit(0);
      }).catch(err => {
        console.error("Error:", err);
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
