# 🚀 Hostinger Docker Deployment Guide

## Quick Deployment (5 minutes)

### Step 1: Prepare Files

Upload the entire `gateway-control` folder to your Hostinger server:

```bash
# Using SCP (from your local machine)
scp -r gateway-control/* user@your-server-ip:/home/user/gateway-control/

# Or upload via FTP/SFTP using FileZilla or similar
```

### Step 2: Configure Environment

SSH into your server and create the `.env` file:

```bash
ssh user@your-server-ip
cd gateway-control
cp .env.example .env
nano .env
```

**IMPORTANT:** Change `ADMIN_API_KEY` to something secure:
```bash
# Generate a secure key:
openssl rand -hex 32
# Copy the output and paste it as ADMIN_API_KEY
```

Your `.env` should look like:
```env
ADMIN_API_KEY=a3b5c6d7e8f901234567890abcdef1234567890abcdef1234567890abcdef
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TP_API_KEY=
```

### Step 3: Deploy

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Check if running
docker-compose ps
```

### Step 4: Access

| URL | Purpose |
|-----|---------|
| `http://YOUR-SERVER-IP:34567` | Admin Dashboard |
| `http://YOUR-SERVER-IP:34567/api/status` | Public API (for landing pages) |
| `http://YOUR-SERVER-IP:34567/health` | Health check |

---

## Using a Domain (Optional)

If you have a domain, you can access it without the port number.

### Option A: Cloudflare Tunnel (Recommended - Free)

1. Install `cloudflared` on your server
2. Run: `cloudflared tunnel --url http://localhost:34567`
3. Get a public URL like `https://your-gateway.pages.dev`

### Option B: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name gateway.yourdomain.com;

    location / {
        proxy_pass http://localhost:34567;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then access via: `http://gateway.yourdomain.com`

---

## Connecting Landing Pages

Update your landing page `config.js`:

```javascript
const CONFIG = {
  // Point to your deployed gateway-control
  centralApiUrl: "http://YOUR-SERVER-IP:34567",
  // or with domain:
  // centralApiUrl: "https://gateway.yourdomain.com",

  // ... rest of config
};
```

---

## Firewall Notes

Make sure port **34567** is open on your server:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 34567/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=34567/tcp
sudo firewall-cmd --reload
```

---

## Troubleshooting

### Container not starting?
```bash
docker-compose logs gateway-control
```

### Permission denied?
```bash
chmod +x data/
```

### Port already in use?
Change port in `docker-compose.yml` (both `ports` and `PORT` env var).

### Database issues?
```bash
# Reset everything (WARNING: deletes all data)
docker-compose down -v
rm -rf data/
docker-compose up -d
```

---

## Maintenance

### View logs
```bash
docker-compose logs -f gateway-control
```

### Restart
```bash
docker-compose restart
```

### Update
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Backup database
```bash
cp data/domains.db data/domains.db.backup.$(date +%Y%m%d)
```
