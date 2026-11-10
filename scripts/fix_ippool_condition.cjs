const fs = require('fs');
const path = require('path');

const vmControllerPath = path.join(__dirname, '..', 'controllers', 'vmController.js');
let code = fs.readFileSync(vmControllerPath, 'utf8').replace(/\r\n/g, '\n');

const target = `            if (vm.ipPool && vm.ipPool.length > 0 && vm.ipPool[0].ipAddress !== liveIp) {
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
            }`;

const replacement = `            if (vm.ipPool && vm.ipPool.length > 0) {
              if (vm.ipPool[0].ipAddress !== liveIp) {
                await prisma.iPPool.update({
                  where: { ipId: vm.ipPool[0].ipId },
                  data: { ipAddress: liveIp },
                }).catch(() => {});
              }
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
            }`;

if (code.includes(target)) {
  code = code.replace(target, replacement).replace(/\n/g, '\r\n');
  fs.writeFileSync(vmControllerPath, code, 'utf8');
  console.log('Successfully fixed iPPool update condition in vmController.js');
} else {
  console.error('Target for iPPool condition not found');
}
