const fs = require('fs');

let agent = fs.readFileSync('hyperv_agent.js', 'utf8');
let sanitizer = fs.readFileSync('lib/errorSanitizer.js', 'utf8');

// remove import
agent = agent.replace("import { sanitizeInfrastructureError } from './lib/errorSanitizer.js';", '');

// remove export keyword from sanitizer and append
sanitizer = sanitizer.replace('export function sanitizeInfrastructureError', 'function sanitizeInfrastructureError');
agent = agent + '\n\n' + sanitizer;

fs.writeFileSync('hyperv_agent.js', agent, 'utf8');
console.log('Successfully inlined errorSanitizer into hyperv_agent.js');
