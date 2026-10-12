import { Client } from 'ssh2';
import path from 'path';

const WORKER_HOST = process.env.ATC_WORKER_HOST || '172.27.47.192';
const WORKER_PORT = parseInt(process.env.ATC_WORKER_PORT || '22', 10);
const WORKER_USER = process.env.ATC_WORKER_USER || 'ubuntu';
const WORKER_PASS = process.env.ATC_WORKER_PASS || 'root';

/**
 * Execute command on worker VM via SSH
 */
export function runOnWorker(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let stdout = '';
        let stderr = '';
        stream.on('data', (d) => { stdout += d.toString(); });
        stream.stderr.on('data', (d) => { stderr += d.toString(); });
        stream.on('close', (code) => {
          conn.end();
          resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
        });
      });
    });
    conn.on('error', (err) => {
      reject(err);
    });
    conn.connect({
      host: WORKER_HOST,
      port: WORKER_PORT,
      username: WORKER_USER,
      password: WORKER_PASS,
      readyTimeout: 10000,
    });
  });
}

/**
 * Provision tenant website and container on worker VM
 */
export async function createTenantSite(site) {
  const siteDir = `/var/atc/sites/site_${site.id}/public_html`;
  const domainName = site.domain;
  const customDomain = site.customDomain ? site.customDomain.trim() : '';
  const serverNames = [domainName, customDomain].filter(Boolean).join(' ');

  // 1. Create directory structure
  await runOnWorker(`sudo mkdir -p "${siteDir}" && sudo chown -R 33:33 "${siteDir}" 2>/dev/null || sudo chown -R ubuntu:ubuntu "${siteDir}"`);

  // 2. Configure Nginx Virtual Host
  const vhostConfig = `
server {
    listen 80;
    server_name ${serverNames};

    client_max_body_size 100M;

    location / {
        proxy_pass http://site_${site.id}:80;
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
`.trim();

  await runOnWorker(`echo "${Buffer.from(vhostConfig).toString('base64')}" | base64 -d | sudo tee /var/atc/proxy/conf.d/site_${site.id}.conf`);

  // 3. Provision by app type
  if (site.appType === 'WORDPRESS') {
    // Create MySQL database & user inside shared atc-mariadb
    const sqlCmd = `
      CREATE DATABASE IF NOT EXISTS \\\`${site.dbName}\\\`;
      CREATE USER IF NOT EXISTS '${site.dbUser}'@'%' IDENTIFIED BY '${site.dbPass}';
      GRANT ALL PRIVILEGES ON \\\`${site.dbName}\\\`.* TO '${site.dbUser}'@'%';
      FLUSH PRIVILEGES;
    `;
    await runOnWorker(`docker exec -i atc-mariadb mariadb -uroot -pATC_SuperSecretMariaDb2026! -e "${sqlCmd.replace(/\n/g, ' ')}"`);

    // Run WordPress container with tight resource bounds (192MB RAM, 0.75 CPU limit)
    await runOnWorker(`
      docker run -d \\
        --name site_${site.id} \\
        --restart unless-stopped \\
        --network atc-net \\
        --memory=192m \\
        --cpus=0.75 \\
        -v ${siteDir}:/var/www/html \\
        -e WORDPRESS_DB_HOST=atc-mariadb \\
        -e WORDPRESS_DB_USER=${site.dbUser} \\
        -e WORDPRESS_DB_PASSWORD=${site.dbPass} \\
        -e WORDPRESS_DB_NAME=${site.dbName} \\
        wordpress:php8.2-apache
    `);
  } else {
    // Static HTML / Custom Web App
    const defaultIndex = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${site.name} - Hosted on ATC Cloud</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 48px; max-width: 540px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-top: 0; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">ATC Cloud Web Hosting</div>
    <h1>${site.name} is Live!</h1>
    <p>Your website is successfully deployed and running in an isolated container sandbox on ATC Cloud high-performance infrastructure.</p>
    <p style="font-size: 13px; color: #64748b;">Manage your files and configuration instantly through the ATC Portal Dashboard.</p>
  </div>
</body>
</html>`;

    await runOnWorker(`echo "${Buffer.from(defaultIndex).toString('base64')}" | base64 -d | sudo tee ${siteDir}/index.html`);

    // Run ultra-lightweight Nginx container (32MB RAM)
    await runOnWorker(`
      docker run -d \\
        --name site_${site.id} \\
        --restart unless-stopped \\
        --network atc-net \\
        --memory=32m \\
        --cpus=0.25 \\
        -v ${siteDir}:/usr/share/nginx/html:ro \\
        nginx:alpine
    `);
  }

  // 4. Reload reverse proxy so changes take effect instantly
  await runOnWorker(`docker exec atc-proxy nginx -s reload`);
  return { success: true };
}

/**
 * Stop/Start/Restart container on worker VM
 */
export async function controlTenantSite(siteId, action) {
  const allowed = ['start', 'stop', 'restart'];
  if (!allowed.includes(action)) throw new Error('Invalid action');
  const res = await runOnWorker(`docker ${action} site_${siteId}`);
  return res;
}

/**
 * Remove tenant website, container, DB and virtual host
 */
export async function removeTenantSite(site) {
  // Stop & remove container
  await runOnWorker(`docker rm -f site_${site.id} 2>/dev/null || true`);
  // Remove vhost & reload proxy
  await runOnWorker(`sudo rm -f /var/atc/proxy/conf.d/site_${site.id}.conf && docker exec atc-proxy nginx -s reload 2>/dev/null || true`);
  // Drop database if WordPress
  if (site.appType === 'WORDPRESS' && site.dbName) {
    await runOnWorker(`docker exec -i atc-mariadb mariadb -uroot -pATC_SuperSecretMariaDb2026! -e "DROP DATABASE IF EXISTS \\\`${site.dbName}\\\`; DROP USER IF EXISTS '${site.dbUser}'@'%';" 2>/dev/null || true`);
  }
  // Remove files
  await runOnWorker(`sudo rm -rf /var/atc/sites/site_${site.id} 2>/dev/null || true`);
  return { success: true };
}

/**
 * List files for a site in public_html
 */
export async function listSiteFiles(siteId, relPath = '') {
  // Prevent directory traversal
  const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const targetDir = `/var/atc/sites/site_${siteId}/public_html/${cleanPath}`.replace(/\/+/g, '/');

  const cmd = `python3 -c "
import os, json, sys
p = sys.argv[1]
if not os.path.exists(p):
    print(json.dumps([]))
    sys.exit(0)
res = []
for entry in os.scandir(p):
    try:
        st = entry.stat()
        res.append({
            'name': entry.name,
            'isDirectory': entry.is_dir(),
            'size': st.st_size,
            'modified': int(st.st_mtime * 1000)
        })
    except:
        pass
print(json.dumps(sorted(res, key=lambda x: (not x['isDirectory'], x['name'].lower()))))
" "${targetDir}"`;

  const { stdout } = await runOnWorker(cmd);
  try {
    return JSON.parse(stdout || '[]');
  } catch (_) {
    return [];
  }
}

/**
 * Read file content
 */
export async function readSiteFile(siteId, relPath) {
  const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const targetFile = `/var/atc/sites/site_${siteId}/public_html/${cleanPath}`.replace(/\/+/g, '/');
  const { stdout, code } = await runOnWorker(`cat "${targetFile}"`);
  if (code !== 0) throw new Error('File not found or permission denied');
  return stdout;
}

/**
 * Write file content
 */
export async function writeSiteFile(siteId, relPath, content) {
  const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const targetFile = `/var/atc/sites/site_${siteId}/public_html/${cleanPath}`.replace(/\/+/g, '/');
  const b64 = Buffer.from(content).toString('base64');
  await runOnWorker(`echo "${b64}" | base64 -d | sudo tee "${targetFile}" > /dev/null`);
  return { success: true };
}

/**
 * Delete file or directory
 */
export async function deleteSiteFile(siteId, relPath) {
  const cleanPath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  if (!cleanPath || cleanPath === '.' || cleanPath === '/') {
    throw new Error('Cannot delete root public_html directory');
  }
  const target = `/var/atc/sites/site_${siteId}/public_html/${cleanPath}`.replace(/\/+/g, '/');
  await runOnWorker(`sudo rm -rf "${target}"`);
  return { success: true };
}
