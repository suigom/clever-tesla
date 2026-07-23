/**
 * ═══════════════════════════════════════════════════════════════
 *  LANDING PAGE CONFIGURATION
 *  Edit this file to customize your landing page.
 *
 *  ⚠️  WARNING: Do NOT put industry-specific keywords here.
 *      Keep everything brand-name only to avoid TrustPositif
 *      keyword-based blocking.
 * ═══════════════════════════════════════════════════════════════
 */

const CONFIG = {

  // ── Brand & SEO ──────────────────────────────────────────────
  // These appear in the page title, meta tags, and on the page.
  // Keep them GENERIC — brand name only, no industry keywords!

  brandName: "GUDANGSPIN",
  tagline: "SITUS BANDAR NOMOR 1 DI INDONESIA",
  metaDescription: "GUDANGSPIN OFFICIAL",
  siteUrl: "https:/sparkling-chaja-7f3bae.netlify.app",

  // ── Visual ───────────────────────────────────────────────────

  heroImage: "./assets/hero.jpg",

  // ── Central API ──────────────────────────────────────────────
  // Point this to your Docker Control Plane server (see gateway-control/).
  // It can be hosted anywhere; landing pages fetch /api/status from here.
  // Leave empty if you only want to use the local fallback domains pool.
  centralApiUrl: "http://72.61.209.216:34567/",

  // ── Redirect Settings ────────────────────────────────────────

  redirectDelay: 5,  // seconds before auto-redirect

  // Fallback domain pool — used if centralApiUrl is empty or unreachable.
  domains: [
    "https://gudangspin.click",
  ],

  // "random" = pick a random domain each visit
  // "sequential" = cycle through domains in order (tracked via localStorage)
  rotationStrategy: "random",
};
