import { authenticate, unauthenticated } from "../shopify.server";
import { getShopCredentials } from "../shopify-admin.server";
import { noticesFor } from "../track-notices.server";

// Storefront order tracking (Shopify App Proxy: https://unniyarcha.com/apps/track).
// Customer gives an order number and/or phone number. Only status + tracking links are returned
// (no items, address, email or amounts). Signature is verified by authenticate.public.appProxy.

const FIELDS = `
  name createdAt cancelledAt displayFulfillmentStatus phone
  shippingAddress { phone }
  fulfillments { status displayStatus trackingInfo { number url company } }
`;

const hits = new Map(); // ip -> [timestamps]
function throttled(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 12;
}

const last10 = (s) => String(s || "").replace(/\D/g, "").slice(-10);
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function shape(o) {
  const cancelled = !!o.cancelledAt;
  const shipments = [];
  for (const f of o.fulfillments || []) {
    if (f.status === "CANCELLED" || f.status === "ERROR" || f.status === "FAILURE") continue;
    const infos = f.trackingInfo?.length ? f.trackingInfo : [{}];
    for (const t of infos) {
      shipments.push({
        company: t.company || "",
        number: t.number || "",
        url: /^https?:\/\//i.test(t.url || "") ? t.url : "",
        delivered: f.displayStatus === "DELIVERED",
      });
    }
  }
  let status = "processing";
  if (cancelled) status = "cancelled";
  else if (shipments.length) status = o.displayFulfillmentStatus === "PARTIALLY_FULFILLED" ? "partial" : "shipped";
  return {
    order: String(o.name || "").trim(),
    date: o.createdAt,
    status,
    shipments,
  };
}

export const loader = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: "Not allowed" }, 403);
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  if (throttled(ip)) return json({ error: "Too many tries. Please wait a minute and try again." }, 429);

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 40);
  const digits = q.replace(/\D/g, "");
  if (digits.length < 5) return json({ error: "Please enter your order number or the phone number used on the order." }, 400);

  const creds = await getShopCredentials();
  if (!creds) return json({ error: "Tracking is not available right now." }, 503);
  const { admin } = await unauthenticated.admin(creds.shop);

  const run = async (query, variables) => {
    const res = await admin.graphql(query, { variables });
    const j = await res.json();
    if (j.errors?.length) throw new Error(j.errors[0].message);
    return j.data;
  };

  let nodes = [];
  try {
    const isPhone = digits.length >= 10 && !/unni|#/i.test(q);
    if (!isPhone) {
      // order number: try the store's name formats (" Unni_123", "#123", "123")
      const names = [` Unni_${digits}`, `#${digits}`, digits];
      for (const n of names) {
        const d = await run(
          `query($q:String!){ orders(first:3, query:$q){ nodes{ ${FIELDS} } } }`,
          { q: `name:"${n}"` },
        );
        nodes = d.orders.nodes.filter((o) => String(o.name).replace(/\D/g, "") === digits);
        if (nodes.length) break;
      }
    } else {
      const want = last10(digits);
      let after = null;
      for (let page = 0; page < 3 && nodes.length < 5; page++) {
        const d = await run(
          `query($after:String){ orders(first:100, sortKey:CREATED_AT, reverse:true, after:$after){ pageInfo{hasNextPage endCursor} nodes{ ${FIELDS} } } }`,
          { after },
        );
        for (const o of d.orders.nodes) {
          if (last10(o.phone) === want || last10(o.shippingAddress?.phone) === want) nodes.push(o);
        }
        if (!d.orders.pageInfo.hasNextPage) break;
        after = d.orders.pageInfo.endCursor;
      }
      nodes = nodes.slice(0, 5);
    }
  } catch (e) {
    console.error("track error", e.message);
    return json({ error: "Could not check right now. Please try again in a moment." }, 500);
  }

  let pick = () => null;
  try { pick = await noticesFor(nodes); } catch (e) { console.error("track notices", e.message); }
  return json({ orders: nodes.map((o) => { const r = shape(o); r.notice = pick(o, r.status); return r; }) });
};
