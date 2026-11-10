const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e '
      import("./lib/prisma.js").then(async (m) => {
        const p = m.default || m.prisma;
        const count = await p.$queryRawUnsafe("SELECT COUNT(*) as cnt FROM [UM].[UM_Cities] WHERE PK_Province_ID = 82 AND (IsDeleted = 0 OR IsDeleted IS NULL)");
        console.log("Total cities for province 82 in SQL:", count);
        process.exit(0);
      });
    '
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
