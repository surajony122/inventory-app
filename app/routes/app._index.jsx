import { useState, useMemo } from "react";
import { useLoaderData, useSubmit, Link, useLocation } from "react-router";
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
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.55;min-height:100vh;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:3px;}

/* HEADER */
.pg-header{background:var(--text);padding:0 28px;display:flex;align-items:center;gap:20px;height:58px;position:sticky;top:0;z-index:60;}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{width:32px;height:32px;border:1.5px solid rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:#fff;letter-spacing:0.02em;}
.brand-tag{font-size:10px;color:rgba(255,255,255,0.38);font-family:'DM Mono',monospace;letter-spacing:0.08em;text-transform:uppercase;margin-left:2px;}
.hd-mid{flex:1;display:flex;align-items:center;justify-content:center;gap:2px;}
.nav-tab{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:5px 16px;border-radius:6px;border:none;background:transparent;color:rgba(255,255,255,0.45);cursor:pointer;transition:all 0.15s;}
.nav-tab:hover{color:rgba(255,255,255,0.75);}
.nav-tab.active{background:rgba(255,255,255,0.12);color:#fff;}
.hd-right{display:flex;align-items:center;gap:10px;}
.sync-badge{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.03em;}
.hdr-btn{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;padding:5px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);cursor:pointer;transition:all 0.15s;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
.hdr-btn:hover{background:rgba(255,255,255,0.14);color:#fff;}

/* LAYOUT */
.pg-main{padding:24px 28px;max-width:1360px;margin:0 auto;}

/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;transition:box-shadow 0.15s,transform 0.1s;position:relative;overflow:hidden;cursor:default;}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--accent-line,transparent);}
.stat-card:hover{box-shadow:var(--shadow-sm);transform:translateY(-1px);}
.stat-label{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}
.stat-num{font-size:28px;font-weight:300;color:var(--text);line-height:1;font-family:'Cormorant Garamond',serif;}
.stat-num.danger{color:var(--rose);}
.stat-num.warn{color:var(--gold);}

/* TWO COL */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}

/* SECTION CARD */
.sec-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-xs);}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--border);background:var(--surface-2);}
.sec-title{font-size:12px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:8px;}
.title-pip{width:5px;height:5px;border-radius:50%;background:var(--gold);flex-shrink:0;}

/* TOP ROW (dashboard) */
.top-row{display:flex;gap:16px;margin-bottom:20px;align-items:flex-start;flex-wrap:wrap;}
.top-row .stats-grid{margin-bottom:0;flex:1;}

/* ALERTS PANEL */
.alerts-panel{width:220px;flex-shrink:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;}
.alerts-panel-title{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}
.alert-item{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.15);border-radius:var(--r-md);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:opacity 0.12s;display:flex;align-items:center;gap:10px;}
.alert-item:hover{opacity:0.82;}
.alert-item:last-child{margin-bottom:0;}
.alert-thumb{width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0;border:1px solid var(--border);}
.alert-thumb-ph{width:32px;height:32px;border-radius:6px;background:rgba(154,42,58,0.12);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--rose-text);}
.alert-info{flex:1;min-width:0;}
.alert-id{font-size:12px;font-weight:500;color:var(--rose-text);}
.alert-sub{font-size:10px;color:var(--rose);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.alerts-ok{background:var(--teal-bg);border:1px solid rgba(42,122,106,0.15);border-radius:var(--r-md);padding:10px 12px;font-size:11px;color:var(--teal-text);display:flex;align-items:center;gap:6px;}

/* TOOLBAR */
.toolbar{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap;align-items:center;}
.search-wrap{position:relative;flex:1;min-width:180px;}
.search-wrap input{width:100%;padding:7px 12px 7px 32px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;transition:border-color 0.15s;}
.search-wrap input:focus{border-color:var(--gold);}
.search-wrap input::placeholder{color:var(--text-3);}
.search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:var(--text-3);pointer-events:none;}
.filter-sel{padding:7px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);outline:none;cursor:pointer;}
.filter-sel:focus{border-color:var(--gold);}

