const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

console.log('Connecting to Ubuntu Portal VM at 172.18.247.252...');

conn.on('ready', () => {
  console.log('Connected! Starting SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = path.resolve('csc.tar.gz');
    const remoteFile = '/home/ubuntu/csc.tar.gz';

    console.log('Uploading csc.tar.gz to VM...');
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) {
        console.error('SFTP upload error:', err);
        conn.end();
        process.exit(1);
      }
      console.log('Upload complete! Extracting country-state-city on VM and pulling develop...');

      const remoteCmd = `
        cd /home/ubuntu/atech_vps_portal &&
        tar -xzf /home/ubuntu/csc.tar.gz -C node_modules/ &&
        rm -f /home/ubuntu/csc.tar.gz &&
        git fetch origin develop &&
        git reset --hard origin/develop &&
        pm2 restart all &&
        pm2 status
      `;

      conn.exec(remoteCmd, (err, stream) => {
        if (err) {
          console.error('Exec error:', err);
          conn.end();
          process.exit(1);
        }

        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
          console.log(`\nDeployment command finished with exit code ${code}`);
          conn.end();
          process.exit(code || 0);
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection error:', err.message);
  process.exit(1);
}).connect({
  host: '172.18.247.252',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
