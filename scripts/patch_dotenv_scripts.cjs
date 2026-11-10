const fs = require('fs');
const path = require('path');

const targetFiles = [
  'scripts/seed_policies.cjs',
  'scripts/create_policy_table.cjs',
  'scripts/test_policy_integration.cjs'
];

const dotenvHeader = "const path = require('path');\r\nrequire('dotenv').config({ path: path.resolve(__dirname, '../.env') });\r\n";

for (const rel of targetFiles) {
  if (fs.existsSync(rel)) {
    let code = fs.readFileSync(rel, 'utf8');
    if (!code.includes("require('dotenv').config")) {
      code = dotenvHeader + code;
      fs.writeFileSync(rel, code, 'utf8');
      console.log(`✓ Added dotenv loader to ${rel}`);
    }
  }
}
console.log('Done patching scripts with dotenv loader!');
