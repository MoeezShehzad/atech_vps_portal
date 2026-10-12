import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const vhost = `server {
    listen 80;
    server_name cloudapp.atechconsult.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://site_2:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

  const b64 = Buffer.from(vhost).toString('base64');
  const cmd = `echo "${b64}" | base64 -d | sudo tee /var/atc/proxy/conf.d/site_2.conf && docker exec atc-proxy nginx -t && docker exec atc-proxy nginx -s reload`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', code => {
      console.log('Fixed vhost with code:', code);
      conn.end();
    });
  });
});

conn.connect({
  host: '172.27.47.192',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
