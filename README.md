# 🎮 Cyberpunk Landing Gateway

A cyberpunk/gaming-themed static landing page that serves as an anti-block gateway. It redirects users to your main application hosted on rotating domains, bypassing DNS-level domain blocking (TrustPositif).

![Cyberpunk Landing Page](./assets/hero.jpg)

## 🔥 The Problem

- Indonesian ISPs use **TrustPositif** DNS blocklists to block website domains
- Blocking is triggered by **keyword-based crawling** and **domain reports**
- Once a domain is blocked, **all ISPs must comply**

## ✅ The Solution

```
User → Netlify Landing Page → picks domain → redirects → Main App Server
                                    ↑
                              config.js
                          (domain pool)
```

- This landing page is hosted on **Netlify** with a stable, clean domain
- Uses **brand-safe SEO** — Google indexes it, but no keywords for TrustPositif to flag
- Users land here first, then get **auto-redirected** to your app on a rotating domain
- When a domain gets blocked, swap it in `config.js` — the landing page URL stays the same

## 🚀 Quick Start

```bash
# 1. Clone
git clone <your-repo-url>
cd clever-tesla

# 2. Edit config
open config.js   # Set your brand name, domains, and image

# 3. Replace hero image
cp /path/to/your/image.jpg assets/hero.jpg

# 4. Deploy to Netlify (pick one method)
```

### Deploy to Netlify

| Method | Steps |
|--------|-------|
| **Drag & Drop** | Go to [app.netlify.com/drop](https://app.netlify.com/drop) → drag project folder |
| **Git Connected** | Push to GitHub → connect in Netlify dashboard → set publish dir `.` |
| **CLI** | `npm i -g netlify-cli && netlify login && netlify deploy --prod --dir=.` |

## ⚙️ Configuration Reference

All configuration lives in a single file: **`config.js`**

| Field | Type | Description |
|-------|------|-------------|
| `brandName` | `string` | Your brand name — shown in title, h1, and meta tags |
| `tagline` | `string` | Short tagline shown below the brand name |
| `metaDescription` | `string` | Meta description for Google (keep generic!) |
| `siteUrl` | `string` | Your landing page's canonical URL |
| `heroImage` | `string` | Path to your hero/banner image |
| `centralApiUrl` | `string` | URL of your Control Plane deployment (optional) |
| `redirectDelay` | `number` | Seconds before auto-redirect (set `0` for instant) |
| `domains` | `string[]` | Fallback domain pool (used if central API is empty/unreachable) |
| `rotationStrategy` | `string` | `"random"` or `"sequential"` |

### 🛰️ Centralized Checker & Automation
If you have multiple landing pages or want automatic domain status monitoring, you can deploy a centralized **Control Plane** (located in the [gateway-control](./gateway-control) folder).
When `centralApiUrl` is configured:
1. The landing page queries the Control Plane for currently *active* (unblocked) domains on load.
2. It automatically filters out blocked domains from the redirection cycle.
3. If the Control Plane is offline, it gracefully falls back to the static `domains` list.

## 🔄 Domain Rotation Guide

### Adding a new domain

1. Register a cheap domain (`.xyz`, `.site`, `.click` — ~$1/year)
2. Point it to your main server (DNS A record or CNAME)
3. Set up SSL (Let's Encrypt / Cloudflare)
4. Add it to the `domains` array in `config.js`
5. Deploy

### Removing a blocked domain

1. Remove it from the `domains` array in `config.js`
2. Deploy
3. The landing page immediately stops sending users there

### Monitoring

- Check your domains against TrustPositif: https://trustpositif.komdigi.go.id/
- Consider automating this with periodic `fetch` checks

## 🏗️ Architecture

### How the redirect works

1. User arrives at your landing page (stable Netlify URL)
2. `script.js` reads the domain pool from `config.js`
3. A domain is selected (random or sequential)
4. A countdown shows on the CTA button
5. After the countdown (or on click), user is redirected
6. `Referrer-Policy: no-referrer` prevents linking the landing page to the target

### Why Brand-Safe SEO?

| What it does | How |
|-------------|-----|
| **Google indexes it** | `<title>` and `<meta description>` contain brand name |
| **TrustPositif ignores it** | Zero industry keywords anywhere in HTML |
| **Crawlers can't find target** | Redirect URL is in JavaScript only, not in `<a>` tags |

## 🎨 Customization

### Changing the hero image

Replace `assets/hero.jpg` with your image. Recommended: **16:9 aspect ratio**, ≥800px wide.

### Changing colors

Edit the CSS custom properties at the top of `style.css`:

```css
:root {
  --color-primary: #A855F7;        /* Electric purple */
  --color-primary-deep: #7C3AED;   /* Deep purple */
  --color-accent: #FFD700;          /* Gold */
  --color-accent-warm: #F59E0B;     /* Amber gold */
  --color-bg: #0A0A0A;              /* Near-black */
  --color-text: #FFFFFF;             /* White */
}
```

### Disabling animations

Animations automatically disable for users with `prefers-reduced-motion: reduce` in their OS. To disable for everyone, remove the `@keyframes` blocks from `style.css`.

## 🔒 Security Headers

Configured in `netlify.toml`:

| Header | Value | Purpose |
|--------|-------|----------|
| `Referrer-Policy` | `no-referrer` | Don't leak landing URL to target |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Permissions-Policy` | `interest-cohort=()` | Opt out of FLoC |

> 🔑 **Critical:** `Referrer-Policy: no-referrer` is the most important header. Without it, your target server's access logs would show the landing page URL as the referrer, potentially linking the two and getting the landing page blocked.

## 🧰 Recommended Stack

| Purpose | Recommendation |
|---------|----------------|
| Landing page hosting | **Netlify** (free tier) |
| CDN for main app | **Cloudflare** (free tier) |
| SSL certificates | **Let's Encrypt** (free, auto-renew) |
| Cheap domains | Namecheap, Porkbun, Cloudflare Registrar |
| Distribution | Telegram channel, WhatsApp group |
| DNS management | **Cloudflare DNS** (free) |

## 📁 Project Structure

```
├── index.html          # Landing page
├── style.css           # Cyberpunk design system
├── config.js           # ⚡ Edit this — brand, domains, settings
├── script.js           # Redirect logic & animations
├── netlify.toml        # Netlify config + security headers
├── README.md           # This file
└── assets/
    └── hero.jpg        # Hero image (replace with yours)
```

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Page shows "YOUR BRAND" | Edit `brandName` in `config.js` |
| Redirect doesn't work | Check `domains` array has valid `https://` URLs |
| Image doesn't load | Check `heroImage` path in `config.js` |
| Netlify returns 404 | Ensure publish directory is `.` (root) |
| Page looks broken on mobile | Clear browser cache and reload |
| LED animation is laggy | Try Chrome/Edge; Firefox may be slower with conic-gradient animation |

## 📄 License

MIT
