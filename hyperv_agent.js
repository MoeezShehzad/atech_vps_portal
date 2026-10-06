// ==============================================================================
// Service: hyperv_agent.js
// Purpose: Windows Host Hyper-V Agent - Receives commands from Ubuntu Portal
//          and executes Hyper-V PowerShell scripts directly on Windows Host.
// ==============================================================================

import http from 'http';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.HYPERV_AGENT_PORT || 5050;
const HOST = '0.0.0.0';
const SCRIPTS_DIR = path.join(__dirname, 'scripts', 'hyperv');
const DEFAULT_TEMPLATE = 'D:\\00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx';

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
        TemplatePath: data.templatePath || DEFAULT_TEMPLATE,
        SwitchName: data.switchName || 'Default Switch',
      });

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

      const result = await runPowerShell('Power-VPS.ps1', {
        VMName: vmName,
        Action: action.toUpperCase(),
      });

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

      const result = await runPowerShell('Resize-VPS.ps1', {
        VMName: vmName,
        RAMMB: ramMb || 0,
        CPUCount: cpuCount || 0,
        DiskGB: diskGb || 0,
      });

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

      const result = await runPowerShell('Destroy-VPS.ps1', {
        VMName: vmName,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 6. Live Status
    if (req.method === 'GET' && pathname === '/api/hyperv/status') {
      const vmName = url.searchParams.get('vmName') || '';
      const result = await runPowerShell('Get-VPS.ps1', { VMName: vmName });
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
      const result = await runPowerShell('Get-Metrics.ps1', { VMName: vmName });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (error) {
    console.error(`[AGENT HANDLER ERROR]`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.error || error.message || 'Host execution failed', details: error }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`================================================================`);
  console.log(`[HYPER-V AGENT] Running on http://${HOST}:${PORT}`);
  console.log(`[HYPER-V AGENT] Ready to receive commands from Ubuntu Portal`);
  console.log(`[HYPER-V AGENT] Master Template Path: ${DEFAULT_TEMPLATE}`);
  console.log(`================================================================`);
});
