import { timingSafeEqual } from "crypto";
import prisma from "../db.server";
import { getShopCredentials, ADMIN_API_VERSION } from "../shopify-admin.server";

const PAY_MAP = {
  paid:           "Paid",
  pending:        "Payment pending",
  authorized:     "Authorized",
  partially_paid: "Partially paid",
  refunded:       "Refunded",
  voided:         "Voided",
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function mapOrder(order) {
  const id   = `gid://shopify/Order/${order.id}`;
  const li   = order.line_items?.[0];
  const cust = order.customer;
  const name = cust
    ? [cust.first_name, cust.last_name].filter(Boolean).join(" ").trim() || "Guest"
    : "Guest";

  const tags = (order.tags || "").toLowerCase().split(",").map(t => t.trim()).filter(Boolean);
  const priority = tags.includes("priority:high") || tags.includes("urgent")
    ? "High" : tags.includes("priority:low") ? "Low" : "Medium";

  return {
    id,
    data: {
      name:          order.name,
      customer:      name,
      item:          li?.title    || "—",
      sku:           li?.sku      || "—",
      qty:           li?.quantity || 1,
      imageUrl:      li?.image?.src || null,
      orderDate:     fmtDate(order.created_at),
      createdAt:     order.created_at,
      paymentStatus: PAY_MAP[order.financial_status] || "N/A",
      priority,
      shopifyNote:   order.note || "",
      tags:          order.tags || "",
    },
  };
}

// Fetches ALL orders ever using Shopify REST cursor pagination
async function fetchAllOrders(shop, accessToken, days) {
  let pageInfo = null;
  let isFirst  = true;
  let total    = 0;

  while (isFirst || pageInfo) {
    const params = new URLSearchParams({ limit: "50" });

    if (isFirst) {
      params.set("status", "any");
      params.set("order", "updated_at desc");
      if (days) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        params.set("updated_at_min", since);
      }
      params.set("fields", "id,name,created_at,financial_status,customer,line_items,tags,note");
    } else {
      // When using page_info, no other filters allowed
      params.set("page_info", pageInfo);
    }

    const url = `https://${shop}/admin/api/${ADMIN_API_VERSION}/orders.json?${params}`;
    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Shopify ${res.status}: ${body}`);
    }

    const data   = await res.json();
    const orders = data.orders || [];

    const chunkSize = 15;
    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (o) => {
          const { id, data } = mapOrder(o);
          await prisma.orderCache.upsert({
            where:  { id },
            update: data,
            create: { id, ...data },
          });
        })
      );
    }

    total += orders.length;
    console.log(`[cron-sync] Page done — ${orders.length} orders (running total: ${total})`);

    // Parse Link header for next cursor
    const link = res.headers.get("link") || "";
    let nextPageInfo = null;
    for (const part of link.split(",")) {
      if (part.includes('rel="next"')) {
        const match = part.match(/[?&]page_info=([^&>]+)/);
        if (match) nextPageInfo = decodeURIComponent(match[1]);
      }
    }
    pageInfo = nextPageInfo;
    isFirst  = false;
  }

  return total;
}

// ── action ────────────────────────────────────────────────────────────────────
function validSecret(given) {
  const expected = process.env.CRON_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const action = async ({ request }) => {
  if (!validSecret(request.headers.get("x-cron-secret"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?days=N limits to orders updated in the last N days (default 30); ?all=1 syncs every order
  const url  = new URL(request.url);
  const days = url.searchParams.get("all") === "1" ? 0 : Number(url.searchParams.get("days")) || 30;

  const creds = await getShopCredentials();
  if (!creds) {
    return Response.json(
      { error: "No Shopify session found and SHOPIFY_ACCESS_TOKEN/SHOPIFY_STORE_URL are not set. Open the app in Shopify admin once to create a session." },
      { status: 500 }
    );
  }

  try {
    const t0    = Date.now();
    const count = await fetchAllOrders(creds.shop, creds.accessToken, days);
    const secs  = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[cron-sync] ✅ Synced ${count} orders in ${secs}s`);
    return Response.json({ ok: true, synced: count, elapsed: `${secs}s`, shop: creds.shop });
  } catch (err) {
    console.error("[cron-sync] ❌ Failed:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};

// Block GET requests
export const loader = () => Response.json({ error: "POST only" }, { status: 405 });
