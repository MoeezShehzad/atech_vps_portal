const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    cd /var/www/atechconsult.com
    node -e '
      import("./lib/prisma.js").then(async (m) => {
        const p = m.default || m.prisma;
        console.time("Query all cities");
        const cities = await p.$queryRawUnsafe("SELECT CityID AS id, RTRIM(CityName) AS name, RTRIM(CityCode) AS code, PK_Province_ID AS provinceId FROM [UM].[UM_Cities] WHERE (IsDeleted = 0 OR IsDeleted IS NULL) AND PK_Province_ID = 82 ORDER BY CityName ASC");
        console.timeEnd("Query all cities");
        console.log("Total returned:", cities.length);
        console.log("First city:", cities[0]?.name);
        console.log("Last city:", cities[cities.length - 1]?.name);
        const jsonStr = JSON.stringify(cities);
        console.log("JSON size in MB:", (jsonStr.length / 1024 / 1024).toFixed(2));
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
