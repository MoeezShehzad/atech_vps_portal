const fs = require('fs');
const path = require('path');

const vmControllerPath = path.join(__dirname, '..', 'controllers', 'vmController.js');
let code = fs.readFileSync(vmControllerPath, 'utf8');

const t = `let orgHeader = req.headers['x-organization-id'] || req.query.orgId;`;
const r = `let orgHeader = req?.headers?.['x-organization-id'] || req?.query?.orgId;`;

if (code.includes(t)) {
  code = code.replace(t, r);
  fs.writeFileSync(vmControllerPath, code, 'utf8');
  console.log('Successfully updated orgHeader safe navigation');
} else {
  console.error('Target not found');
}
