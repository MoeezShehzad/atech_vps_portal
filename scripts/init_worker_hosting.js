import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Initializing ATC Web Hosting Core on atc-web-worker-01...');
  
  const setupScript = `
    echo root | sudo -S bash -c 'echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu && chmod 0440 /etc/sudoers.d/ubuntu'
    
    # Create required directories
    sudo mkdir -p /var/atc/mariadb /var/atc/sites /var/atc/proxy/conf.d /var/atc/proxy/ssl
    sudo chown -R ubuntu:ubuntu /var/atc

    # Create Docker Network if not exists
    sudo docker network create atc-net 2>/dev/null || true

    # Deploy Tuned Lightweight MariaDB for all tenants (64MB buffer pool for high density)
    if ! sudo docker ps -a --format '{{.Names}}' | grep -q '^atc-mariadb$'; then
      sudo docker run -d \\
        --name atc-mariadb \\
        --restart always \\
        --network atc-net \\
        -v /var/atc/mariadb:/var/lib/mysql \\
        -e MARIADB_ROOT_PASSWORD='ATC_SuperSecretMariaDb2026!' \\
        mariadb:10.11 \\
        --innodb-buffer-pool-size=64M \\
        --key-buffer-size=16M \\
        --max-connections=200
      echo "Started atc-mariadb container"
    else
      echo "atc-mariadb already exists"
    fi

    # Create base reverse proxy nginx config
    cat << 'EOF' | sudo tee /var/atc/proxy/nginx.conf
user  nginx;
worker_processes  auto;
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 100M;

    # Default catch-all page for ATC Cloud
    server {
        listen 80 default_server;
        server_name _;

        location / {
            default_type text/html;
            return 200 '<!DOCTYPE html><html><head><title>ATC Cloud Managed Hosting</title><style>body{font-family:system-ui;background:#090d16;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}h1{color:#38bdf8;font-size:2rem;}p{color:#94a3b8;}</style></head><body><div style="text-align:center;"><h1>ATC Cloud Web Server</h1><p>Active and ready to serve tenant sites.</p></div></body></html>';
        }
    }

    # Include tenant virtual hosts
    include /etc/nginx/conf.d/*.conf;
}
EOF

    # Deploy ATC Reverse Proxy container
    if ! sudo docker ps -a --format '{{.Names}}' | grep -q '^atc-proxy$'; then
      sudo docker run -d \\
        --name atc-proxy \\
        --restart always \\
        --network atc-net \\
        -p 80:80 \\
        -p 443:443 \\
        -v /var/atc/proxy/nginx.conf:/etc/nginx/nginx.conf:ro \\
        -v /var/atc/proxy/conf.d:/etc/nginx/conf.d \\
        -v /var/atc/proxy/ssl:/etc/nginx/ssl:ro \\
        nginx:alpine
      echo "Started atc-proxy container"
    else
      echo "atc-proxy already exists"
    fi

    sudo docker ps
  `;

  conn.exec(setupScript, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`Core hosting stack initialized with exit code: ${code}`);
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
