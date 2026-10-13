// ==============================================================================
// File: services/appStoreService.js
// Purpose: Enterprise Automation Engine for 1-Click Apps on Hyper-V VMs
// ==============================================================================

import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';
import hypervService from './hypervService.js';
import { APPS_CATALOG, APP_CATEGORIES, getAppById } from '../lib/appsCatalog.js';

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
    apps: list.map(({ installCommands, ...app }) => app), // Don't expose internal scripts to public listing
  };
}

export async function getInstalledAppsForVM(vmId, userId) {
  const vm = await prisma.virtualMachine.findFirst({
    where: { vmId: Number(vmId), userId: Number(userId) },
  });

  if (!vm) {
    throw new Error('Virtual machine not found or unauthorized.');
  }

  // Fetch installed app activities from ActivityLog
  const logs = await prisma.activityLog.findMany({
    where: {
      vmId: Number(vmId),
      action: 'INSTALL_APP',
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  });

  const installedMap = new Map();
  for (const log of logs) {
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      if (details?.appId && !installedMap.has(details.appId)) {
        installedMap.set(details.appId, {
          appId: details.appId,
          appName: details.appName,
          installedAt: log.createdAt,
          port: details.port,
          accessUrl: details.accessUrl,
        });
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  return Array.from(installedMap.values());
}

export async function installAppOnVM({ vmId, userId, appId }) {
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

          // Update database IPPool & VM records
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

    if (attempt < maxIpAttempts) {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  if (!targetIp) {
    const errorMsg = `Virtual machine '${vm.vmName}' did not acquire a valid IP address within timeout.`;
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

  const targetUser = vm.adminUser || 'ubuntu';
  const primaryPass = vm.adminPassword || 'root';
  const fallbackPass = 'root';

  console.log(`[APP STORE] VM '${vm.vmName}' target reachable at ${targetIp}:22. Preparing remote automated execution script...`);

  // 2. Build non-interactive self-contained bash script
  const scriptLines = [
    '#!/bin/bash',
    'set -e',
    'export DEBIAN_FRONTEND=noninteractive',
    'export NEEDRESTART_MODE=a',
    'export UCF_FORCE_CONFFOLD=1',
    '',
    `echo "[APP-INSTALL] Initializing 1-Click installation for ${app.name} (${app.id})..."`,
    '',
    '# Ensure passwordless sudo is active for non-interactive commands',
    'if [ "$(id -u)" -ne 0 ]; then',
    `  echo '${primaryPass}' | sudo -S bash -c 'echo "${targetUser} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/99-app-install && chmod 0440 /etc/sudoers.d/99-app-install' 2>/dev/null || true`,
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

  for (const cmd of app.installCommands) {
    scriptLines.push(`echo "[APP-INSTALL] Executing: ${cmd.replace(/"/g, '\\"')}"`);
    scriptLines.push(cmd);
  }

  scriptLines.push('');
  scriptLines.push(`echo "[APP-INSTALL] COMPLETED_SUCCESSFULLY: ${app.id}"`);

  const fullScript = scriptLines.join('\n');
  const b64Script = Buffer.from(fullScript).toString('base64');
  const remoteExecCommand = `echo "${b64Script}" | base64 -d | bash`;

  // 3. Connect via SSH with backoff retry and credential fallback
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 * 5s = 100s

    const tryConnect = () => {
      attempts++;
      const currentPassword = attempts % 2 === 1 ? primaryPass : fallbackPass;
      const conn = new SSHClient();
      let stdoutBuffer = '';
      let stderrBuffer = '';

      conn.on('ready', () => {
        console.log(`[APP STORE] SSH connected to ${targetIp} as ${targetUser}. Running install script for ${app.name}...`);

        conn.exec(remoteExecCommand, (err, stream) => {
          if (err) {
            conn.end();
            return reject(new Error(`Failed to initiate remote execution: ${err.message}`));
          }

          stream.on('data', (data) => {
            const chunk = data.toString();
            stdoutBuffer += chunk;
            const lines = chunk.split('\n').filter((l) => l.trim().startsWith('[APP-INSTALL]'));
            lines.forEach((l) => console.log(`[APP STORE STDOUT] ${l.trim()}`));
          });

          stream.stderr.on('data', (data) => {
            stderrBuffer += data.toString();
          });

          stream.on('close', async (code) => {
            conn.end();

            const isSuccess = code === 0 || stdoutBuffer.includes(`COMPLETED_SUCCESSFULLY: ${app.id}`);
            const accessUrl =
              app.defaultPort === 80
                ? `http://${targetIp}`
                : app.defaultPort === 443
                  ? `https://${targetIp}`
                  : `http://${targetIp}:${app.defaultPort}`;

            const resolvedGuide = app.accessGuide.replace(/{IP}/g, targetIp);

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
                  port: app.defaultPort,
                  accessUrl,
                  exitCode: code,
                  summary: isSuccess
                    ? `Successfully provisioned ${app.name}.`
                    : stderrBuffer.slice(-300) || stdoutBuffer.slice(-300) || 'Unknown error',
                }),
              },
            }).catch((logErr) => console.warn('[App Store ActivityLog Warning]:', logErr.message));

            if (!isSuccess && code !== 0) {
              console.error(`[APP STORE ERROR] Installation of ${app.name} failed with code ${code}. Stderr: ${stderrBuffer.slice(-400)}`);
              return reject(new Error(`Application installation failed: ${stderrBuffer.slice(-300) || stdoutBuffer.slice(-300) || 'Non-zero exit code'}`));
            }

            console.log(`[APP STORE SUCCESS] Application '${app.name}' installed successfully on VM '${vm.vmName}'! Accessible at ${accessUrl}`);

            resolve({
              success: true,
              appId: app.id,
              appName: app.name,
              vmName: vm.vmName,
              ip: targetIp,
              port: app.defaultPort,
              accessUrl,
              guide: resolvedGuide,
            });
          });
        });
      });

      conn.on('error', (err) => {
        conn.end();
        if (attempts < maxAttempts) {
          console.log(`[APP STORE] SSH connection attempt ${attempts}/${maxAttempts} failed (${err.message}). Retrying in 5s...`);
          setTimeout(tryConnect, 5000);
        } else {
          console.error(`[APP STORE ERROR] SSH connection to VM failed after ${maxAttempts} attempts (${targetIp}:22): ${err.message}`);
          reject(new Error(`SSH connection to VM failed after ${maxAttempts} attempts (${targetIp}:22): ${err.message}`));
        }
      });

      conn.connect({
        host: targetIp,
        port: 22,
        username: targetUser,
        password: currentPassword,
        readyTimeout: 10000,
      });
    };

    tryConnect();
  });
}
