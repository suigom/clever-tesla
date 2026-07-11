# ⚙️ Gateway Control Plane

This directory contains the central Control Plane for your multi-landing page network. It runs the automated health checker bot, tracks domain statuses using Netlify Blobs, and serves the CORS-enabled API consumed by the landing pages.

## Features
- **Cron-based Health Check**: Automatically queries the TrustPositif community API (`trustpositif.id`) for all domains.
- **Netlify Blobs Database**: Stores domain lists and health states securely inside Netlify (no configuration required).
- **Public Status API**: Securely exposes active domains to your landing pages, allowing direct client-side fetch.
- **Admin Control Panel**: A built-in web dashboard to add/remove domains and trigger manual checks instantly.
- **Telegram Notifications**: Sends direct alerts to your Telegram chat whenever a domain gets blocked or restored.

---

## 🚀 Quick Setup

1. **Deploy to Netlify**:
   - Push this `gateway-control` directory to a new Git repository.
   - Connect it to a new Netlify site.
   - Publish directory should be set to the root `.` (or empty).
   - Node version should be 18+.

2. **Configure Environment Variables**:
   In your Netlify dashboard, go to **Site settings > Environment variables** and add:
   
   | Variable | Required | Description |
   |----------|----------|-------------|
   | `ADMIN_API_KEY` | **Yes** | Any long secure string. Used to log into your control dashboard. |
   | `TELEGRAM_BOT_TOKEN` | *Optional* | Your Telegram bot token (from `@BotFather`). |
   | `TELEGRAM_CHAT_ID` | *Optional* | Chat ID where the bot should send domain block alerts. |
   | `TP_API_KEY` | *Optional* | TrustPositif key for higher limits (default allows 100 checks/day). |

3. **Access Control Panel**:
   - Visit the domain Netlify assigned to your control plane (e.g. `https://your-control-plane.netlify.app`).
   - Enter your `ADMIN_API_KEY` to unlock the dashboard.
   - Add your initial domains to the pool.

---

## 🛠️ REST API Reference

All requests must be POSTed to your control plane function `/.netlify/functions/manage`.
Include the header `X-API-Key: YOUR_ADMIN_API_KEY`.

### 1. List Domains
- **Payload**: `{"action": "list"}`
- **Response**: List of all domains, statuses, and history logs.

### 2. Add Domain
- **Payload**: `{"action": "add", "domain": "https://newdomain.xyz"}`
- **Response**: Triggers an immediate TrustPositif check and adds it to rotation if active.

### 3. Remove Domain
- **Payload**: `{"action": "remove", "domain": "https://newdomain.xyz"}`

### 4. Trigger Check Immediately
- **Payload**: `{"action": "check-now"}`

---

## 🔗 Integrating with Landing Pages

Update the `config.js` of your landing pages to point to this control plane:
```js
const CONFIG = {
  // ...
  centralApiUrl: "https://your-control-plane.netlify.app",
  // ...
};
```
That's it! The landing pages will fetch active domains from this central endpoint on load and gracefully fall back to local hardcoded domains if the control plane is offline.
