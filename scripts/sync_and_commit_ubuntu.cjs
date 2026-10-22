const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const filesToSync = [
  'public/index.html',
  'public/src/index.css',
  'public/src/pages/Home.tsx',
  'public/src/components/Navbar.tsx',
  'public/src/components/Footer.tsx',
  'public/src/components/AnimatedCloudTerminal.tsx',
  'public/src/components/LiquidGlassSphere.tsx',
  'public/src/context/ThemeContext.tsx',
  'public/src/assets/datacenter_infrastructure_bg.jpg',
  'public/src/assets/datacenter_server_racks.jpg',
  'public/src/assets/nexa_atmospheric_clouds.jpg',
  'public/src/assets/nexa_liquid_sphere.jpg',
  'public/src/assets/bg_fiber_network.jpg',
  'public/src/assets/bg_server_hall.jpg',
  'public/src/assets/bg_server_hardware.jpg',
  'public/src/assets/bg_noc_room.jpg'
];

const conn = new Client();
console.log('Connecting to ubuntu@prod-srv (172.21.39.51)...');

conn.on('ready', () => {
  console.log('SSH connection ready. Starting SFTP sync...');
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
        sftp.fastPut(localPath, remotePath, (uploadErr) => {
          if (uploadErr) {
            reject(uploadErr);
          } else {
            console.log(`✓ Synced: ${relPath}`);
            resolve();
          }
        });
      });
    };

    try {
      for (const f of filesToSync) {
        if (fs.existsSync(f)) {
          await uploadFile(f);
        }
      }

      console.log('All files synced to /home/ubuntu/atech_vps_portal!');

      const commands = `
        set -e
        cd /home/ubuntu/atech_vps_portal
        echo "=== 1. GIT STATUS BEFORE ==="
        git status
        echo "=== 2. GIT ADD & COMMIT ON UBUNTU ==="
        git add public/index.html public/src/index.css public/src/pages/Home.tsx public/src/components/Navbar.tsx public/src/components/Footer.tsx public/src/components/AnimatedCloudTerminal.tsx public/src/components/LiquidGlassSphere.tsx public/src/context/ThemeContext.tsx public/src/assets/
        git commit -m "Add high-resolution server and infrastructure backgrounds to all homepage sections" || echo "Already committed or clean"
        echo "=== 3. GIT STATUS AFTER ==="
        git status
        echo "=== 4. FRONTEND BUILD ==="
        cd public
        npm run build
        echo "=== 5. RESTART PM2 ==="
        cd /home/ubuntu/atech_vps_portal
        pm2 restart all
        pm2 status
      `;

      conn.exec(commands, (execErr, stream) => {
        if (execErr) {
          console.error('Command error:', execErr);
          conn.end();
          process.exit(1);
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', code => {
          console.log(`\nRemote script finished with code ${code}`);
          conn.end();
          process.exit(code || 0);
        });
      });

    } catch (e) {
      console.error('Sync failure:', e);
      conn.end();
      process.exit(1);
    }
  });
}).on('error', e => {
  console.error('SSH Error:', e.message);
  process.exit(1);
}).connect({
  host: '172.21.39.51',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 15000,
});
