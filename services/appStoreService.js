// ==============================================================================
// File: services/appStoreService.js
// Purpose: Automation engine for 1-Click App installation on Hyper-V VMs
// ==============================================================================

import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';
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
    apps: list.map(({ installCommands, ...app }) => app), // Don't expose raw internal scripts to public listing
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

  if (vm.status !== 'RUNNING') {
    throw new Error(`Virtual machine '${vm.vmName}' is currently ${vm.status}. Please power it on before installing apps.`);
  }

  // Determine reachable IP
  let targetIp = null;
  if (vm.ipPool && vm.ipPool.length > 0) {
    const valid = vm.ipPool.find(ip => ip.ipAddress && !ip.ipAddress.startsWith('DHCP'));
    if (valid) targetIp = valid.ipAddress;
  }

  if (!targetIp) {
    throw new Error(`Virtual machine does not have an active IP address assigned yet.`);
  }

  const targetUser = vm.adminUser || 'ubuntu';
  const targetPass = vm.adminPassword || 'root';

  // Construct batch bash command string
  const fullCommand = app.installCommands.join(' && ');

  return new Promise((resolve, reject) => {
    const conn = new SSHClient();
    let stdoutBuffer = '';
    let stderrBuffer = '';

    conn.on('ready', () => {
      conn.exec(fullCommand, (err, stream) => {
        if (err) {
          conn.end();
          return reject(new Error(`Failed to initiate remote execution: ${err.message}`));
        }

        stream.on('data', (data) => {
          stdoutBuffer += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderrBuffer += data.toString();
        });

        stream.on('close', async (code) => {
          conn.end();

          const isSuccess = code === 0 || stdoutBuffer.length > 0;
          const accessUrl = app.defaultPort === 80 
            ? `http://${targetIp}` 
            : app.defaultPort === 443 
              ? `https://${targetIp}` 
              : `http://${targetIp}:${app.defaultPort}`;

          const resolvedGuide = app.accessGuide.replace(/{IP}/g, targetIp);

          // Log in database ActivityLog
          await prisma.activityLog.create({
            data: {
              userId: Number(userId),
              vmId: Number(vmId),
              action: 'INSTALL_APP',
              status: isSuccess ? 'COMPLETED' : 'FAILED',
              ipAddress: targetIp,
              details: JSON.stringify({
                appId: app.id,
                appName: app.name,
                port: app.defaultPort,
                accessUrl,
                exitCode: code,
                summary: isSuccess ? 'Successfully provisioned application.' : stderrBuffer.slice(-200),
              }),
            },
          });

          if (!isSuccess && code !== 0) {
            return reject(new Error(`Application installation failed: ${stderrBuffer.slice(-300) || 'Unknown error'}`));
          }

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
      reject(new Error(`SSH connection to VM failed (${targetIp}:22): ${err.message}`));
    });

    conn.connect({
      host: targetIp,
      port: 22,
      username: targetUser,
      password: targetPass,
      readyTimeout: 20000,
    });
  });
}
