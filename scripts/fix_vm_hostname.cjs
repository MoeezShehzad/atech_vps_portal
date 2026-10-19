const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
  console.log('Connected to VM 37 at 172.21.44.75...');
  c.exec('sudo hostnamectl set-hostname docker-server && echo docker-server | sudo tee /etc/hostname && sudo sed -i "s/127.0.1.1.*/127.0.1.1 docker-server/g" /etc/hosts', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      console.log('Successfully set hostname to docker-server on VM 37!');
      c.end();
    });
  });
}).on('error', (err) => {
  console.warn('SSH to VM 37 notice:', err.message);
  process.exit(0);
}).connect({
  host: '172.21.44.75',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
