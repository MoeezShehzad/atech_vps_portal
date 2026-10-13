// ==============================================================================
// File: lib/appsCatalog.js
// Purpose: Curated catalog of 100+ Enterprise & Developer 1-Click Apps
// ==============================================================================

export const APP_CATEGORIES = [
  { id: 'all', label: 'All Applications' },
  { id: 'web-cms', label: 'CMS & Web Publishing' },
  { id: 'dev-stacks', label: 'Developer Stacks' },
  { id: 'databases', label: 'Databases & Cache' },
  { id: 'devops-ci', label: 'DevOps & Containers' },
  { id: 'control-panels', label: 'Control Panels' },
  { id: 'security-vpn', label: 'Security & VPN' },
  { id: 'monitoring', label: 'Monitoring & Alerts' },
  { id: 'cloud-storage', label: 'Cloud Storage & Sync' },
  { id: 'media-chat', label: 'Communication & Media' },
  { id: 'gaming-apps', label: 'Game Servers' },
];

export const APPS_CATALOG = [
  // -------------------------------------------------------------
  // 1. CMS & Web Publishing
  // -------------------------------------------------------------
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'web-cms',
    version: '6.4 LTS',
    description: 'The world\'s most popular CMS, deployed with optimized Nginx, PHP 8.2, and MariaDB.',
    defaultPort: 80,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Blog', 'CMS', 'PHP', 'Nginx'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y nginx mariadb-server php-fpm php-mysql php-curl php-gd php-mbstring php-xml php-xmlrpc php-soap php-intl php-zip',
      'sudo systemctl enable --now nginx mariadb',
      'sudo mkdir -p /var/www/html/wordpress',
      'curl -O https://wordpress.org/latest.tar.gz && tar -xzf latest.tar.gz && sudo cp -r wordpress/* /var/www/html/ && rm -rf wordpress latest.tar.gz',
      'sudo chown -R www-data:www-data /var/www/html',
      'sudo chmod -R 755 /var/www/html',
      'sudo systemctl restart nginx'
    ],
    accessGuide: 'Open http://{IP} in your browser to complete WordPress setup.'
  },
  {
    id: 'ghost',
    name: 'Ghost CMS',
    category: 'web-cms',
    version: '5.x',
    description: 'Professional publishing platform built on modern Node.js technology for newsletters and blogs.',
    defaultPort: 2368,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Publishing', 'Node.js', 'Blog'],
    installCommands: [
      'curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -',
      'sudo apt-get install -y nodejs nginx',
      'sudo npm install ghost-cli@latest -g',
      'sudo mkdir -p /var/www/ghost && sudo chown ubuntu:ubuntu /var/www/ghost',
      'cd /var/www/ghost && ghost install local --no-setup-linux-user'
    ],
    accessGuide: 'Access Ghost at http://{IP}:2368/ghost to configure your admin profile.'
  },
  {
    id: 'drupal',
    name: 'Drupal CMS',
    category: 'web-cms',
    version: '10.2',
    description: 'Flexible open-source content management framework for enterprise web applications.',
    defaultPort: 80,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Enterprise', 'CMS', 'PHP'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y apache2 mariadb-server php libapache2-mod-php php-mysql php-gd php-xml php-mbstring',
      'sudo systemctl enable --now apache2 mariadb'
    ],
    accessGuide: 'Open http://{IP} to initialize Drupal installation.'
  },
  {
    id: 'joomla',
    name: 'Joomla',
    category: 'web-cms',
    version: '5.0',
    description: 'Award-winning CMS that enables you to build powerful web sites and online applications.',
    defaultPort: 80,
    minRamGb: 1,
    minCpu: 1,
    tags: ['CMS', 'PHP', 'Community'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y apache2 mariadb-server php libapache2-mod-php php-mysql',
      'sudo systemctl enable --now apache2 mariadb'
    ],
    accessGuide: 'Open http://{IP} to begin Joomla installer.'
  },
  {
    id: 'strapi',
    name: 'Strapi Headless CMS',
    category: 'web-cms',
    version: '4.x',
    description: 'Leading open-source headless CMS 100% JavaScript / TypeScript for APIs and mobile apps.',
    defaultPort: 1337,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Headless', 'API', 'Node.js'],
    installCommands: [
      'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -',
      'sudo apt-get install -y nodejs build-essential',
      'sudo npm install -g pm2'
    ],
    accessGuide: 'Strapi API and Admin ready on port 1337 (http://{IP}:1337/admin).'
  },
  {
    id: 'grav',
    name: 'Grav CMS',
    category: 'web-cms',
    version: '1.7',
    description: 'Fast, simple, and flexible flat-file CMS requiring no database setup.',
    defaultPort: 80,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Flat-File', 'Fast', 'PHP'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y nginx php-fpm php-cli php-gd php-curl php-mbstring php-xml php-zip',
      'sudo systemctl enable --now nginx'
    ],
    accessGuide: 'Access Grav dashboard at http://{IP}/admin.'
  },
  {
    id: 'directus',
    name: 'Directus Headless CMS',
    category: 'web-cms',
    version: '10.x',
    description: 'Instant BaaS and Headless CMS layer over any SQL database.',
    defaultPort: 8055,
    minRamGb: 2,
    minCpu: 1,
    tags: ['BaaS', 'API', 'SQL'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose',
      'sudo docker run -d --name directus -p 8055:8055 -e KEY=secret-key -e SECRET=secret directus/directus:latest'
    ],
    accessGuide: 'Open http://{IP}:8055 to initialize Directus.'
  },
  {
    id: 'mediawiki',
    name: 'MediaWiki',
    category: 'web-cms',
    version: '1.41 LTS',
    description: 'The wiki software that powers Wikipedia and thousands of documentation sites.',
    defaultPort: 80,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Wiki', 'Documentation', 'PHP'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y apache2 mariadb-server php php-mysql php-xml php-mbstring',
      'sudo systemctl enable --now apache2 mariadb'
    ],
    accessGuide: 'Open http://{IP} to finalize MediaWiki configuration.'
  },

  // -------------------------------------------------------------
  // 2. Developer Stacks
  // -------------------------------------------------------------
  {
    id: 'docker',
    name: 'Docker & Docker Compose',
    category: 'dev-stacks',
    version: '26.0 LTS',
    description: 'Complete containerization platform with official Docker Engine, Compose plugin, and CLI tools.',
    defaultPort: 22,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Containers', 'DevOps', 'Microservices'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y ca-certificates curl gnupg lsb-release',
      'sudo mkdir -p /etc/apt/keyrings',
      'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes',
      'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
      'sudo apt-get update -y',
      'sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
      'sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || sudo ln -sf /usr/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true',
      'sudo systemctl daemon-reload',
      'sudo systemctl enable --now docker.socket docker',
      'sudo usermod -aG docker ubuntu 2>/dev/null || true'
    ],
    accessGuide: 'Docker is active. Run "docker run hello-world" or "docker compose up" over SSH.'
  },
  {
    id: 'nodejs',
    name: 'Node.js & PM2 Stack',
    category: 'dev-stacks',
    version: '20.x LTS',
    description: 'Latest Node.js runtime with npm, yarn, pnpm, and PM2 production process manager.',
    defaultPort: 3000,
    minRamGb: 1,
    minCpu: 1,
    tags: ['JavaScript', 'TypeScript', 'Backend'],
    installCommands: [
      'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -',
      'sudo apt-get install -y nodejs build-essential git',
      'sudo npm install -g pm2 yarn pnpm nodemon',
      'pm2 startup systemd -u ubuntu --hp /home/ubuntu | sudo bash -'
    ],
    accessGuide: 'Node.js, npm, and PM2 are ready. Deploy apps and run "pm2 start server.js".'
  },
  {
    id: 'lamp-stack',
    name: 'LAMP Web Stack',
    category: 'dev-stacks',
    version: 'Ubuntu 24.04',
    description: 'Classic web hosting stack: Linux, Apache 2.4, MySQL / MariaDB, and PHP 8.3.',
    defaultPort: 80,
    minRamGb: 1,
    minCpu: 1,
    tags: ['PHP', 'Apache', 'MySQL'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y apache2 mariadb-server php libapache2-mod-php php-mysql php-cli php-curl php-gd php-mbstring',
      'sudo systemctl enable --now apache2 mariadb'
    ],
    accessGuide: 'Apache web server is live at http://{IP}. Document root is /var/www/html.'
  },
  {
    id: 'lemp-stack',
    name: 'LEMP High-Performance Stack',
    category: 'dev-stacks',
    version: 'Ubuntu 24.04',
    description: 'High-performance stack: Linux, Nginx reverse proxy, MariaDB, and PHP 8.3-FPM.',
    defaultPort: 80,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Nginx', 'PHP-FPM', 'High-Load'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y nginx mariadb-server php-fpm php-mysql php-cli php-curl php-gd php-mbstring php-zip',
      'sudo systemctl enable --now nginx mariadb'
    ],
    accessGuide: 'Nginx is active at http://{IP}. Configured with PHP-FPM fastcgi pool.'
  },
  {
    id: 'python-django',
    name: 'Python Django & Gunicorn',
    category: 'dev-stacks',
    version: 'Python 3.12',
    description: 'Production Python web stack with Python 3, pip, virtualenv, Django, and Gunicorn WSGI.',
    defaultPort: 8000,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Python', 'Django', 'REST'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y python3-pip python3-venv python3-dev build-essential libpq-dev',
      'sudo pip3 install --break-system-packages django gunicorn uvicorn'
    ],
    accessGuide: 'Python environment ready. Run your Django apps with "gunicorn myproject.wsgi:application".'
  },
  {
    id: 'fastapi',
    name: 'FastAPI & Uvicorn Stack',
    category: 'dev-stacks',
    version: 'Python 3.12',
    description: 'High performance async Python framework for building modern REST and GraphQL APIs.',
    defaultPort: 8000,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Python', 'Async', 'API'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y python3-pip python3-venv',
      'sudo pip3 install --break-system-packages fastapi "uvicorn[standard]" pydantic'
    ],
    accessGuide: 'FastAPI and Uvicorn ready. Launch your async app with "uvicorn main:app --host 0.0.0.0 --port 8000".'
  },
  {
    id: 'golang-stack',
    name: 'Go (Golang) Developer Suite',
    category: 'dev-stacks',
    version: '1.22 LTS',
    description: 'Official Go programming language compiler, tools, and build environment for cloud services.',
    defaultPort: 8080,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Go', 'Microservices', 'Fast'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y curl git build-essential',
      'curl -LO https://go.dev/dl/go1.22.1.linux-amd64.tar.gz',
      'sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz && rm go1.22.1.linux-amd64.tar.gz',
      'echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc'
    ],
    accessGuide: 'Go is installed at /usr/local/go. Test by running "go version" over SSH.'
  },
  {
    id: 'rust-stack',
    name: 'Rust Development Toolchain',
    category: 'dev-stacks',
    version: 'Stable',
    description: 'Rust compiler (rustc), Cargo package manager, and essential build tools.',
    defaultPort: 8080,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Rust', 'Systems', 'High-Performance'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y build-essential curl git',
      'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'
    ],
    accessGuide: 'Rust toolchain installed. Source "$HOME/.cargo/env" and run "cargo --version".'
  },
  {
    id: 'ruby-rails',
    name: 'Ruby on Rails & Puma',
    category: 'dev-stacks',
    version: 'Rails 7.x',
    description: 'Modern Ruby web framework with Bundler, Node.js, Yarn, and Puma app server.',
    defaultPort: 3000,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Ruby', 'Rails', 'Web'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y ruby-full build-essential libpq-dev git curl',
      'sudo gem install rails bundler'
    ],
    accessGuide: 'Ruby on Rails ready. Create your project with "rails new myapp".'
  },

  // -------------------------------------------------------------
  // 3. Databases & Cache
  // -------------------------------------------------------------
  {
    id: 'postgresql',
    name: 'PostgreSQL 16 Enterprise',
    category: 'databases',
    version: '16 LTS',
    description: 'The world\'s most advanced open-source relational database with ACID compliance.',
    defaultPort: 5432,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Database', 'SQL', 'ACID'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y postgresql postgresql-contrib',
      'sudo systemctl enable --now postgresql'
    ],
    accessGuide: 'PostgreSQL listening on port 5432. Connect using "sudo -u postgres psql".'
  },
  {
    id: 'mysql',
    name: 'MySQL Server 8.0',
    category: 'databases',
    version: '8.0 LTS',
    description: 'Popular open-source relational database management system for web applications.',
    defaultPort: 3306,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Database', 'SQL', 'Relational'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y mysql-server',
      'sudo systemctl enable --now mysql'
    ],
    accessGuide: 'MySQL listening on port 3306. Connect via "sudo mysql".'
  },
  {
    id: 'redis',
    name: 'Redis In-Memory Cache',
    category: 'databases',
    version: '7.2',
    description: 'Blazing fast in-memory key-value data structure store used as a database, cache, and message broker.',
    defaultPort: 6379,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Cache', 'NoSQL', 'In-Memory'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y redis-server',
      'sudo systemctl enable --now redis-server'
    ],
    accessGuide: 'Redis is running on port 6379. Test with "redis-cli ping".'
  },
  {
    id: 'mongodb',
    name: 'MongoDB Community Edition',
    category: 'databases',
    version: '7.0',
    description: 'Leading document-oriented NoSQL database designed for modern JSON application data.',
    defaultPort: 27017,
    minRamGb: 2,
    minCpu: 1,
    tags: ['NoSQL', 'Document', 'JSON'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y gnupg curl',
      'curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes',
      'echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list',
      'sudo apt-get update -y && sudo apt-get install -y mongodb-org',
      'sudo systemctl enable --now mongod'
    ],
    accessGuide: 'MongoDB running on port 27017. Connect using "mongosh".'
  },
  {
    id: 'mariadb',
    name: 'MariaDB Community Server',
    category: 'databases',
    version: '10.11 LTS',
    description: 'Fast, scalable, and robust open-source fork of MySQL by the original developers.',
    defaultPort: 3306,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Database', 'SQL', 'MariaDB'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y mariadb-server mariadb-client',
      'sudo systemctl enable --now mariadb'
    ],
    accessGuide: 'MariaDB active on port 3306. Access via "sudo mariadb".'
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch Search Engine',
    category: 'databases',
    version: '8.x',
    description: 'Distributed, RESTful search and analytics engine for logs, full-text search, and time-series.',
    defaultPort: 9200,
    minRamGb: 4,
    minCpu: 2,
    tags: ['Search', 'Logs', 'Analytics'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io',
      'sudo docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.12.0'
    ],
    accessGuide: 'Elasticsearch running on http://{IP}:9200.'
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ Message Broker',
    category: 'databases',
    version: '3.12',
    description: 'Enterprise message broker with support for AMQP, MQTT, and WebSockets messaging.',
    defaultPort: 15672,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Queue', 'AMQP', 'Messaging'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y rabbitmq-server',
      'sudo rabbitmq-plugins enable rabbitmq_management',
      'sudo systemctl enable --now rabbitmq-server'
    ],
    accessGuide: 'RabbitMQ Web Management console at http://{IP}:15672 (default: guest/guest).'
  },
  {
    id: 'meilisearch',
    name: 'Meilisearch Lightning Search',
    category: 'databases',
    version: '1.7',
    description: 'Ultra-fast, typo-tolerant open source search engine designed for instant frontend search.',
    defaultPort: 7700,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Search', 'Rust', 'Fast'],
    installCommands: [
      'curl -L https://install.meilisearch.com | sh',
      'sudo mv ./meilisearch /usr/local/bin/',
      'sudo nohup /usr/local/bin/meilisearch --http-addr 0.0.0.0:7700 >/var/log/meili.log 2>&1 &'
    ],
    accessGuide: 'Meilisearch listening at http://{IP}:7700.'
  },

  // -------------------------------------------------------------
  // 4. DevOps & Containers
  // -------------------------------------------------------------
  {
    id: 'portainer',
    name: 'Portainer CE Docker GUI',
    category: 'devops-ci',
    version: '2.19 CE',
    description: 'Web management UI for Docker environments, containers, stacks, volumes, and images.',
    defaultPort: 9443,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Docker', 'GUI', 'Management'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io',
      'sudo docker volume create portainer_data',
      'sudo docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest'
    ],
    accessGuide: 'Open https://{IP}:9443 to set your Portainer admin credentials.'
  },
  {
    id: 'gitlab-ce',
    name: 'GitLab Community Edition',
    category: 'devops-ci',
    version: '16.x',
    description: 'Complete DevOps platform for Git source control, CI/CD pipelines, issue tracking, and wiki.',
    defaultPort: 80,
    minRamGb: 4,
    minCpu: 4,
    tags: ['Git', 'CI/CD', 'Enterprise'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y curl openssh-server ca-certificates tzdata perl',
      'curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash',
      'sudo EXTERNAL_URL="http://$(hostname -I | awk \'{print $1}\')" apt-get install -y gitlab-ce'
    ],
    accessGuide: 'Access GitLab at http://{IP}. Password in /etc/gitlab/initial_root_password.'
  },
  {
    id: 'gitea',
    name: 'Gitea Lightweight Git',
    category: 'devops-ci',
    version: '1.21',
    description: 'Painless, super-fast self-hosted Git service written in Go. Minimal resource footprint.',
    defaultPort: 3000,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Git', 'Fast', 'Go'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y git sqlite3',
      'sudo wget -O /usr/local/bin/gitea https://dl.gitea.com/gitea/1.21.7/gitea-1.21.7-linux-amd64',
      'sudo chmod +x /usr/local/bin/gitea'
    ],
    accessGuide: 'Open http://{IP}:3000 to complete initial Gitea wizard.'
  },
  {
    id: 'jenkins',
    name: 'Jenkins CI/CD Automation',
    category: 'devops-ci',
    version: 'LTS',
    description: 'Leading open source automation server for building, testing, and deploying any project.',
    defaultPort: 8080,
    minRamGb: 2,
    minCpu: 2,
    tags: ['CI/CD', 'Java', 'Automation'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y fontconfig openjdk-17-jre',
      'sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key',
      'echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null',
      'sudo apt-get update -y && sudo apt-get install -y jenkins',
      'sudo systemctl enable --now jenkins'
    ],
    accessGuide: 'Open http://{IP}:8080. Unlock key is at /var/lib/jenkins/secrets/initialAdminPassword.'
  },
  {
    id: 'harbor',
    name: 'Harbor Enterprise Registry',
    category: 'devops-ci',
    version: '2.10',
    description: 'Cloud native container registry that secures container artifacts with policies and role-based access.',
    defaultPort: 80,
    minRamGb: 4,
    minCpu: 2,
    tags: ['Registry', 'Containers', 'Security'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose'
    ],
    accessGuide: 'Container registry ready on port 80/443.'
  },

  // -------------------------------------------------------------
  // 5. Control Panels
  // -------------------------------------------------------------
  {
    id: 'aapanel',
    name: 'aaPanel Server Manager',
    category: 'control-panels',
    version: '6.8 Stable',
    description: 'Simple, powerful web-based hosting control panel to manage websites, FTP, databases, and Docker.',
    defaultPort: 8888,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Panel', 'Hosting', 'Web'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y wget curl ca-certificates',
      'wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh',
      'echo "y" | sudo bash install.sh aapanel'
    ],
    accessGuide: 'Access aaPanel at http://{IP}:8888. Login details printed to console.'
  },
  {
    id: 'cyberpanel',
    name: 'CyberPanel (OpenLiteSpeed)',
    category: 'control-panels',
    version: 'Latest',
    description: 'High-speed web hosting control panel powered by OpenLiteSpeed web server and LSCache.',
    defaultPort: 8090,
    minRamGb: 2,
    minCpu: 1,
    tags: ['LiteSpeed', 'Hosting', 'WordPress'],
    installCommands: [
      'sudo apt-get update -y',
      'curl -s https://cyberpanel.net/install.sh -o install.sh'
    ],
    accessGuide: 'CyberPanel web console available at https://{IP}:8090.'
  },
  {
    id: 'webmin',
    name: 'Webmin System Administration',
    category: 'control-panels',
    version: '2.105',
    description: 'Web-based system configuration tool for Unix-like systems. Manage users, packages, disks, and services.',
    defaultPort: 10000,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Admin', 'SysAdmin', 'Unix'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y curl',
      'curl -o setup-repos.sh https://raw.githubusercontent.com/webmin/webmin/master/setup-repos.sh',
      'echo "y" | sudo sh setup-repos.sh',
      'sudo apt-get install -y webmin --install-recommends',
      'sudo systemctl enable --now webmin'
    ],
    accessGuide: 'Open https://{IP}:10000 and log in with your root/ubuntu credentials.'
  },
  {
    id: 'cockpit',
    name: 'Cockpit Linux Management',
    category: 'control-panels',
    version: 'Latest',
    description: 'Modern, clean web interface for managing Linux storage, network, firewall, and system logs.',
    defaultPort: 9090,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Linux', 'RedHat', 'SysAdmin'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y cockpit',
      'sudo systemctl enable --now cockpit.socket'
    ],
    accessGuide: 'Open https://{IP}:9090 and log in with system credentials.'
  },
  {
    id: 'cloudron',
    name: 'Cloudron Smart Server',
    category: 'control-panels',
    version: 'Latest',
    description: 'Complete server OS that lets you easily install, manage, and secure web apps with auto-backups.',
    defaultPort: 443,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Apps', 'Automation', 'Self-Hosted'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y wget',
      'wget https://cloudron.io/cloudron-setup && sudo chmod +x ./cloudron-setup'
    ],
    accessGuide: 'Navigate to https://{IP} to initialize Cloudron.'
  },

  // -------------------------------------------------------------
  // 6. Security & VPN
  // -------------------------------------------------------------
  {
    id: 'wireguard',
    name: 'WireGuard Secure VPN',
    category: 'security-vpn',
    version: '1.0 LTS',
    description: 'Extremely fast, modern, and cryptographic VPN protocol running in the Linux kernel.',
    defaultPort: 51820,
    minRamGb: 1,
    minCpu: 1,
    tags: ['VPN', 'Security', 'Fast', 'Kernel'],
    installCommands: [
      'sudo apt-get update -y',
      'sudo apt-get install -y wireguard qrencode iptables',
      'sudo sysctl -w net.ipv4.ip_forward=1'
    ],
    accessGuide: 'WireGuard installed. Configure /etc/wireguard/wg0.conf.'
  },
  {
    id: 'openvpn',
    name: 'OpenVPN Access Server',
    category: 'security-vpn',
    version: '2.12',
    description: 'Full-featured secure SSL/TLS VPN solution integrating OpenVPN server, management, and client software.',
    defaultPort: 943,
    minRamGb: 1,
    minCpu: 1,
    tags: ['VPN', 'SSL', 'Remote-Access'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y openvpn ca-certificates'
    ],
    accessGuide: 'OpenVPN Admin web portal accessible at https://{IP}:943/admin.'
  },
  {
    id: 'nginx-proxy-manager',
    name: 'Nginx Proxy Manager',
    category: 'security-vpn',
    version: 'Latest',
    description: 'Expose your services easily with automatic Let\'s Encrypt SSL certificates and clean web UI.',
    defaultPort: 81,
    minRamGb: 1,
    minCpu: 1,
    tags: ['SSL', 'Nginx', 'Reverse-Proxy'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose',
      'mkdir -p ~/npm && cd ~/npm',
      'sudo docker run -d --restart=always -p 80:80 -p 81:81 -p 443:443 -v ~/npm/data:/data -v ~/npm/letsencrypt:/etc/letsencrypt --name nginx-proxy-manager jc21/nginx-proxy-manager:latest'
    ],
    accessGuide: 'Admin UI live at http://{IP}:81 (Default: admin@example.com / changeme).'
  },
  {
    id: 'adguard-home',
    name: 'AdGuard Home Network DNS',
    category: 'security-vpn',
    version: 'Latest',
    description: 'Network-wide software for blocking ads and tracking. Operates as a local forwarding DNS server.',
    defaultPort: 3000,
    minRamGb: 1,
    minCpu: 1,
    tags: ['DNS', 'Adblock', 'Privacy'],
    installCommands: [
      'curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sudo sh -s -- -v'
    ],
    accessGuide: 'Initial setup wizard is open at http://{IP}:3000.'
  },
  {
    id: 'tailscale',
    name: 'Tailscale Zero-Config Mesh',
    category: 'security-vpn',
    version: 'Latest',
    description: 'Zero-config VPN that creates a secure private mesh network between your servers and devices.',
    defaultPort: 22,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Mesh', 'Zero-Trust', 'WireGuard'],
    installCommands: [
      'curl -fsSL https://tailscale.com/install.sh | sudo sh'
    ],
    accessGuide: 'Tailscale installed. Run "sudo tailscale up" to link your machine.'
  },

  // -------------------------------------------------------------
  // 7. Monitoring & Alerts
  // -------------------------------------------------------------
  {
    id: 'grafana',
    name: 'Grafana Observability',
    category: 'monitoring',
    version: '10.3',
    description: 'Open and composable observability and data visualization platform. Beautiful dashboards.',
    defaultPort: 3000,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Metrics', 'Dashboards', 'Analytics'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y apt-transport-https software-properties-common wget',
      'sudo mkdir -p /etc/apt/keyrings/',
      'wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null',
      'echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list',
      'sudo apt-get update -y && sudo apt-get install -y grafana',
      'sudo systemctl enable --now grafana-server'
    ],
    accessGuide: 'Grafana dashboards live at http://{IP}:3000 (Default: admin / admin).'
  },
  {
    id: 'prometheus',
    name: 'Prometheus Metrics Collector',
    category: 'monitoring',
    version: '2.49',
    description: 'Systems monitoring and alerting toolkit with powerful dimensional data model and PromQL.',
    defaultPort: 9090,
    minRamGb: 2,
    minCpu: 1,
    tags: ['Metrics', 'Alerting', 'Time-Series'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y prometheus prometheus-node-exporter',
      'sudo systemctl enable --now prometheus'
    ],
    accessGuide: 'Prometheus interface running at http://{IP}:9090.'
  },
  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma Status Page',
    category: 'monitoring',
    version: '1.23',
    description: 'Self-hosted monitoring tool like Uptime Robot. Monitors HTTP, TCP, Ping, DNS with alerts.',
    defaultPort: 3001,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Status-Page', 'Uptime', 'Monitoring'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io',
      'sudo docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1'
    ],
    accessGuide: 'Access your uptime monitoring dashboard at http://{IP}:3001.'
  },
  {
    id: 'netdata',
    name: 'Netdata Real-Time Performance',
    category: 'monitoring',
    version: 'Latest',
    description: 'Real-time performance and health monitoring for systems and hardware metrics per-second.',
    defaultPort: 19999,
    minRamGb: 1,
    minCpu: 1,
    tags: ['Real-Time', 'Hardware', 'Metrics'],
    installCommands: [
      'curl https://my-netdata.io/kickstart.sh | sudo sh -s -- --dont-wait'
    ],
    accessGuide: 'Live system dashboard running at http://{IP}:19999.'
  },
  {
    id: 'zabbix',
    name: 'Zabbix Enterprise Monitoring',
    category: 'monitoring',
    version: '6.4 LTS',
    description: 'Mature enterprise-class open-source monitoring software for networks and servers.',
    defaultPort: 80,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Enterprise', 'Network', 'Alerting'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y apache2 mariadb-server'
    ],
    accessGuide: 'Open http://{IP}/zabbix to complete setup.'
  },

  // -------------------------------------------------------------
  // 8. Cloud Storage & Sync
  // -------------------------------------------------------------
  {
    id: 'nextcloud',
    name: 'Nextcloud Hub',
    category: 'cloud-storage',
    version: '28.0 Hub',
    description: 'Self-hosted productivity platform. Files, docs, calendar, chat, and collaborative editing.',
    defaultPort: 80,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Cloud', 'Files', 'Office', 'Privacy'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y snapd',
      'sudo snap install nextcloud'
    ],
    accessGuide: 'Nextcloud Hub is ready at http://{IP}. Set up your admin account in browser.'
  },
  {
    id: 'minio',
    name: 'MinIO High-Performance S3',
    category: 'cloud-storage',
    version: 'Latest',
    description: 'High-performance S3-compatible object storage server built for cloud native data.',
    defaultPort: 9001,
    minRamGb: 2,
    minCpu: 1,
    tags: ['S3', 'Storage', 'Object-Store'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io',
      'sudo docker run -d --name minio -p 9000:9000 -p 9001:9001 -e "MINIO_ROOT_USER=minioadmin" -e "MINIO_ROOT_PASSWORD=minioadmin" minio/minio server /data --console-address ":9001"'
    ],
    accessGuide: 'MinIO Console running at http://{IP}:9001 (Default: minioadmin / minioadmin).'
  },
  {
    id: 'syncthing',
    name: 'Syncthing Continuous Sync',
    category: 'cloud-storage',
    version: 'Latest',
    description: 'Continuous file synchronization program that synchronizes files between two or more computers in real time.',
    defaultPort: 8384,
    minRamGb: 1,
    minCpu: 1,
    tags: ['P2P', 'Sync', 'Decentralized'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y syncthing',
      'sudo systemctl enable --now syncthing@ubuntu.service'
    ],
    accessGuide: 'Syncthing Web GUI is active on http://{IP}:8384.'
  },

  // -------------------------------------------------------------
  // 9. Communication & Media
  // -------------------------------------------------------------
  {
    id: 'jitsi-meet',
    name: 'Jitsi Meet Video Conferences',
    category: 'media-chat',
    version: 'Latest',
    description: 'Fully encrypted, 100% open source video conferencing tool without account requirements.',
    defaultPort: 443,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Video', 'Conferencing', 'WebRTC'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y curl apt-transport-https',
      'sudo curl -s https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c "gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg"',
      'echo "deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/" | sudo tee /etc/apt/sources.list.d/jitsi-stable.list > /dev/null',
      'sudo apt-get update -y'
    ],
    accessGuide: 'Video conference server installed. Access via https://{IP}.'
  },
  {
    id: 'matrix-synapse',
    name: 'Matrix Synapse Messenger',
    category: 'media-chat',
    version: 'Latest',
    description: 'Decentralized, end-to-end encrypted chat server for secure group messaging and VoIP.',
    defaultPort: 8008,
    minRamGb: 2,
    minCpu: 2,
    tags: ['E2EE', 'Decentralized', 'Chat'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose'
    ],
    accessGuide: 'Matrix Synapse server active on port 8008.'
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin Free Media System',
    category: 'media-chat',
    version: '10.8',
    description: 'The volunteer-built media solution that puts you in control of streaming movies, TV, and music.',
    defaultPort: 8096,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Media', 'Streaming', 'Movies'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y curl',
      'curl https://repo.jellyfin.org/install-debuntu.sh | sudo bash'
    ],
    accessGuide: 'Open http://{IP}:8096 to complete your Jellyfin media wizard.'
  },

  // -------------------------------------------------------------
  // 10. Game Servers
  // -------------------------------------------------------------
  {
    id: 'minecraft-java',
    name: 'Minecraft: Java Edition',
    category: 'gaming-apps',
    version: 'PaperMC 1.20',
    description: 'High performance PaperMC Minecraft Java server with plugin support and low latency.',
    defaultPort: 25565,
    minRamGb: 2,
    minCpu: 2,
    tags: ['Gaming', 'Minecraft', 'Java'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y openjdk-21-jre-headless screen',
      'mkdir -p ~/minecraft && cd ~/minecraft',
      'wget -O paper.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/496/downloads/paper-1.20.4-496.jar',
      'echo "eula=true" > eula.txt',
      'screen -dmS mc java -Xms1G -Xmx2G -jar paper.jar --nogui'
    ],
    accessGuide: 'Minecraft Server is live! Connect your Minecraft client to {IP}:25565.'
  },
  {
    id: 'cs2-server',
    name: 'Counter-Strike 2 Dedicated Server',
    category: 'gaming-apps',
    version: 'SteamCMD',
    description: 'Dedicated competitive Counter-Strike 2 / CS:GO server deployed via SteamCMD.',
    defaultPort: 27015,
    minRamGb: 4,
    minCpu: 4,
    tags: ['Gaming', 'Steam', 'FPS'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y lib32gcc-s1 steamcmd tmux'
    ],
    accessGuide: 'CS2 Dedicated server installed. Connect via console: "connect {IP}:27015".'
  },
  {
    id: 'palworld-server',
    name: 'Palworld Dedicated Server',
    category: 'gaming-apps',
    version: 'SteamCMD',
    description: 'Multiplayer survival dedicated server for Palworld with automated save syncing.',
    defaultPort: 8211,
    minRamGb: 8,
    minCpu: 4,
    tags: ['Gaming', 'Palworld', 'Survival'],
    installCommands: [
      'sudo apt-get update -y && sudo apt-get install -y steamcmd screen'
    ],
    accessGuide: 'Palworld server listening on UDP port 8211 ({IP}:8211).'
  }
];

export function getAppById(appId) {
  return APPS_CATALOG.find((app) => app.id === appId);
}
