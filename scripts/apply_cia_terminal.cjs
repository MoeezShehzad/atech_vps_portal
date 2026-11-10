const fs = require('fs');
const path = require('path');

const terminalServicePath = path.join(__dirname, '..', 'services', 'terminalService.js');
let code = fs.readFileSync(terminalServicePath, 'utf8').replace(/\r\n/g, '\n');

const target = `      if (membership && membership.role !== 'billing') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      ws.send('\\r\\n\\x1b[31m[ERROR] Unauthorized: You do not have permission to access this virtual machine terminal.\\x1b[0m\\r\\n');
      return ws.close();
    }`;

const replacement = `      if (membership && ['owner', 'admin', 'devops'].includes(membership.role)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      ws.send('\\r\\n\\x1b[31m[ERROR] Access Denied: Interactive console sessions are restricted to DevOps and Admin roles under CIA Security Policy.\\x1b[0m\\r\\n');
      return ws.close();
    }`;

if (!code.includes(target)) {
  console.error('Target not found in services/terminalService.js');
  process.exit(1);
}

code = code.replace(target, replacement).replace(/\n/g, '\r\n');
fs.writeFileSync(terminalServicePath, code, 'utf8');
console.log('Successfully updated services/terminalService.js with CIA enforcement!');
