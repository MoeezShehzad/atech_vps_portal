const { Client } = require('ssh2');

const UBUNTU_HOST = process.env.UBUNTU_HOST || '172.21.39.51';
const UBUNTU_PORT = 22;
const UBUNTU_USER = 'ubuntu';
const UBUNTU_PASS = 'root';

console.log(`Connecting to ${UBUNTU_HOST}:${UBUNTU_PORT}...`);

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection established! Starting Docker & guacd setup...');

  // 1. Install Docker if missing
  // 2. Start Docker service
  // 3. Pull and run guacamole/guacd with restart=always on port 4822
  const bashScript = `
    set -e
    echo "[1/4] Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
      echo "Installing docker.io..."
      echo root | sudo -S DEBIAN_FRONTEND=noninteractive apt-get update -y
      echo root | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
      echo root | sudo -S systemctl enable --now docker
      echo root | sudo -S usermod -aG docker ${UBUNTU_USER}
    else
      echo "Docker already installed."
      echo root | sudo -S systemctl start docker
    fi

    echo "[2/4] Verifying Docker daemon..."
    echo root | sudo -S docker ps

    echo "[3/4] Pulling and deploying guacamole/guacd..."
    # Remove existing container if any
    echo root | sudo -S docker rm -f guacd 2>/dev/null || true

    # Run guacamole/guacd
    echo root | sudo -S docker run -d \
      --name guacd \
      --restart unless-stopped \
      -p 0.0.0.0:4822:4822 \
      guacamole/guacd:latest

    echo "[4/4] Checking guacd container status..."
    sleep 3
    echo root | sudo -S docker ps --filter "name=guacd"
    echo root | sudo -S docker logs --tail 20 guacd
  `;

  conn.exec(bashScript, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));

    stream.on('close', (code) => {
      console.log(`\nSetup completed with exit code: ${code}`);
      conn.end();
      process.exit(code);
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH Connection Error:', err);
  process.exit(1);
});

conn.connect({
  host: UBUNTU_HOST,
  port: UBUNTU_PORT,
  username: UBUNTU_USER,
  password: UBUNTU_PASS,
  readyTimeout: 15000,
});
