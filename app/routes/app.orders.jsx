import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useSubmit, useNavigation, Link, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F5F2EC;--surface:#FDFBF8;--surface-2:#F0EDE6;--surface-3:#E8E4DB;
  --border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);--border-strong:rgba(60,45,20,0.25);
  --text:#231F17;--text-2:#6B6251;--text-3:#A89F8E;
  --gold:#B8782A;--gold-bg:#FBF3E6;--gold-text:#7A4F18;--gold-border:rgba(184,120,42,0.25);
  --teal:#2A7A6A;--teal-bg:#E6F5F2;--teal-text:#185448;
  --blue:#2A5F9A;--blue-bg:#E6EEF8;--blue-text:#183A66;
  --rose:#9A2A3A;--rose-bg:#F8E6E8;--rose-text:#661825;
  --violet:#5A2A9A;--violet-bg:#EEE6F8;--violet-text:#38186A;
  --cyan:#2A7A8A;--cyan-bg:#E6F4F6;--cyan-text:#185460;
  --slate-bg:#EEEAE4;--slate-text:#4A4438;
  --orange-bg:#FBF0E6;--orange-text:#7A4A18;
  --r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;
  --shadow-xs:0 1px 2px rgba(60,45,20,0.06);
  --shadow-sm:0 2px 6px rgba(60,45,20,0.07),0 1px 2px rgba(60,45,20,0.05);
  --shadow-md:0 6px 18px rgba(60,45,20,0.09),0 2px 4px rgba(60,45,20,0.05);
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.55;min-height:100vh;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:3px;}
.ord-header{background:var(--text);padding:0 28px;display:flex;align-items:center;gap:20px;height:58px;position:sticky;top:0;z-index:60;}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{width:32px;height:32px;border:1.5px solid rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#fff;letter-spacing:0.02em;}
.brand-tag{font-size:10px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-left:2px;}
.header-mid{flex:1;display:flex;align-items:center;justify-content:center;}
.header-right{display:flex;align-items:center;gap:10px;}
.sync-badge{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.03em;}
.stat-num.danger{color:var(--rose);}
.alerts-panel{width:220px;flex-shrink:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.alerts-panel-title{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}
.alert-item{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.15);border-radius:var(--r-md);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:opacity 0.12s;display:flex;align-items:center;gap:10px;}
.alert-item:hover{opacity:0.82;}
.alert-thumb{width:32px;height:32px;border-radius:6px;object-fit:cover;background:var(--rose-bg);flex-shrink:0;}
.sku-section{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 18px;margin-bottom:14px;}
.section-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;}
.sku-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;}
.sku-card{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;transition:all 0.15s;overflow:hidden;}
.sku-card:hover{border-color:var(--border-strong);transform:translateY(-1px);box-shadow:var(--shadow-sm);}
.sku-card.sku-active{border:2px solid var(--gold);background:var(--gold-bg);}
.sku-img-wrap{width:100%;height:110px;overflow:hidden;background:var(--surface-3);position:relative;}
.sku-big{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;color:var(--text);line-height:1;}
.toolbar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;}
.search-wrap{position:relative;flex:1;min-width:200px;}
.search-wrap input{width:100%;padding:8px 12px 8px 34px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;transition:border-color 0.15s;}
.search-wrap input:focus{border-color:var(--gold);}
.bulk-bar{display:flex;align-items:center;gap:10px;background:var(--text);color:#fff;border-radius:var(--r-md);padding:10px 16px;margin-bottom:10px;flex-wrap:wrap;}
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-xs);}
.orders-table{width:100%;border-collapse:collapse;}
.orders-table th{text-align:left;padding:10px 14px;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;background:var(--surface-2);}
.badge{display:inline-block;font-size:10px;font-weight:500;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.b-gold{background:var(--gold-bg);color:var(--gold-text);}
.b-teal{background:var(--teal-bg);color:var(--teal-text);}
.modal-overlay{position:fixed;inset:0;background:rgba(35,31,23,0.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(3px);}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--text);}
.btn-primary{background:var(--text);color:var(--surface);border-color:var(--text);font-weight:500;cursor:pointer;}
.handoff-row{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text-2);padding:7px 0;border-bottom:1px solid var(--border);}
`;

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const PROD_STATUSES = ["Sent to Production", "In Production", "Production Complete"];
const ROLES = ["admin", "inventory", "production", "dispatch"];
const PAGE_SIZE = 25;

const STATUS_BADGE = {
  "Awaiting Inventory Check": "b-gold",
  "Ready for Dispatch": "b-teal",
  "Sent to Production": "b-orange",
  "In Production": "b-blue",
  "Production Complete": "b-violet",
  "Returned to Inventory": "b-cyan",
  "Dispatched": "b-slate",
  "On Hold": "b-rose",
  "Cancelled": "b-rose",
  "Paid": "b-teal",
  "Payment pending": "b-gold",
  "Authorized": "b-cyan",
  "Partially paid": "b-orange",
};
const STATUS_CHIP = {
  "Sent to Production": { cls: "b-orange", lbl: "Queued" },
  "In Production": { cls: "b-blue", lbl: "Active" },
  "Production Complete": { cls: "b-violet", lbl: "Done" },
};
const PRI_BADGE = { High: "b-pri-h", Medium: "b-pri-m", Low: "b-pri-l" };
const STAT_LINES = {
  "Awaiting Inventory Check": "#B8782A",
  "Ready for Dispatch": "#2A7A6A",
  "In Production": "#2A5F9A",
  "On Hold": "#9A2A3A",
};
const roleFilter = {
  admin: () => true,
  inventory: o => ["Awaiting Inventory Check", "Returned to Inventory", "Ready for Dispatch"].includes(o.status),
  production: o => PROD_STATUSES.includes(o.status),
  dispatch: o => ["Ready for Dispatch", "Dispatched"].includes(o.status),
};
const BULK_DEFS = [
  { label: "Stock available → dispatch", primary: true, app: ["Awaiting Inventory Check"], ns: "Ready for Dispatch", no: "Dispatch - Queue", hf: { from: "Inventory", to: "Dispatch" } },
  { label: "Send to production", primary: false, app: ["Awaiting Inventory Check"], ns: "Sent to Production", no: "Production - Queue", hf: { from: "Inventory", to: "Production" } },
  { label: "Mark in production", primary: true, app: ["Sent to Production"], ns: "In Production", no: null, hf: { from: "Queue", to: "Artisan" } },
  { label: "Mark production complete", primary: true, app: ["In Production"], ns: "Production Complete", no: null, hf: { from: "Production", to: "QC" } },
  { label: "Return to inventory", primary: true, app: ["Production Complete"], ns: "Returned to Inventory", no: "Inventory - Queue", hf: { from: "Production", to: "Inventory" } },
  { label: "Ready for dispatch", primary: true, app: ["Returned to Inventory"], ns: "Ready for Dispatch", no: "Dispatch - Queue", hf: { from: "Inventory", to: "Dispatch" } },
  { label: "Mark dispatched", primary: true, app: ["Ready for Dispatch"], ns: "Dispatched", no: "Courier", hf: { from: "Dispatch", to: "Courier" } },
  { label: "Put on hold", primary: false, app: ["Awaiting Inventory Check", "Returned to Inventory", "Ready for Dispatch", "Sent to Production", "In Production"], ns: "On Hold", no: null, hf: null },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getPriority(tags = []) {
  const t = (tags || []).map(s => s.toLowerCase());
  if (t.includes("priority:high") || t.includes("urgent")) return "High";
  if (t.includes("priority:low")) return "Low";
  return "Medium";
}
function getAging(createdAt) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}
function formatPayment(status) {
  if (!status) return "N/A";
  const map = {
    PAID: "Paid", PENDING: "Payment pending", AUTHORIZED: "Authorized",
    PARTIALLY_PAID: "Partially paid", REFUNDED: "Refunded", VOIDED: "Voided",
  };
  return map[status] || status.split("_").map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function getAvailBulk(ids, orders) {
  const sel = orders.filter(o => ids.includes(o.shopifyId));
  const ss = [...new Set(sel.map(o => o.status))];
  return BULK_DEFS.filter(d => ss.every(s => d.app.includes(s)));
}
function getSingleActions(o) {
  switch (o.status) {
    case "Awaiting Inventory Check": return [
      { l: "Stock available → dispatch", p: true, ns: "Ready for Dispatch", no: "Dispatch - Queue", hf: { from: "Inventory", to: "Dispatch" } },
      { l: "Send to production", p: false, ns: "Sent to Production", no: "Production - Queue", hf: { from: "Inventory", to: "Production" } },
      { l: "Put on hold", p: false, ns: "On Hold", no: null, hf: null },
    ];
    case "Sent to Production": return [{ l: "Mark in production", p: true, ns: "In Production", no: null, hf: { from: "Queue", to: "Artisan" } }];
    case "In Production": return [{ l: "Mark production complete", p: true, ns: "Production Complete", no: null, hf: { from: "Production", to: "QC" } }];
    case "Production Complete": return [{ l: "Return to inventory", p: true, ns: "Returned to Inventory", no: "Inventory - Queue", hf: { from: "Production", to: "Inventory" } }];
    case "Returned to Inventory": return [{ l: "Ready for dispatch", p: true, ns: "Ready for Dispatch", no: "Dispatch - Queue", hf: { from: "Inventory", to: "Dispatch" } }];
    case "Ready for Dispatch": return [{ l: "Mark dispatched", p: true, ns: "Dispatched", no: "Courier", hf: { from: "Dispatch", to: "Courier" } }];
    case "On Hold": return [{ l: "Resume — inventory check", p: true, ns: "Awaiting Inventory Check", no: "Inventory - Queue", hf: null }];
    default: return [];
  }
}

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let rawOrders = [], ordersError = null;
  try {
    let cursor = null, hasNext = true;
    while (hasNext) {
      const resp = await admin.graphql(`
        query($cursor: String) {
          orders(first: 250, after: $cursor, sortKey: CREATED_AT, reverse: true) {
            pageInfo { hasNextPage endCursor }
            edges { node {
              id name createdAt displayFinancialStatus displayFulfillmentStatus
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { firstName lastName email }
              lineItems(first: 5) { edges { node { title sku quantity image { url } } } }
              tags note
            }}
          }
        }
      `, { variables: { cursor } });
      const json = await resp.json();
      // GraphQL errors come back as 200 with { errors: [...] } — must check explicitly
      if (json.errors?.length) {
        throw new Error(json.errors.map(e => e.message).join(" | "));
      }
      const page = json.data?.orders;
      if (!page) break;
      rawOrders = rawOrders.concat(page.edges?.map(e => e.node) || []);
      hasNext = page.pageInfo?.hasNextPage || false;
      cursor = page.pageInfo?.endCursor || null;
    }
  } catch (err) {
    ordersError = err.message || "Orders unavailable";
    // Fallback: try fetching orders without customer fields
    try {
      let cursor = null, hasNext = true;
      while (hasNext) {
        const resp = await admin.graphql(`
          query($cursor: String) {
            orders(first: 250, after: $cursor, sortKey: CREATED_AT, reverse: true) {
              pageInfo { hasNextPage endCursor }
              edges { node {
                id name createdAt displayFinancialStatus displayFulfillmentStatus
                totalPriceSet { shopMoney { amount currencyCode } }
                lineItems(first: 5) { edges { node { title sku quantity image { url } } } }
                tags note
              }}
            }
          }
        `, { variables: { cursor } });
        const json = await resp.json();
        if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
        const page = json.data?.orders;
        if (!page) break;
        rawOrders = rawOrders.concat(page.edges?.map(e => e.node) || []);
        hasNext = page.pageInfo?.hasNextPage || false;
        cursor = page.pageInfo?.endCursor || null;
      }
      ordersError = null; // fallback succeeded, clear the error
    } catch (fallbackErr) {
      ordersError = err.message; // keep original error
    }
  }

  const orderIds = rawOrders.map(o => o.id);
  const localStates = orderIds.length
    ? await prisma.orderWorkflow.findMany({ where: { id: { in: orderIds } } })
    : [];

  const orders = rawOrders.map(o => {
    const state = localStates.find(s => s.id === o.id);
    const li0 = o.lineItems.edges[0]?.node;
    return {
      shopifyId: o.id,
      id: o.name,
      customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : "Guest",
      item: li0?.title || "—",
      sku: li0?.sku || "—",
      qty: li0?.quantity || 1,
      imageUrl: li0?.image?.url || null,
      orderDate: fmtDate(o.createdAt),
      createdAt: o.createdAt,
      priority: getPriority(o.tags || []),
      status: state?.status || "Awaiting Inventory Check",
      owner: state?.owner || "Inventory - Queue",
      handoffs: JSON.parse(state?.handoffs || "[]"),
      aging: getAging(o.createdAt),
      note: state?.note || "",
      shopifyNote: o.note || "",
      paymentStatus: formatPayment(o.displayFinancialStatus),
    };
  });

  return {
    orders,
    ordersError,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    params: new URL(request.url).search
  };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const fd = await request.formData();
  const actionType = fd.get("actionType");

  if (actionType === "updateWorkflow") {
    const orderId = fd.get("orderId");
    const status = fd.get("status");
    const note = fd.get("note") || undefined;
    const owner = fd.get("owner") || undefined;
    const hfFrom = fd.get("hfFrom");
    const hfTo = fd.get("hfTo");
    const existing = await prisma.orderWorkflow.findUnique({ where: { id: orderId } });
    const handoffs = JSON.parse(existing?.handoffs || "[]");
    if (status && status !== existing?.status) {
      handoffs.push({ from: hfFrom || existing?.status || "Initial", to: hfTo || status, at: new Date().toISOString() });
    }
    await prisma.orderWorkflow.upsert({
      where: { id: orderId },
      update: { status, ...(note !== undefined ? { note } : {}), ...(owner ? { owner } : {}), handoffs: JSON.stringify(handoffs) },
      create: { id: orderId, status, note: note || "", owner: owner || "Inventory - Queue", handoffs: JSON.stringify(handoffs) },
    });
    return { success: true };
  }

  if (actionType === "bulkUpdate") {
    const ids = JSON.parse(fd.get("ids") || "[]");
    const status = fd.get("status");
    const owner = fd.get("owner") || null;
    const hfFrom = fd.get("hfFrom");
    const hfTo = fd.get("hfTo");
    for (const id of ids) {
      const existing = await prisma.orderWorkflow.findUnique({ where: { id } });
      const handoffs = JSON.parse(existing?.handoffs || "[]");
      handoffs.push({ from: hfFrom || existing?.status || "Initial", to: hfTo || status, at: new Date().toISOString() });
      const update = { status, handoffs: JSON.stringify(handoffs) };
      if (owner) update.owner = owner;
      await prisma.orderWorkflow.upsert({
        where: { id },
        update,
        create: { id, status, owner: owner || "Inventory - Queue", handoffs: JSON.stringify(handoffs) },
      });
    }
    return { success: true };
  }

  if (actionType === "resetOrder") {
    const orderId = fd.get("orderId");
    await prisma.orderWorkflow.upsert({
      where: { id: orderId },
      update: { status: "Awaiting Inventory Check", owner: "Inventory - Queue", note: "", handoffs: JSON.stringify([{ from: "Reset", to: "Inventory", at: new Date().toISOString() }]) },
      create: { id: orderId, status: "Awaiting Inventory Check", owner: "Inventory - Queue", handoffs: JSON.stringify([]) },
    });
    return { success: true };
  }

  if (actionType === "saveNote") {
    const orderId = fd.get("orderId");
    const note = fd.get("note") || "";
    await prisma.orderWorkflow.upsert({
      where: { id: orderId },
      update: { note },
      create: { id: orderId, note, status: "Awaiting Inventory Check", owner: "Inventory - Queue", handoffs: "[]" },
    });
    return { success: true };
  }

  return { success: false };
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function OrderWorkflowPage() {
  const { orders: loadedOrders, ordersError } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();

  // ── local state for optimistic UI ─────────────────────────────────────────
  const [orders, setOrders] = useState(loadedOrders);
  useEffect(() => { setOrders(loadedOrders); }, [loadedOrders]);

  const [role, setRole] = useState("admin");
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [priorityF, setPriorityF] = useState("all");
  const [payF, setPayF] = useState("all");
  const [activeSKU, setActiveSKU] = useState(null);
  const [skuF, setSkuF] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [modalNote, setModalNote] = useState("");
  const [pendingBulk, setPendingBulk] = useState(null);

  // ── derived ───────────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    return orders.filter(o => {
      if (!roleFilter[role](o)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (![o.id, o.customer, o.item, o.sku, o.shopifyId].join(" ").toLowerCase().includes(q)) return false;
      }
      if (statusF !== "all" && o.status !== statusF) return false;
      if (priorityF !== "all" && o.priority !== priorityF) return false;
      if (payF !== "all" && o.paymentStatus !== payF) return false;
      if (activeSKU && o.sku !== activeSKU) return false;
      if (role === "production" && skuF !== "all") {
        if (skuF === "queued" && o.status !== "Sent to Production") return false;
        if (skuF === "active" && o.status !== "In Production") return false;
      }
      return true;
    }).sort((a, b) => {
      const n = s => parseInt(String(s).replace(/\D/g, "")) || 0;
      return n(b.shopifyId) - n(a.shopifyId);
    });
  }, [orders, role, query, statusF, priorityF, payF, activeSKU, skuF]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const prodSKUs = useMemo(() => {
    const map = {};
    orders.filter(o => PROD_STATUSES.includes(o.status)).forEach(o => {
      if (!map[o.sku]) map[o.sku] = { sku: o.sku, item: o.item, totalQty: 0, n: 0, ss: {}, imageUrl: o.imageUrl };
      map[o.sku].totalQty += o.qty;
      map[o.sku].n++;
      map[o.sku].ss[o.status] = (map[o.sku].ss[o.status] || 0) + o.qty;
    });
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
  }, [orders]);

  const delayed = visible.filter(o => o.aging >= 2);
  const selIdArr = [...selectedIds];
  const availBulk = getAvailBulk(selIdArr, orders);

  // ── Stats and Data Mappings ───────────────────────────────────────────────
  const stats = useMemo(() => [
    { label: "Awaiting Inventory Check", value: orders.filter(o => o.status === "Awaiting Inventory Check").length },
    { label: "Ready for Dispatch", value: orders.filter(o => o.status === "Ready for Dispatch").length },
    { label: "In Production", value: orders.filter(o => o.status === "In Production").length },
    { label: "On Hold", value: orders.filter(o => o.status === "On Hold").length },
    { label: "Delayed", value: delayed.length, isDanger: true }
  ], [orders, delayed]);

  const alerts = delayed.slice(0, 5);
  const skus = prodSKUs;
  const lParams = useLoaderData().params;
  const params = new URLSearchParams(lParams).toString() ? `?${new URLSearchParams(lParams).toString()}` : "";

  // ── Handlers ───────────────────────────────────────────────────────────────
  const submitUpdate = (orderId, status, no, hf) => {
    const fd = new FormData();
    fd.append("actionType", "updateWorkflow");
    fd.append("orderId", orderId);
    fd.append("status", status);
    if (no) fd.append("owner", no);
    if (hf) { fd.append("hfFrom", hf.from); fd.append("hfTo", hf.to); }
    submit(fd, { method: "POST" });
    setOrders(prev => prev.map(o => o.shopifyId !== orderId ? o : {
      ...o, status,
      ...(no ? { owner: no } : {}),
      handoffs: [...(o.handoffs || []), ...(hf ? [{ from: hf.from, to: hf.to, at: new Date().toISOString() }] : [])],
    }));
    setSelected(null);
  };

  const submitBulk = (def, ids) => {
    const fd = new FormData();
    fd.append("actionType", "bulkUpdate");
    fd.append("ids", JSON.stringify(ids));
    fd.append("status", def.ns);
    if (def.no) fd.append("owner", def.no);
    if (def.hf) { fd.append("hfFrom", def.hf.from); fd.append("hfTo", def.hf.to); }
    submit(fd, { method: "POST" });
    setOrders(prev => prev.map(o => !ids.includes(o.shopifyId) ? o : {
      ...o, status: def.ns,
      ...(def.no ? { owner: def.no } : {}),
      handoffs: [...(o.handoffs || []), ...(def.hf ? [{ from: def.hf.from, to: def.hf.to, at: new Date().toISOString() }] : [])],
    }));
    setSelectedIds(new Set());
    setPendingBulk(null);
  };

  const submitReset = (orderId) => {
    if (!confirm("Are you sure you want to reset this order?")) return;
    const fd = new FormData();
    fd.append("actionType", "updateWorkflow");
    fd.append("orderId", orderId);
    fd.append("status", "Awaiting Inventory Check");
    fd.append("owner", "Inventory - Queue");
    submit(fd, { method: "POST" });
    setOrders(prev => prev.map(o => o.shopifyId !== orderId ? o : {
      ...o, status: "Awaiting Inventory Check", owner: "Inventory - Queue", handoffs: [],
    }));
    setSelected(null);
  };

  const handleNoteSave = (orderId, note) => {
    const fd = new FormData();
    fd.append("actionType", "updateWorkflow");
    fd.append("orderId", orderId);
    fd.append("note", note);
    submit(fd, { method: "POST" });
  };


  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  const allPageSelected = page.length > 0 && page.every(o => selectedIds.has(o.shopifyId));
  const someSelected = page.some(o => selectedIds.has(o.shopifyId));

  return (
    <div className="ord-container">
      <style>{CSS}</style>

      {/* HEADER */}
      <header className="ord-header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5">
              <circle cx="8" cy="8" r="7" />
              <path d="M8 4l2 4-2 4-2-4 2-4z" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>
          <div>
            <span className="brand-name">Unnicharya</span>
            <span className="brand-tag">Ops</span>
          </div>
        </div>

        <div className="header-mid">
          <div className="role-tabs">
            {ROLES.map((r) => (
              <button
                key={r}
                className={`role-tab ${role === r ? "active" : ""}`}
                onClick={() => {
                  setRole(r);
                  setActiveSKU(null);
                  setSelectedIds(new Set());
                  setCurrentPage(1);
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="header-right">
          <span className="sync-badge">Connected</span>
          <Link to={`/app${params}`} className="back-btn">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="ord-main">
        <div className="top-row">
          <div className="stats-grid">
            {stats.map((s) => (
              <div
                key={s.label}
                className="stat-card"
                style={{ "--accent-line": STAT_LINES[s.label] || "transparent" }}
              >
                <div className="stat-label">{s.label}</div>
                <div className={`stat-num ${s.isDanger ? "danger" : ""}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="alerts-panel">
            <div className="alerts-panel-title">Delayed Orders</div>
            {alerts.length > 0 ? (
              alerts.map((a) => (
                <div key={a.id} className="alert-item" onClick={() => setSelected(a)}>
                  {a.imageUrl ? (
                    <img src={a.imageUrl} className="alert-thumb" alt="" />
                  ) : (
                    <div className="alert-thumb-ph">◎</div>
                  )}
                  <div className="alert-info">
                    <div className="alert-id">{a.shopifyId}</div>
                    <div className="alert-status">{a.status}</div>
                    <div className="alert-age">{a.aging}d delay</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="alerts-ok">All orders on track</div>
            )}
          </div>
        </div>

        {role === "production" && (
          <div className="sku-section">
            <div className="section-bar">
              <div className="section-title">
                <span className="title-pip"></span>
                Production SKU Summary
              </div>
            </div>
            <div className="sku-grid">
              {skus.map((s) => (
                <div
                  key={s.sku}
                  className={`sku-card ${activeSKU === s.sku ? "sku-active" : ""}`}
                  onClick={() => setActiveSKU(activeSKU === s.sku ? null : s.sku)}
                >
                  <div className="sku-img-wrap">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} className="sku-img" alt="" />
                    ) : (
                      <div className="sku-img-ph">◈</div>
                    )}
                  </div>
                  <div className="sku-body">
                    <div className="sku-code">{s.sku}</div>
                    <div className="sku-name">{s.item}</div>
                    <div className="sku-big">{s.totalQty}</div>
                    <div className="sku-meta">
                      units · {s.n} order{s.n !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="toolbar">
          <div className="search-wrap">
            <svg
              className="search-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="6.5" cy="6.5" r="4" />
              <path d="M11 11l2.5 2.5" />
            </svg>
            <input
              type="text"
              placeholder="Search orders, SKU, customer…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            value={statusF}
            onChange={(e) => {
              setStatusF(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All statuses</option>
            {Object.keys(STATUS_BADGE).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="dl-btn" onClick={() => window.print()}>
            Print / Export
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <div className="bulk-count">
              {selectedIds.size} selected <span>order{selectedIds.size !== 1 ? "s" : ""}</span>
            </div>
            <div className="bulk-btns">
              {BULK_DEFS.map((d) => (
                <button
                  key={d.label}
                  className={`bbtn ${d.primary ? "primary" : ""}`}
                  onClick={() => setPendingBulk({ def: d, ids: [...selectedIds] })}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button className="bulk-x" onClick={() => setSelectedIds(new Set())}>
              ✕
            </button>
          </div>
        )}

        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="th-chk">
                  <input
                    type="checkbox"
                    checked={page.length > 0 && page.every((o) => selectedIds.has(o.shopifyId))}
                    onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) page.forEach((o) => next.add(o.shopifyId));
                      else page.forEach((o) => next.delete(o.shopifyId));
                      setSelectedIds(next);
                    }}
                  />
                </th>
                <th></th>
                <th>Order</th>
                <th>Payment</th>
                <th>Customer</th>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Aging</th>
              </tr>
            </thead>
            <tbody>
              {page.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  style={{ background: selectedIds.has(o.shopifyId) ? "var(--surface-2)" : "" }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(o.shopifyId)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(o.shopifyId);
                        else next.delete(o.shopifyId);
                        setSelectedIds(next);
                      }}
                    />
                  </td>
                  <td>
                    {o.imageUrl ? (
                      <img src={o.imageUrl} className="prod-thumb" alt="" />
                    ) : (
                      <div className="prod-thumb-ph">◈</div>
                    )}
                  </td>
                  <td>
                    <div className="order-id">{o.shopifyId}</div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.paymentStatus] || ""}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>{o.customer}</td>
                  <td>
                    <div className="item-n" title={o.item}>
                      {o.item}
                    </div>
                  </td>
                  <td>
                    <span className="sku-m">{o.sku}</span>
                  </td>
                  <td>{o.qty}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status] || ""}`}>{o.status}</span>
                  </td>
                  <td>
                    <span className={o.aging >= 2 ? "age-warn" : "age-ok"}>{o.aging}d</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {page.length === 0 && (
            <div className="empty-state">
              <div className="empty-glyph">◎</div>
              <div>No orders match current filters</div>
            </div>
          )}
        </div>

        <div className="bottom-row">
          <div className="process-panel">
            <div className="panel-title">Process Rules</div>
            <div className="flow-diagram">
              {["Shopify", "Inventory", "Production", "Inventory", "Dispatch"].map((n, i, arr) => (
                <span key={i}>
                  <span className="flow-node">{n}</span>
                  {i < arr.length - 1 && <span className="flow-arrow">→</span>}
                </span>
              ))}
            </div>
            {[
              "Every Shopify order enters automatically and is assigned to Inventory for stock check.",
              "Inventory can mark stock available (→ Dispatch) or send the SKU to Production.",
              "Production cannot close the order directly — it must return to Inventory for QC and receipt.",
              "Only Inventory can approve an order as ready for dispatch after receiving the finished item.",
            ].map((txt, i) => (
              <div key={txt} className="process-step">
                <div className="step-num">{i + 1}</div>
                <div className="step-text">{txt}</div>
              </div>
            ))}
          </div>
          <div className="info-panel">
            <div className="panel-title">Priority Tags</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 14 }}>
              Add these tags to Shopify orders to control priority:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge b-pri-h">High</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-3)" }}>
                  priority:high or urgent
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge b-pri-m">Medium</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-3)" }}>
                  default (no tag)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="badge b-pri-l">Low</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-3)" }}>
                  priority:low
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {selected.shopifyId} — {selected.item}
                </div>
                <div className="modal-meta">{selected.customer}</div>
              </div>
              <button className="modal-x" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selected.imageUrl ? (
                <img src={selected.imageUrl} className="modal-product-img" alt="" />
              ) : (
                <div className="modal-product-ph">◈</div>
              )}
              <div className="modal-grid">
                <div>
                  <div className="mfield-lbl">SKU</div>
                  <div className="mfield-val">{selected.sku}</div>
                </div>
                <div>
                  <div className="mfield-lbl">Quantity</div>
                  <div className="mfield-val">{selected.qty}</div>
                </div>
                <div>
                  <div className="mfield-lbl">Status</div>
                  <div className="mfield-val">{selected.status}</div>
                </div>
                <div>
                  <div className="mfield-lbl">Aging</div>
                  <div className="mfield-val">{selected.aging} days</div>
                </div>
              </div>

              <div className="handoff-wrap">
                <div className="section-lbl">Handoff Timeline</div>
                {selected.handoffs.map((h, i) => (
                  <div key={i} className="handoff-row">
                    <span className="h-from">{h.from}</span>
                    <span className="h-arrow">→</span>
                    <span className="h-to">{h.to}</span>
                    <span className="h-time">{h.at}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="section-lbl">Internal note</div>
                <textarea
                  className="note-area"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Add a note..."
                />
              </div>
            </div>
            <div className="modal-actions">
              {getSingleActions(selected).map((a, i) => (
                <button
                  key={i}
                  className={`btn ${a.p ? "btn-primary" : ""}`}
                  onClick={() => submitUpdate(selected.shopifyId, a.ns, a.no, a.hf)}
                >
                  {a.l}
                </button>
              ))}
              <button className="btn btn-ghost" onClick={() => submitReset(selected.shopifyId)}>Reset Workflow</button>
              <button className="btn btn-ghost ml-auto" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingBulk && (
        <div className="modal-overlay" onClick={() => setPendingBulk(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{pendingBulk.def.label}</div>
                <div className="modal-meta">{pendingBulk.ids.length} orders affected</div>
              </div>
              <button className="modal-x" onClick={() => setPendingBulk(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="bm-list">
                {orders
                  .filter((o) => pendingBulk.ids.includes(o.shopifyId))
                  .map((o) => (
                    <div key={o.id} className="bm-row">
                      <span className="bm-id">{o.shopifyId}</span>
                      <span className="bm-item">{o.item}</span>
                    </div>
                  ))}
              </div>
              <div className="bm-desc">
                Status will change to <strong>{pendingBulk.def.ns}</strong>
                {pendingBulk.def.no && (
                  <>
                    . Owner: <strong>{pendingBulk.def.no}</strong>
                  </>
                )}
                .
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => submitBulk(pendingBulk.def, pendingBulk.ids)}
              >
                Confirm Update
              </button>
              <button className="btn btn-ghost ml-auto" onClick={() => setPendingBulk(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
