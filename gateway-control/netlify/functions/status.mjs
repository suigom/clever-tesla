import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  try {
    const store = getStore("domains-store");
    const data = await store.get("domain-list", { type: "json" }) || { domains: [] };

    // Filter active domains
    // If a domain has no status yet, we assume it might be active (fallback) or ignore.
    // Let's filter status: "active" or not "blocked" (e.g. active / unknown) so new domains aren't hidden immediately before first check.
    const activeDomains = data.domains
      .filter(d => d.status !== "blocked")
      .map(d => d.url);

    return new Response(
      JSON.stringify({
        success: true,
        active: activeDomains,
        count: activeDomains.length,
        lastChecked: data.lastRun || null
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60"
        }
      }
    );
  } catch (error) {
    console.error("Status API error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
