const { Client } = require('ssh2');
const path = require('path');

const filesToSync = [
  'controllers/authController.js',
  'controllers/vmController.js',
  'services/hypervService.js',
  'services/pricingService.js',
  'services/trialService.js',
  'services/emailService.js',
  'routes/pricing.js',
  'prisma/seed.js',
  'seed_data.js',
  'public/src/services/pricingApi.ts',
  'public/src/components/StorageAndDisks.tsx',
  'public/src/pages/Pricing.tsx',
  'public/src/pages/Home.tsx',
  'public/src/pages/AddtoCart.tsx',
  'public/src/pages/Checkout.tsx',
  'public/src/pages/Dashboard.tsx',
  'public/src/pages/AdminDashboard.tsx'
];

const conn = new Client();
console.log('Connecting to Ubuntu VM 172.24.210.109...');

conn.on('ready', () => {
  console.log('SSH connection ready. Opening SFTP...');
  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    const upload = (file) => new Promise((resolve, reject) => {
      const local = path.resolve(file);
      const remote = '/home/ubuntu/atech_vps_portal/' + file.replace(/\\/g, '/');
      console.log('Uploading:', file, '->', remote);
      sftp.fastPut(local, remote, (uErr) => {
        if (uErr) reject(uErr);
        else {
          console.log('Uploaded:', file);
          resolve();
        }
      });
    });

    try {
      for (const f of filesToSync) {
        await upload(f);
      }
      console.log('All files transferred to Ubuntu!');

      const script = [
        'set -e',
        'echo "=== CHECKING FRONTEND BUILD ON UBUNTU ==="',
        'cd /home/ubuntu/atech_vps_portal/public',
        'npm run build',
        'echo "=== RESTARTING PM2 SERVICES ==="',
        'cd /home/ubuntu/atech_vps_portal',
        'pm2 restart all',
        'sleep 2',
        'pm2 status'
      ].join('\n');

      console.log('Executing build and restart on Ubuntu...');
      conn.exec(script, (execErr, stream) => {
        if (execErr) {
          console.error('Exec error:', execErr);
          conn.end();
          return;
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', code => {
          console.log('\nRemote build and restart finished with code:', code);
          conn.end();
        });
      });
    } catch (e) {
      console.error('Upload failed:', e);
      conn.end();
    }
  });
}).on('error', err => {
  console.error('SSH connect error:', err);
}).connect({
  host: '172.24.210.109',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000
});
