const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

const target = `// 2. CORS Configuration (Tightened for Production)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
].filter(Boolean);`;

const replacement = `// 2. CORS Configuration (Tightened for Production)
const allowedOrigins = [
  'https://www.atechconsult.com',
  'https://atechconsult.com',
  'http://www.atechconsult.com',
  'http://atechconsult.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'http://localhost:5174',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
].filter(Boolean);`;

if (serverCode.includes(target)) {
  serverCode = serverCode.replace(target, replacement);
  fs.writeFileSync('server.js', serverCode, 'utf8');
  console.log('Successfully updated allowedOrigins in server.js');
} else {
  // Try regex
  const regex = /\/\/\s*2\.\s*CORS Configuration[\s\S]*?\]\.filter\(Boolean\);/;
  if (regex.test(serverCode)) {
    serverCode = serverCode.replace(regex, replacement);
    fs.writeFileSync('server.js', serverCode, 'utf8');
    console.log('Successfully updated allowedOrigins via regex');
  } else {
    console.error('Target not found in server.js');
  }
}
