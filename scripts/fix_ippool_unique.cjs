const fs = require('fs');

let code = fs.readFileSync('controllers/vmController.js', 'utf8');

const regex = /\/\/\s*2\.\s*Assign IP:\s*only claim a public IP if purchased, otherwise allocate local DHCP lease\s*ipRecord\s*=\s*await\s*prisma\.iPPool\.create\(\{\s*data:\s*\{\s*ipAddress:\s*'DHCP Leasing\.\.\.',\s*subnetMask:\s*'255\.255\.240\.0',\s*gateway:\s*'172\.27\.32\.1',\s*ipType:\s*'LOCAL_IPV4',\s*status:\s*'AVAILABLE',\s*\},?\s*\}\);/;

const replacement = `// 2. Assign IP: pick available IP from pool or generate unique pending DHCP lease
    ipRecord = await prisma.iPPool.findFirst({
      where: { status: 'AVAILABLE' },
    });
    if (!ipRecord) {
      ipRecord = await prisma.iPPool.create({
        data: {
          ipAddress: \`DHCP-\${Date.now()}-\${Math.floor(100 + Math.random() * 900)}\`,
          subnetMask: '255.255.255.0',
          gateway: '172.16.16.1',
          ipType: 'LOCAL_IPV4',
          status: 'AVAILABLE',
        },
      });
    }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('controllers/vmController.js', code, 'utf8');
  console.log('Successfully replaced via Regex in vmController.js');
} else {
  console.error('Regex did not match');
}
