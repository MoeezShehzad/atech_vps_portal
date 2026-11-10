const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to 172.16.17.48. Pulling latest code and starting clean PM2...');

  const script = `
    cd /var/www/atechconsult.com
    git pull origin develop
    cd public && npm run build && cd ..
    pm2 start server.js --name "atech-portal"
    pm2 save
    sleep 3
    pm2 status
    curl -i http://localhost:5000/api/health
  `;

  conn.exec(script, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log('\nFinished with code:', code);
      conn.end();
    });
  });
}).connect({ host: '172.16.17.48', port: 22, username: 'atc', password: 'admin@123' });
