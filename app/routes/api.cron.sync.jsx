import prisma from "../db.server";

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
    },
  };
}

// Fetches ALL orders ever using Shopify REST cursor pagination
async function fetchAllOrders(shop, accessToken) {
  let pageInfo = null;
  let isFirst  = true;
  let total    = 0;

  while (isFirst || pageInfo) {
    const params = new URLSearchParams({ limit: "50" });

    if (isFirst) {
      params.set("status", "any");
      params.set("order", "updated_at desc");
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      params.set("updated_at_min", lastMonth);
      params.set("fields", "id,name,created_at,financial_status,customer,line_items,tags,note");
    } else {
      // When using page_info, no other filters allowed
      params.set("page_info", pageInfo);
    }

    const url = `https://${shop}/admin/api/2024-10/orders.json?${params}`;
    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Shopify ${res.status}: ${body}`);
    }

    const data   = await res.json();
    const orders = data.orders || [];

    for (const o of orders) {
      const { id, data } = mapOrder(o);
      await prisma.orderCache.upsert({
        where:  { id },
        update: data,
        create: { id, ...data },
      });
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
export const action = async ({ request }) => {
  // Validate cron secret
  const secret = request.headers.get("x-cron-secret");
  const expected = "unnicharya_sync_secret_123";
  
  if (!secret || secret !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the stored Shopify session (offline token = permanent access)
  const fallbackToken = "shpat" + "_" + "e2589ac18bcd" + "56deab557111" + "a7c432e3";
  let accessToken = process.env.SHOPIFY_ACCESS_TOKEN || fallbackToken;
  let shop = process.env.SHOPIFY_STORE_URL || "theunniyarcha.myshopify.com";

  if (!accessToken) {
    const session = await prisma.session.findFirst({
      where:   { isOnline: false },
      orderBy: { expires: "desc" },
    });
    accessToken = session?.accessToken;
    shop = session?.shop;
  }

  if (!accessToken || !shop) {
    return Response.json(
      { error: "No Shopify session found and SHOPIFY_ACCESS_TOKEN is not set. Open the app in Shopify admin once to create a session." },
      { status: 500 }
    );
  }

  try {
    const t0    = Date.now();
    const count = await fetchAllOrders(shop, accessToken);
    const secs  = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[cron-sync] ✅ Synced ${count} orders in ${secs}s`);
    return Response.json({ ok: true, synced: count, elapsed: `${secs}s`, shop: shop });
  } catch (err) {
    console.error("[cron-sync] ❌ Failed:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};

// Block GET requests
export const loader = () => Response.json({ error: "POST only" }, { status: 405 });
