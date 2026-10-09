import { Client } from 'ssh2';
import fs from 'fs';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `python3 -c "
with open('/home/ubuntu/.pm2/logs/atech-backend-error.log') as f:
    lines = f.readlines()
errs = [i for i, l in enumerate(lines) if 'createTicket error' in l]
if errs:
    print(''.join(lines[errs[-1]:errs[-1]+30]))
else:
    print('No createTicket errors found')
"`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', () => {
      conn.end();
      process.exit(0);
    });
  });
});
conn.connect({
  host: '172.19.124.110',
  port: 22,
  username: 'ubuntu',
  password: 'root',
});
