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

// Fetches ALL orders from Jan 2025 onwards using Shopify REST cursor pagination
async function fetchAllOrders(shop, accessToken) {
  const SINCE = "2025-01-01T00:00:00Z";
  let pageInfo = null;
  let isFirst  = true;
  let total    = 0;

  while (isFirst || pageInfo) {
    const params = new URLSearchParams({ limit: "250", status: "any" });

    if (isFirst) {
      params.set("created_at_min", SINCE);
      params.set("order", "created_at desc");
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

    await Promise.all(
      orders.map(o => {
        const { id, data } = mapOrder(o);
        return prisma.orderCache.upsert({
          where:  { id },
          update: data,
          create: { id, ...data },
        });
      })
    );

    total += orders.length;
    console.log(`[cron-sync] Page done — ${orders.length} orders (running total: ${total})`);

    // Parse Link header for next cursor
    const link      = res.headers.get("link") || "";
    const nextMatch = link.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/);
    pageInfo = nextMatch ? decodeURIComponent(nextMatch[1]) : null;
    isFirst  = false;
  }

  return total;
}

// ── action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  // Validate cron secret
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the stored Shopify session (offline token = permanent access)
  const session = await prisma.session.findFirst({
    where:   { isOnline: false },
    orderBy: { expires: "desc" },
  });

  if (!session?.accessToken || !session?.shop) {
    return Response.json(
      { error: "No Shopify session found. Open the app in Shopify admin once to create a session." },
      { status: 500 }
    );
  }

  try {
    const t0    = Date.now();
    const count = await fetchAllOrders(session.shop, session.accessToken);
    const secs  = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[cron-sync] ✅ Synced ${count} orders in ${secs}s`);
    return Response.json({ ok: true, synced: count, elapsed: `${secs}s`, shop: session.shop });
  } catch (err) {
    console.error("[cron-sync] ❌ Failed:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
};

// Block GET requests
export const loader = () => Response.json({ error: "POST only" }, { status: 405 });
