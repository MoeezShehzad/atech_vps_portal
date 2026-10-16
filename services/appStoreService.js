// ==============================================================================
// File: services/appStoreService.js
// Purpose: Enterprise Automation Engine for 1-Click Apps on Hyper-V VMs
// ==============================================================================

import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';
import hypervService from './hypervService.js';
import { APPS_CATALOG, APP_CATEGORIES, getAppById } from '../lib/appsCatalog.js';

// In-memory store for real-time 1-Click installation job progress & console logs
// Key: `${vmId}:${appId}`
const activeInstallJobs = new Map();

export async function listAppCatalog({ category, search }) {
  let list = APPS_CATALOG;

  if (category && category !== 'all') {
    list = list.filter((app) => app.category === category);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        (app.tags && app.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return {
    categories: APP_CATEGORIES,
    total: list.length,
    apps: list.map((app) => ({
      ...app,
      installCommands: app.installCommands || [],
    })),
  };
}

export async function getInstalledAppsForVM(vmId, userId) {
  const vm = await prisma.virtualMachine.findFirst({
    where: { vmId: Number(vmId), userId: Number(userId) },
    include: { ipPool: true },
  });

  if (!vm) {
    throw new Error('Virtual machine not found or unauthorized.');
  }

  const validIpObj = vm.ipPool?.find(
    (ip) => ip.ipAddress && !ip.ipAddress.startsWith('DHCP') && !ip.ipAddress.includes(':') && ip.ipAddress !== '127.0.0.1'
  );
  const vmIp = validIpObj?.ipAddress || 'YOUR_VM_IP';

  // Fetch both INSTALL_APP and UNINSTALL_APP logs from ActivityLog
  const logs = await prisma.activityLog.findMany({
    where: {
      vmId: Number(vmId),
      action: { in: ['INSTALL_APP', 'UNINSTALL_APP'] },
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  });

  const seenAppIds = new Set();
  const installedList = [];

  for (const log of logs) {
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      const appId = details?.appId;
      if (!appId || seenAppIds.has(appId)) continue;
      seenAppIds.add(appId);

      // If the latest completed action for this appId was UNINSTALL_APP, skip it
      if (log.action === 'UNINSTALL_APP') {
        continue;
      }

      const catalogApp = getAppById(appId);
      const port = details.port || catalogApp?.defaultPort || 80;
      const accessUrl =
        details.accessUrl ||
        (port === 80
          ? `http://${vmIp}`
          : port === 443
            ? `https://${vmIp}`
            : `http://${vmIp}:${port}`);
      const guide = catalogApp?.accessGuide
        ? catalogApp.accessGuide.replace(/{IP}/g, vmIp)
        : `Access your application at ${accessUrl}`;

      installedList.push({
        appId,
        appName: details.appName || catalogApp?.name || appId,
        category: catalogApp?.category || 'web-cms',
        version: catalogApp?.version || 'Latest',
        description: catalogApp?.description || '',
        tags: catalogApp?.tags || [],
        installedAt: log.createdAt,
        port,
        accessUrl,
        guide,
        config: details.config || {},
      });
    } catch (e) {
      // Ignore malformed log details
    }
  }

  return installedList;
}

export async function getVMInstallJobs(vmId, userId) {
  const vm = await prisma.virtualMachine.findFirst({
    where: { vmId: Number(vmId), userId: Number(userId) },
  });

  if (!vm) {
    throw new Error('Virtual machine not found or unauthorized.');
  }

  const jobs = [];
  const prefix = `${Number(vmId)}:`;
  for (const [key, job] of activeInstallJobs.entries()) {
    if (key.startsWith(prefix)) {
      jobs.push(job);
    }
  }
  return jobs;
}

export async function uninstallAppFromVM({ vmId, userId, appId }) {
  const vm = await prisma.virtualMachine.findFirst({
    where: { vmId: Number(vmId), userId: Number(userId) },
  });

  if (!vm) {
    throw new Error('Virtual machine not found or unauthorized.');
  }

  const catalogApp = getAppById(appId);
  const jobKey = `${Number(vmId)}:${appId}`;
  activeInstallJobs.delete(jobKey);

  await prisma.activityLog.create({
    data: {
      userId: Number(userId),
      vmId: Number(vmId),
      action: 'UNINSTALL_APP',
      status: 'COMPLETED',
      details: JSON.stringify({
        appId,
        appName: catalogApp?.name || appId,
        summary: `Removed ${catalogApp?.name || appId} from installed applications registry.`,
      }),
    },
  });

  return {
    success: true,
    appId,
    vmId: Number(vmId),
  };
}

export async function installAppOnVM({ vmId, userId, appId, config = {}, asyncMode = false }) {
  const app = getAppById(appId);
  if (!app) {
    throw new Error(`Application '${appId}' is not found in the 1-Click catalog.`);
  }

  const vm = await prisma.virtualMachine.findFirst({
    where: { vmId: Number(vmId), userId: Number(userId) },
    include: { ipPool: true },
  });

  if (!vm) {
    throw new Error('Target virtual machine not found or unauthorized.');
  }

  const effectivePort = Number(config?.customPort) || app.defaultPort || 80;
  const domain = (config?.domain || '').trim();
  const adminEmail = (config?.adminEmail || '').trim();
  const openFirewallPort = config?.openFirewallPort !== false;

  const jobKey = `${Number(vmId)}:${app.id}`;
  const jobState = {
    jobKey,
    vmId: Number(vmId),
    vmName: vm.vmName,
    appId: app.id,
    appName: app.name,
    status: 'RUNNING',
    phase: 'Discovering VM Network & IP Address',
    progress: 10,
    logs: [
      `[APP-INSTALL] Queued 1-Click StackScript for ${app.name} (${app.version}) on ${vm.vmName}...`,
    ],
    config: {
      port: effectivePort,
      domain: domain || null,
      adminEmail: adminEmail || null,
      openFirewallPort,
    },
    startedAt: new Date().toISOString(),
    completedAt: null,
    result: null,
    error: null,
  };

  activeInstallJobs.set(jobKey, jobState);

  const appendJobLog = (line, progressOverride, phaseOverride) => {
    const clean = String(line || '').trim();
    if (clean) {
      jobState.logs.push(clean);
      if (jobState.logs.length > 200) {
        jobState.logs.shift();
      }
    }
    if (typeof progressOverride === 'number') {
      jobState.progress = Math.max(jobState.progress, Math.min(99, progressOverride));
    }
    if (phaseOverride) {
      jobState.phase = phaseOverride;
    }
  };

  const executePipeline = async () => {
    console.log(`[APP STORE] Initiating 1-Click install of '${app.name}' (${app.id}) on VM '${vm.vmName}' (vmId: ${vmId})...`);

    // 1. Poll for valid VM IP address (retry up to 30 attempts, 5s interval = 150s)
    let targetIp = null;
    const maxIpAttempts = 30;

    for (let attempt = 1; attempt <= maxIpAttempts; attempt++) {
      const currentVm = await prisma.virtualMachine.findFirst({
        where: { vmId: Number(vmId) },
        include: { ipPool: true },
      });

      if (currentVm?.ipPool && currentVm.ipPool.length > 0) {
        const valid = currentVm.ipPool.find(
          (ip) => ip.ipAddress && !ip.ipAddress.startsWith('DHCP') && !ip.ipAddress.includes(':') && ip.ipAddress !== '127.0.0.1'
        );
        if (valid) {
          targetIp = valid.ipAddress;
          break;
        }
      }

      // Proactively query live Hyper-V status to discover DHCP IP
      try {
        const liveInfo = await hypervService.getStatus(vm.vmName);
        const liveList = Array.isArray(liveInfo) ? liveInfo : [liveInfo];
        const match = liveList.find((v) => v && v.VMName && v.VMName.toLowerCase() === vm.vmName.toLowerCase()) || liveInfo;
        if (match && match.IPAddresses && match.IPAddresses.length > 0) {
          const discovered = match.IPAddresses.find(
            (ip) => ip && !ip.includes(':') && ip !== '127.0.0.1'
          );
          if (discovered) {
            targetIp = discovered;
            console.log(`[APP STORE] Discovered live DHCP IP '${discovered}' for '${vm.vmName}' from Hyper-V.`);

            if (currentVm?.ipPool && currentVm.ipPool.length > 0) {
              await prisma.iPPool.update({
                where: { ipId: currentVm.ipPool[0].ipId },
                data: { ipAddress: discovered, status: 'ASSIGNED' },
              }).catch(() => {});
            } else {
              await prisma.iPPool.create({
                data: {
                  ipAddress: discovered,
                  subnetMask: '255.255.240.0',
                  gateway: '172.27.32.1',
                  ipType: 'PUBLIC_IPV4',
                  status: 'ASSIGNED',
                  assignedVmId: vm.vmId,
                },
              }).catch(() => {});
            }
            break;
          }
        }
      } catch (hvErr) {
        // Hyper-V poll retry
      }

      appendJobLog(
        `[APP-INSTALL] Waiting for VM '${vm.vmName}' network interface to report IPv4 address (attempt ${attempt}/${maxIpAttempts})...`,
        15,
        'Waiting for VM IP Assignment'
      );

      if (attempt < maxIpAttempts) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    if (!targetIp) {
      const errorMsg = `Virtual machine '${vm.vmName}' did not acquire a valid IP address within timeout. Ensure the VM is Running.`;
      jobState.status = 'FAILED';
      jobState.phase = 'Network Unreachable';
      jobState.error = errorMsg;
      jobState.completedAt = new Date().toISOString();
      appendJobLog(`[APP-INSTALL] ERROR: ${errorMsg}`);

      await prisma.activityLog.create({
        data: {
          userId: Number(userId),
          vmId: Number(vmId),
          action: 'INSTALL_APP',
          status: 'FAILED',
          details: JSON.stringify({
            appId: app.id,
            appName: app.name,
            error: errorMsg,
          }),
        },
      }).catch(() => {});
      throw new Error(errorMsg);
    }

    appendJobLog(
      `[APP-INSTALL] Target VM IP verified: ${targetIp}:22. Building StackScript payload...`,
      25,
      'Connecting via SSH Bridge'
    );

    const targetUser = vm.adminUser || 'ubuntu';
    const primaryPass = vm.adminPassword || 'root';

    // Multi-credential candidates (same resilient order as Web SSH Terminal)
    const credentialCandidates = [];
    const addCred = (u, p) => {
      if (u && p && !credentialCandidates.some((c) => c.username === u && c.password === p)) {
        credentialCandidates.push({ username: u, password: p });
      }
    };
    addCred(targetUser, primaryPass);
    addCred(targetUser, 'root');
    addCred('ubuntu', primaryPass);
    addCred('ubuntu', 'root');
    addCred('root', primaryPass);
    addCred('root', 'root');

    // 2. Build non-interactive self-contained bash script
    const scriptLines = [
      '#!/bin/bash',
      'set -e',
      'export DEBIAN_FRONTEND=noninteractive',
      'export NEEDRESTART_MODE=a',
      'export UCF_FORCE_CONFFOLD=1',
      `export APP_ID="${app.id}"`,
      `export APP_PORT="${effectivePort}"`,
      `export APP_DOMAIN="${domain.replace(/"/g, '')}"`,
      `export ADMIN_EMAIL="${adminEmail.replace(/"/g, '')}"`,
      '',
      `echo "[APP-INSTALL] Initializing 1-Click installation for ${app.name} (${app.id})..."`,
      '',
      '# Ensure passwordless sudo is active for non-interactive commands',
      'if [ "$(id -u)" -ne 0 ]; then',
      `  (echo '${primaryPass}' | sudo -S bash -c 'echo "$(whoami) ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/99-app-install && chmod 0440 /etc/sudoers.d/99-app-install' 2>/dev/null) || (echo 'root' | sudo -S bash -c 'echo "$(whoami) ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/99-app-install && chmod 0440 /etc/sudoers.d/99-app-install' 2>/dev/null) || true`,
      'fi',
      '',
      '# Wait for unattended-upgrades or background apt locks to release',
      'echo "[APP-INSTALL] Checking for package manager locks..."',
      'for i in $(seq 1 120); do',
      '  if ! sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 && \\',
      '     ! sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1 && \\',
      '     ! sudo fuser /var/lib/dpkg/lock >/dev/null 2>&1; then',
      '    break',
      '  fi',
      '  echo "[APP-INSTALL] Waiting for dpkg lock to release ($i/120)..."',
      '  sleep 2',
      'done',
      '',
      'echo "[APP-INSTALL] Lock free. Executing catalog recipes..."',
    ];

    const totalCommands = app.installCommands.length || 1;
    app.installCommands.forEach((cmd, idx) => {
      scriptLines.push(`echo "[APP-INSTALL] [STEP ${idx + 1}/${totalCommands}] Executing: ${cmd.replace(/"/g, '\\"')}"`);
      scriptLines.push(cmd);
    });

    if (openFirewallPort && effectivePort) {
      scriptLines.push(`echo "[APP-INSTALL] Opening firewall port ${effectivePort}/tcp..."`);
      scriptLines.push(`sudo ufw allow ${effectivePort}/tcp >/dev/null 2>&1 || true`);
    }

    scriptLines.push('');
    scriptLines.push(`echo "[APP-INSTALL] COMPLETED_SUCCESSFULLY: ${app.id}"`);

    const fullScript = scriptLines.join('\n');
    const b64Script = Buffer.from(fullScript).toString('base64');
    const remoteExecCommand = `echo "${b64Script}" | base64 -d | bash`;

    // 3. Connect via SSH with backoff retry and multi-credential fallback
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;

      const tryConnect = () => {
        attempts++;
        const cred = credentialCandidates[(attempts - 1) % credentialCandidates.length];
        const conn = new SSHClient();
        let stdoutBuffer = '';
        let stderrBuffer = '';
        let stepCount = 0;

        conn.on('ready', () => {
          console.log(`[APP STORE] SSH connected to ${targetIp} as ${cred.username}. Running install script for ${app.name}...`);
          appendJobLog(
            `[APP-INSTALL] SSH handshake established with ${targetIp} (user: ${cred.username}). Starting StackScript execution...`,
            35,
            'Executing StackScript Recipes'
          );

          conn.exec(remoteExecCommand, (err, stream) => {
            if (err) {
              conn.end();
              const execErr = new Error(`Failed to initiate remote execution: ${err.message}`);
              jobState.status = 'FAILED';
              jobState.phase = 'Execution Failed';
              jobState.error = execErr.message;
              jobState.completedAt = new Date().toISOString();
              return reject(execErr);
            }

            stream.on('data', (data) => {
              const chunk = data.toString();
              stdoutBuffer += chunk;
              const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
              for (const line of lines) {
                if (line.startsWith('[APP-INSTALL]')) {
                  console.log(`[APP STORE STDOUT] ${line}`);
                  if (line.includes('[STEP ')) {
                    stepCount++;
                    const stepProgress = Math.min(92, 40 + Math.round((stepCount / totalCommands) * 50));
                    appendJobLog(line, stepProgress, `Installing ${app.name} (Step ${stepCount}/${totalCommands})`);
                  } else if (line.includes('Checking for package manager locks')) {
                    appendJobLog(line, 38, 'Checking APT / DPKG Locks');
                  } else if (line.includes('Opening firewall port')) {
                    appendJobLog(line, 95, 'Configuring Firewall & Service Ports');
                  } else {
                    appendJobLog(line);
                  }
                }
              }
            });

            stream.stderr.on('data', (data) => {
              stderrBuffer += data.toString();
            });

            stream.on('close', async (code) => {
              conn.end();

              const isSuccess = code === 0 || stdoutBuffer.includes(`COMPLETED_SUCCESSFULLY: ${app.id}`);
              const hostForUrl = domain || targetIp;
              const accessUrl =
                effectivePort === 80
                  ? `http://${hostForUrl}`
                  : effectivePort === 443
                    ? `https://${hostForUrl}`
                    : `http://${hostForUrl}:${effectivePort}`;

              const resolvedGuide = app.accessGuide
                .replace(/{IP}/g, targetIp)
                .replace(new RegExp(String(app.defaultPort), 'g'), String(effectivePort));

              // Record in database ActivityLog
              await prisma.activityLog.create({
                data: {
                  userId: Number(userId),
                  vmId: Number(vmId),
                  action: 'INSTALL_APP',
                  status: isSuccess ? 'COMPLETED' : 'FAILED',
                  details: JSON.stringify({
                    appId: app.id,
                    appName: app.name,
                    port: effectivePort,
                    accessUrl,
                    config: jobState.config,
                    exitCode: code,
                    summary: isSuccess
                      ? `Successfully provisioned ${app.name} on port ${effectivePort}.`
                      : stderrBuffer.slice(-300) || stdoutBuffer.slice(-300) || 'Unknown error',
                  }),
                },
              }).catch((logErr) => console.warn('[App Store ActivityLog Warning]:', logErr.message));

              if (!isSuccess && code !== 0) {
                const errSummary = stderrBuffer.slice(-300) || stdoutBuffer.slice(-300) || 'Non-zero exit code';
                console.error(`[APP STORE ERROR] Installation of ${app.name} failed with code ${code}. Stderr: ${errSummary}`);
                jobState.status = 'FAILED';
                jobState.phase = 'Installation Failed';
                jobState.error = `Application installation failed: ${errSummary}`;
                jobState.completedAt = new Date().toISOString();
                appendJobLog(`[APP-INSTALL] ERROR: ${jobState.error}`);
                return reject(new Error(jobState.error));
              }

              console.log(`[APP STORE SUCCESS] Application '${app.name}' installed successfully on VM '${vm.vmName}'! Accessible at ${accessUrl}`);

              const finalResult = {
                success: true,
                appId: app.id,
                appName: app.name,
                version: app.version,
                category: app.category,
                vmName: vm.vmName,
                ip: targetIp,
                port: effectivePort,
                accessUrl,
                guide: resolvedGuide,
                config: jobState.config,
                installedAt: new Date().toISOString(),
              };

              jobState.status = 'COMPLETED';
              jobState.progress = 100;
              jobState.phase = 'Active & Ready';
              jobState.result = finalResult;
              jobState.completedAt = new Date().toISOString();
              appendJobLog(`[APP-INSTALL] Verified & Active at ${accessUrl}`, 100, 'Active & Ready');

              resolve(finalResult);
            });
          });
        });

        conn.on('error', (err) => {
          conn.end();
          if (attempts < maxAttempts) {
            console.log(`[APP STORE] SSH connection attempt ${attempts}/${maxAttempts} (${cred.username}) failed (${err.message}). Retrying in 4s...`);
            appendJobLog(
              `[APP-INSTALL] SSH handshake attempt ${attempts}/${maxAttempts} (${cred.username}@${targetIp}) — retrying...`,
              28,
              'Connecting via SSH Bridge'
            );
            setTimeout(tryConnect, 4000);
          } else {
            const sshErrMsg = `SSH connection to VM '${vm.vmName}' (${targetIp}:22) failed after ${maxAttempts} attempts: ${err.message}`;
            console.error(`[APP STORE ERROR] ${sshErrMsg}`);
            jobState.status = 'FAILED';
            jobState.phase = 'SSH Connection Failed';
            jobState.error = sshErrMsg;
            jobState.completedAt = new Date().toISOString();
            appendJobLog(`[APP-INSTALL] ERROR: ${sshErrMsg}`);
            reject(new Error(sshErrMsg));
          }
        });

        conn.connect({
          host: targetIp,
          port: 22,
          username: cred.username,
          password: cred.password,
          readyTimeout: 10000,
        });
      };

      tryConnect();
    });
  };

  if (asyncMode) {
    executePipeline().catch((err) => {
      console.error(`[APP STORE ASYNC JOB ERROR] (${jobKey}):`, err.message);
    });
    return {
      async: true,
      job: jobState,
    };
  }

  return executePipeline();
}
