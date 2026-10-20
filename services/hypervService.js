// ==============================================================================
// Service: hypervService.js
// Purpose: Hyper-V Orchestrator - Connects Ubuntu backend to Windows Host Agent
//          to execute real PowerShell cmdlets in Hyper-V on Windows.
// ==============================================================================

import fs from 'fs';
import prisma from '../lib/prisma.js';

// Dynamically determine the Windows Host default gateway from Linux routing table
function getLinuxDefaultGateway() {
  try {
    if (process.platform === 'linux' && fs.existsSync('/proc/net/route')) {
      const routeData = fs.readFileSync('/proc/net/route', 'utf8');
      const lines = routeData.trim().split('\n');
      for (const line of lines) {
        const fields = line.split('\t');
        if (fields[1] === '00000000' && fields[2]) {
          const hex = fields[2];
          const parts = [
            parseInt(hex.substring(6, 8), 16),
            parseInt(hex.substring(4, 6), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(0, 2), 16),
          ];
          return parts.join('.');
        }
      }
    }
  } catch (_) {}
  return null;
}

const detectedGw = getLinuxDefaultGateway();
const gwHost = detectedGw ? `http://${detectedGw}:5050` : null;

// Host agent candidates (prioritize direct Windows host gateway on Hyper-V Default Switch)
const PRIMARY_HOST = process.env.HYPERV_HOST_URL || process.env.HYPERV_AGENT_URL || gwHost || 'http://172.18.240.1:5050';
const HOST_CANDIDATES = [
  PRIMARY_HOST,
  gwHost,
  'http://172.18.240.1:5050',
  'http://172.27.32.1:5050',
  'http://localhost:5050',
  'http://127.0.0.1:5050',
].filter((v, i, a) => v && a.indexOf(v) === i);

const DEFAULT_TEMPLATE = 'D:\\00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx';

class HyperVService {
  constructor() {
    this.activeHost = PRIMARY_HOST;
    this.lastHostCheck = 0;
  }

