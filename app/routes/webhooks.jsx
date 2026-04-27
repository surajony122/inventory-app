import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PAY_MAP = {
  paid:           "Paid",
  pending:        "Payment pending",
  authorized:     "Authorized",
  partially_paid: "Partially paid",
  refunded:       "Refunded",
  voided:         "Voided",
};

// Shopify REST webhook payload → OrderCache row
async function upsertOrder(order) {
  // Webhooks use numeric IDs; our cache uses Shopify GID format
  const id   = `gid://shopify/Order/${order.id}`;
  const li   = order.line_items?.[0];
  const cust = order.customer;
  const name = cust
    ? [cust.first_name, cust.last_name].filter(Boolean).join(" ").trim() || "Guest"
    : "Guest";

  const tags = (order.tags || "").toLowerCase().split(",").map(t => t.trim()).filter(Boolean);
  const priority = tags.includes("priority:high") || tags.includes("urgent")
    ? "High"
    : tags.includes("priority:low") ? "Low" : "Medium";

  const data = {
    name:          order.name,
    customer:      name,
    item:          li?.title || "—",
    sku:           li?.sku   || "—",
    qty:           li?.quantity || 1,
    imageUrl:      li?.image?.src || null,
    orderDate:     fmtDate(order.created_at),
    createdAt:     order.created_at,
    paymentStatus: PAY_MAP[order.financial_status] || "N/A",
    priority,
    shopifyNote:   order.note || "",
  };

  await prisma.orderCache.upsert({
    where:  { id },
    update: data,
    create: { id, ...data },
  });

  console.log(`[webhook] Saved order ${order.name} (${id})`);
}

// ── action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  const { topic, payload } = await authenticate.webhook(request);

  try {
    switch (topic) {
      case "ORDERS_CREATE":
      case "ORDERS_UPDATED":
      case "ORDERS_PAID":
        await upsertOrder(payload);
        break;

      case "ORDERS_CANCELLED":
        // Update payment status but keep the order in cache
        if (payload?.id) {
          const id = `gid://shopify/Order/${payload.id}`;
          await prisma.orderCache.updateMany({
            where: { id },
            data:  { paymentStatus: "Voided" },
          });
        }
        break;

      case "APP_UNINSTALLED":
        // Clean up sessions but keep order data
        console.log(`[webhook] App uninstalled from shop`);
        break;

      default:
        console.log(`[webhook] Unhandled topic: ${topic}`);
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${topic}:`, err.message);
    // Return 200 anyway — Shopify retries on non-200, which can cause loops
  }

  return new Response(null, { status: 200 });
};