/* TABLE */
.tbl-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;min-width:600px;}
th{text-align:left;padding:9px 14px;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;background:var(--surface-2);border-bottom:1px solid var(--border-md);white-space:nowrap;}
td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;font-size:13px;}
tr:last-child td{border-bottom:none;}
tbody tr{cursor:pointer;transition:background 0.08s;}
tbody tr:hover td{background:var(--surface-2);}
.row-out td{background:#fdf4f4!important;}
.row-low td{background:#fdf9f0!important;}
tbody tr.no-click{cursor:default;}

/* PRODUCT CELL */
.prod-cell{display:flex;align-items:center;gap:10px;}
.prod-img{width:38px;height:38px;border-radius:7px;object-fit:cover;border:1px solid var(--border);background:var(--surface-3);display:block;flex-shrink:0;}
.prod-img-ph{width:38px;height:38px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--text-3);flex-shrink:0;}
.prod-name{font-size:13px;font-weight:500;color:var(--text);line-height:1.3;}
.prod-variant{font-size:11px;color:var(--text-3);margin-top:1px;}

/* INPUTS */
.qty-in{width:72px;padding:5px 8px;border:1px solid var(--border-md);border-radius:5px;font-size:13px;text-align:center;outline:none;font-family:'DM Mono',monospace;transition:border-color 0.15s;background:var(--surface);}
.qty-in:focus{border-color:var(--gold);}
.txt-in{width:100px;padding:5px 8px;border:1px solid var(--border-md);border-radius:5px;font-size:12px;outline:none;transition:border-color 0.15s;background:var(--surface);font-family:'DM Sans',sans-serif;}
.txt-in:focus{border-color:var(--gold);}
.save-btn{padding:4px 10px;font-size:12px;font-weight:500;background:var(--text);color:#fff;border:none;border-radius:5px;cursor:pointer;transition:opacity 0.12s;font-family:'DM Sans',sans-serif;}
.save-btn:hover{opacity:0.8;}

/* BADGES */
.badge{display:inline-block;font-size:10px;font-weight:500;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.b-success{background:var(--teal-bg);color:var(--teal-text);}
.b-warning{background:var(--gold-bg);color:var(--gold-text);}
.b-danger{background:var(--rose-bg);color:var(--rose-text);}
.b-info{background:var(--blue-bg);color:var(--blue-text);}
.b-slate{background:var(--slate-bg);color:var(--slate-text);}
.b-fulfil{background:var(--teal-bg);color:var(--teal-text);}
.b-unfulfil{background:var(--rose-bg);color:var(--rose-text);}
.b-partial{background:var(--gold-bg);color:var(--gold-text);}

.diff-chip{display:inline-flex;align-items:center;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;}
.d-pos{background:var(--teal-bg);color:var(--teal-text);}
.d-neg{background:var(--rose-bg);color:var(--rose-text);}
.d-zero{background:var(--slate-bg);color:var(--slate-text);}

/* ORDER CARDS */
.orders-list{padding:12px 16px;display:flex;flex-direction:column;gap:10px;}
.order-card{border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;background:var(--surface-2);}
.order-hdr{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:background 0.1s;gap:12px;flex-wrap:wrap;}
.order-hdr:hover{background:var(--surface-3);}
.order-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.order-num{font-weight:600;font-size:14px;font-family:'Cormorant Garamond',serif;}
.order-cust{font-size:12px;color:var(--text-2);}
.order-date{font-size:11px;color:var(--text-3);font-family:'DM Mono',monospace;}
.order-right{display:flex;align-items:center;gap:10px;}
.caret{color:var(--text-3);font-size:11px;transition:transform 0.2s;display:inline-block;}
.caret.open{transform:rotate(180deg);}
.order-body{border-top:1px solid var(--border);}

/* EMPTY */
.empty-state{text-align:center;padding:52px 24px;color:var(--text-3);}
.empty-glyph{font-family:'Cormorant Garamond',serif;font-size:42px;color:var(--border-strong);margin-bottom:10px;}

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:999;pointer-events:none;}
.toast{background:var(--text);color:#fff;padding:10px 18px;border-radius:var(--r-sm);font-size:13px;display:flex;align-items:center;gap:8px;animation:toastIn 0.2s ease;}
.toast.t-success{background:var(--teal);}
.toast.t-error{background:var(--rose);}
@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}

/* SAVE BAR */
.save-bar{display:flex;align-items:center;gap:10px;background:var(--text);color:#fff;border-radius:var(--r-md);padding:10px 16px;margin-bottom:12px;animation:slideDown 0.15s ease;}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.save-bar-label{font-size:13px;font-weight:500;}
.save-bar-label span{color:rgba(255,255,255,0.4);font-size:12px;margin-left:4px;}
.sbtn{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:6px 16px;border-radius:var(--r-sm);border:none;background:#fff;color:var(--text);cursor:pointer;transition:opacity 0.12s;}
.sbtn:hover{opacity:0.85;}
.sbtn-ghost{background:rgba(255,255,255,0.12);color:#fff;}
.sbtn-ghost:hover{background:rgba(255,255,255,0.2);}
.ml-auto{margin-left:auto;}

/* MISC */
.sku-m{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-2);}
.price-m{font-family:'DM Mono',monospace;font-size:12px;}
.err-banner{background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-md);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--gold-text);}

@media(max-width:900px){.stats-grid{grid-template-columns:repeat(3,1fr);}.two-col{grid-template-columns:1fr;}.top-row{flex-direction:column;}.alerts-panel{width:100%;}}
@media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr);}.pg-main{padding:16px;}.pg-header{padding:0 16px;}}
`;

const TABS = [
  ["dashboard", "Dashboard"],
  ["products", "Products & Inventory"],
  ["orders", "Open Orders"],
  ["alerts", "Alerts"],
];

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch all products
  let rawProducts = [], productsError = null;
  try {
    let cursor = null, hasNext = true;
    while (hasNext) {
      const resp = await admin.graphql(`
        query($cursor:String){
          products(first:250,after:$cursor){
            pageInfo{ hasNextPage endCursor }
            edges{ node{
              id title vendor
              featuredImage{ url }
              variants(first:100){ edges{ node{
                id title sku inventoryQuantity
              }}}
            }}
          }
        }
      `, { variables: { cursor } });
      const json = await resp.json();
      if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
      const pg = json.data?.products; if (!pg) break;
      rawProducts = rawProducts.concat(pg.edges.map(e => e.node));
      hasNext = pg.pageInfo.hasNextPage; cursor = pg.pageInfo.endCursor;
    }
  } catch (err) {
    productsError = err.message || "Products unavailable";
  }

  // Fetch open orders (unfulfilled/partial) with customer
  let rawOrders = [], ordersError = null;
  try {
    let cursor = null, hasNext = true;
    while (hasNext) {
      const resp = await admin.graphql(`
        query($cursor:String){
          orders(first:250,after:$cursor,query:"fulfillment_status:unfulfilled OR fulfillment_status:partial",sortKey:CREATED_AT,reverse:true){
            pageInfo{ hasNextPage endCursor }
            edges{ node{
              id name createdAt displayFulfillmentStatus
              totalPriceSet{ shopMoney{ amount currencyCode } }
              customer{ firstName lastName }
              lineItems(first:10){ edges{ node{
                title sku quantity
                image{ url }
                variant{ id }
                product{ id }
              }}}
            }}
          }
        }
      `, { variables: { cursor } });
      const json = await resp.json();
      if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
      const pg = json.data?.orders; if (!pg) break;
      rawOrders = rawOrders.concat(pg.edges.map(e => e.node));
      hasNext = pg.pageInfo.hasNextPage; cursor = pg.pageInfo.endCursor;
    }
  } catch (err) {
    ordersError = err.message || "Orders unavailable";
    // Fallback without customer
    try {
      rawOrders = [];
      let cursor = null, hasNext = true;
      while (hasNext) {
        const resp = await admin.graphql(`
          query($cursor:String){
            orders(first:250,after:$cursor,query:"fulfillment_status:unfulfilled OR fulfillment_status:partial",sortKey:CREATED_AT,reverse:true){
              pageInfo{ hasNextPage endCursor }
              edges{ node{
                id name createdAt displayFulfillmentStatus
                totalPriceSet{ shopMoney{ amount currencyCode } }
                lineItems(first:10){ edges{ node{
                  title sku quantity
                  image{ url }
                  variant{ id }
                  product{ id }
                }}}
              }}
            }
          }
        `, { variables: { cursor } });
        const json = await resp.json();
        if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
        const pg = json.data?.orders; if (!pg) break;
        rawOrders = rawOrders.concat(pg.edges.map(e => e.node));
        hasNext = pg.pageInfo.hasNextPage; cursor = pg.pageInfo.endCursor;
      }
      ordersError = null;
    } catch (_) { /* keep original error */ }
  }

  // Load warehouse inventory from Prisma
  const allVariantIds = rawProducts.flatMap(p => p.variants.edges.map(e => e.node.id));
  const inventories = allVariantIds.length
    ? await prisma.inventory.findMany({ where: { id: { in: allVariantIds } } })
    : [];

  // Transform
  const products = rawProducts.map(p => ({
    id: p.id,
    title: p.title,
    vendor: p.vendor || "",
    imageUrl: p.featuredImage?.url || null,
    variants: p.variants.edges.map(e => ({
      id: e.node.id,
      title: e.node.title,
      sku: e.node.sku || "",
      inventoryQuantity: e.node.inventoryQuantity || 0,
    })),
  }));

  const orders = rawOrders.map(o => ({
    id: o.id,
    name: o.name,
    createdAt: o.createdAt,
    fulfillmentStatus: o.displayFulfillmentStatus || "UNFULFILLED",
    totalPrice: o.totalPriceSet?.shopMoney?.amount || "0",
    currencyCode: o.totalPriceSet?.shopMoney?.currencyCode || "INR",
    customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : null,
    lineItems: o.lineItems.edges.map(e => ({
      title: e.node.title,
      sku: e.node.sku || "",
      quantity: e.node.quantity,
      imageUrl: e.node.image?.url || null,
      variantId: e.node.variant?.id || null,
      productId: e.node.product?.id || null,
    })),
  }));

  const warehouse = {};
  inventories.forEach(inv => {
    warehouse[inv.id] = {
      quantity: inv.quantity,
      binLocation: inv.binLocation || "",
      notes: inv.notes || "",
      updatedAt: inv.updatedAt,
    };
  });

  return { products, orders, warehouse, productsError, ordersError };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const fd = await request.formData();
  const type = fd.get("type");

  if (type === "save") {
    const id = fd.get("id"), sku = fd.get("sku") || "";
    const quantity = parseInt(fd.get("quantity") || "0");
    const binLocation = fd.get("binLocation") || "";
    const notes = fd.get("notes") || "";
    await prisma.inventory.upsert({
      where: { id },
      update: { quantity, binLocation, notes },
      create: { id, sku, quantity, binLocation, notes },
    });
    return { ok: true };
  }

  if (type === "saveAll") {
    const updates = JSON.parse(fd.get("updates") || "[]");
    for (const u of updates) {
      await prisma.inventory.upsert({
        where: { id: u.id },
        update: { quantity: u.quantity, binLocation: u.binLocation, notes: u.notes },
        create: { id: u.id, sku: u.sku || "", quantity: u.quantity, binLocation: u.binLocation, notes: u.notes },
      });
    }
    return { ok: true };
  }

  return { ok: false };
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmt(d) { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
function cur(amount, code) {
  const sym = code === "INR" ? "₹" : (code || "");
  return sym + Number(amount).toLocaleString("en-IN");
}

function Thumb({ src, alt, size = 38 }) {
  const [err, setErr] = useState(false);
  if (src && !err) return <img src={src} style={{ width: size, height: size, borderRadius: 7, objectFit: "cover", border: "1px solid var(--border)", display: "block", flexShrink: 0 }} alt={alt} onError={() => setErr(true)} loading="lazy" />;
  return <div style={{ width: size, height: size, borderRadius: 7, background: "var(--surface-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond',serif", fontSize: size * 0.42, color: "var(--text-3)", flexShrink: 0 }}>◈</div>;
}

function QtyBadge({ q }) {
  if (q === 0) return <span className="badge b-danger">0</span>;
  if (q <= 5) return <span className="badge b-warning">{q}</span>;
  return <span className="badge b-success">{q}</span>;
}

function DiffChip({ diff }) {
  if (diff === null) return <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>;
  if (diff > 0) return <span className="diff-chip d-pos">+{diff}</span>;
  if (diff < 0) return <span className="diff-chip d-neg">{diff}</span>;
  return <span className="diff-chip d-zero">0</span>;
}

function FulfillBadge({ s }) {
  if (!s || s === "UNFULFILLED") return <span className="badge b-unfulfil">Unfulfilled</span>;
  if (s === "FULFILLED") return <span className="badge b-fulfil">Fulfilled</span>;
  return <span className="badge b-partial">Partial</span>;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function IndexPage() {
  const { products, orders, warehouse: initWh, productsError, ordersError } = useLoaderData();
  const { search: locationSearch } = useLocation();
  const submit = useSubmit();

  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [warehouse, setWarehouse] = useState(initWh);
  const [pending, setPending] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function navigate(t) { setTab(t); setSearch(""); setFilter("all"); }

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let variants = 0, out = 0, low = 0;
    products.forEach(p => p.variants.forEach(v => {
      variants++;
      const q = v.inventoryQuantity || 0;
      if (q === 0) out++; else if (q <= 5) low++;
    }));
    return { products: products.length, variants, out, low: low + out, openOrders: orders.length };
  }, [products, orders]);

  const lowItems = useMemo(() => {
    const items = [];
    products.forEach(p => p.variants.forEach(v => {
      if ((v.inventoryQuantity || 0) <= 5) items.push({ p, v });
    }));
    return items.sort((a, b) => (a.v.inventoryQuantity || 0) - (b.v.inventoryQuantity || 0));
  }, [products]);

  const alerts = useMemo(() => {
    const a = [];
    products.forEach(prod => prod.variants.forEach(v => {
      const sq = v.inventoryQuantity || 0;
      const wh = warehouse[v.id];
      const wq = wh?.quantity;
      if (sq === 0) a.push({ sev: "danger", prod, v, sq, wq, reason: "Out of stock on Shopify" });
      else if (sq <= 5) a.push({ sev: "warning", prod, v, sq, wq, reason: `Low stock — ${sq} left` });
      if (wq !== undefined && Math.abs(wq - sq) >= 3) a.push({ sev: "info", prod, v, sq, wq, reason: `Qty mismatch — Shopify: ${sq}, Warehouse: ${wq}` });
    }));
    return a;
  }, [products, warehouse]);

  // ── Warehouse editing ─────────────────────────────────────────────────────
  function track(variantId, sku, field, val) {
    setPending(prev => {
      const wh = warehouse[variantId] || {};
      const existing = prev[variantId] || {
        quantity: wh.quantity !== undefined ? String(wh.quantity) : "",
        binLocation: wh.binLocation || "",
        notes: wh.notes || "",
        sku,
      };
      return { ...prev, [variantId]: { ...existing, [field]: val } };
    });
  }

  function saveVariant(variantId, sku) {
    const p = pending[variantId] || {};
    const wh = warehouse[variantId] || {};
    const qty = p.quantity !== undefined ? p.quantity : (wh.quantity !== undefined ? String(wh.quantity) : "");
    if (qty === "") { showToast("Enter a quantity first", "error"); return; }
    const bl = p.binLocation !== undefined ? p.binLocation : (wh.binLocation || "");
    const nt = p.notes !== undefined ? p.notes : (wh.notes || "");
    const fd = new FormData();
    fd.append("type", "save"); fd.append("id", variantId); fd.append("sku", sku);
    fd.append("quantity", qty); fd.append("binLocation", bl); fd.append("notes", nt);
    submit(fd, { method: "POST" });
    setWarehouse(prev => ({ ...prev, [variantId]: { quantity: parseInt(qty), binLocation: bl, notes: nt, updatedAt: new Date().toISOString() } }));
    setPending(prev => { const n = { ...prev }; delete n[variantId]; return n; });
    showToast("Saved", "success");
  }

  function saveAll() {
    const keys = Object.keys(pending);
    if (!keys.length) { showToast("No pending changes"); return; }
    const updates = keys.map(id => {
      const p = pending[id], wh = warehouse[id] || {};
      return {
        id, sku: p.sku || "",
        quantity: parseInt(p.quantity !== undefined ? p.quantity : (wh.quantity ?? 0)),
        binLocation: p.binLocation !== undefined ? p.binLocation : (wh.binLocation || ""),
        notes: p.notes !== undefined ? p.notes : (wh.notes || ""),
      };
    });
    const fd = new FormData();
    fd.append("type", "saveAll"); fd.append("updates", JSON.stringify(updates));
    submit(fd, { method: "POST" });
    const newWh = { ...warehouse };
    updates.forEach(u => { newWh[u.id] = { quantity: u.quantity, binLocation: u.binLocation, notes: u.notes, updatedAt: new Date().toISOString() }; });
    setWarehouse(newWh);
    setPending({});
    showToast(`Saved ${updates.length} items`, "success");
  }

  function discardPending() { setPending({}); }

  function toggleOrder(id) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const hasPending = Object.keys(pending).length > 0;

  // ── Dashboard Tab ─────────────────────────────────────────────────────────
  function DashboardTab() {
    const pendingOrders = orders.slice(0, 8);
    return (
      <>
        <div className="top-row">
          <div className="stats-grid">
            <div className="stat-card" style={{ "--accent-line": "#B8782A" }}><div className="stat-label">Products</div><div className="stat-num">{stats.products}</div></div>
            <div className="stat-card" style={{ "--accent-line": "#2A5F9A" }}><div className="stat-label">Total Variants</div><div className="stat-num">{stats.variants}</div></div>
            <div className="stat-card" style={{ "--accent-line": "#2A7A6A" }}><div className="stat-label">Open Orders</div><div className="stat-num">{stats.openOrders}</div></div>
            <div className="stat-card" style={{ "--accent-line": "#B8782A" }}><div className="stat-label">Low / Out of Stock</div><div className={`stat-num${stats.low > 0 ? " warn" : ""}`}>{stats.low}</div></div>
            <div className="stat-card" style={{ "--accent-line": "#9A2A3A" }}><div className="stat-label">Out of Stock</div><div className={`stat-num${stats.out > 0 ? " danger" : ""}`}>{stats.out}</div></div>
          </div>
          <div className="alerts-panel">
            <div className="alerts-panel-title">Stock Alerts</div>
            {lowItems.length === 0
              ? <div className="alerts-ok">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#2A7A6A" strokeWidth="1.2"/><path d="M3.5 6l1.8 1.8L8.5 4" stroke="#2A7A6A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  All stocked
                </div>
              : lowItems.slice(0, 6).map(({ p, v }, i) => (
                <div key={i} className="alert-item" onClick={() => navigate("products")}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} className="alert-thumb" alt="" onError={e => { e.target.style.display = "none"; }} />
                    : <div className="alert-thumb-ph">◈</div>}
                  <div className="alert-info">
                    <div className="alert-id">{p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title}</div>
                    <div className="alert-sub">{v.title !== "Default Title" ? v.title : (v.sku || "—")} · {v.inventoryQuantity || 0} left</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="two-col">
          <div className="sec-card">
            <div className="sec-hdr">
              <div className="sec-title"><span className="title-pip"></span>Low Stock Items</div>
              <span className="badge b-danger">{lowItems.length}</span>
            </div>
            {lowItems.length === 0
              ? <div className="empty-state"><div className="empty-glyph">✦</div><p>All products well stocked</p></div>
              : <div className="tbl-wrap"><table>
                  <thead><tr><th style={{ width: 46 }}></th><th>Product</th><th>SKU</th><th>Shopify Qty</th><th>Warehouse</th></tr></thead>
                  <tbody>
                    {lowItems.slice(0, 10).map(({ p, v }, i) => {
                      const wh = warehouse[v.id];
                      const q = v.inventoryQuantity || 0;
                      return (
                        <tr key={i} className={q === 0 ? "row-out" : "row-low"} onClick={() => navigate("products")}>
                          <td style={{ padding: "8px 6px 8px 14px", width: 46 }}><Thumb src={p.imageUrl} alt={p.title} size={34} /></td>
                          <td>
                            <div className="prod-name">{p.title.length > 30 ? p.title.slice(0, 30) + "…" : p.title}</div>
                            {v.title !== "Default Title" && <div className="prod-variant">{v.title}</div>}
                          </td>
                          <td><span className="sku-m">{v.sku || "—"}</span></td>
                          <td><QtyBadge q={q} /></td>
                          <td>{wh ? <span className="badge b-info">{wh.quantity}</span> : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Not set</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>}
          </div>

          <div className="sec-card">
            <div className="sec-hdr">
              <div className="sec-title"><span className="title-pip"></span>Pending Fulfillment</div>
              <span className="badge b-warning">{pendingOrders.length}</span>
            </div>
            {pendingOrders.length === 0
              ? <div className="empty-state"><div className="empty-glyph">✦</div><p>All orders fulfilled!</p></div>
              : <div className="tbl-wrap"><table>
                  <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {pendingOrders.map((o, i) => (
                      <tr key={i} onClick={() => navigate("orders")}>
                        <td><strong>{o.name}</strong><div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'DM Mono',monospace" }}>{fmt(o.createdAt)}</div></td>
                        <td style={{ fontSize: 12, color: "var(--text-2)" }}>{o.customer || "Guest"}</td>
                        <td style={{ fontWeight: 600 }}>{o.lineItems.length}</td>
                        <td><span className="price-m">{cur(o.totalPrice, o.currencyCode)}</span></td>
                        <td><FulfillBadge s={o.fulfillmentStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>}
          </div>
        </div>
      </>
    );
  }

  // ── Products Tab ──────────────────────────────────────────────────────────
  function ProductsTab() {
    let list = products;
    const q = search.toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || (p.vendor || "").toLowerCase().includes(q) || p.variants.some(v => (v.sku || "").toLowerCase().includes(q)));
    if (filter === "out") list = list.filter(p => p.variants.some(v => (v.inventoryQuantity || 0) === 0));
    else if (filter === "low") list = list.filter(p => p.variants.some(v => { const q2 = v.inventoryQuantity || 0; return q2 > 0 && q2 <= 5; }));
    else if (filter === "ok") list = list.filter(p => p.variants.every(v => (v.inventoryQuantity || 0) > 5));
    else if (filter === "miss") list = list.filter(p => p.variants.some(v => !warehouse[v.id]));

    return (
      <>
        {hasPending && (
          <div className="save-bar">
            <div className="save-bar-label">Unsaved changes <span>{Object.keys(pending).length}</span></div>
            <button className="sbtn" onClick={saveAll}>💾 Save All</button>
            <button className="sbtn sbtn-ghost ml-auto" onClick={discardPending}>Discard</button>
          </div>
        )}
        <div className="sec-card">
          <div className="toolbar">
            <div className="search-wrap">
              <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/></svg>
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
          <div className="tbl-wrap">
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
                  <tr className="no-click"><td colSpan={9}><div className="empty-state"><div className="empty-glyph">◎</div><p>No products match your filter</p></div></td></tr>
                ) : list.flatMap(prod => {
                  const multi = prod.variants.length > 1;
                  const rows = [];
                  if (multi) {
                    rows.push(
                      <tr key={`hdr-${prod.id}`} className="no-click" style={{ background: "var(--surface-2)" }}>
                        <td colSpan={9} style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Thumb src={prod.imageUrl} alt={prod.title} size={22} />
                            {prod.title} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({prod.variants.length} variants)</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  prod.variants.forEach(v => {
                    const wh = warehouse[v.id] || {};
                    const pv = pending[v.id] || {};
                    const sq = v.inventoryQuantity || 0;
                    const wqRaw = pv.quantity !== undefined ? pv.quantity : (wh.quantity !== undefined ? String(wh.quantity) : "");
                    const wq = wqRaw !== "" ? parseInt(wqRaw) : null;
                    const diff = wq !== null ? wq - sq : null;
                    const rowCls = sq === 0 ? "row-out" : sq <= 5 ? "row-low" : "";
                    rows.push(
                      <tr key={v.id} className={`no-click ${rowCls}`}>
                        <td style={{ padding: "8px 6px 8px 14px", width: 46 }}>{!multi && <Thumb src={prod.imageUrl} alt={prod.title} size={36} />}</td>
                        <td>
                          {!multi && <div className="prod-name">{prod.title}</div>}
                          <div className="prod-variant">{v.title !== "Default Title" ? v.title : (multi ? "" : "—")}</div>
                        </td>
                        <td><span className="sku-m">{v.sku || "—"}</span></td>
                        <td><QtyBadge q={sq} /></td>
                        <td>
                          <input className="qty-in" type="number" min="0"
                            value={wqRaw}
                            placeholder="—"
                            onChange={e => track(v.id, v.sku, "quantity", e.target.value)} />
                        </td>
                        <td><DiffChip diff={diff} /></td>
                        <td>
                          <input className="txt-in" type="text"
                            value={pv.binLocation !== undefined ? pv.binLocation : (wh.binLocation || "")}
                            placeholder="Bin/shelf"
                            onChange={e => track(v.id, v.sku, "binLocation", e.target.value)} />
                        </td>
                        <td>
                          <input className="txt-in" type="text"
                            value={pv.notes !== undefined ? pv.notes : (wh.notes || "")}
                            placeholder="Notes"
                            onChange={e => track(v.id, v.sku, "notes", e.target.value)} />
                        </td>
                        <td><button className="save-btn" onClick={() => saveVariant(v.id, v.sku)}>Save</button></td>
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

  // ── Open Orders Tab ───────────────────────────────────────────────────────
  function OrdersTab() {
    const q = search.toLowerCase();
    const list = q
      ? orders.filter(o =>
          o.name.toLowerCase().includes(q) ||
          (o.customer || "").toLowerCase().includes(q) ||
          o.lineItems.some(li => li.title.toLowerCase().includes(q))
        )
      : orders;

    if (!list.length) return (
      <div className="sec-card">
        <div className="empty-state"><div className="empty-glyph">◎</div><p>No open orders right now</p></div>
      </div>
    );

    return (
      <div className="sec-card">
        <div className="toolbar">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/></svg>
            <input type="text" placeholder="Search orders, customers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{list.length} open order{list.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="orders-list">
          {list.map(o => {
            const isOpen = expanded.has(o.id);
            const firstImg = o.lineItems[0]?.imageUrl || null;
            // Find variant stock for each line item
            const lineRows = o.lineItems.map((li, idx) => {
              let sq = null, wh = null;
              if (li.variantId) {
                const prod = products.find(p => p.variants.some(v => v.id === li.variantId));
                const variant = prod?.variants.find(v => v.id === li.variantId);
                if (variant) { sq = variant.inventoryQuantity || 0; wh = warehouse[li.variantId]; }
              }
              const wq = wh?.quantity;
              const avail = wq !== null && wq !== undefined ? wq : sq;
              let stockCls = "b-slate", stockLbl = "Unknown";
              if (avail !== null) {
                if (avail >= li.quantity) { stockCls = "b-success"; stockLbl = "✓ Available"; }
                else if (avail > 0) { stockCls = "b-warning"; stockLbl = "⚠ Partial"; }
                else { stockCls = "b-danger"; stockLbl = "✗ Short"; }
              }
              return (
                <tr key={idx}>
                  <td style={{ padding: "8px 6px 8px 16px", width: 46 }}><Thumb src={li.imageUrl} alt={li.title} size={34} /></td>
                  <td><div className="prod-name" style={{ fontSize: 12 }}>{li.title}</div></td>
                  <td><span className="sku-m">{li.sku || "—"}</span></td>
                  <td style={{ fontWeight: 600 }}>{li.quantity}</td>
                  <td>{sq !== null ? <QtyBadge q={sq} /> : "—"}</td>
                  <td>{wq !== undefined && wq !== null ? <span className="badge b-info">{wq}</span> : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Not entered</span>}</td>
                  <td>{wh?.binLocation ? <span className="sku-m">{wh.binLocation}</span> : "—"}</td>
                  <td><span className={`badge ${stockCls}`}>{stockLbl}</span></td>
                </tr>
              );
            });

            return (
              <div key={o.id} className="order-card">
                <div className="order-hdr" onClick={() => toggleOrder(o.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Thumb src={firstImg} alt={o.name} size={36} />
                    <div className="order-meta">
                      <span className="order-num">{o.name}</span>
                      <span className="order-cust">👤 {o.customer || "Guest"}</span>
                      <span className="order-date">{fmt(o.createdAt)}</span>
                      <FulfillBadge s={o.fulfillmentStatus} />
                    </div>
                  </div>
                  <div className="order-right">
                    <span className="price-m" style={{ fontWeight: 600 }}>{cur(o.totalPrice, o.currencyCode)}</span>
                    <span className="badge b-info">{o.lineItems.length} item{o.lineItems.length !== 1 ? "s" : ""}</span>
                    <span className={`caret${isOpen ? " open" : ""}`}>▼</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="order-body">
                    <div className="tbl-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: 46 }}></th>
                            <th>Product</th><th>SKU</th><th>Ordered</th>
                            <th>Shopify Stock</th><th>Warehouse</th><th>Bin</th><th>Status</th>
                          </tr>
                        </thead>
                        <tbody>{lineRows}</tbody>
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

  // ── Alerts Tab ────────────────────────────────────────────────────────────
  function AlertsTab() {
    if (!alerts.length) return (
      <div className="sec-card">
        <div className="empty-state"><div className="empty-glyph">✦</div><p>No alerts — everything looks good!</p></div>
      </div>
    );
    return (
      <div className="sec-card">
        <div className="sec-hdr">
          <div className="sec-title"><span className="title-pip"></span>Stock Alerts</div>
          <span className="badge b-danger">{alerts.length}</span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 46 }}></th>
                <th>Severity</th><th>Product</th><th>Variant</th><th>SKU</th>
                <th>Shopify Qty</th><th>Warehouse</th><th>Issue</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} className={a.sev === "danger" ? "row-out" : a.sev === "warning" ? "row-low" : ""}>
                  <td style={{ padding: "8px 6px 8px 14px" }}><Thumb src={a.prod.imageUrl} alt={a.prod.title} size={34} /></td>
                  <td>
                    <span className={`badge ${a.sev === "danger" ? "b-danger" : a.sev === "warning" ? "b-warning" : "b-info"}`}>
                      {a.sev === "danger" ? "🔴 Critical" : a.sev === "warning" ? "🟡 Low" : "🔵 Mismatch"}
                    </span>
                  </td>
                  <td><div className="prod-name">{a.prod.title.length > 28 ? a.prod.title.slice(0, 28) + "…" : a.prod.title}</div></td>
                  <td style={{ fontSize: 11, color: "var(--text-3)" }}>{a.v.title !== "Default Title" ? a.v.title : "—"}</td>
                  <td><span className="sku-m">{a.v.sku || "—"}</span></td>
                  <td><QtyBadge q={a.sq} /></td>
                  <td>{a.wq !== undefined ? <span className="badge b-info">{a.wq}</span> : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Not set</span>}</td>
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

      <header className="pg-header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="5.5" r="2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/>
              <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">Unniyarcha</span>
          <span className="brand-tag">inventory</span>
        </div>

        <div className="hd-mid">
          {TABS.map(([id, label]) => (
            <button key={id} className={`nav-tab${tab === id ? " active" : ""}`} onClick={() => navigate(id)}>{label}</button>
          ))}
        </div>

        <div className="hd-right">
          <Link to={`/app/orders${locationSearch}`} className="hdr-btn">🛒 Order Workflow →</Link>
        </div>
      </header>

      <main className="pg-main">
        {productsError && (
          <div className="err-banner"><strong>⚠ Products API Error:</strong> {productsError}</div>
        )}
        {ordersError && (
          <div className="err-banner"><strong>⚠ Orders API Error:</strong> {ordersError}</div>
        )}

        {tab === "dashboard" && <DashboardTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "alerts" && <AlertsTab />}
      </main>

      {toast && (
        <div className="toast-wrap">
          <div className={`toast${toast.type ? " t-" + toast.type : ""}`}>
            {toast.type === "success" ? "✓ " : toast.type === "error" ? "✗ " : ""}{toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
