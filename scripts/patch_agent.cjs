const fs = require('fs');

let code = fs.readFileSync('hyperv_agent.js', 'utf8').replace(/\r\n/g, '\n');

// Patch 1: runPowerShell JSON parsing
const oldRunPs = `      // Try parsing JSON from script output (array or object)
      try {
        const jsonMatch = stdout.match(/(\\[[\\s\\S]*\\]|\\{[\\s\\S]*\\})/);
        if (jsonMatch) {
          return resolve(JSON.parse(jsonMatch[0]));
        }
      } catch (e) {
        // Fall back to raw output
      }
      resolve({ status: 'SUCCESS', output: stdout });`;

const newRunPs = `      // Try parsing JSON from script output (lines from bottom up)
      const lines = stdout.trim().split(/\\r?\\n/);
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if ((line.startsWith('{') && line.endsWith('}')) || (line.startsWith('[') && line.endsWith(']'))) {
          try {
            return resolve(JSON.parse(line));
          } catch (e) {}
        }
      }
      try {
        const jsonMatch = stdout.match(/(\\[[\\s\\S]*\\]|\\{[\\s\\S]*\\})/);
        if (jsonMatch) {
          return resolve(JSON.parse(jsonMatch[0]));
        }
      } catch (e) {
        // Fall back to raw output
      }
      resolve({ status: 'SUCCESS', output: stdout });`;

// Patch 2: invalidateAgentCaches on create
const oldCreate = `      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 3. Power Action`;

const newCreate = `      invalidateAgentCaches();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    }

    // 3. Power Action`;

let changed = false;
if (code.includes(oldRunPs)) {
  code = code.replace(oldRunPs, newRunPs);
  changed = true;
  console.log('Patched runPowerShell in hyperv_agent.js');
}

if (code.includes(oldCreate)) {
  code = code.replace(oldCreate, newCreate);
  changed = true;
  console.log('Patched create invalidation in hyperv_agent.js');
}

if (changed) {
  fs.writeFileSync('hyperv_agent.js', code, 'utf8');
  console.log('Successfully saved hyperv_agent.js');
} else {
  console.warn('No changes applied to hyperv_agent.js');
}
