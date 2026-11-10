const fs = require('fs');
const path = require('path');

const vmControllerPath = path.join(__dirname, '..', 'controllers', 'vmController.js');
let code = fs.readFileSync(vmControllerPath, 'utf8').replace(/\r\n/g, '\n');

// 1. In getUserVMs, mask password for viewer
const passTarget = `        adminPassword: (vm.image?.osFamily?.toLowerCase().includes('win') || vm.image?.name?.toLowerCase().includes('win') || vm.adminUser === 'user') ? (decryptVmPassword(vm.adminPassword) ?? '') : (decryptVmPassword(vm.adminPassword) || 'root'),`;

const passReplacement = `        adminPassword: (isOrgContext && memberRole === 'viewer')
          ? '••••••••••••'
          : ((vm.image?.osFamily?.toLowerCase().includes('win') || vm.image?.name?.toLowerCase().includes('win') || vm.adminUser === 'user')
            ? (decryptVmPassword(vm.adminPassword) ?? '')
            : (decryptVmPassword(vm.adminPassword) || 'root')),`;

if (!code.includes(passTarget)) {
  console.error('Password target not found!');
  process.exit(1);
}
code = code.replace(passTarget, passReplacement);

// 2. In getConsoleSession, enforce CIA: only owner, admin, devops can get console session (viewer excluded)
const consoleTarget = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { ipPool: true, image: true },
      allowedRoles: ['owner', 'admin', 'devops', 'viewer'],
    });`;

const consoleReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { ipPool: true, image: true },
      allowedRoles: ['owner', 'admin', 'devops'], // Viewers strictly restricted under CIA Confidentiality & Integrity
    });`;

if (!code.includes(consoleTarget)) {
  console.error('Console target not found!');
  process.exit(1);
}
code = code.replace(consoleTarget, consoleReplacement);

// 3. In reactivateVMInstance, remove billing role
const reactivateTarget = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin', 'billing'],
    });`;

const reactivateReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin'],
    });`;

if (!code.includes(reactivateTarget)) {
  console.error('Reactivate target not found!');
  process.exit(1);
}
code = code.replace(reactivateTarget, reactivateReplacement);

code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(vmControllerPath, code, 'utf8');
console.log('Successfully applied CIA security and removed billing role from vmController.js!');
