const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const filesToUpload = [
  'controllers/companyController.js',
  'controllers/vmController.js',
  'services/terminalService.js',
  'public/src/components/TeamManagement.tsx',
  'public/src/components/WorkspaceSwitcher.tsx',
  'public/src/pages/Dashboard.tsx',
];

const conn = new Client();

console.log('Connecting to Ubuntu VM 172.26.50.172...');

conn.on('ready', () => {
  console.log('SSH connection established! Initializing SFTP...');

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('SFTP initialization error:', err);
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
            resolve();
          }
        });
      });
    };

    try {
      for (const file of filesToUpload) {
        await uploadFile(file);
      }
      console.log('Files uploaded successfully via SFTP!');

      const remoteCmd = `
        cd /home/ubuntu/atech_vps_portal &&
        cd public && npm run build && cd .. &&
        pm2 restart all &&
        sleep 2 &&
        pm2 status
      `;

      console.log('Building frontend and restarting PM2 on Ubuntu VM...');
      conn.exec(remoteCmd, (execErr, stream) => {
        if (execErr) {
          console.error('Command execution error:', execErr);
          conn.end();
          process.exit(1);
        }

        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
          console.log(`\nDeployment & PM2 restart completed with code ${code}`);
          conn.end();
          process.exit(code || 0);
        });
      });
    } catch (e) {
      console.error('Upload process failed:', e);
      conn.end();
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('SSH Connection error:', err.message);
  process.exit(1);
}).connect({
  host: '172.26.50.172',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 15000,
});
