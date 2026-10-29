import { decryptVmPassword, decodeResourceId } from './cryptoService.js';
import net from 'net';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';
import hypervService from './hypervService.js';
import { sendVmFailureAlertToSupport } from './emailService.js';

export function setupTerminalWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      socket.setNoDelay(true);
      socket.setKeepAlive(true, 10000);
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/terminal' || url.pathname === '/api/ws/terminal') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          if (ws._socket) {
            ws._socket.setNoDelay(true);
          }
          wss.emit('connection', ws, request, url);
        });
      } else if (!url.pathname.includes('guacamole')) {
        socket.destroy();
      }
    } catch (e) {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws, request, url) => {
    const ticket = url.searchParams.get('ticket') || url.searchParams.get('token');
    const rawVmId = url.searchParams.get('vmId');
    const vmIdParam = rawVmId ? decodeResourceId(rawVmId) : null;

    if (!ticket) {
      ws.send('\r\n\x1b[31m[ERROR] Authentication ticket or token is required.\x1b[0m\r\n');
      return ws.close();
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'atc_cloud_default_jwt_secret_must_change';
    let decoded;
    try {
      decoded = jwt.verify(ticket, secret);
    } catch (err) {
      if (process.env.JWT_SECRET && process.env.JWT_SECRET !== secret) {
        try {
          decoded = jwt.verify(ticket, process.env.JWT_SECRET);
        } catch (e) {}
      }
      if (!decoded) {
        ws.send('\r\n\x1b[31m[ERROR] Invalid or expired authentication token.\x1b[0m\r\n');
        return ws.close();
      }
    }

    // If a console ticket is bound to a specific vmId or siteId, prevent switching target via query param
    const userId = decoded.userId;
    const siteIdParam = Number(url.searchParams.get('siteId'));
    const decodedVmId = decoded.vmId ? decodeResourceId(decoded.vmId) : null;
    if (decodedVmId && vmIdParam && decodedVmId !== vmIdParam) {
      ws.send('\r\n\x1b[31m[ERROR] Console ticket does not match requested VM.\x1b[0m\r\n');
      return ws.close();
    }
    if (decoded.siteId && siteIdParam && Number(decoded.siteId) !== siteIdParam) {
      ws.send('\r\n\x1b[31m[ERROR] Console ticket does not match requested site.\x1b[0m\r\n');
      return ws.close();
    }
    const siteId = decoded.siteId || siteIdParam;
    const vmId = decodedVmId || vmIdParam;

    // =========================================================================
    // BRANCH A: Container Sandbox Terminal (for Managed Web Hosting / Developers)
    // =========================================================================
    if (siteId) {
      const site = await prisma.managedWebsite.findFirst({
        where: { id: siteId, userId },
      });

      if (!site) {
        ws.send('\r\n\x1b[31m[ERROR] Managed website container not found or access denied.\x1b[0m\r\n');
        return ws.close();
      }

      if (site.status === 'STOPPED') {
        ws.send(`\r\n\x1b[33m====================================================\x1b[0m\r\n`);
        ws.send(`\x1b[1;33m  [NOTICE] CONTAINER IS CURRENTLY STOPPED\x1b[0m\r\n`);
        ws.send(`  Site container 'site_${site.id}' is offline.\r\n`);
        ws.send(`  Please click the Start button in the ATC Websites Manager.\r\n`);
        ws.send(`\x1b[33m====================================================\x1b[0m\r\n\r\n`);
        return ws.close();
      }

      ws.send(`\r\n\x1b[36m====================================================\x1b[0m\r\n`);
      ws.send(`\x1b[1;32m  ATC CLOUD DEVELOPER SANDBOX CONSOLE\x1b[0m\r\n`);
      ws.send(`  Site: \x1b[33m${site.name}\x1b[0m | App: \x1b[35m${site.appType}\x1b[0m\r\n`);
      ws.send(`  Container: \x1b[36msite_${site.id}\x1b[0m (Isolated Environment)\r\n`);
      ws.send(`\x1b[36m====================================================\x1b[0m\r\n\r\n`);

      const workerHost = process.env.ATC_WORKER_HOST || '172.27.47.192';
      const sshConn = new SSHClient();
      let shellStream = null;
      let ptyRows = 30;
      let ptyCols = 100;

      sshConn.on('ready', () => {
        // Spawn docker exec interactive shell directly inside tenant container
        const execCmd = `docker exec -it site_${site.id} /bin/bash 2>/dev/null || docker exec -it site_${site.id} /bin/sh`;
        sshConn.exec(execCmd, { pty: { term: 'xterm-256color', rows: ptyRows, cols: ptyCols } }, (err, stream) => {
          if (err) {
            if (ws.readyState === ws.OPEN) {
              ws.send(`\r\n\x1b[31m[ERROR] Failed to attach to container: ${err.message}\x1b[0m\r\n`);
              ws.close();
            }
            return sshConn.end();
          }

          shellStream = stream;
          stream.on('data', (data) => {
            if (ws.readyState === ws.OPEN) ws.send(data.toString('utf-8'));
          });
          stream.stderr.on('data', (data) => {
            if (ws.readyState === ws.OPEN) ws.send(data.toString('utf-8'));
          });
          stream.on('close', () => {
            if (ws.readyState === ws.OPEN) ws.close();
            sshConn.end();
          });
        });
      });

      sshConn.on('error', (err) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(`\r\n\x1b[31m[SSH Error] Worker node unreachable: ${err.message}\x1b[0m\r\n`);
          ws.close();
        }
      });

      ws.on('message', (msg) => {
        if (typeof msg === 'string' ? msg.charCodeAt(0) === 123 : (msg && msg[0] === 123)) {
          try {
            const str = msg.toString();
            if (str.startsWith('{"type":"resize"')) {
              const parsed = JSON.parse(str);
              if (parsed.cols && parsed.rows && shellStream && shellStream.setWindow) {
                shellStream.setWindow(Number(parsed.rows), Number(parsed.cols), 0, 0);
              }
              return;
            }
          } catch {}
        }
        if (shellStream && shellStream.writable) {
          shellStream.write(msg);
        }
      });

      ws.on('close', () => {
        try {
          if (shellStream) shellStream.end();
          sshConn.end();
        } catch (_) {}
      });

      sshConn.connect({
        host: workerHost,
        port: 22,
        username: process.env.ATC_WORKER_USER || 'ubuntu',
        password: process.env.ATC_WORKER_PASS || 'root',
        readyTimeout: 10000,
      });

      return;
    }

    // =========================================================================
    // BRANCH B: Full Virtual Machine Terminal (Hyper-V Guest)
    // =========================================================================
    if (!vmId) {
      ws.send('\r\n\x1b[31m[ERROR] Valid vmId or siteId is required.\x1b[0m\r\n');
      return ws.close();
    }

    const vm = await prisma.virtualMachine.findUnique({
      where: { vmId },
      include: { ipPool: true },
    });

    if (!vm || vm.status === 'TERMINATED') {
      ws.send('\r\n\x1b[31m[ERROR] Virtual machine not found or access denied.\x1b[0m\r\n');
      return ws.close();
    }

    // Verify authorized access: either direct owner, or active member of owner's organization
    let hasAccess = vm.userId === userId;
    if (!hasAccess) {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId,
          status: 'active',
          organization: { ownerId: vm.userId },
        },
      });
      if (membership && ['owner', 'admin', 'devops'].includes(membership.role)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      ws.send('\r\n\x1b[31m[ERROR] Access Denied: Interactive console sessions are restricted to DevOps and Admin roles under CIA Security Policy.\x1b[0m\r\n');
      return ws.close();
    }

    // Quick check: If database already marks VM as stopped, reject immediately without waiting
    // (Live hypervService probe is deferred to SSH error handler if connection fails, preventing 6-second startup delay)

    if (vm.status === 'STOPPED') {
      ws.send(`\r\n\x1b[33m====================================================\x1b[0m\r\n`);
      ws.send(`\x1b[1;33m  [NOTICE] SERVER IS CURRENTLY POWERED OFF\x1b[0m\r\n`);
      ws.send(`  Virtual machine '${vm.vmName}' is turned off.\r\n`);
      ws.send(`  Please click the Start button on your dashboard to boot the server.\r\n`);
      ws.send(`\x1b[33m====================================================\x1b[0m\r\n\r\n`);
      return ws.close();
    }

    // Dynamic IP resolution
    let targetIp = decoded.ip;
    if (!targetIp || targetIp === 'DHCP Pending' || targetIp === 'DHCP Leasing...') {
      if (vm.ipPool && vm.ipPool.length > 0 && vm.ipPool[0].ipAddress && !vm.ipPool[0].ipAddress.startsWith('DHCP')) {
        targetIp = vm.ipPool[0].ipAddress;
      } else {
        targetIp = '192.168.2.192';
      }
    }

    const targetUser = decoded.username || vm.adminUser || 'ubuntu';
    const targetPassword = decoded.password || decryptVmPassword(vm.adminPassword) || 'root';

    ws.send(`\r\n\x1b[36m====================================================\x1b[0m\r\n`);
    ws.send(`\x1b[1;32m  ATC CLOUD WEB CONSOLE\x1b[0m — Connected to ${vm.vmName}\r\n`);
    ws.send(`  Host IP: \x1b[33m${targetIp}\x1b[0m | User: \x1b[33m${targetUser}\x1b[0m\r\n`);
    ws.send(`\x1b[36m====================================================\x1b[0m\r\n\r\n`);

    let activeConn = null;
    let shellStream = null;
    let ptyRows = 30;
    let ptyCols = 100;
    let retryCount = 0;
    const maxRetries = 3;
    const inputBuffer = [];

    function connectSSH(user, pass, isFallback = false) {
      const sshConn = new SSHClient();
      activeConn = sshConn;

      sshConn.on('connect', () => {
        if (sshConn._sock) {
          try {
            sshConn._sock.setNoDelay(true);
            sshConn._sock.setKeepAlive(true, 10000);
          } catch (e) {}
        }
      });

      sshConn.on('ready', () => {
        retryCount = 0;
        if (isFallback) {
          ws.send(`\r\n\x1b[33m[Notice] Initialized via recovery channel. Preparing environment for ${targetUser}...\x1b[0m\r\n`);
        }

        // Allocate interactive pseudo-terminal (PTY) with accurate rows/cols
        sshConn.shell(
          {
            term: 'xterm-256color',
            rows: ptyRows,
            cols: ptyCols,
          },
          (err, stream) => {
            if (err) {
              if (ws.readyState === ws.OPEN) {
                ws.send(`\r\n\x1b[31m[ERROR] Failed to start shell session: ${err.message}\x1b[0m\r\n`);
                ws.close();
              }
              return sshConn.end();
            }

            shellStream = stream;

            // If we connected via fallback, heal targetUser and targetPassword so future logins work seamlessly
            if (isFallback) {
              const safeUser = (targetUser || 'ubuntu').toLowerCase().replace(/[^a-z0-9_-]/g, '');
              const safePass = (targetPassword || 'root').replace(/"/g, '\\"');
              const healCmd = `echo "root" | sudo -S bash -c "echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/99-ubuntu-nopasswd && chmod 0440 /etc/sudoers.d/99-ubuntu-nopasswd && echo 'ubuntu:${safePass}' | chpasswd && echo 'root:${safePass}' | chpasswd" 2>/dev/null ; id -u ${safeUser} 2>/dev/null || (sudo useradd -m -s /bin/bash -G sudo ${safeUser} 2>/dev/null && echo "${safeUser}:${safePass}" | sudo chpasswd) ; exec su - ${safeUser}\n`;
              stream.write(healCmd);
            }

            // Flush any keystrokes sent before SSH stream completed handshake
            while (inputBuffer.length > 0) {
              const buffered = inputBuffer.shift();
              if (stream.writable) stream.write(buffered);
            }

            // Pipe remote shell output directly to browser xterm as UTF-8 strings
            stream.on('data', (data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(data.toString('utf-8'));
              }
            });

            stream.stderr.on('data', (data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(data.toString('utf-8'));
              }
            });

            stream.on('close', () => {
              if (ws.readyState === ws.OPEN) {
                ws.send(`\r\n\r\n\x1b[1;33m[SESSION CLOSED]\x1b[0m Shell process exited or machine powered off.\r\n`);
                ws.close();
              }
              sshConn.end();
            });
          }
        );
      });

      sshConn.on('error', async (err) => {
        console.warn(`[SSH2 Connection Attempt on ${targetIp} for ${user}]:`, err.message);
        
        // Multi-tier credential fallback for newly provisioned or template instances
        const isAuthErr = err.level === 'client-authentication' || err.message?.toLowerCase().includes('auth');
        if (!isFallback && isAuthErr) {
          if (pass !== 'root') {
            console.log(`[SSH2 Fallback] Retrying with template password 'root' for user '${user}'...`);
            try { sshConn.end(); } catch (e) {}
            return connectSSH(user, 'root', true);
          } else if (user !== 'ubuntu') {
            console.log(`[SSH2 Fallback] Retrying with default account 'ubuntu:root' to self-heal guest session...`);
            try { sshConn.end(); } catch (e) {}
            return connectSSH('ubuntu', 'root', true);
          }
        }

        const isNetworkErr = err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH' || err.code === 'ETIMEDOUT' || err.level === 'client-timeout';
        if (isNetworkErr && retryCount < maxRetries) {
          retryCount++;
          if (ws.readyState === ws.OPEN) {
            ws.send(`\r\n\x1b[33m[Console]\x1b[0m Waiting for guest operating system SSH service to become ready (attempt ${retryCount}/${maxRetries})...\r\n`);
          }
          try { sshConn.end(); } catch (e) {}
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              connectSSH(user, pass, isFallback);
            }
          }, 3000);
          return;
        }

        // Dispatch automated incident alert to customer support
        sendVmFailureAlertToSupport({
          vmName: vm.vmName,
          vmId: vm.vmId,
          customerEmail: decoded.email || 'customer@atechconsult.com',
          customerName: decoded.name || 'Customer',
          action: 'WEB_CONSOLE_SSH_BRIDGE',
          error: `Guest SSH service on ${targetIp}:22 was unreachable after ${maxRetries} connection attempts (${err.message}).`,
          scriptName: 'WebConsole / SSH Bridge',
          hostStatus: (await hypervService.isHostReachable()) ? 'Online' : 'Offline / Unreachable',
        }).catch((e) => console.error('[Console Alert Dispatch Err]', e.message));

        if (ws.readyState === ws.OPEN) {
          ws.send(`\r\n\x1b[31m[SSH Error] Connection failed: ${err.message}\x1b[0m\r\n`);
          ws.send(`\x1b[33m[Support System] Our customer support team has been automatically alerted of this VM connection issue.\x1b[0m\r\n`);
          ws.close();
        }
      });

      sshConn.connect({
        host: targetIp,
        port: 22,
        username: user,
        password: pass,
        readyTimeout: 15000,
        keepaliveInterval: 10000,
      });
    }

    // Forward browser keystrokes and resize signals to remote shell stream
    ws.on('message', (msg) => {
      // Check for JSON resize signal (starts with '{' -> 123)
      if (typeof msg === 'string' ? msg.charCodeAt(0) === 123 : (msg && msg[0] === 123)) {
        try {
          const str = msg.toString();
          if (str.startsWith('{"type":"resize"')) {
            const parsed = JSON.parse(str);
            if (parsed.cols && parsed.rows) {
              ptyCols = Number(parsed.cols);
              ptyRows = Number(parsed.rows);
              if (shellStream && shellStream.writable) {
                shellStream.setWindow(ptyRows, ptyCols, 0, 0);
              }
            }
            return;
          }
        } catch {}
      }

      // Fast-path: keystroke input (zero overhead, direct write)
      if (shellStream && shellStream.writable) {
        shellStream.write(msg);
      } else {
        inputBuffer.push(msg);
      }
    });

    ws.on('close', () => {
      try {
        if (shellStream) shellStream.end();
        if (activeConn) activeConn.end();
      } catch (e) {}
    });

    // Start SSH connection
    connectSSH(targetUser, targetPassword, false);
  });

  return wss;
}
