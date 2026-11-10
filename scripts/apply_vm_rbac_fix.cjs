const fs = require('fs');
const path = require('path');

const vmControllerPath = path.join(__dirname, '..', 'controllers', 'vmController.js');
let code = fs.readFileSync(vmControllerPath, 'utf8');

console.log('Original vmController length:', code.length);

// 1. Add getAuthorizedVm and enhance resolveWorkspaceContext
const resolveTarget = `async function resolveWorkspaceContext(req, userId) {
  // Check if the user is registered as a company
  const currentUser = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, accountType: true, companyName: true },
  });
  const isCompanyUser = currentUser?.accountType === 'company' || Boolean(currentUser?.companyName);

  let orgHeader = req.headers['x-organization-id'] || req.query.orgId;
  // If user registered as company, force them into their company organization context
  if (isCompanyUser && (!orgHeader || orgHeader === 'personal')) {
    const ownedOrg = await prisma.organization.findFirst({ where: { ownerId: userId } });
    if (ownedOrg) {
      orgHeader = String(ownedOrg.orgId);
    }
  }

  if (!orgHeader || orgHeader === 'personal') {
    return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
  }
  const orgId = parseInt(orgHeader, 10);
  if (isNaN(orgId)) {
    return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
  }
  const org = await prisma.organization.findUnique({
    where: { orgId },
    include: { members: { where: { userId, status: 'active' } } },
  });
  if (!org) {
    return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
  }
  if (org.ownerId === userId) {
    return { effectiveUserId: org.ownerId, isOrgContext: true, memberRole: 'owner', org };
  }
  const member = org.members[0];
  if (member) {
    return { effectiveUserId: org.ownerId, isOrgContext: true, memberRole: member.role, org };
  }
  return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
}`;

const resolveReplacement = `async function resolveWorkspaceContext(req, userId) {
  // Check if the user is registered as a company
  const currentUser = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, accountType: true, companyName: true },
  });
  const isCompanyUser = currentUser?.accountType === 'company' || Boolean(currentUser?.companyName);

  let orgHeader = req.headers['x-organization-id'] || req.query.orgId;
  // If user registered as company, force them into their company organization context
  if (isCompanyUser && (!orgHeader || orgHeader === 'personal')) {
    const ownedOrg = await prisma.organization.findFirst({ where: { ownerId: userId } });
    if (ownedOrg) {
      orgHeader = String(ownedOrg.orgId);
    }
  }

  // If no org header is explicitly passed and user has no personal VMs, check if they are in an active organization
  if (!orgHeader || orgHeader === 'personal') {
    if (!isCompanyUser) {
      const personalVmCount = await prisma.virtualMachine.count({
        where: { userId, status: { not: 'TERMINATED' } },
      });
      if (personalVmCount === 0) {
        const activeMembership = await prisma.organizationMember.findFirst({
          where: { userId, status: 'active' },
          include: { organization: true },
        });
        if (activeMembership && activeMembership.organization) {
          return {
            effectiveUserId: activeMembership.organization.ownerId,
            isOrgContext: true,
            memberRole: activeMembership.role,
            org: activeMembership.organization,
          };
        }
      }
    }
    return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
  }

  const orgId = parseInt(orgHeader, 10);
  if (isNaN(orgId)) {
    return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
  }
  const org = await prisma.organization.findUnique({
    where: { orgId },
    include: { members: { where: { userId, status: 'active' } } },
  });
  if (!org) {
    return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
  }
  if (org.ownerId === userId) {
    return { effectiveUserId: org.ownerId, isOrgContext: true, memberRole: 'owner', org };
  }
  const member = org.members[0];
  if (member) {
    return { effectiveUserId: org.ownerId, isOrgContext: true, memberRole: member.role, org };
  }
  return { effectiveUserId: userId, isOrgContext: false, memberRole: 'owner' };
}

/**
 * Enterprise RBAC helper: Authenticate access to a specific Virtual Machine
 * Verifies direct ownership or authorized active organization team membership.
 */
export async function getAuthorizedVm(vmId, userId, options = {}) {
  const { include, allowedRoles } = options;

  if (!vmId || !userId) {
    return { error: 'Valid VM ID and User ID required.', status: 400 };
  }

  const vm = await prisma.virtualMachine.findUnique({
    where: { vmId },
    include: include || { ipPool: true, image: true, plan: true, subscription: true },
  });

  if (!vm || vm.status === 'TERMINATED') {
    return { error: 'Virtual machine not found.', status: 404 };
  }

  // 1. Direct owner check
  if (vm.userId === userId) {
    return { vm, role: 'owner', isOrgContext: false, effectiveUserId: userId };
  }

  // 2. Organization membership check
  // Check if caller is an active member in an organization owned by the VM owner
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      status: 'active',
      organization: {
        ownerId: vm.userId,
      },
    },
    include: { organization: true },
  });

  if (membership) {
    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(membership.role)) {
      return {
        error: \`Access Denied: Your role '\${membership.role}' does not have permission to perform this action.\`,
        status: 403,
      };
    }
    return {
      vm,
      role: membership.role,
      isOrgContext: true,
      org: membership.organization,
      effectiveUserId: vm.userId,
    };
  }

  return { error: 'Virtual machine not found or unauthorized.', status: 404 };
}`;

