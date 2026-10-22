const { Client } = require('ssh2');
const path = require('path');

const filesToUpload = [
  'public/src/pages/Home.tsx',
  'public/src/components/Navbar.tsx',
  'public/src/components/Footer.tsx'
];

const conn = new Client();

console.log('Connecting to Ubuntu server 172.21.39.51 to push full dark data center theme...');

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

      const remoteCmd = `
        set -e
        cd /home/ubuntu/atech_vps_portal/public
        echo "=== Running npm run build on Ubuntu server ==="
        npm run build
        echo "=== Restarting PM2 services ==="
        cd /home/ubuntu/atech_vps_portal
        pm2 restart all
        pm2 status
      `;

      console.log('Building frontend and restarting PM2 on Ubuntu server...');
      conn.exec(remoteCmd, (execErr, stream) => {
        if (execErr) {
          console.error('Command execution error:', execErr);
          conn.end();
          process.exit(1);
        }

        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
          console.log(`\nRemote build and PM2 restart completed with code ${code}`);
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
  host: '172.21.39.51',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 15000,
});
