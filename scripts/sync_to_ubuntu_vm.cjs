const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const filesToUpload = [
  'public/src/components/Navbar.tsx',
  'public/src/components/AccountSettings.tsx',
  'public/src/components/Sidebar.tsx',
  'public/src/components/TeamManagement.tsx',
  'public/src/components/WorkspaceSwitcher.tsx',
  'public/src/components/BillingAndInvoices.tsx',
  'public/src/pages/Dashboard.tsx',
];

const conn = new Client();

console.log('Connecting to Ubuntu VM (172.28.70.228:22) via SSH/SFTP...');

conn.on('ready', () => {
  console.log('SSH connection established! Initializing SFTP...');

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      process.exit(1);
    }

    const uploadFile = (relPath) => {
      return new Promise((resolve, reject) => {
        const localPath = path.resolve(relPath);
        const remotePath = path.posix.join('/home/ubuntu/atech_vps_portal', relPath.replace(/\\/g, '/'));

        console.log(`Uploading ${relPath} -> ${remotePath}...`);
        sftp.fastPut(localPath, remotePath, (uploadErr) => {
          if (uploadErr) {
            reject(uploadErr);
          } else {
            console.log(`✓ Uploaded ${relPath}`);
            resolve();
          }
        });
      });
    };

    try {
      for (const file of filesToUpload) {
        await uploadFile(file);
      }
      console.log('All files uploaded successfully!');

      const script = `
        set -e
        echo "=== BUILDING FRONTEND ON UBUNTU ==="
        cd /home/ubuntu/atech_vps_portal/public
        npm run build
        echo "=== RESTARTING PM2 SERVICES ==="
        cd /home/ubuntu/atech_vps_portal
        pm2 restart all
        sleep 2
        pm2 status
      `;

      conn.exec(script, (execErr, stream) => {
        if (execErr) {
          console.error('Exec error:', execErr);
          conn.end();
          process.exit(1);
        }

        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
          console.log(`\nDeployment finished with code: ${code}`);
          conn.end();
          process.exit(code || 0);
        });
      });
    } catch (uploadError) {
      console.error('Upload failed:', uploadError);
      conn.end();
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
}).connect({
  host: '172.28.70.228',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000,
});
