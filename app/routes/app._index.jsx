import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
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
  --r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;
  --shadow-xs:0 1px 2px rgba(60,45,20,0.06);
  --shadow-sm:0 2px 6px rgba(60,45,20,0.07),0 1px 2px rgba(60,45,20,0.05);
  --shadow-md:0 6px 18px rgba(60,45,20,0.09),0 2px 4px rgba(60,45,20,0.05);
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.55;min-height:100vh;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:3px;}
.inv-header{background:var(--text);padding:0 28px;display:flex;align-items:center;gap:20px;height:58px;position:sticky;top:0;z-index:60;}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{width:32px;height:32px;border:1.5px solid rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#fff;letter-spacing:0.02em;}
.brand-tag{font-size:10px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-left:2px;}
.header-mid{flex:1;display:flex;align-items:center;justify-content:center;gap:2px;}
.nav-tab{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:5px 16px;border-radius:6px;border:none;background:transparent;color:rgba(255,255,255,0.45);cursor:pointer;transition:all 0.15s;}
.nav-tab:hover{color:rgba(255,255,255,0.75);}
.nav-tab.active{background:rgba(255,255,255,0.12);color:#fff;}
.header-right{display:flex;align-items:center;gap:10px;}
.hdr-btn{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);cursor:pointer;transition:all 0.15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
.hdr-btn:hover{background:rgba(255,255,255,0.14);color:#fff;}
.inv-main{padding:24px 28px;max-width:1360px;margin:0 auto;}
.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;transition:box-shadow 0.15s,transform 0.1s;position:relative;overflow:hidden;cursor:default;}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent-line,transparent);}
.stat-card:hover{box-shadow:var(--shadow-sm);transform:translateY(-1px);}
.stat-label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}
.stat-num{font-size:28px;font-weight:300;color:var(--text);line-height:1;font-family:'Cormorant Garamond',serif;}
.stat-num.danger{color:var(--rose);}
.stat-num.warn{color:var(--gold);}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.sec-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-xs);}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--border);background:var(--surface-2);}
.sec-title{font-size:12px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:8px;}
.title-pip{width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0;}
.toolbar{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap;align-items:center;}
.search-wrap{position:relative;flex:1;min-width:180px;}
.search-wrap input{width:100%;padding:7px 12px 7px 32px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;transition:border-color 0.15s;}
.search-wrap input:focus{border-color:var(--gold);}
.search-wrap input::placeholder{color:var(--text-3);}
.search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:var(--text-3);pointer-events:none;}
.filter-sel{padding:7px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;cursor:pointer;}
.filter-sel:focus{border-color:var(--gold);}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;min-width:680px;}
th{text-align:left;padding:9px 14px;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;background:var(--surface-2);border-bottom:1px solid var(--border-md);white-space:nowrap;}
td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;font-size:13px;}
tr:last-child td{border-bottom:none;}
tbody tr{cursor:pointer;transition:background 0.08s;}
tbody tr:hover td{background:var(--surface-2);}
.row-out td{background:#fdf4f4!important;}
.row-low td{background:#fdf9f0!important;}
.prod-cell{display:flex;align-items:center;gap:10px;}
.prod-img{width:38px;height:38px;border-radius:7px;object-fit:cover;border:1px solid var(--border);background:var(--surface-3);display:block;flex-shrink:0;}
.prod-img-ph{width:38px;height:38px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--text-3);flex-shrink:0;}
.prod-name{font-size:13px;font-weight:500;color:var(--text);line-height:1.3;}
.prod-variant{font-size:11px;color:var(--text-3);margin-top:1px;}
.qty-in{width:72px;padding:5px 8px;border:1px solid var(--border-md);border-radius:5px;font-size:13px;text-align:center;outline:none;font-family:'DM Mono',monospace;transition:border-color 0.15s;background:var(--surface);}
.qty-in:focus{border-color:var(--gold);}
.txt-in{width:100px;padding:5px 8px;border:1px solid var(--border-md);border-radius:5px;font-size:12px;outline:none;transition:border-color 0.15s;background:var(--surface);font-family:'DM Sans',sans-serif;}
.txt-in:focus{border-color:var(--gold);}
.save-btn{padding:4px 10px;font-size:12px;font-weight:500;background:var(--text);color:#fff;border:none;border-radius:5px;cursor:pointer;transition:opacity 0.12s;}
.save-btn:hover{opacity:0.8;}
.badge{display:inline-block;font-size:10px;font-weight:500;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.b-success{background:var(--teal-bg);color:var(--teal-text);}
.b-warning{background:var(--gold-bg);color:var(--gold-text);}
.b-danger{background:var(--rose-bg);color:var(--rose-text);}
.b-info{background:var(--blue-bg);color:var(--blue-text);}
.b-slate{background:#EEEAE4;color:#4A4438;}
.b-fulfil{background:var(--teal-bg);color:var(--teal-text);}
.b-unfulfil{background:var(--rose-bg);color:var(--rose-text);}
.b-partial{background:var(--gold-bg);color:var(--gold-text);}
.diff-chip{display:inline-flex;align-items:center;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;}
.d-pos{background:var(--teal-bg);color:var(--teal-text);}
.d-neg{background:var(--rose-bg);color:var(--rose-text);}
.d-zero{background:#EEEAE4;color:#4A4438;}
.orders-list{padding:12px 16px;display:flex;flex-direction:column;gap:10px;}
.order-card{border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;background:var(--surface-2);}
.order-hdr{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:background 0.1s;gap:12px;flex-wrap:wrap;}
.order-hdr:hover{background:var(--surface-3);}
.order-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.order-num{font-weight:600;font-size:14px;font-family:'Cormorant Garamond',serif;}
.order-cust{font-size:12px;color:var(--text-2);}
.order-date{font-size:11px;color:var(--text-3);font-family:'DM Mono',monospace;}
.order-right{display:flex;align-items:center;gap:10px;}
.caret{color:var(--text-3);font-size:11px;transition:transform 0.2s;}
.caret.open{transform:rotate(180deg);}
.order-body{border-top:1px solid var(--border);}
.alerts-panel{width:220px;flex-shrink:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.alerts-panel-title{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}
.alert-item{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.15);border-radius:var(--r-md);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:opacity 0.12s;display:flex;align-items:center;gap:10px;}
.alert-item:hover{opacity:0.82;}
.alert-item:last-child{margin-bottom:0;}
.alert-thumb{width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0;}
.alert-thumb-ph{width:32px;height:32px;border-radius:6px;background:rgba(154,42,58,0.12);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;}
.alert-info{flex:1;min-width:0;}
.alert-id{font-size:12px;font-weight:500;color:var(--rose-text);}
.alert-sub{font-size:10px;color:var(--rose);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.alerts-ok{background:var(--teal-bg);border:1px solid rgba(42,122,106,0.15);border-radius:var(--r-md);padding:10px 12px;font-size:11px;color:var(--teal-text);display:flex;align-items:center;gap:6px;}
.top-row{display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;flex-wrap:wrap;}
.top-row .stats-grid{margin-bottom:0;flex:1;}
.empty-state{text-align:center;padding:52px 24px;color:var(--text-3);}
.empty-glyph{font-family:'Cormorant Garamond',serif;font-size:42px;color:var(--border-strong);margin-bottom:10px;}
.toast-wrap{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:999;}
.toast{background:var(--text);color:#fff;padding:10px 18px;border-radius:var(--r-sm);font-size:13px;display:flex;align-items:center;gap:8px;}
.toast.t-success{background:var(--teal);}
.toast.t-error{background:var(--rose);}
.save-bar{display:flex;align-items:center;gap:10px;background:var(--text);color:#fff;border-radius:var(--r-md);padding:10px 16px;margin-bottom:12px;}
.save-bar-label{font-size:13px;font-weight:500;}
.sbtn{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:6px 16px;border-radius:var(--r-sm);border:none;background:#fff;color:var(--text);cursor:pointer;transition:opacity 0.12s;}
.sbtn:hover{opacity:0.85;}
.sbtn-ghost{background:rgba(255,255,255,0.12);color:#fff;}
.sbtn-ghost:hover{background:rgba(255,255,255,0.2);}
.ml-auto{margin-left:auto;}
.sku-m{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-2);}
.price-m{font-family:'DM Mono',monospace;font-size:12px;}
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(3,1fr);}.two-col{grid-template-columns:1fr;}.top-row{flex-direction:column;}.alerts-panel{width:100%;}}
@media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr);}.inv-main{padding:16px;}.inv-header{padding:0 16px;}}
`;

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const products = [];
  let cursor = null, hasNext = true;
  while (hasNext) {
    const resp = await admin.graphql(`
      query ($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges { node {
            id title
            featuredImage { url }
            variants(first: 50) {
              edges { node { id title sku inventoryQuantity } }
            }
          }}
        }
      }
    `, { variables: { cursor } });
    const pg = (await resp.json()).data?.products;
    if (!pg) break;
    products.push(...pg.edges.map(e => ({
      id: e.node.id,
      title: e.node.title,
      image: e.node.featuredImage || null,
      variants: e.node.variants.edges.map(v => ({
        id: v.node.id,
        title: v.node.title,
        sku: v.node.sku || "",
        inventoryQuantity: v.node.inventoryQuantity ?? 0,
      })),
    })));
    hasNext = pg.pageInfo.hasNextPage;
    cursor = pg.pageInfo.endCursor;
  }

  let orders = [], ordersError = null;
  try {
    let osCursor = null, osNext = true;
    while (osNext) {
      const resp = await admin.graphql(`
        query ($cursor: String) {
          orders(first: 50, after: $cursor, sortKey: CREATED_AT, reverse: true) {
            pageInfo { hasNextPage endCursor }
            edges { node {
              id name createdAt displayFinancialStatus displayFulfillmentStatus
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { firstName lastName }
              lineItems(first: 10) {
                edges { node {
                  title quantity sku
                  image { url }
                  variant { id title }
                }}
              }
            }}
          }
        }
      `, { variables: { cursor: osCursor } });
      const json = await resp.json();
      if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
      const pg = json.data?.orders;
      if (!pg) break;
      orders.push(...pg.edges.map(e => ({
        id: e.node.id,
        name: e.node.name,
        createdAt: e.node.createdAt,
        customer: e.node.customer,
        totalPrice: parseFloat(e.node.totalPriceSet?.shopMoney?.amount || 0),
        currency: e.node.totalPriceSet?.shopMoney?.currencyCode || "INR",
        financialStatus: e.node.displayFinancialStatus,
        fulfillmentStatus: e.node.displayFulfillmentStatus,
        lineItems: e.node.lineItems.edges.map(le => ({
          title: le.node.title,
          quantity: le.node.quantity,
          sku: le.node.sku || "",
          imageUrl: le.node.image?.url || null,
          variantId: le.node.variant?.id || null,
          variantTitle: le.node.variant?.title || null,
        })),
      })));
      osNext = pg.pageInfo.hasNextPage;
      osCursor = pg.pageInfo.endCursor;
    }
    orders = orders.filter(o =>
      !o.fulfillmentStatus ||
      o.fulfillmentStatus === "UNFULFILLED" ||
      o.fulfillmentStatus === "PARTIAL"
    );
  } catch (err) {
    ordersError = err.message || "Orders unavailable";
  }

  const variantIds = products.flatMap(p => p.variants.map(v => v.id));
  const warehouseRows = variantIds.length
    ? await prisma.inventory.findMany({ where: { id: { in: variantIds } } })
    : [];
  const warehouse = Object.fromEntries(
    warehouseRows.map(r => [r.id, { quantity: r.quantity, binLocation: r.binLocation || "", notes: r.notes || "" }])
  );

  return { products, orders, warehouse, ordersError };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const body = await request.json();

  if (body.type === "saveVariant") {
    const { variantId, quantity, binLocation, notes } = body;
    await prisma.inventory.upsert({
      where: { id: variantId },
      update: { quantity: parseInt(quantity), binLocation: binLocation || "", notes: notes || "" },
      create: { id: variantId, quantity: parseInt(quantity), binLocation: binLocation || "", notes: notes || "" },
    });
    return { ok: true };
  }

  if (body.type === "saveBulk") {
    await Promise.all(body.updates.map(u =>
      prisma.inventory.upsert({
        where: { id: u.variantId },
        update: { quantity: u.quantity, binLocation: u.binLocation || "", notes: u.notes || "" },
        create: { id: u.variantId, quantity: u.quantity, binLocation: u.binLocation || "", notes: u.notes || "" },
      })
    ));
    return { ok: true, count: body.updates.length };
  }

  return { ok: false };
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function cur(n, currency = "INR") {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function QtyBadge({ q }) {
  if (q === 0) return <span className="badge b-danger">0</span>;
  if (q <= 5)  return <span className="badge b-warning">{q}</span>;
  return              <span className="badge b-success">{q}</span>;
}

function DiffChip({ diff }) {
  if (diff === null) return <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>;
  if (diff > 0) return <span className="diff-chip d-pos">+{diff}</span>;
  if (diff < 0) return <span className="diff-chip d-neg">{diff}</span>;
  return               <span className="diff-chip d-zero">0</span>;
}

function Thumb({ src, alt, size = 38 }) {
  if (src) return (
    <img src={src} className="prod-img" style={{ width: size, height: size }} alt={alt}
      onError={e => { e.target.style.display = "none"; }} />
  );
  return <div className="prod-img-ph" style={{ width: size, height: size }}>◈</div>;
}

function FulfillBadge({ status }) {
  if (!status || status === "UNFULFILLED")
    return <span className="badge b-unfulfil">Unfulfilled</span>;
  if (status === "FULFILLED")
    return <span className="badge b-fulfil">Fulfilled</span>;
  return <span className="badge b-partial">Partial</span>;
}

const TABS = [
  ["dashboard", "Dashboard"],
  ["products",  "Products & Inventory"],
  ["orders",    "Open Orders"],
  ["alerts",    "Alerts"],
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function InventoryDashboard() {
  const { products, orders, warehouse: initWarehouse, ordersError } = useLoaderData();

  const [tab,      setTab]      = useState("dashboard");
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [expanded, setExpanded] = useState(new Set());
  const [pending,  setPending]  = useState({});
  const [warehouse, setWarehouse] = useState(initWarehouse);
  const [toasts,   setToasts]   = useState([]);

  const fetcher = useFetcher();

  function showToast(msg, type = "") {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      showToast(fetcher.data.count ? `Saved ${fetcher.data.count} items` : "Saved", "success");
    }
  }, [fetcher.state, fetcher.data]);

  function track(vid, field, val) {
    setPending(prev => ({
      ...prev,
      [vid]: { ...(prev[vid] || { qty: "", binLocation: "", notes: "" }), [field]: val },
    }));
  }

  function saveVariant(vid) {
    const p  = pending[vid] || {};
    const wh = warehouse[vid] || {};
    const qty = p.qty !== undefined ? p.qty : (wh.quantity !== undefined ? String(wh.quantity) : "");
    if (qty === "") { showToast("Enter a quantity first", "error"); return; }
    const binLocation = p.binLocation !== undefined ? p.binLocation : (wh.binLocation || "");
    const notes       = p.notes !== undefined ? p.notes : (wh.notes || "");
    fetcher.submit(
      { type: "saveVariant", variantId: vid, quantity: parseInt(qty), binLocation, notes },
      { method: "post", encType: "application/json" }
    );
    setWarehouse(w => ({ ...w, [vid]: { quantity: parseInt(qty), binLocation, notes } }));
    setPending(prev => { const n = { ...prev }; delete n[vid]; return n; });
  }

  function saveAll() {
    const keys = Object.keys(pending);
    if (!keys.length) { showToast("No pending changes"); return; }
    const updates = keys.map(vid => {
      const p = pending[vid], wh = warehouse[vid] || {};
      return {
        variantId: vid,
        quantity: parseInt(p.qty !== undefined ? p.qty : (wh.quantity || 0)),
        binLocation: p.binLocation !== undefined ? p.binLocation : (wh.binLocation || ""),
        notes: p.notes !== undefined ? p.notes : (wh.notes || ""),
      };
    });
    fetcher.submit({ type: "saveBulk", updates }, { method: "post", encType: "application/json" });
    setWarehouse(w => {
      const n = { ...w };
      updates.forEach(u => { n[u.variantId] = { quantity: u.quantity, binLocation: u.binLocation, notes: u.notes }; });
      return n;
    });
    setPending({});
  }

  function navigate(t) { setTab(t); setSearch(""); setFilter("all"); }
  function toggleOrder(id) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // ── stats ──────────────────────────────────────────────────────────────────
  const allVariants = products.flatMap(p => p.variants.map(v => ({ ...v, pTitle: p.title, pImg: p.image?.url })));
  const stats = {
    products: products.length,
    variants: allVariants.length,
    openOrders: orders.length,
    low: allVariants.filter(v => (v.inventoryQuantity || 0) <= 5).length,
    out: allVariants.filter(v => (v.inventoryQuantity || 0) === 0).length,
  };
  const lowItems = allVariants.filter(v => (v.inventoryQuantity || 0) <= 5)
    .sort((a, b) => (a.inventoryQuantity || 0) - (b.inventoryQuantity || 0));

  // ── DASHBOARD TAB ──────────────────────────────────────────────────────────
  function DashboardTab() {
    const pendingOrders = orders.slice(0, 8);
    return (
      <>
        <div className="top-row">
          <div className="stats-grid">
            <div className="stat-card" style={{ "--accent-line": "#B8782A" }}>
              <div className="stat-label">Products</div>
              <div className="stat-num">{stats.products}</div>
            </div>
            <div className="stat-card" style={{ "--accent-line": "#2A5F9A" }}>
              <div className="stat-label">Total Variants</div>
              <div className="stat-num">{stats.variants}</div>
            </div>
            <div className="stat-card" style={{ "--accent-line": "#2A7A6A" }}>
              <div className="stat-label">Open Orders</div>
              <div className="stat-num">{stats.openOrders}</div>
            </div>
            <div className="stat-card" style={{ "--accent-line": "#B8782A" }}>
              <div className="stat-label">Low / Out of Stock</div>
              <div className={`stat-num${stats.low > 0 ? " warn" : ""}`}>{stats.low}</div>
            </div>
            <div className="stat-card" style={{ "--accent-line": "#9A2A3A" }}>
              <div className="stat-label">Out of Stock</div>
              <div className={`stat-num${stats.out > 0 ? " danger" : ""}`}>{stats.out}</div>
            </div>
          </div>

          <div className="alerts-panel">
            <div className="alerts-panel-title">Stock Alerts</div>
            {lowItems.length === 0 ? (
              <div className="alerts-ok">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#2A7A6A" strokeWidth="1.2" />
                  <path d="M3.5 6l1.8 1.8L8.5 4" stroke="#2A7A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                All stocked
              </div>
            ) : lowItems.slice(0, 6).map(v => (
              <div key={v.id} className="alert-item">
                {v.pImg
                  ? <img src={v.pImg} className="alert-thumb" alt={v.pTitle} onError={e => { e.target.style.display = "none"; }} />
                  : <div className="alert-thumb-ph">◈</div>}
                <div className="alert-info">
                  <div className="alert-id">{v.pTitle.length > 22 ? v.pTitle.slice(0, 22) + "…" : v.pTitle}</div>
                  <div className="alert-sub">{v.title !== "Default Title" ? v.title : (v.sku || "—")} · {v.inventoryQuantity || 0} left</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="two-col">
          <div className="sec-card">
            <div className="sec-hdr">
              <div className="sec-title"><span className="title-pip" />Low Stock Items</div>
              <span className="badge b-danger">{lowItems.length}</span>
            </div>
            {lowItems.length === 0 ? (
              <div className="empty-state"><div className="empty-glyph">✦</div><p>All products well stocked</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th></th><th>Product</th><th>SKU</th><th>Shopify Qty</th><th>Warehouse</th></tr></thead>
                  <tbody>
                    {lowItems.slice(0, 10).map(v => {
                      const q  = v.inventoryQuantity || 0;
                      const wh = warehouse[v.id];
                      return (
                        <tr key={v.id} className={q === 0 ? "row-out" : "row-low"}>
                          <td style={{ padding: "8px 6px 8px 14px", width: 46 }}>
                            <Thumb src={v.pImg} alt={v.pTitle} size={34} />
                          </td>
                          <td>
                            <div className="prod-name">{v.pTitle.length > 30 ? v.pTitle.slice(0, 30) + "…" : v.pTitle}</div>
                            {v.title !== "Default Title" && <div className="prod-variant">{v.title}</div>}
                          </td>
                          <td><span className="sku-m">{v.sku || "—"}</span></td>
                          <td><QtyBadge q={q} /></td>
                          <td>
                            {wh
                              ? <span className="badge b-info">{wh.quantity}</span>
                              : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Not set</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="sec-card">
            <div className="sec-hdr">
              <div className="sec-title"><span className="title-pip" />Pending Fulfillment</div>
              <span className="badge b-warning">{pendingOrders.length}</span>
            </div>
            {pendingOrders.length === 0 ? (
              <div className="empty-state"><div className="empty-glyph">✦</div><p>All orders fulfilled!</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {pendingOrders.map(o => (
                      <tr key={o.id} onClick={() => navigate("orders")}>
                        <td>
                          <strong>{o.name}</strong>
                          <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'DM Mono',monospace" }}>{fmt(o.createdAt)}</div>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                          {o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : "Guest"}
                        </td>
                        <td style={{ fontWeight: 500 }}>{o.lineItems.length}</td>
                        <td><span className="price-m">{cur(o.totalPrice)}</span></td>
                        <td><FulfillBadge status={o.fulfillmentStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── PRODUCTS TAB ───────────────────────────────────────────────────────────
  function ProductsTab() {
    const q = search.toLowerCase();
    let list = products;
    if (q) list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.variants.some(v => (v.sku || "").toLowerCase().includes(q))
    );
    if (filter === "out")  list = list.filter(p => p.variants.some(v => (v.inventoryQuantity || 0) === 0));
    if (filter === "low")  list = list.filter(p => p.variants.some(v => { const qty = v.inventoryQuantity || 0; return qty > 0 && qty <= 5; }));
    if (filter === "ok")   list = list.filter(p => p.variants.every(v => (v.inventoryQuantity || 0) > 5));
    if (filter === "miss") list = list.filter(p => p.variants.some(v => !warehouse[v.id]));

    const hasPending = Object.keys(pending).length > 0;

    return (
      <>
        {hasPending && (
          <div className="save-bar">
            <div className="save-bar-label">
              Unsaved changes <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginLeft: 4 }}>{Object.keys(pending).length}</span>
            </div>
            <button className="sbtn" onClick={saveAll}>💾 Save All</button>
            <button className="sbtn sbtn-ghost ml-auto" onClick={() => setPending({})}>Discard</button>
          </div>
        )}
        <div className="sec-card">
          <div className="toolbar">
            <div className="search-wrap">
              <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l2.5 2.5" />
              </svg>
              <input type="text" placeholder="Search products, SKU…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-sel" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All products</option>
              <option value="ok">In stock (&gt;5)</option>
              <option value="low">Low stock (≤5)</option>
              <option value="out">Out of stock</option>
              <option value="miss">Warehouse qty missing</option>
            </select>
            <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{list.length} product{list.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 46 }}></th>
                  <th>Product / Variant</th><th>SKU</th>
                  <th>Shopify Qty</th><th>Warehouse Qty</th><th>Diff</th>
                  <th>Bin / Location</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state"><div className="empty-glyph">◎</div><p>No products match your filter</p></div>
                  </td></tr>
                ) : list.flatMap(prod => {
                  const multi = prod.variants.length > 1;
                  const rows = [];
                  if (multi) {
                    rows.push(
                      <tr key={`hdr-${prod.id}`} style={{ background: "var(--surface-2)" }}>
                        <td colSpan={9} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Thumb src={prod.image?.url} alt={prod.title} size={22} />
                            {prod.title}
                            <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({prod.variants.length} variants)</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  prod.variants.forEach(v => {
                    const wh = warehouse[v.id] || {};
                    const p  = pending[v.id] || {};
                    const sq = v.inventoryQuantity || 0;
                    const wqRaw = p.qty !== undefined ? p.qty : (wh.quantity !== undefined ? String(wh.quantity) : "");
                    const wq = wqRaw !== "" ? parseInt(wqRaw) : null;
                    const diff = wq !== null ? wq - sq : null;
                    const rowCls = sq === 0 ? "row-out" : sq <= 5 ? "row-low" : "";
                    rows.push(
                      <tr key={v.id} className={rowCls}>
                        <td style={{ padding: "8px 6px 8px 14px", width: 46 }}>
                          {!multi && <Thumb src={prod.image?.url} alt={prod.title} size={36} />}
                        </td>
                        <td>
                          {!multi && <div className="prod-name">{prod.title}</div>}
                          <div className="prod-variant">{v.title !== "Default Title" ? v.title : (multi ? "" : "—")}</div>
                        </td>
                        <td><span className="sku-m">{v.sku || "—"}</span></td>
                        <td><QtyBadge q={sq} /></td>
                        <td>
                          <input className="qty-in" type="number" min="0" value={wqRaw}
                            placeholder="—" onChange={e => track(v.id, "qty", e.target.value)} />
                        </td>
                        <td><DiffChip diff={diff} /></td>
                        <td>
                          <input className="txt-in" type="text"
                            value={p.binLocation !== undefined ? p.binLocation : (wh.binLocation || "")}
                            placeholder="Bin/shelf" onChange={e => track(v.id, "binLocation", e.target.value)} />
                        </td>
                        <td>
                          <input className="txt-in" type="text"
                            value={p.notes !== undefined ? p.notes : (wh.notes || "")}
                            placeholder="Notes" onChange={e => track(v.id, "notes", e.target.value)} />
                        </td>
                        <td><button className="save-btn" onClick={() => saveVariant(v.id)}>Save</button></td>
                      </tr>
                    );
                  });
                  return rows;
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // ── ORDERS TAB ─────────────────────────────────────────────────────────────
  function OrdersTab() {
    const q = search.toLowerCase();
    let list = orders;
    if (q) list = list.filter(o =>
      o.name.toLowerCase().includes(q) ||
      (o.customer && `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q)) ||
      o.lineItems.some(li => li.title.toLowerCase().includes(q))
    );

    if (!list.length) return (
      <div className="sec-card">
        <div className="empty-state"><div className="empty-glyph">◎</div><p>No open orders right now</p></div>
      </div>
    );

    return (
      <div className="sec-card">
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l2.5 2.5" />
            </svg>
            <input type="text" placeholder="Search orders, customers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{list.length} open order{list.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="orders-list">
          {list.map(o => {
            const open = expanded.has(o.id);
            const cust = o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : "Guest";
            const firstImg = o.lineItems[0]?.imageUrl;

            return (
              <div key={o.id} className="order-card">
                <div className="order-hdr" onClick={() => toggleOrder(o.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Thumb src={firstImg} alt={o.name} size={36} />
                    <div className="order-meta">
                      <span className="order-num">{o.name}</span>
                      <span className="order-cust">👤 {cust}</span>
                      <span className="order-date">{fmt(o.createdAt)}</span>
                      <FulfillBadge status={o.fulfillmentStatus} />
                    </div>
                  </div>
                  <div className="order-right">
                    <span className="price-m" style={{ fontWeight: 600 }}>{cur(o.totalPrice)}</span>
                    <span className="badge b-info">{o.lineItems.length} item{o.lineItems.length !== 1 ? "s" : ""}</span>
                    <span className={`caret${open ? " open" : ""}`}>▼</span>
                  </div>
                </div>
                {open && (
                  <div className="order-body">
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th style={{ width: 46 }}></th><th>Product</th><th>Variant</th><th>SKU</th><th>Ordered</th><th>Shopify Stock</th><th>Warehouse</th><th>Bin</th></tr>
                        </thead>
                        <tbody>
                          {o.lineItems.map((li, i) => {
                            const prod    = products.find(p => p.variants.some(v => v.id === li.variantId));
                            const variant = prod?.variants.find(v => v.id === li.variantId);
                            const sq      = variant ? (variant.inventoryQuantity || 0) : null;
                            const wh      = li.variantId ? warehouse[li.variantId] : null;
                            const avail   = wh ? wh.quantity : sq;
                            const [stockCls, stockLbl] = avail === null
                              ? ["b-slate", "Unknown"]
                              : avail >= li.quantity
                              ? ["b-success", "✓ Available"]
                              : avail > 0
                              ? ["b-warning", "⚠ Partial"]
                              : ["b-danger", "✗ Short"];
                            return (
                              <tr key={i}>
                                <td style={{ padding: "8px 6px 8px 16px", width: 46 }}>
                                  <Thumb src={li.imageUrl} alt={li.title} size={34} />
                                </td>
                                <td><div className="prod-name" style={{ fontSize: 12 }}>{li.title}</div></td>
                                <td style={{ fontSize: 11, color: "var(--text-3)" }}>{li.variantTitle || "—"}</td>
                                <td><span className="sku-m">{li.sku || "—"}</span></td>
                                <td style={{ fontWeight: 600 }}>{li.quantity}</td>
                                <td>{sq !== null ? <QtyBadge q={sq} /> : "—"}</td>
                                <td>
                                  {wh ? <span className="badge b-info">{wh.quantity}</span>
                                      : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Not entered</span>}
                                </td>
                                <td>
                                  {wh?.binLocation
                                    ? <span className="sku-m">{wh.binLocation}</span>
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── ALERTS TAB ─────────────────────────────────────────────────────────────
  function AlertsTab() {
    const alerts = [];
    products.forEach(prod => prod.variants.forEach(v => {
      const sq = v.inventoryQuantity || 0;
      const wh = warehouse[v.id];
      const wq = wh?.quantity;
      if (sq === 0) alerts.push({ sev: "danger", prod, v, sq, wq, reason: "Out of stock on Shopify" });
      else if (sq <= 5) alerts.push({ sev: "warning", prod, v, sq, wq, reason: `Low stock — ${sq} left` });
      if (wq !== undefined && Math.abs(wq - sq) >= 3)
        alerts.push({ sev: "info", prod, v, sq, wq, reason: `Qty mismatch — Shopify: ${sq}, Warehouse: ${wq}` });
    }));

    if (!alerts.length) return (
      <div className="sec-card">
        <div className="empty-state"><div className="empty-glyph">✦</div><p>No alerts — everything looks good!</p></div>
      </div>
    );

    return (
      <div className="sec-card">
        <div className="sec-hdr">
          <div className="sec-title"><span className="title-pip" />Stock Alerts</div>
          <span className="badge b-danger">{alerts.length}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th style={{ width: 46 }}></th><th>Severity</th><th>Product</th><th>Variant</th><th>SKU</th><th>Shopify Qty</th><th>Warehouse</th><th>Issue</th></tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} className={a.sev === "danger" ? "row-out" : a.sev === "warning" ? "row-low" : ""}>
                  <td style={{ padding: "8px 6px 8px 14px" }}>
                    <Thumb src={a.prod.image?.url} alt={a.prod.title} size={34} />
                  </td>
                  <td>
                    <span className={`badge ${a.sev === "danger" ? "b-danger" : a.sev === "warning" ? "b-warning" : "b-info"}`}>
                      {a.sev === "danger" ? "🔴 Critical" : a.sev === "warning" ? "🟡 Low" : "🔵 Mismatch"}
                    </span>
                  </td>
                  <td><div className="prod-name">{a.prod.title.length > 28 ? a.prod.title.slice(0, 28) + "…" : a.prod.title}</div></td>
                  <td style={{ fontSize: 11, color: "var(--text-3)" }}>{a.v.title !== "Default Title" ? a.v.title : "—"}</td>
                  <td><span className="sku-m">{a.v.sku || "—"}</span></td>
                  <td><QtyBadge q={a.sq} /></td>
                  <td>
                    {a.wq !== undefined
                      ? <span className="badge b-info">{a.wq}</span>
                      : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Not set</span>}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="inv-header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="5.5" r="2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" />
              <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-name">Unniyarcha</div>
          <div className="brand-tag">inventory</div>
        </div>

        <div className="header-mid">
          {TABS.map(([id, label]) => (
            <button key={id} className={`nav-tab${tab === id ? " active" : ""}`} onClick={() => navigate(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="header-right">
          <Link to="/app/orders" className="hdr-btn">🛒 Order Workflow →</Link>
        </div>
      </header>

      <main className="inv-main">
        {ordersError && tab === "orders" && (
          <div style={{ background: "var(--gold-bg)", border: "1px solid var(--gold-border)", borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--gold-text)" }}>
            ⚠ Orders require Protected Customer Data approval in Shopify Partner Dashboard.
          </div>
        )}
        {tab === "dashboard" && <DashboardTab />}
        {tab === "products"  && <ProductsTab />}
        {tab === "orders"    && <OrdersTab />}
        {tab === "alerts"    && <AlertsTab />}
      </main>

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast${t.type ? " t-" + t.type : ""}`}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✗ " : ""}{t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
