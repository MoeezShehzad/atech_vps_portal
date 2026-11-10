const fs = require('fs');
const path = require('path');

const terminalServicePath = path.join(__dirname, '..', 'services', 'terminalService.js');
let code = fs.readFileSync(terminalServicePath, 'utf8').replace(/\r\n/g, '\n');

const target = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { ipPool: true },
    });

    if (!vm) {
      ws.send('\\r\\n\\x1b[31m[ERROR] Virtual machine not found or access denied.\\x1b[0m\\r\\n');
      return ws.close();
    }`;

const replacement = `    const vm = await prisma.virtualMachine.findUnique({
      where: { vmId },
      include: { ipPool: true },
    });

    if (!vm || vm.status === 'TERMINATED') {
      ws.send('\\r\\n\\x1b[31m[ERROR] Virtual machine not found or access denied.\\x1b[0m\\r\\n');
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
      if (membership && membership.role !== 'billing') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      ws.send('\\r\\n\\x1b[31m[ERROR] Unauthorized: You do not have permission to access this virtual machine terminal.\\x1b[0m\\r\\n');
      return ws.close();
    }`;

if (!code.includes(target)) {
  console.error('Target not found in services/terminalService.js');
  process.exit(1);
}

code = code.replace(target, replacement).replace(/\n/g, '\r\n');
fs.writeFileSync(terminalServicePath, code, 'utf8');
console.log('Successfully updated services/terminalService.js!');
