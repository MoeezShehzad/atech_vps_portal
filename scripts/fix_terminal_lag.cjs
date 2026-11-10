const fs = require('fs');

// 1. Update controllers/vmController.js
let vmController = fs.readFileSync('controllers/vmController.js', 'utf8');
const isCRLF1 = vmController.includes('\r\n');
let normVm = vmController.replace(/\r\n/g, '\n');

const oldIpProbe = `    let targetIp = (vm.ipPool && vm.ipPool.length > 0 && vm.ipPool[0].ipAddress !== 'DHCP Pending' && vm.ipPool[0].ipAddress !== 'DHCP Leasing...') 
      ? vm.ipPool[0].ipAddress 
      : null;

    // Check live status from Hyper-V host
    try {
      const live = await hypervService.getStatus(vm.vmName);
      if (live && live.IPAddresses && live.IPAddresses.length > 0) {
        const liveIp = live.IPAddresses.find((ip) => ip && ip !== '127.0.0.1' && !ip.includes(':'));
        if (liveIp) {
          targetIp = liveIp;
          if (vm.ipPool && vm.ipPool.length > 0) {
            await prisma.iPPool.update({
              where: { ipId: vm.ipPool[0].ipId },
              data: { ipAddress: liveIp },
            }).catch(() => {});
          } else {
            await prisma.iPPool.create({
              data: {
                ipAddress: liveIp,
                subnetMask: '255.255.240.0',
                gateway: '172.27.32.1',
                ipType: 'PUBLIC_IPV4',
                status: 'ASSIGNED',
                assignedVmId: vm.vmId,
              },
            }).catch((err) => console.error('[iPPool create error]:', err.message));
          }
        }
      }
    } catch {}`;

const newIpProbe = `    let targetIp = (vm.ipPool && vm.ipPool.length > 0 && vm.ipPool[0].ipAddress && vm.ipPool[0].ipAddress !== 'DHCP Pending' && vm.ipPool[0].ipAddress !== 'DHCP Leasing...') 
      ? vm.ipPool[0].ipAddress 
      : null;

    // Only probe Hyper-V agent if IP is not yet resolved in database
    if (!targetIp) {
      try {
        const live = await hypervService.getStatus(vm.vmName);
        if (live && live.IPAddresses && live.IPAddresses.length > 0) {
          const liveIp = live.IPAddresses.find((ip) => ip && ip !== '127.0.0.1' && !ip.includes(':'));
          if (liveIp) {
            targetIp = liveIp;
            if (vm.ipPool && vm.ipPool.length > 0) {
              await prisma.iPPool.update({
                where: { ipId: vm.ipPool[0].ipId },
                data: { ipAddress: liveIp },
              }).catch(() => {});
            } else {
              await prisma.iPPool.create({
                data: {
                  ipAddress: liveIp,
                  subnetMask: '255.255.240.0',
                  gateway: '172.27.32.1',
                  ipType: 'PUBLIC_IPV4',
                  status: 'ASSIGNED',
                  assignedVmId: vm.vmId,
                },
              }).catch((err) => console.error('[iPPool create error]:', err.message));
            }
          }
        }
      } catch {}
    }`;

if (normVm.includes(oldIpProbe)) {
  normVm = normVm.replace(oldIpProbe, newIpProbe);
  if (isCRLF1) normVm = normVm.replace(/\n/g, '\r\n');
  fs.writeFileSync('controllers/vmController.js', normVm, 'utf8');
  console.log('Updated controllers/vmController.js');
} else {
  console.warn('oldIpProbe not matched in controllers/vmController.js');
}

// 2. Update services/terminalService.js: remove 6s blocking getStatus probe
let termService = fs.readFileSync('services/terminalService.js', 'utf8');
const isCRLF2 = termService.includes('\r\n');
let normTerm = termService.replace(/\r\n/g, '\n');

const oldLiveProbe = `    // Live probe to Hyper-V host to verify actual VM state before initiating SSH connection
    try {
      const liveStatus = await hypervService.getStatus(vm.vmName);
      if (liveStatus && liveStatus.Found) {
        const rawState = String(liveStatus.State || '').toUpperCase();
        if (rawState === 'OFF' || rawState === 'STOPPED' || rawState === 'PAUSED') {
          const newStatus = rawState === 'PAUSED' ? 'PAUSED' : 'STOPPED';
          await prisma.virtualMachine.update({
            where: { vmId: vm.vmId },
            data: { status: newStatus },
          }).catch(() => {});
          vm.status = newStatus;
        }
      }
    } catch (_) {}`;

const newLiveProbe = `    // Quick check: If database already marks VM as stopped, reject immediately without waiting
    // (Live hypervService probe is deferred to SSH error handler if connection fails, preventing 6-second startup delay)`;

if (normTerm.includes(oldLiveProbe)) {
  normTerm = normTerm.replace(oldLiveProbe, newLiveProbe);
  if (isCRLF2) normTerm = normTerm.replace(/\n/g, '\r\n');
  fs.writeFileSync('services/terminalService.js', normTerm, 'utf8');
  console.log('Updated services/terminalService.js (removed 6s blocking probe)');
} else {
  console.warn('oldLiveProbe not matched in services/terminalService.js');
}
