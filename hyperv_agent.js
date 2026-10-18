// ==============================================================================
// Service: hyperv_agent.js
// Purpose: Windows Host Hyper-V Agent - Receives commands from Ubuntu Portal
//          and executes Hyper-V PowerShell scripts directly on Windows Host.
// ==============================================================================

import http from 'http';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client as SSHClient } from 'ssh2';
import net from 'net';
import { sanitizeInfrastructureError } from './lib/errorSanitizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.HYPERV_AGENT_PORT || 5050;
const HOST = '0.0.0.0';
const SCRIPTS_DIR = path.join(__dirname, 'scripts', 'hyperv');
const DEFAULT_TEMPLATE = 'D:\\00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx';

function checkPortOpen(host, port, timeout = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpen = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      isOpen = true;
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function provisionGuestVM({ vmName, adminUsername, adminPassword, sshPublicKey, appId }) {
  console.log(`[GUEST PROVISIONER] Starting background provisioning for VM '${vmName}'${appId ? ` (App: ${appId})` : ''}...`);
  const deadline = Date.now() + 150000; // 2.5 minutes timeout
  let targetIp = null;

  while (Date.now() < deadline) {
    try {
      const status = await runPowerShell('Get-VPS.ps1', { VMName: vmName });
      if (status && status.IPAddresses && status.IPAddresses.length > 0) {
        const found = status.IPAddresses.find((ip) => ip && !ip.includes(':') && ip !== '127.0.0.1');
        if (found) {
          const isOpen = await checkPortOpen(found, 22, 2000);
          if (isOpen) {
            targetIp = found;
            break;
          }
        }
      }
    } catch (e) { }
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (!targetIp) {
    console.warn(`[GUEST PROVISIONER] VM '${vmName}' IP not discovered or port 22 not reachable within timeout.`);
    return;
  }

  console.log(`[GUEST PROVISIONER] VM '${vmName}' is reachable at ${targetIp}:22. Running guest initialization...`);

  const defaultUser = 'ubuntu';
  const defaultPass = 'root';

  return new Promise((resolve) => {
    const conn = new SSHClient();
    conn.on('ready', () => {
      console.log(`[GUEST PROVISIONER] SSH connected to ${targetIp} as ${defaultUser}.`);

      const effectivePass = adminPassword || defaultPass;
      const b64Pass = Buffer.from(effectivePass).toString('base64');
      const safeUser = (adminUsername || defaultUser).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const formattedHostname = targetIp.replace(/\./g, '-');

      let script = `
# 1. First establish passwordless sudo so subsequent operations never fail
echo "${defaultPass}" | sudo -S bash -c "echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/99-ubuntu-nopasswd && chmod 0440 /etc/sudoers.d/99-ubuntu-nopasswd" 2>/dev/null || true

# 2. Disk and partition expansion
sudo growpart /dev/sda 3 2>/dev/null || true
sudo pvresize /dev/sda3 2>/dev/null || true
sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv 2>/dev/null || true

# 3. Hostname setup
sudo hostnamectl set-hostname "${formattedHostname}" 2>/dev/null || true
echo "${formattedHostname}" | sudo tee /etc/hostname >/dev/null 2>&1 || true
sudo sed -i 's/127.0.1.1.*/127.0.1.1 ${formattedHostname}/g' /etc/hosts 2>/dev/null || true
echo "127.0.0.1 ${formattedHostname}" | sudo tee -a /etc/hosts >/dev/null 2>&1 || true

# 4. User and password synchronization
P=\$(echo '${b64Pass}' | base64 -d)
echo "ubuntu:\$P" | sudo chpasswd
echo "root:\$P" | sudo chpasswd

# 5. Ensure SSH password authentication is enabled
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config 2>/dev/null || true
sudo sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config.d/*.conf 2>/dev/null || true
sudo systemctl reload ssh 2>/dev/null || sudo systemctl restart ssh 2>/dev/null || true
`;

      if (safeUser !== 'ubuntu' && safeUser !== 'root') {
        script += `
id -u ${safeUser} 2>/dev/null || sudo useradd -m -s /bin/bash -G sudo ${safeUser}
echo "${safeUser}:\$P" | sudo chpasswd
echo "${safeUser} ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/99-${safeUser}-nopasswd >/dev/null && sudo chmod 0440 /etc/sudoers.d/99-${safeUser}-nopasswd
`;
      }

      if (sshPublicKey && sshPublicKey.trim()) {
        const cleanKey = sshPublicKey.trim().replace(/"/g, '\\"');
        const userHome = safeUser === 'root' ? '/root' : `/home/${safeUser}`;
        script += `
sudo mkdir -p ${userHome}/.ssh && sudo chmod 700 ${userHome}/.ssh
echo "${cleanKey}" | sudo tee -a ${userHome}/.ssh/authorized_keys >/dev/null
sudo chmod 600 ${userHome}/.ssh/authorized_keys
sudo chown -R ${safeUser}:${safeUser} ${userHome}/.ssh 2>/dev/null || true
sudo mkdir -p /root/.ssh && sudo chmod 700 /root/.ssh
echo "${cleanKey}" | sudo tee -a /root/.ssh/authorized_keys >/dev/null
sudo chmod 600 /root/.ssh/authorized_keys
`;
      }

      conn.exec(script, (err, stream) => {
        if (err) {
          console.error(`[GUEST PROVISIONER ERROR] Exec failed:`, err.message);
          conn.end();
          return resolve();
        }
        stream.on('data', (d) => console.log(`[GUEST STDOUT] ${d.toString().trim()}`));
        stream.stderr.on('data', (d) => console.warn(`[GUEST STDERR] ${d.toString().trim()}`));
        stream.on('close', (code) => {
          console.log(`[GUEST PROVISIONER DONE] VM '${vmName}' guest configuration finished with code ${code}.`);
          conn.end();
          resolve();
        });
      });
    });

    conn.on('error', (err) => {
      console.warn(`[GUEST PROVISIONER] SSH initial connection failed (${err.message}). Trying user ${adminUsername}...`);
      // If default credentials failed, perhaps user was already provisioned
      conn.end();
      resolve();
    });

    conn.connect({
      host: targetIp,
      port: 22,
      username: defaultUser,
      password: defaultPass,
      readyTimeout: 10000,
    });
  });
}

function runPowerShell(scriptName, params = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const paramList = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `-${k} "${v}"`)
      .join(' ');

    const cmd = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${scriptPath}" ${paramList}`;
    console.log(`[AGENT EXEC] ${cmd}`);

    exec(cmd, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      console.log(`[AGENT STDOUT]\n${stdout}`);
      if (stderr) console.warn(`[AGENT STDERR]\n${stderr}`);

      if (err) {
        console.error(`[AGENT ERROR] ${err.message}`);
        return reject({ error: err.message, stderr, stdout });
      }

      // Try parsing JSON from script output (array or object)
      try {
        const jsonMatch = stdout.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
          return resolve(JSON.parse(jsonMatch[0]));
        }
      } catch (e) {
        // Fall back to raw output
      }
      resolve({ status: 'SUCCESS', output: stdout });
    });
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

let bulkStatusCache = { data: null, timestamp: 0 };
let bulkStatusPromise = null;
const metricsCache = new Map();

function invalidateAgentCaches() {
  bulkStatusCache = { data: null, timestamp: 0 };
  bulkStatusPromise = null;
  metricsCache.clear();
}

async function getCachedStatus(vmName) {
  const now = Date.now();
  if (vmName) {
    if (bulkStatusCache.data && now - bulkStatusCache.timestamp < 3500) {
      let list = Array.isArray(bulkStatusCache.data) ? bulkStatusCache.data : [bulkStatusCache.data];
      const match = list.find((v) => v && v.VMName && v.VMName.toLowerCase() === vmName.toLowerCase());
      if (match) return match;
    }
    return await runPowerShell('Get-VPS.ps1', { VMName: vmName });
  }

  // Bulk query (all VMs)
  if (bulkStatusCache.data && now - bulkStatusCache.timestamp < 3500) {
    return bulkStatusCache.data;
  }

  if (bulkStatusPromise) {
    return await bulkStatusPromise;
  }

  bulkStatusPromise = (async () => {
    try {
      const result = await runPowerShell('Get-VPS.ps1', { VMName: '' });
      bulkStatusCache = { data: result, timestamp: Date.now() };
      return result;
    } finally {
      bulkStatusPromise = null;
    }
  })();

  return await bulkStatusPromise;
}

async function getCachedMetrics(vmName) {
  const now = Date.now();
  const cached = metricsCache.get(vmName.toLowerCase());
  if (cached && now - cached.timestamp < 3000) {
    return cached.data;
  }
  const result = await runPowerShell('Get-Metrics.ps1', { VMName: vmName });
  metricsCache.set(vmName.toLowerCase(), { data: result, timestamp: Date.now() });
  return result;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(`[AGENT REQ] ${req.method} ${pathname}`);

  try {
    // 1. Health check
    if (pathname === '/health' || pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          status: 'ok',
          service: 'ATECH Windows Hyper-V Host Agent',
          platform: process.platform,
          arch: process.arch,
          timestamp: new Date().toISOString(),
        })
      );
    }

    // 2. Provision VM
    if (req.method === 'POST' && pathname === '/api/hyperv/create') {
      const data = await parseJsonBody(req);
      const vmName = data.vmName;
      if (!vmName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName is required' }));
      }

      const result = await runPowerShell('Create-VPS.ps1', {
        VMName: vmName,
        RAMMB: data.ramMb || 2048,
        CPUCount: data.cpuCount || 2,
        DiskGB: data.diskGb || 40,
        AdminUsername: data.adminUsername || 'ubuntu',
        AdminPassword: data.adminPassword || '',
        SSHPublicKey: data.sshPublicKey || '',
        TemplatePath: data.templatePath || DEFAULT_TEMPLATE,
        SwitchName: data.switchName || 'Default Switch',
      });

      // Asynchronously provision guest OS in background
      provisionGuestVM({
        vmName,
        adminUsername: data.adminUsername || 'ubuntu',
        adminPassword: data.adminPassword || '',
        sshPublicKey: data.sshPublicKey || '',
        appId: data.appId || '',
      }).catch((e) => console.error('[GUEST PROVISION ASYNC ERROR]:', e));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 3. Power Action
    if (req.method === 'POST' && pathname === '/api/hyperv/power') {
      const data = await parseJsonBody(req);
      const { vmName, action } = data;
      if (!vmName || !action) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName and action are required' }));
      }

      invalidateAgentCaches();
      const result = await runPowerShell('Power-VPS.ps1', {
        VMName: vmName,
        Action: action.toUpperCase(),
      });
      invalidateAgentCaches();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 4. Resize Hardware Specs
    if (req.method === 'POST' && pathname === '/api/hyperv/resize') {
      const data = await parseJsonBody(req);
      const { vmName, ramMb, cpuCount, diskGb } = data;
      if (!vmName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName is required' }));
      }

      invalidateAgentCaches();
      const result = await runPowerShell('Resize-VPS.ps1', {
        VMName: vmName,
        RAMMB: ramMb || 0,
        CPUCount: cpuCount || 0,
        DiskGB: diskGb || 0,
      });
      invalidateAgentCaches();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 5. Destroy VM
    if (req.method === 'POST' && pathname === '/api/hyperv/destroy') {
      const data = await parseJsonBody(req);
      const { vmName } = data;
      if (!vmName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName is required' }));
      }

      invalidateAgentCaches();
      const result = await runPowerShell('Destroy-VPS.ps1', {
        VMName: vmName,
      });
      invalidateAgentCaches();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 6. Live Status
    if (req.method === 'GET' && pathname === '/api/hyperv/status') {
      const vmName = url.searchParams.get('vmName') || '';
      const result = await getCachedStatus(vmName);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 7. Live Telemetry & Resource Metrics (CPU, RAM, Disk, IO)
    if (req.method === 'GET' && pathname === '/api/hyperv/metrics') {
      const vmName = url.searchParams.get('vmName') || '';
      if (!vmName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName query param is required' }));
      }
      const result = await getCachedMetrics(vmName);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 8. Snapshots (CREATE, LIST, RESTORE, DELETE)
    if (pathname === '/api/hyperv/snapshot') {
      if (req.method === 'GET') {
        const vmName = url.searchParams.get('vmName');
        if (!vmName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'vmName is required' }));
        }
        const result = await runPowerShell('Snapshot-VPS.ps1', {
          VMName: vmName,
          Action: 'LIST',
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      }

      if (req.method === 'POST') {
        const data = await parseJsonBody(req);
        const { vmName, action, snapshotName } = data;
        if (!vmName || !action) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'vmName and action are required' }));
        }
        const result = await runPowerShell('Snapshot-VPS.ps1', {
          VMName: vmName,
          Action: action.toUpperCase(),
          SnapshotName: snapshotName || '',
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      }
    }

    // 9. Reset Guest Admin Password
    if (req.method === 'POST' && pathname === '/api/hyperv/reset-password') {
      const data = await parseJsonBody(req);
      const { vmName, adminUsername, newPassword, currentPassword } = data;
      if (!vmName || !newPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName and newPassword are required' }));
      }

      // Provision new password to guest OS
      await provisionGuestVM({
        vmName,
        adminUsername: adminUsername || 'ubuntu',
        adminPassword: newPassword,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'SUCCESS', message: 'Password updated on guest VM' }));
    }

    // 10. Rebuild VM (Destroy old disk & recreate from master template)
    if (req.method === 'POST' && pathname === '/api/hyperv/rebuild') {
      const data = await parseJsonBody(req);
      const { vmName, ramMb, cpuCount, diskGb, templatePath, adminUsername, adminPassword, sshPublicKey } = data;
      if (!vmName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'vmName is required' }));
      }

      try {
        await runPowerShell('Destroy-VPS.ps1', { VMName: vmName });
      } catch (e) {
        console.warn(`[REBUILD] VM destroy warning:`, e.message);
      }

      const result = await runPowerShell('Create-VPS.ps1', {
        VMName: vmName,
        RAMMB: ramMb || 2048,
        CPUCount: cpuCount || 2,
        DiskGB: diskGb || 40,
        AdminUsername: adminUsername || 'ubuntu',
        AdminPassword: adminPassword || '',
        SSHPublicKey: sshPublicKey || '',
        TemplatePath: templatePath || DEFAULT_TEMPLATE,
        SwitchName: data.switchName || 'Default Switch',
      });

      provisionGuestVM({
        vmName,
        adminUsername: adminUsername || 'ubuntu',
        adminPassword: adminPassword || '',
        sshPublicKey: sshPublicKey || '',
      }).catch((e) => console.error('[GUEST REBUILD PROVISION ERROR]:', e));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (error) {
    console.error(`[AGENT HANDLER ERROR]`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    const rawMsg = error.error || error.message || 'Host execution failed';
    res.end(JSON.stringify({ error: sanitizeInfrastructureError(rawMsg) }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`================================================================`);
  console.log(`[HYPER-V AGENT] Running on http://${HOST}:${PORT}`);
  console.log(`[HYPER-V AGENT] Ready to receive commands from Ubuntu Portal`);
  console.log(`[HYPER-V AGENT] Master Template Path: ${DEFAULT_TEMPLATE}`);
  console.log(`================================================================`);

  // Forward localhost:5000 and localhost:5174 to Ubuntu VM for Google OAuth & local portal access
  const VM_IP = process.env.UBUNTU_VM_IP || '172.20.208.223';
  [5000, 5174].forEach((fwdPort) => {
    try {
      const bridge = net.createServer((socket) => {
        const target = net.connect(fwdPort, VM_IP);
        socket.pipe(target);
        target.pipe(socket);
        socket.on('error', () => { });
        target.on('error', () => { });
      });
      bridge.on('error', () => { }); // Port already forwarded or in use
      bridge.listen(fwdPort, '127.0.0.1', () => {
        console.log(`[PORT BRIDGE] Forwarding localhost:${fwdPort} -> ${VM_IP}:${fwdPort}`);
      });
    } catch (_) { }
  });
});
