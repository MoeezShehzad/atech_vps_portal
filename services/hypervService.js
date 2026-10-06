// ==============================================================================
// Service: hypervService.js
// Purpose: Hyper-V Orchestrator - Connects Ubuntu backend to Windows Host Agent
//          to execute real PowerShell cmdlets in Hyper-V on Windows.
// ==============================================================================

import prisma from '../lib/prisma.js';

// Try both default gateway (172.25.80.1) and Wi-Fi host IP (192.168.100.92)
const HOST_CANDIDATES = [
  process.env.HYPERV_AGENT_URL,
  'http://172.25.80.1:5050',
  'http://192.168.100.92:5050',
].filter(Boolean);

const DEFAULT_ISO = 'D:\\00_Master_Template\\ubuntu-22.04.5-live-server-amd64.iso';

class HyperVService {
  /**
   * Helper to dispatch commands to the Windows Host Hyper-V Agent via HTTP.
   * Tries candidate IPs and returns real Hyper-V execution result.
   */
  async dispatchToHost(endpoint, method = 'POST', body = null) {
    let lastError = null;

    for (const baseUrl of HOST_CANDIDATES) {
      const url = `${baseUrl}${endpoint}`;
      try {
        console.log(`[HYPER-V DISPATCH] -> ${method} ${url}`, body || '');

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(180000), // 3 min timeout for VM provisioning
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errMsg = data.error || data.stderr || `Host Agent returned HTTP ${response.status}`;
          if (errMsg.includes('permission') || errMsg.includes('authorization policy') || errMsg.includes('Access is denied')) {
            throw new Error(`Hyper-V Permission Denied on Windows: The Host Agent must be running as Administrator. Please right-click start_hyperv_agent.bat on Windows and choose 'Run as administrator'.`);
          }
          throw new Error(errMsg);
        }

        console.log(`[HYPER-V HOST SUCCESS] Response from ${baseUrl}:`, data);
        return data;
      } catch (err) {
        lastError = err;
        console.warn(`[HYPER-V DISPATCH FAILED on ${baseUrl}]:`, err.message);
        // If it's a permission denied error, stop trying other IPs - it's a Windows privilege issue
        if (err.message.includes('Hyper-V Permission Denied')) {
          throw err;
        }
      }
    }

    // If all hosts were unreachable
    console.error(`[HYPER-V HOST UNREACHABLE] Could not connect to Windows Host Agent on any candidate URL.`);
    throw new Error(`Windows Hyper-V Host Agent is not reachable at 172.25.80.1:5050 or 192.168.100.92:5050. Please double-click start_hyperv_agent.bat on Windows to start it.`);
  }

  /**
   * Provision a new Virtual Machine on Windows Hyper-V.
   */
  async createVM({ vmId, vmName, cpuCores, ramGb, storageGb, templatePath, switchName = 'Default Switch' }) {
    const ramMb = ramGb * 1024;
    console.log(`[HYPER-V] Provisioning VM: ${vmName} (${cpuCores} vCPU, ${ramGb}GB RAM, ${storageGb}GB Disk)`);

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
        templatePath: templatePath || DEFAULT_ISO,
        switchName,
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
}

export default new HyperVService();
