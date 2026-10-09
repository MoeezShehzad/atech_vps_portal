// ==============================================================================
// Service: hypervService.js
// Purpose: Hyper-V Orchestrator - Connects Ubuntu backend to Windows Host Agent
//          to execute real PowerShell cmdlets in Hyper-V on Windows.
// ==============================================================================

import prisma from '../lib/prisma.js';

// Host agent candidates (prioritize direct host gateway)
const PRIMARY_HOST = process.env.HYPERV_HOST_URL || process.env.HYPERV_AGENT_URL || 'http://172.19.112.1:5050';
const HOST_CANDIDATES = [
  PRIMARY_HOST,
  'http://172.19.112.1:5050',
  'http://127.0.0.1:5050',
  'http://localhost:5050',
].filter((v, i, a) => v && a.indexOf(v) === i);

const DEFAULT_TEMPLATE = 'D:\\00_Master_Template\\Ubuntu Server 24.04 LTS.vhdx';

class HyperVService {
  constructor() {
    this.activeHost = PRIMARY_HOST;
  }

  /**
   * Helper to dispatch commands to the Windows Host Hyper-V Agent via HTTP.
   * Uses cached active host for fast execution and dynamic timeouts.
   */
  async dispatchToHost(endpoint, method = 'POST', body = null) {
    let lastError = null;

    // Fast timeout for quick operations, extended timeout for disk creation/rebuilding
    const isLongOp = endpoint.includes('/create') || endpoint.includes('/rebuild');
    const isMediumOp = endpoint.includes('/destroy');
    const timeoutMs = isLongOp ? 180000 : (isMediumOp ? 30000 : 10000);

    // Try current active host first
    const candidates = [this.activeHost, ...HOST_CANDIDATES.filter((h) => h !== this.activeHost)];

    for (const baseUrl of candidates) {
      const url = `${baseUrl}${endpoint}`;
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

        // Cache working host
        this.activeHost = baseUrl;
        return data;
      } catch (err) {
        lastError = err;
        console.warn(`[HYPER-V DISPATCH NOTICE] ${baseUrl}${endpoint}: ${err.message}`);
        if (err.message.includes('Hyper-V Permission Denied')) {
          throw err;
        }
      }
    }

    console.error(`[HYPER-V HOST UNREACHABLE] Could not connect to Windows Host Agent on ${PRIMARY_HOST}`);
    throw new Error(`Windows Hyper-V Host Agent is not responding. Please make sure hyperv_agent.js is running on Windows.`);
  }

  /**
   * Provision a new Virtual Machine on Windows Hyper-V.
   */
  async createVM({ vmId, vmName, cpuCores, ramGb, storageGb, templatePath, switchName = 'Default Switch', adminUsername = 'ubuntu', adminPassword = '', sshPublicKey = '' }) {
    const ramMb = ramGb * 1024;
    console.log(`[HYPER-V] Provisioning VM: ${vmName} (${cpuCores} vCPU, ${ramGb}GB RAM, ${storageGb}GB Disk, user: ${adminUsername}, sshKey: ${Boolean(sshPublicKey)})`);

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