// Normalize newlines for matching
function replaceBlock(source, targetText, replacementText) {
  const normSource = source.replace(/\r\n/g, '\n');
  const normTarget = targetText.replace(/\r\n/g, '\n');
  const normReplacement = replacementText.replace(/\r\n/g, '\n');

  if (!normSource.includes(normTarget)) {
    throw new Error('Target block not found: ' + normTarget.substring(0, 80));
  }
  return normSource.replace(normTarget, normReplacement);
}

// 1. Apply resolveWorkspaceContext and getAuthorizedVm
code = replaceBlock(code, resolveTarget, resolveReplacement);

// 2. Update powerAction to use getAuthorizedVm
const powerTarget = `    const { effectiveUserId, isOrgContext, memberRole } = await resolveWorkspaceContext(req, userId);
    if (isOrgContext && memberRole === 'viewer') {
      return res.status(403).json({ error: 'Access Denied: Viewers have read-only access and cannot execute power actions.' });
    }
    if (isOrgContext && memberRole === 'billing') {
      return res.status(403).json({ error: 'Access Denied: Billing specialists cannot execute VM operations.' });
    }
    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId: effectiveUserId },
      include: { subscription: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found.' });
    }`;

const powerReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin', 'devops'],
    });

    if (authResult.error) {
      return res.status(authResult.status || 403).json({ error: authResult.error });
    }

    const { vm } = authResult;`;

code = replaceBlock(code, powerTarget, powerReplacement);

// 3. Update previewResize
const previewResizeTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true, plan: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found.' });
    }`;

const previewResizeReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true, plan: true },
      allowedRoles: ['owner', 'admin'],
    });

    if (authResult.error) {
      return res.status(authResult.status || 403).json({ error: authResult.error });
    }

    const { vm } = authResult;`;

code = replaceBlock(code, previewResizeTarget, previewResizeReplacement);

// 4. Update resizeVM
const resizeTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true, plan: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found.' });
    }`;

const resizeReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true, plan: true },
      allowedRoles: ['owner', 'admin'],
    });

    if (authResult.error) {
      return res.status(authResult.status || 403).json({ error: authResult.error });
    }

    const { vm } = authResult;`;

code = replaceBlock(code, resizeTarget, resizeReplacement);

// 5. Update destroyVM
const destroyTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true },
    });

    if (!vm) {
      // Idempotent: VM is already removed from DB, return 200 OK so UI clears smoothly
      return res.json({
        success: true,
        message: 'Virtual machine is already removed.',
        alreadyRemoved: true,
      });
    }`;

const destroyReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin'],
    });

    if (authResult.error) {
      if (authResult.status === 404) {
        return res.json({
          success: true,
          message: 'Virtual machine is already removed.',
          alreadyRemoved: true,
        });
      }
      return res.status(authResult.status || 403).json({ error: authResult.error });
    }

    const { vm } = authResult;`;

code = replaceBlock(code, destroyTarget, destroyReplacement);

// 6. Update getVMMetrics
const metricsTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found' });
    }`;

const metricsReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops', 'viewer'],
    });

    if (authResult.error) {
      return res.status(authResult.status || 404).json({ error: authResult.error });
    }

    const { vm } = authResult;`;

code = replaceBlock(code, metricsTarget, metricsReplacement);

// 7. Update getConsoleSession
const consoleSessionTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { ipPool: true, image: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found or unauthorized.' });
    }`;

const consoleSessionReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { ipPool: true, image: true },
      allowedRoles: ['owner', 'admin', 'devops', 'viewer'],
    });

    if (authResult.error) {
      return res.status(authResult.status || 403).json({ error: authResult.error });
    }

    const { vm } = authResult;`;

code = replaceBlock(code, consoleSessionTarget, consoleSessionReplacement);

// In getConsoleSession, include effectiveUserId and role in JWT ticket
const ticketSignTarget = `    const ticket = jwt.sign(
      {
        userId,
        vmId,
        vmName: vm.vmName,
        ip: targetIp,
        username: vm.adminUser || 'ubuntu',
        password: decryptVmPassword(vm.adminPassword) || 'root',
        purpose: 'web_terminal',
      },
      secret,
      { expiresIn: '5m' }
    );`;

const ticketSignReplacement = `    const ticket = jwt.sign(
      {
        userId,
        effectiveUserId: vm.userId,
        role: authResult.role,
        vmId,
        vmName: vm.vmName,
        ip: targetIp,
        username: vm.adminUser || 'ubuntu',
        password: decryptVmPassword(vm.adminPassword) || 'root',
        purpose: 'web_terminal',
      },
      secret,
      { expiresIn: '5m' }
    );`;

code = replaceBlock(code, ticketSignTarget, ticketSignReplacement);

// 8. Update snapshots endpoints
const snapGetTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const snapGetReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops', 'viewer'],
    });
    if (authResult.error) return res.status(authResult.status || 404).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, snapGetTarget, snapGetReplacement);

const snapCreateTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const snapCreateReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, snapCreateTarget, snapCreateReplacement);

const snapRestoreTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const snapRestoreReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, snapRestoreTarget, snapRestoreReplacement);

const snapDeleteTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const snapDeleteReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, snapDeleteTarget, snapDeleteReplacement);

// 9. resetVMPassword
const resetPassTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const resetPassReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, resetPassTarget, resetPassReplacement);

// 10. rebuildVMInstance
const rebuildTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
      include: { image: true },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const rebuildReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { image: true },
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, rebuildTarget, rebuildReplacement);

// 11. getVMBackups
const backupsGetTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
      include: {
        plan: true,
        subscription: true,
        backups: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const backupsGetReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: {
        plan: true,
        subscription: true,
        backups: {
          orderBy: { createdAt: 'desc' },
        },
      },
      allowedRoles: ['owner', 'admin', 'devops', 'viewer'],
    });

    if (authResult.error) return res.status(authResult.status || 404).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, backupsGetTarget, backupsGetReplacement);

// 12. createVMBackup
const backupCreateTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
      include: { subscription: true },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const backupCreateReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, backupCreateTarget, backupCreateReplacement);

// 13. restoreVMBackup
const backupRestoreTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const backupRestoreReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, backupRestoreTarget, backupRestoreReplacement);

// 14. deleteVMBackup
const backupDeleteTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const backupDeleteReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, backupDeleteTarget, backupDeleteReplacement);

// 15. toggleVMBackups
const backupToggleTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
      include: { subscription: true },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const backupToggleReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, backupToggleTarget, backupToggleReplacement);

// 16. Firewall get, add, delete
const fwGetTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const fwGetReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops', 'viewer'],
    });
    if (authResult.error) return res.status(authResult.status || 404).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, fwGetTarget, fwGetReplacement);

const fwAddTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const fwAddReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, fwAddTarget, fwAddReplacement);

const fwDelTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId, status: { not: 'TERMINATED' } },
    });
    if (!vm) return res.status(404).json({ error: 'Virtual Machine not found' });`;

const fwDelReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      allowedRoles: ['owner', 'admin', 'devops'],
    });
    if (authResult.error) return res.status(authResult.status || 403).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, fwDelTarget, fwDelReplacement);

// 17. reactivateVMInstance
const reactivateTarget = `    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true },
    });

    if (!vm) return res.status(404).json({ error: 'Virtual machine not found.' });`;

const reactivateReplacement = `    const authResult = await getAuthorizedVm(vmId, userId, {
      include: { subscription: true },
      allowedRoles: ['owner', 'admin', 'billing'],
    });

    if (authResult.error) return res.status(authResult.status || 404).json({ error: authResult.error });
    const { vm } = authResult;`;

code = replaceBlock(code, reactivateTarget, reactivateReplacement);

// Write back to file with CRLF
const finalCode = code.replace(/\n/g, '\r\n');
fs.writeFileSync(vmControllerPath, finalCode, 'utf8');
console.log('Successfully applied all VM RBAC updates to controllers/vmController.js!');
