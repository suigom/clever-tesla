import { getStore } from "@netlify/blobs";
import checkDomainsHandler from "./check-domains.mjs";

export default async (req, context) => {
  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders
    });
  }

  // Validate ADMIN_API_KEY
  const apiKey = req.headers.get("x-api-key");
  const expectedApiKey = process.env.ADMIN_API_KEY;

  if (!expectedApiKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error: ADMIN_API_KEY environment variable is not set on the server." }),
      { status: 500, headers: corsHeaders }
    );
  }

  if (apiKey !== expectedApiKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Invalid X-API-Key." }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { action, domain } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: action." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const store = getStore("domains-store");
    let data = await store.get("domain-list", { type: "json" }) || { domains: [] };

    if (action === "list") {
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: corsHeaders
      });
    }

    if (action === "add") {
      if (!domain) {
        return new Response(
          JSON.stringify({ error: "Missing parameter: domain is required for add action." }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Standardize domain URL
      let domainUrl = domain.trim();
      if (!domainUrl.startsWith("http://") && !domainUrl.startsWith("https://")) {
        domainUrl = "https://" + domainUrl;
      }

      // Check if it already exists
      const exists = data.domains.some(d => d.url.toLowerCase() === domainUrl.toLowerCase());
      if (exists) {
        return new Response(
          JSON.stringify({ error: `Domain ${domainUrl} already exists in the pool.` }),
          { status: 400, headers: corsHeaders }
        );
      }

      const newDomainObj = {
        url: domainUrl,
        status: "unknown",
        lastChecked: null,
        addedAt: new Date().toISOString(),
        blockedSince: null
      };

      data.domains.push(newDomainObj);
      await store.setJSON("domain-list", data);

      // Perform a check immediately
      try {
        await checkDomainsHandler(req, context);
      } catch (checkErr) {
        console.error("Post-add health check failed:", checkErr);
      }

      // Retrieve updated data
      const updatedData = await store.get("domain-list", { type: "json" });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Added ${domainUrl} successfully. Triggered initial check.`,
          data: updatedData
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (action === "remove") {
      if (!domain) {
        return new Response(
          JSON.stringify({ error: "Missing parameter: domain is required for remove action." }),
          { status: 400, headers: corsHeaders }
        );
      }

      let domainUrl = domain.trim();
      if (!domainUrl.startsWith("http://") && !domainUrl.startsWith("https://")) {
        domainUrl = "https://" + domainUrl;
      }

      const originalLength = data.domains.length;
      data.domains = data.domains.filter(
        d => d.url.toLowerCase() !== domainUrl.toLowerCase()
      );

      if (data.domains.length === originalLength) {
        return new Response(
          JSON.stringify({ error: `Domain ${domainUrl} not found in the pool.` }),
          { status: 404, headers: corsHeaders }
        );
      }

      await store.setJSON("domain-list", data);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Removed ${domainUrl} successfully.`,
          data
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (action === "check-now") {
      console.log("Triggering manual health check check-now...");
      const checkRes = await checkDomainsHandler(req, context);
      const checkResJson = await checkRes.json();
      
      const updatedData = await store.get("domain-list", { type: "json" });
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Manual health check execution complete.",
          checkResult: checkResJson,
          data: updatedData
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Manage API error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
};
