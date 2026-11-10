const { Client } = require('ssh2');

const UBUNTU_IP = '172.23.201.102';
const WINDOWS_HOST_IP = '172.23.192.1';

const conn = new Client();
conn.on('ready', () => {
  console.log(`Connected to Ubuntu VM at ${UBUNTU_IP}`);
  const envContent = `# Server Configuration
PORT=5000
HOST=0.0.0.0

# Database Configuration (Points to Windows Host SQL Server on Port 1433)
DATABASE_URL="sqlserver://${WINDOWS_HOST_IP}:1433;database=atechconsult;user=atech_portal_user;password=admin@123;encrypt=true;trustServerCertificate=true"

# Hyper-V Host Agent URL (Windows Host on Port 5050)
HYPERV_HOST_URL=http://${WINDOWS_HOST_IP}:5050

# JWT & Session Secrets
JWT_SECRET="super_secret_atech_vps_key_2026"
JWT_VERIFY_SECRET="your_super_secret_verify_key"
SESSION_SECRET="atech_vps_super_secret_session_key_2026_99x!"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="369485207582-d99elbgam5spalb22apu63vje1avu5gq.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# Corporate Mail Suite Configuration (mail.atechconsult.com)
SMTP_HOST=mail.atechconsult.com
SMTP_PORT=465
SMTP_SECURE=true

# Support Desk
SMTP_SUPPORT_USER=customer-support@atechconsult.com
SMTP_SUPPORT_PASS="uTJ5+5CbUG"

# System & Transactional (Verification, Password Reset, Server Ready)
SMTP_NOREPLY_USER=no-reply@atechconsult.com
SMTP_NOREPLY_PASS="Q)9zVhm9BQ"

# Invoicing & Receipts
SMTP_BILLING_USER=billing@atechconsult.com
SMTP_BILLING_PASS="{tSvuZA9Wj"

# Infrastructure & Security Alerts
SMTP_ALERTS_USER=alerts@atechconsult.com
SMTP_ALERTS_PASS="yykFkq[55g"

# Networking / URLs
BACKEND_URL=http://${UBUNTU_IP}:5000
FRONTEND_URL=http://${UBUNTU_IP}:5174
CLIENT_URL=http://${UBUNTU_IP}:5174
`;

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err);
      conn.end();
      return;
    }

    const remoteEnvPath = '/home/ubuntu/atech_vps_portal/.env';
    const writeStream = sftp.createWriteStream(remoteEnvPath);

    writeStream.on('close', () => {
      console.log('✓ Successfully written .env to Ubuntu VM');
      
      const cmd = `
        echo "=== RESTARTING PM2 SERVICES ==="
        cd /home/ubuntu/atech_vps_portal
        pm2 restart all
        sleep 3
        pm2 status
        echo "=== TESTING PRISMA DB CONNECTIVITY ==="
        node -e "
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          async function test() {
            const count = await prisma.user.count();
            console.log('PRISMA_DB_TEST_OK! User count in SQL Server:', count);
            const plans = await prisma.vPSPlan.count();
            console.log('PRISMA_DB_TEST_OK! VPS Plans count:', plans);
            await prisma.\\$disconnect();
          }
          test().catch(e => { console.error('PRISMA_ERR:', e.message); process.exit(1); });
        "
        echo "=== TESTING API HEALTH ==="
        curl -i http://localhost:5000/api/health
      `;

      conn.exec(cmd, (execErr, stream) => {
        if (execErr) {
          console.error(execErr);
          conn.end();
          return;
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', code => {
          console.log('\nCommand completed with code:', code);
          conn.end();
        });
      });
    });

    writeStream.write(envContent);
    writeStream.end();
  });
}).on('error', err => {
  console.error('SSH Error:', err);
}).connect({
  host: UBUNTU_IP,
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
