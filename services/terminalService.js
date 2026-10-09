import net from 'net';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';

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
      }
    } catch (e) {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws, request, url) => {
    const ticket = url.searchParams.get('ticket') || url.searchParams.get('token');
    const vmIdParam = Number(url.searchParams.get('vmId'));

    if (!ticket) {
      ws.send('\r\n\x1b[31m[ERROR] Authentication ticket or token is required.\x1b[0m\r\n');
      return ws.close();
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';
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

    const userId = decoded.userId;
    const vmId = vmIdParam || decoded.vmId;

    if (!vmId) {
      ws.send('\r\n\x1b[31m[ERROR] Valid vmId is required.\x1b[0m\r\n');
      return ws.close();
    }

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { ipPool: true },
    });

    if (!vm) {
      ws.send('\r\n\x1b[31m[ERROR] Virtual machine not found or access denied.\x1b[0m\r\n');
      return ws.close();
    }

    if (vm.status === 'STOPPED') {
      ws.send(`\r\n\x1b[33m====================================================\x1b[0m\r\n`);
      ws.send(`\x1b[1;33m  [NOTICE] SERVER IS CURRENTLY POWERED OFF\x1b[0m\r\n`);
      ws.send(`  Virtual machine '${vm.vmName}' is not running.\r\n`);
      ws.send(`  Please click the Power On button in your dashboard to activate the server.\r\n`);
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
    const targetPassword = decoded.password || vm.adminPassword || 'root';

    ws.send(`\r\n\x1b[36m====================================================\x1b[0m\r\n`);
    ws.send(`\x1b[1;32m  ATECH CLOUD WEB CONSOLE\x1b[0m — Connected to ${vm.vmName}\r\n`);
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

            // If we connected via fallback user 'ubuntu', heal targetUser
            if (isFallback && targetUser !== 'ubuntu' && targetUser !== 'root') {
              const safeUser = targetUser.toLowerCase().replace(/[^a-z0-9_-]/g, '');
              const safePass = targetPassword.replace(/"/g, '\\"');
              const healCmd = `echo "root" | sudo -S id -u ${safeUser} 2>/dev/null || (echo "root" | sudo -S useradd -m -s /bin/bash -G sudo ${safeUser} && echo "${safeUser}:${safePass}" | sudo chpasswd) ; exec su - ${safeUser}\n`;
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

      sshConn.on('error', (err) => {
        console.warn(`[SSH2 Connection Attempt on ${targetIp} for ${user}]:`, err.message);
        // If authentication failed on custom user, attempt fallback to default ubuntu user
        if (!isFallback && targetUser !== 'ubuntu' && (err.level === 'client-authentication' || err.message?.toLowerCase().includes('auth'))) {
          console.log(`[SSH2 Fallback] Retrying with default account 'ubuntu' to self-heal guest session...`);
          try { sshConn.end(); } catch (e) {}
          return connectSSH('ubuntu', 'root', true);
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

        if (ws.readyState === ws.OPEN) {
          ws.send(`\r\n\x1b[31m[SSH Error] Connection failed: ${err.message}\x1b[0m\r\n`);
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