  /**
   * Fast pre-flight check to verify which host agent is reachable.
   * Prevents long hangs if the host agent is offline.
   */
  async findReachableHost() {
    if (this.activeHost && Date.now() - this.lastHostCheck < 15000) {
      return this.activeHost;
    }

    const dynGw = getLinuxDefaultGateway();
    const dynGwUrl = dynGw ? `http://${dynGw}:5050` : null;

    const candidates = [
      this.activeHost,
      dynGwUrl,
      ...HOST_CANDIDATES.filter((h) => h !== this.activeHost)
    ].filter(Boolean);

    for (const host of candidates) {
      try {
        const ping = await fetch(`${host}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        if (ping.ok) {
          this.activeHost = host;
          this.lastHostCheck = Date.now();
          return host;
        }
      } catch (_) {}
    }

    return null;
  }

  async isHostReachable() {
    const host = await this.findReachableHost();
    return Boolean(host);
  }

  /**
   * Helper to dispatch commands to the Windows Host Hyper-V Agent via HTTP.
   * Uses cached active host for fast execution and dynamic timeouts.
   */
  async dispatchToHost(endpoint, method = 'POST', body = null) {
    const isLongOp = endpoint.includes('/create') || endpoint.includes('/rebuild');
    const isMediumOp = endpoint.includes('/destroy') || endpoint.includes('/power') || endpoint.includes('/resize');
    const timeoutMs = isLongOp ? 180000 : (isMediumOp ? 60000 : 25000);

    const host = await this.findReachableHost();
    if (!host) {
      console.error(`[HYPER-V HOST UNREACHABLE] Could not connect to Windows Host Agent on ${PRIMARY_HOST}`);
      throw new Error(`Windows Hyper-V Host Agent is offline or unreachable at 172.27.32.1:5050. Please ensure hyperv_agent.js is running on the Windows host.`);
    }

    const url = `${host}${endpoint}`;
    try {
      console.log(`[HYPER-V DISPATCH] -> ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data.error || data.stderr || `Host Agent returned HTTP ${response.status}`;
        if (errMsg.includes('permission') || errMsg.includes('authorization policy') || errMsg.includes('Access is denied')) {
          throw new Error(`Hyper-V Permission Denied on Windows: Host Agent requires Administrator privileges.`);
        }
        throw new Error(errMsg);
      }

      this.lastHostCheck = Date.now();
      return data;
    } catch (err) {
      this.lastHostCheck = 0; // force re-probe on next request
      console.warn(`[HYPER-V DISPATCH NOTICE] ${url}: ${err.message}`);
      if (err.message.includes('Hyper-V Permission Denied')) {
        throw err;
      }
      throw err;
    }
  }

  /**
   * Provision a new Virtual Machine on Windows Hyper-V.
   */
  async createVM({ vmId, vmName, cpuCores, ramGb, storageGb, templatePath, switchName = 'External_vSwitch', adminUsername = 'ubuntu', adminPassword = '', sshPublicKey = '', appId = '' }) {
    const ramMb = ramGb * 1024;
    console.log(`[HYPER-V] Provisioning VM: ${vmName} (${cpuCores} vCPU, ${ramGb}GB RAM, ${storageGb}GB Disk, user: ${adminUsername}, app: ${appId || 'none'})`);

    // Record Provisioning Job in Database
    const job = await prisma.provisioningJob.create({
      data: {
        vmId: Number(vmId),
        jobType: 'CREATE',
        status: 'RUNNING',
        currentStep: 'Sending command to Windows Hyper-V Host',
        startedAt: new Date(),
      },
    });

    try {
      // Dispatch to Windows Host Agent
      const result = await this.dispatchToHost('/api/hyperv/create', 'POST', {
        vmName,
        ramMb,
        cpuCount: cpuCores,
        diskGb: storageGb,
        templatePath: templatePath || DEFAULT_TEMPLATE,
        switchName,
        adminUsername,
        adminPassword,
        sshPublicKey,
        appId,
      });

      // Update Provisioning Job as completed
      await prisma.provisioningJob.update({
        where: { jobId: job.jobId },
        data: {
          status: 'COMPLETED',
          currentStep: 'Provisioned in Hyper-V and started',
          completedAt: new Date(),
        },
      });

      // Update VM status in DB
      await prisma.virtualMachine.update({
        where: { vmId: Number(vmId) },
        data: {
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          hypervVmId: result.VMId || `hyp-${Date.now()}`,
          startedAt: new Date(),
        },
      });

      return result;
    } catch (err) {
      console.error(`[HYPER-V PROVISIONING FAILED] VM ${vmName}:`, err.message);

      await prisma.provisioningJob.update({
        where: { jobId: job.jobId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });

      await prisma.virtualMachine.update({
        where: { vmId: Number(vmId) },
        data: {
          status: 'FAILED',
          provisioningStatus: 'FAILED',
          provisioningError: err.message,
        },
      });

      throw err;
    }
  }

  /**
   * Power action: START, STOP, RESTART, FORCE_STOP
   */
  async executePowerAction(vmName, action) {
    console.log(`[HYPER-V] Executing power action '${action}' on VM: ${vmName}`);
    return await this.dispatchToHost('/api/hyperv/power', 'POST', {
      vmName,
      action: action.toUpperCase(),
    });
  }

  // Alias for compatibility
  async controlPower(vmName, action) {
    return await this.executePowerAction(vmName, action);
  }

  /**
   * Resize VM hardware specs (CPU cores and RAM)
   */
  async resizeVM({ vmName, cpuCores, ramGb, storageGb }) {
    const ramMb = ramGb * 1024;
    console.log(`[HYPER-V] Resizing VM ${vmName} -> ${cpuCores} vCPU, ${ramGb}GB RAM`);
    return await this.dispatchToHost('/api/hyperv/resize', 'POST', {
      vmName,
      ramMb,
      cpuCount: cpuCores,
      diskGb: storageGb || 0,
    });
  }

  /**
   * Terminate and destroy VM and its disks on Windows Host.
   */
  async destroyVM(vmName) {
    console.log(`[HYPER-V] Terminating and destroying VM on host: ${vmName}`);
    try {
      return await this.dispatchToHost('/api/hyperv/destroy', 'POST', {
        vmName,
      });
    } catch (err) {
      console.warn(`[HYPER-V DESTROY NOTICE] Host dispatch returned: ${err.message}. Proceeding with DB cleanup.`);
      return { status: 'NOTICE', warning: err.message };
    }
  }

  /**
   * Query live telemetry from Hyper-V (specific VM or all host VMs)
   */
  async getStatus(vmName = '') {
    const qs = vmName ? `?vmName=${encodeURIComponent(vmName)}` : '';
    return await this.dispatchToHost(`/api/hyperv/status${qs}`, 'GET');
  }

  /**
   * Query live detailed resource metrics (CPU, RAM, Disk, IO) from Hyper-V
   */
  async getMetrics(vmName) {
    if (!vmName) throw new Error('vmName is required to query metrics');
    const qs = `?vmName=${encodeURIComponent(vmName)}`;
    return await this.dispatchToHost(`/api/hyperv/metrics${qs}`, 'GET');
  }

  /**
   * Manage Checkpoints/Snapshots: CREATE, LIST, RESTORE, DELETE
   */
  async snapshotAction(vmName, action, snapshotName = '') {
    if (action.toUpperCase() === 'LIST') {
      const qs = `?vmName=${encodeURIComponent(vmName)}`;
      return await this.dispatchToHost(`/api/hyperv/snapshot${qs}`, 'GET');
    }
    return await this.dispatchToHost('/api/hyperv/snapshot', 'POST', {
      vmName,
      action: action.toUpperCase(),
      snapshotName,
    });
  }

  /**
   * Reset Guest OS Admin / Root password
   */
  async resetPassword({ vmName, adminUsername, newPassword }) {
    return await this.dispatchToHost('/api/hyperv/reset-password', 'POST', {
      vmName,
      adminUsername,
      newPassword,
    });
  }

  /**
   * Rebuild VM with clean OS image
   */
  async rebuildVM({ vmName, ramMb, cpuCount, diskGb, templatePath, adminUsername, adminPassword, sshPublicKey }) {
    return await this.dispatchToHost('/api/hyperv/rebuild', 'POST', {
      vmName,
      ramMb,
      cpuCount,
      diskGb,
      templatePath,
      adminUsername,
      adminPassword,
      sshPublicKey,
    });
  }
}

export default new HyperVService();
