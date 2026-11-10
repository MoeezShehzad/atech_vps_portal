const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `cd /home/ubuntu/atech_vps_portal && node -e "
    console.time('getStatus');
    import('./services/hypervService.js').then(m => m.default.getStatus('docker-server')).then(r => {
      console.timeEnd('getStatus');
      console.log('Found:', r.Found, 'State:', r.State, 'IPs:', r.IPAddresses);
      process.exit(0);
    }).catch(e => {
      console.error(e);
      process.exit(1);
    });
  "`;

  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      conn.end();
      process.exit(0);
    });
  });
}).connect({
  host: '172.21.39.51',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
