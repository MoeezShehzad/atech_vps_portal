const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const importTarget = "import siteRoutes from './routes/siteRoutes.js';";
const importReplace = "import siteRoutes from './routes/siteRoutes.js';\r\nimport policyRoutes from './routes/policyRoutes.js';";
if (!content.includes("import policyRoutes from './routes/policyRoutes.js'")) {
  content = content.replace(importTarget, importReplace);
}

const mountTarget = "app.use('/api/sites', siteRoutes);";
const mountReplace = "app.use('/api/sites', siteRoutes);\r\napp.use('/api/policies', policyRoutes);";
if (!content.includes("app.use('/api/policies', policyRoutes)")) {
  content = content.replace(mountTarget, mountReplace);
}

fs.writeFileSync('server.js', content, 'utf8');
console.log('server.js updated successfully!');
