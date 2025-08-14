Deploying komomood on a fresh Ubuntu server (concise)

Prereqs
- Ubuntu 22.04+ with sudo
- Domain points to server; ports 80/443 open
- Git installed and access to this repo

1) Install runtime and tools
```bash
sudo apt update
sudo apt install -y nginx git curl sqlite3 ca-certificates
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

2) Clone repo and install backend deps
```bash
sudo mkdir -p /opt && cd /opt
sudo git clone https://github.com/ktwu01/komomood.git
sudo chown -R $USER:$USER komomood
cd komomood/backend
npm ci || npm i
```

3) Start backend with pm2 (port 3002)
```bash
pm2 start /opt/komomood/backend/server.js --name komomood-backend
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

4) Deploy frontend static files
```bash
sudo mkdir -p /var/www/komomood/assets/vendor
sudo install -D -m 0644 /opt/komomood/index.html /var/www/komomood/index.html
sudo install -D -m 0644 /opt/komomood/app.js /var/www/komomood/app.js
sudo rsync -a /opt/komomood/assets/ /var/www/komomood/assets/
sudo chown -R www-data:www-data /var/www/komomood
```

5) Nginx locations (add to your existing server block)
```nginx
location /komomood/ {
    alias /var/www/komomood/;
    index index.html;
    try_files $uri $uri/ =404;
}

location /komomood/api/ {
    proxy_pass http://localhost:3002/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
Apply and reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

6) Verify
```bash
curl -sS https://<your-domain>/komomood/api/health
curl -sS https://<your-domain>/komomood/api/entries
curl -I https://<your-domain>/komomood/
```

7) Optional: TLS with certbot
```bash
sudo snap install --classic certbot
sudo certbot --nginx -d <your-domain>
```

Operations quick refs
- Process: `pm2 status`, `pm2 logs komomood-backend --lines 100`, `pm2 restart komomood-backend`
- Disk space: keep >500MB free to avoid SQLite `SQLITE_FULL`
- DB file: `backend/mood_entries.db` is tracked; app will create/upgrade if missing
- Static deploy updates after git pull:
```bash
cd /opt/komomood && git pull
sudo install -m 0644 index.html /var/www/komomood/index.html
sudo install -m 0644 app.js /var/www/komomood/app.js
sudo rsync -a assets/ /var/www/komomood/assets/
pm2 restart komomood-backend
```

Notes
- Production does not rely on external CDNs; Cal‑Heatmap is currently disabled to prefer the stable legacy grid.
- API base is served via `/komomood/api/`; frontend static under `/komomood/`.
