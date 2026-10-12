import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Reconfiguring site_3 with dedicated preview port 8103...');
  const cmd = `
    # 1. Stop and remove existing site_3 container
    docker rm -f site_3 2>/dev/null || true

    # 2. Add dynamic WP_HOME and WP_SITEURL to wp-config.php if not present
    if ! grep -q "WP_HOME" /var/atc/sites/site_3/public_html/wp-config.php 2>/dev/null; then
      sed -i "/<?php/a define('WP_HOME', 'http://' . \\$_SERVER['HTTP_HOST']);\\ndefine('WP_SITEURL', 'http://' . \\$_SERVER['HTTP_HOST']);" /var/atc/sites/site_3/public_html/wp-config.php
    fi

    # 3. Launch site_3 with both internal network AND direct preview port 8103
    docker run -d \\
      --name site_3 \\
      --restart unless-stopped \\
      --network atc-net \\
      -p 8103:80 \\
      --memory=192m \\
      --cpus=0.75 \\
      -v /var/atc/sites/site_3/public_html:/var/www/html \\
      -e WORDPRESS_DB_HOST=atc-mariadb \\
      -e WORDPRESS_DB_USER=usr_5568 \\
      -e WORDPRESS_DB_PASSWORD=f2b92de0d5b37b4df464c981 \\
      -e WORDPRESS_DB_NAME=atc_db_my_wordpress_blog_5568 \\
      wordpress:php8.2-apache

    # 4. Reload proxy
    docker exec atc-proxy nginx -s reload

    # 5. Verify listening ports
    docker ps --filter "name=site_3"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', code => {
      console.log('Exit code:', code);
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
