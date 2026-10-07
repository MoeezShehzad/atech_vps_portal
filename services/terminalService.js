import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';

export function setupTerminalWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/terminal' || url.pathname === '/api/ws/terminal') {
        wss.handleUpgrade(request, socket, head, (ws) => {
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

    const sshConn = new SSHClient();
    let shellStream = null;

    sshConn.on('ready', () => {
      // Allocate interactive pseudo-terminal (PTY) on remote Linux guest
      sshConn.shell(
        {
          term: 'xterm-256color',
          rows: 30,
          cols: 100,
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

          // Pipe remote shell output directly to browser xterm
          stream.on('data', (data) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(data.toString());
            }
          });

          stream.stderr.on('data', (data) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(data.toString());
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

    // Forward browser keystrokes and resize signals to remote shell stream
    ws.on('message', (msg) => {
      try {
        const str = msg.toString();
        if (str.startsWith('{') && str.includes('"type":"resize"')) {
          try {
            const parsed = JSON.parse(str);
            if (shellStream && parsed.cols && parsed.rows) {
              shellStream.setWindow(parsed.rows, parsed.cols, 0, 0);
            }
          } catch {}
          return;
        }

        if (shellStream && shellStream.writable) {
          shellStream.write(msg);
        }
      } catch (e) {}
    });

    sshConn.on('error', (err) => {
      console.warn(`[SSH2 Connection Error on ${targetIp}]:`, err.message);
      if (ws.readyState === ws.OPEN) {
        ws.send(`\r\n\x1b[31m[SSH Error] Connection failed: ${err.message}\x1b[0m\r\n`);
        ws.close();
      }
    });

    ws.on('close', () => {
      try {
        if (shellStream) shellStream.end();
        sshConn.end();
      } catch (e) {}
    });

    // Connect to target guest VM
    sshConn.connect({
      host: targetIp,
      port: 22,
      username: targetUser,
      password: targetPassword,
      readyTimeout: 15000,
      keepaliveInterval: 10000,
    });
  });

  return wss;
}
