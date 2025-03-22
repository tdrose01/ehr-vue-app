# Deployment Guide

This guide outlines the steps to deploy the EHR Vue Application in both development and production environments.

## Prerequisites

- Node.js v18.x or later
- PostgreSQL 15.x or later
- PM2 (for production deployment)
- Nginx (for production deployment)
- SSL certificate (for production deployment)

## Development Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/tdrose01/ehr-vue-app.git
cd ehr-vue-app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. Configure Environment Variables
```bash
# Frontend (.env)
cp .env.example .env

# Backend (server/.env)
cp server/.env.example server/.env
```

Edit the environment files with appropriate values:
```env
# Frontend (.env)
VITE_API_URL=http://localhost:8002/api
VITE_APP_TITLE=EHR Vue App

# Backend (server/.env)
NODE_ENV=development
PORT=8002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ehr_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:8080
```

### 4. Setup Database
```bash
# Create database
createdb ehr_db

# Run migrations
cd server
npm run migrate
```

### 5. Start Development Servers
```bash
# Start frontend (from root directory)
npm run dev

# Start backend (from server directory)
cd server
npm run dev
```

## Production Deployment

### 1. Server Setup

#### Install Required Software
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

#### Configure PostgreSQL
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE ehr_db;
CREATE USER ehr_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ehr_db TO ehr_user;
\q
```

### 2. Application Setup

#### Clone and Build
```bash
# Clone repository
git clone https://github.com/tdrose01/ehr-vue-app.git
cd ehr-vue-app

# Install dependencies and build frontend
npm install
npm run build

# Setup backend
cd server
npm install
```

#### Configure Environment
```bash
# Create and edit production environment files
cp .env.example .env
cp server/.env.example server/.env

# Edit with production values
vim .env
vim server/.env
```

Production environment variables:
```env
# Frontend (.env)
VITE_API_URL=https://api.your-domain.com
VITE_APP_TITLE=EHR Vue App

# Backend (server/.env)
NODE_ENV=production
PORT=8002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ehr_db
DB_USER=ehr_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://your-domain.com
```

### 3. Configure Nginx

Create Nginx configuration:
```bash
sudo vim /etc/nginx/sites-available/ehr-vue-app
```

Add the following configuration:
```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/ehr-vue-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ehr-vue-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate

Install Certbot and obtain SSL certificates:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 5. Start Application

#### Deploy Frontend
```bash
# Copy built files to web root
sudo mkdir -p /var/www/ehr-vue-app
sudo cp -r dist/* /var/www/ehr-vue-app/
```

#### Start Backend with PM2
```bash
cd server
pm2 start npm --name "ehr-api" -- start
pm2 save
pm2 startup
```

### 6. Monitoring and Maintenance

#### Monitor Logs
```bash
# View PM2 logs
pm2 logs ehr-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Database Backups
```bash
# Create backup script
vim /usr/local/bin/backup-db.sh
```

Add the following content:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump ehr_db > "$BACKUP_DIR/ehr_db_$TIMESTAMP.sql"
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make it executable and schedule with cron:
```bash
chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e
```

Add the following line:
```
0 2 * * * /usr/local/bin/backup-db.sh
```

### 7. Security Considerations

1. Configure UFW firewall:
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

2. Secure PostgreSQL:
```bash
# Edit pg_hba.conf
sudo vim /etc/postgresql/15/main/pg_hba.conf
```

3. Set up fail2ban:
```bash
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

### 8. Updating the Application

Create an update script:
```bash
vim /usr/local/bin/update-ehr-app.sh
```

Add the following content:
```bash
#!/bin/bash
cd /path/to/ehr-vue-app
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/ehr-vue-app/

cd server
npm install
pm2 restart ehr-api
```

Make it executable:
```bash
chmod +x /usr/local/bin/update-ehr-app.sh
```