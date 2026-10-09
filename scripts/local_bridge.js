import net from 'net';

const VM_IP = process.env.VM_IP || '172.19.124.110';

function forward(localPort, targetPort) {
  const server = net.createServer((socket) => {
    const target = net.connect(targetPort, VM_IP);
    socket.pipe(target);
    target.pipe(socket);
    socket.on('error', () => {});
    target.on('error', () => {});
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[PORT FORWARD] Port ${localPort} is already in use.`);
    } else {
      console.error(`[PORT FORWARD] Port ${localPort} error:`, err.message);
    }
  });

  server.listen(localPort, '127.0.0.1', () => {
    console.log(`[PORT FORWARD] localhost:${localPort} -> ${VM_IP}:${targetPort} [ACTIVE]`);
  });
}

console.log(`=== Starting Localhost -> VM Bridge for Google OAuth & Portal Access ===`);
forward(5000, 5000);
forward(5174, 5174);
