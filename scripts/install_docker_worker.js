import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Installing docker.io on atc-web-worker-01...');
  
  const cmd = `
    echo root | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
    echo root | sudo -S systemctl enable --now docker
    echo root | sudo -S usermod -aG docker ubuntu
    docker --version
    echo root | sudo -S docker ps
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`Docker installation finished with exit code: ${code}`);
      conn.end();
      process.exit(code);
    });
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
  });
});

conn.connect({
  host: '172.27.47.192',
  port: 22,
  username: 'ubuntu',
  password: 'root',
  readyTimeout: 10000,
});
