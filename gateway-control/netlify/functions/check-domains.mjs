import { getStore } from "@netlify/blobs";

async function notifyTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("Telegram configuration missing. Message:", message);
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      console.error("Telegram API error:", await res.text());
    }
  } catch (e) {
    console.error("Error sending Telegram message:", e);
  }
}

export default async (req, context) => {
  console.log("Starting scheduled domain health check...");
  
  const store = getStore("domains-store");
  let data = await store.get("domain-list", { type: "json" });
  
  if (!data || !Array.isArray(data.domains)) {
    console.log("No domains configured in database yet.");
    return new Response("No domains configured", { status: 200 });
  }

    const domainsToCheck = data.domains;
    const now = new Date();
    const nowIso = now.toISOString();

    // Filter domains to check:
    // - Check all active or unknown domains.
    // - Completely skip checking blocked domains (once blocked, never checked again in cron).
    const domainsToQuery = [];
    const domainsSkipped = [];

    for (const d of domainsToCheck) {
      if (d.status === "blocked") {
        domainsSkipped.push(d);
        continue;
      }
      domainsToQuery.push(d);
    }

    if (domainsToQuery.length === 0) {
      console.log("No domains require checking in this run.");
      return new Response(JSON.stringify({ success: true, message: "No domains checked (quota saved)" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extract hostnames for domains to check
    const hostnames = [];
    for (const d of domainsToQuery) {
      try {
        const urlObj = new URL(d.url);
        hostnames.push(urlObj.hostname);
      } catch {
        hostnames.push(d.url);
      }
    }

    const payload = {
      domains: hostnames.join("\n")
    };

    const headers = {
      "Content-Type": "application/json"
    };
    if (process.env.TP_API_KEY) {
      headers["X-API-Key"] = process.env.TP_API_KEY;
    }

    console.log("Querying trustpositif.id API for:", hostnames);
    const tpRes = await fetch("https://trustpositif.id/api/v1/check", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!tpRes.ok) {
      const errText = await tpRes.text();
      const errorMsg = `TrustPositif API returned status ${tpRes.status}: ${errText}`;
      console.error(errorMsg);
      return new Response(errorMsg, { status: 500 });
    }

    const resJson = await tpRes.json();
    if (!resJson.success || !Array.isArray(resJson.results)) {
      console.error("Invalid API response format", resJson);
      return new Response("Invalid API response format", { status: 500 });
    }

    // Map API results
    const resultMap = {};
    resJson.results.forEach(r => {
      if (r.Domain && typeof r.Blocked === "boolean") {
        resultMap[r.Domain.toLowerCase()] = r.Blocked;
      }
    });

    const changeLogged = [];
    
    const checkedDomains = domainsToQuery.map(domain => {
      let hostname = "";
      try {
        hostname = new URL(domain.url).hostname.toLowerCase();
      } catch {
        hostname = domain.url.toLowerCase();
      }

      let isBlocked = resultMap[hostname];
      if (isBlocked === undefined && hostname.startsWith("www.")) {
        isBlocked = resultMap[hostname.replace("www.", "")];
      }
      if (isBlocked === undefined) {
        isBlocked = resultMap["www." + hostname];
      }
      
      const actualBlocked = isBlocked ?? false;
      const newStatus = actualBlocked ? "blocked" : "active";
      const oldStatus = domain.status || "unknown";

      if (oldStatus !== newStatus) {
        changeLogged.push({
          url: domain.url,
          from: oldStatus,
          to: newStatus
        });
        domain.blockedSince = newStatus === "blocked" ? nowIso : null;
      }

      domain.status = newStatus;
      domain.lastChecked = nowIso;
      return domain;
    });

    // Merge checked and skipped domains
    const updatedDomains = [...checkedDomains, ...domainsSkipped];

    data.domains = updatedDomains;
    data.lastRun = nowIso;

    await store.setJSON("domain-list", data);

    // Send notifications if status changed
    if (changeLogged.length > 0) {
      const messages = changeLogged.map(c => {
        if (c.to === "blocked") {
          return `🚫 <b>DOMAIN BLOCKED</b>\n<code>${c.url}</code> is now blocked by TrustPositif.`;
        } else {
          return `✅ <b>DOMAIN RESTORED</b>\n<code>${c.url}</code> is now active.`;
        }
      });
      const activeCount = updatedDomains.filter(d => d.status === "active").length;
      messages.push(`Total active domains remaining: <b>${activeCount}</b>`);
      await notifyTelegram(messages.join("\n\n"));
    }

    console.log(`Domain check complete. Checked: ${checkedDomains.length}, Skipped: ${domainsSkipped.length}, Total: ${updatedDomains.length}. Changes: ${changeLogged.length}`);
    return new Response(JSON.stringify({ success: true, checkedCount: checkedDomains.length, changes: changeLogged.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Domain check failed:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  schedule: "0 * * * *"
};
