const fs = require('fs');

let code = fs.readFileSync('services/hypervService.js', 'utf8').replace(/\r\n/g, '\n');

const oldBlock = `      // Update VM status in DB
      await prisma.virtualMachine.update({
        where: { vmId: Number(vmId) },
        data: {
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          hypervVmId: result.VMId || \`hyp-\${Date.now()}\`,`;

const newBlock = `      let extractedVmId = result?.VMId || result?.vmId || (result?.output && typeof result.output === 'object' && result.output.VMId);
      if (!extractedVmId && typeof result?.output === 'string') {
        const idMatch = result.output.match(/"VMId"\\s*:\\s*"([a-f0-9-]+)"/i);
        if (idMatch) extractedVmId = idMatch[1];
      }
      if (!extractedVmId) extractedVmId = \`hyp-\${Date.now()}\`;

      // Update VM status in DB
      await prisma.virtualMachine.update({
        where: { vmId: Number(vmId) },
        data: {
          status: 'RUNNING',
          provisioningStatus: 'COMPLETED',
          hypervVmId: extractedVmId,`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('services/hypervService.js', code, 'utf8');
  console.log('Successfully patched services/hypervService.js');
} else {
  console.warn('Block still not found!');
}
