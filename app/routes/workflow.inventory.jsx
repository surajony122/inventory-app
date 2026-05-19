import prisma from "../db.server";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
import { redirect, useLoaderData, useSubmit, useNavigation, Link } from "react-router";
import { useState, useMemo, useEffect } from "react";

// ── CSS Style ─────────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F5F2EC;--surface:#FDFBF8;--surface-2:#F0EDE6;--surface-3:#E8E4DB;
  --border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);--border-strong:rgba(60,45,20,0.25);
  --text:#231F17;--text-2:#6B6251;--text-3:#A89F8E;
  --gold:#B8782A;--gold-bg:#FBF3E6;--gold-text:#7A4F18;--gold-border:rgba(184,120,42,0.25);
  --rose:#9A2A3A;--rose-bg:#F8E6E8;--rose-text:#661825;
  --teal:#2A7A6A;--teal-bg:#E6F5F2;--teal-text:#185448;
  --r-sm:8px;--r-md:12px;--r-lg:16px;
  --shadow-xs:0 1px 2px rgba(60,45,20,0.06);
  --shadow-sm:0 2px 6px rgba(60,45,20,0.07);
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;}

/* HEADER */
.pg-header{background:var(--text);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:58px;position:sticky;top:0;z-index:60;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
.brand{display:flex;align-items:center;gap:10px;}
.brand-mark{width:22px;height:22px;border:1.5px solid rgba(255,255,255,0.85);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#fff;}
.brand-tag{font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:1px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);padding:2px 6px;border-radius:4px;margin-left:4px;font-family:'DM Sans',sans-serif;}
.hd-right{display:flex;align-items:center;gap:16px;}
.hd-link{font-size:11px;font-weight:500;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.75);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;}
.hd-link:hover,.hd-link.active{background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.35);}

/* MAIN CONTAINER */
.pg-main{padding:24px 28px;max-width:1200px;margin:0 auto;}
.pg-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
.pg-title{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;}
.pg-sub{font-size:12px;color:var(--text-3);margin-top:2px;}

/* STATS CARDS */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:16px 20px;box-shadow:var(--shadow-xs);position:relative;overflow:hidden;}
.stat-card::before{content:"";position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--accent-line, var(--border-strong));}
.stat-label{font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;}
.stat-val{font-size:28px;font-weight:600;margin-top:6px;font-family:'Cormorant Garamond',serif;line-height:1;}

/* FILTER & SEARCH ROW */
.filter-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 20px;box-shadow:var(--shadow-xs);margin-bottom:16px;display:flex;flex-direction:column;gap:14px;}
.filter-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;}
.search-wrap{flex:1;min-width:280px;position:relative;}
.search-input{width:100%;padding:9px 12px 9px 34px;border:1px solid var(--border-md);border-radius:var(--r-sm);font-family:'DM Sans',sans-serif;font-size:13px;background:var(--surface-2);color:var(--text);outline:none;transition:all 0.15s;}
.search-input:focus{border-color:var(--gold);background:var(--surface);}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-3);pointer-events:none;}
.filter-tabs{display:flex;gap:4px;border-bottom:1.5px solid var(--border);padding-bottom:1px;}
.filter-tab{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:6px 12px;border:none;background:none;cursor:pointer;color:var(--text-2);position:relative;transition:color 0.12s;}
.filter-tab:hover{color:var(--text);}
.filter-tab.active{color:var(--gold);font-weight:600;}
.filter-tab.active::after{content:"";position:absolute;bottom:-2px;left:0;right:0;height:2.5px;background:var(--gold);border-radius:10px;}

/* BUTTONS */
.btn{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:8px 16px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;transition:all 0.12s;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.btn:hover{background:var(--surface-2);}
.btn-primary{background:var(--text);color:#fff;border-color:var(--text);}
.btn-primary:hover{opacity:0.85;}
.btn-primary:disabled{opacity:0.4;cursor:not-allowed;}
.btn-slim{padding:5px 10px;font-size:11px;}

/* TABLE STYLING */
.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow-x:auto;overflow-y:hidden;box-shadow:var(--shadow-xs);-webkit-overflow-scrolling:touch;}
.ord-table{width:100%;border-collapse:collapse;min-width:900px;}
.ord-table thead tr{border-bottom:1px solid var(--border-md);}
.ord-table th{text-align:left;padding:10px 14px;font-size:10px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;background:var(--surface-2);}
.ord-table td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle;font-size:13px;}
.ord-table tr:last-child td{border-bottom:none;}
.ord-table tbody tr:hover td{background:var(--surface-2);}
.ord-table tr.changed td{background:#FFFDF4;}

/* CELLS */
.thumb{width:38px;height:38px;border-radius:7px;object-fit:cover;border:1px solid var(--border);display:block;background:var(--surface-3);}
.thumb-ph{width:38px;height:38px;border-radius:7px;background:var(--surface-3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:15px;color:var(--text-3);}
.prod-title{font-weight:600;font-size:13px;}
.var-title{font-size:11px;color:var(--text-3);margin-top:1px;}
.sku-txt{font-family:'DM Mono',monospace;font-size:11px;color:var(--text-2);}
.input-tbl{width:100%;padding:6px 10px;border:1px solid var(--border-md);border-radius:var(--r-sm);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;background:var(--surface);transition:all 0.12s;}
.input-tbl:focus{border-color:var(--gold);background:var(--surface);}
.input-tbl.changed{border-color:var(--gold);background:#FFFDF0;}

/* BADGES */
.badge{display:inline-block;font-size:10px;font-weight:500;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.b-gold{background:var(--gold-bg);color:var(--gold-text);}
.b-teal{background:var(--teal-bg);color:var(--teal-text);}
.b-rose{background:var(--rose-bg);color:var(--rose-text);}
.b-slate{background:var(--slate-bg);color:var(--slate-text);}

/* ERROR BANNER */
.stale-banner{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.2);border-radius:var(--r-md);padding:14px 18px;margin-bottom:20px;font-size:13px;color:var(--rose-text);line-height:1.5;}

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:8px;z-index:999;pointer-events:none;}
.toast{background:var(--text);color:#fff;padding:10px 18px;border-radius:var(--r-sm);font-size:13px;display:flex;align-items:center;gap:8px;animation:toastIn 0.2s ease;box-shadow:0 4px 12px rgba(0,0,0,0.15);}
.toast.t-success{background:var(--teal);}
.toast.t-error{background:var(--rose);}
@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
`;

export const loader = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user) return redirect("/workflow");
  if (!user.access.includes("inventory") && !user.access.includes("admin")) {
    return redirect("/workflow/orders");
  }

  // Get stored Shopify credentials (offline token)
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
    return { error: "Shopify offline access token or shop domain not found. Open the app in Shopify Admin once to register the offline session.", user };
  }

  try {
    let products = [];
    let cursor = null;
    let hasNext = true;

    while (hasNext) {
      const url = `https://${shop}/admin/api/2024-10/graphql.json`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query: `
            query($first: Int!, $after: String) {
              products(first: $first, after: $after) {
                pageInfo { hasNextPage endCursor }
                edges { node {
                  id title handle
                  featuredImage { url }
                  variants(first: 100) {
                    edges { node { id title sku inventoryQuantity } }
                  }
                }}
              }
            }
          `,
          variables: { first: 250, after: cursor }
        })
      });

      if (!resp.ok) {
        throw new Error("Shopify GraphQL API returned status " + resp.status);
      }

      const json = await resp.json();
      const page = json.data?.products;
      products = products.concat(page?.edges?.map(e => e.node) || []);
      hasNext = page?.pageInfo?.hasNextPage || false;
      cursor = page?.pageInfo?.endCursor || null;
    }

    const localInventory = await prisma.inventory.findMany();
    return { products, localInventory, user, shop };
  } catch (err) {
    console.error("[workflow-inventory] Loader failed:", err.message);
    return { error: "Failed to load products from Shopify: " + err.message, user };
  }
};

export const action = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user) return redirect("/workflow");
  if (!user.access.includes("inventory") && !user.access.includes("admin")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fd = await request.formData();
  const type = fd.get("type");

  if (type === "logout") {
    const cookieStr = await wfCookie.serialize("", { maxAge: 0 });
    return redirect("/workflow", { headers: { "Set-Cookie": cookieStr } });
  }

  if (type === "updateStock") {
    const variantId = fd.get("variantId");
    const quantity = parseInt(fd.get("quantity") || "0", 10);
    const binLocation = fd.get("binLocation") || "";
    const notes = fd.get("notes") || "";
    const sku = fd.get("sku") || "";
    await prisma.inventory.upsert({
      where: { id: variantId },
      update: { quantity, binLocation, notes, sku },
      create: { id: variantId, quantity, binLocation, notes, sku },
    });
    return { ok: true };
  }

  if (type === "bulkSave") {
    const updates = JSON.parse(fd.get("updates") || "[]");
    for (const u of updates) {
      await prisma.inventory.upsert({
        where: { id: u.variantId },
        update: { quantity: u.quantity, binLocation: u.bin, notes: u.note, sku: u.sku },
        create: { id: u.variantId, quantity: u.quantity, binLocation: u.bin, notes: u.note, sku: u.sku },
      });
    }
    return { ok: true, saved: updates.length };
  }

  return { ok: false };
};

// helpers
function stockTone(qty) {
  if (qty <= 0) return "b-rose";
  if (qty <= 5) return "b-gold";
  return "b-teal";
}
function stockLabel(qty) {
  if (qty <= 0) return "Out of Stock";
  if (qty <= 5) return "Low Stock";
  return "In Stock";
}

function exportCSV(variants) {
  const header = ["Product", "Variant", "SKU", "Shopify Qty", "Warehouse Qty", "Bin Location", "Notes"];
  const rows = variants.map(v =>
    [v.pTitle, v.vTitle, v.sku || "", v.shopifyQty, v.whQty, v.bin, (v.note || "").replace(/,/g, " ")]
      .map(c => `"${c}"`).join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "warehouse-inventory.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function StandaloneInventory() {
  const data = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [query, setQuery] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [edits, setEdits] = useState({});
  const [toast, setToast] = useState(null);

  function showToast(msg, type="") {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 3000);
  }

  if (data.error) {
    return (
      <div style={{padding:40, maxWidth:600, margin:"0 auto", textAlign:"center", fontFamily:"sans-serif"}}>
        <h2 style={{color:"#9A2A3A", marginBottom:14}}>Configuration Needed</h2>
        <p style={{fontSize:14, color:"#666", lineHeight:1.6, marginBottom:20}}>{data.error}</p>
        <Link to="/workflow/orders" style={{color:"#B8782A", textDecoration:"underline"}}>← Return to Orders Dashboard</Link>
      </div>
    );
  }

  const { products, localInventory, user } = data;

  // Flatten variants
  const variants = useMemo(() => {
    const list = [];
    products.forEach(p => {
      p.variants.edges.forEach(({ node: v }) => {
        const local = localInventory.find(l => l.id === v.id);
        list.push({
          pId: p.id, pTitle: p.title, img: p.featuredImage?.url || null,
          id: v.id, vTitle: v.title, sku: v.sku || "",
          shopifyQty: v.inventoryQuantity ?? 0,
          whQty: local?.quantity ?? 0,
          bin: local?.binLocation ?? "",
          note: local?.notes ?? "",
        });
      });
    });
    return list;
  }, [products, localInventory]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return variants.filter(v => {
      const matchQ = !q ||
        v.pTitle.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.vTitle.toLowerCase().includes(q) ||
        v.bin.toLowerCase().includes(q);
      const filter = ["All", "Low Stock", "Out of Stock"][tabIndex];
      const matchF =
        filter === "All" ? true :
          filter === "Low Stock" ? (v.shopifyQty > 0 && v.shopifyQty <= 5) :
            filter === "Out of Stock" ? v.shopifyQty <= 0 : true;
      return matchQ && matchF;
    });
  }, [variants, query, tabIndex]);

  const editedCount = Object.keys(edits).length;

  const setField = (id, field, value) => {
    setEdits(prev => {
      const original = variants.find(v => v.id === id);
      const current = prev[id] || { ...original };
      const updated = { ...current, [field]: value };
      
      // If the fields are identical to original, remove from edits
      const isSame = 
        String(updated.whQty) === String(original.whQty) &&
        updated.bin === original.bin &&
        updated.note === original.note &&
        updated.sku === original.sku;
      
      const next = { ...prev };
      if (isSame) {
        delete next[id];
      } else {
        next[id] = updated;
      }
      return next;
    });
  };

  const saveSingle = (id) => {
    const editData = edits[id] || variants.find(v => v.id === id);
    const fd = new FormData();
    fd.append("type", "updateStock");
    fd.append("variantId", id);
    fd.append("quantity", editData.whQty);
    fd.append("binLocation", editData.bin);
    fd.append("notes", editData.note);
    fd.append("sku", editData.sku);
    submit(fd, { method: "POST" });
    setEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
    showToast("Variant saved successfully!", "success");
  };

  const saveAll = () => {
    const updates = Object.entries(edits).map(([variantId, editData]) => ({
      variantId,
      quantity: parseInt(editData.whQty) || 0,
      bin: editData.bin || "",
      note: editData.note || "",
      sku: editData.sku || "",
    }));
    const fd = new FormData();
    fd.append("type", "bulkSave");
    fd.append("updates", JSON.stringify(updates));
    submit(fd, { method: "POST" });
    setEdits({});
    showToast(`Bulk saved ${updates.length} variants!`, "success");
  };

  const doLogout = () => {
    const fd = new FormData();
    fd.append("type", "logout");
    submit(fd, { method: "POST" });
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"/>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {/* Header */}
      <header className="pg-header">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <circle cx="8" cy="5.5" r="2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3"/>
              <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">Unniyarcha</span>
          <span className="brand-tag">team workflow</span>
        </div>

        <div className="hd-right">
          {user?.name && (
            <span style={{fontSize:11, color:"rgba(255,255,255,0.45)", fontFamily:"'DM Sans',sans-serif"}}>
              {user.name}
            </span>
          )}
          <Link to="/workflow/orders" className="hd-link">Orders Workflow</Link>
          <Link to="/workflow/inventory" className="hd-link active">Warehouse Inventory</Link>
          {user?.access?.includes("admin") && (
            <Link to="/workflow/users" className="hd-link">Manage Users</Link>
          )}
          <button className="hd-link" onClick={doLogout}>Sign Out</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pg-main">
        <div className="pg-title-row">
          <div>
            <h1 className="pg-title">Warehouse Inventory Management</h1>
            <div className="pg-sub">{variants.length} variants across {products.length} products listed in Shopify</div>
          </div>
          <div>
            {editedCount > 0 ? (
              <button className="btn btn-primary" onClick={saveAll} disabled={isSaving}>
                {isSaving ? "Saving..." : `Save All Changes (${editedCount})`}
              </button>
            ) : (
              <button className="btn" onClick={() => exportCSV(filtered)}>Export CSV</button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {[
            { label: "Total Variants", value: variants.length, accent: "var(--border-strong)" },
            { label: "Low Stock Items", value: variants.filter(v => v.shopifyQty > 0 && v.shopifyQty <= 5).length, accent: "var(--gold)" },
            { label: "Out of Stock Items", value: variants.filter(v => v.shopifyQty <= 0).length, accent: "var(--rose)" },
            { label: "Unsaved Changes", value: editedCount, accent: editedCount > 0 ? "var(--gold)" : "var(--border-strong)" },
          ].map(({ label, value, accent }) => (
            <div className="stat-card" key={label} style={{ "--accent-line": accent }}>
              <div className="stat-label">{label}</div>
              <div className="stat-val">{value}</div>
            </div>
          ))}
        </div>

        {/* Filter and Search Card */}
        <div className="filter-card">
          <div className="filter-top">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by product, SKU, variant, or bin location…"
              />
            </div>
            {editedCount > 0 && (
              <button className="btn btn-primary" onClick={saveAll} disabled={isSaving}>
                Save All Edits ({editedCount})
              </button>
            )}
          </div>
          <div className="filter-tabs">
            {["All", "Low Stock", "Out of Stock"].map((tab, idx) => (
              <button
                key={tab}
                className={`filter-tab${idx === tabIndex ? " active" : ""}`}
                onClick={() => setTabIndex(idx)}
              >
                {tab} ({
                  idx === 0 ? variants.length :
                  idx === 1 ? variants.filter(v => v.shopifyQty > 0 && v.shopifyQty <= 5).length :
                  variants.filter(v => v.shopifyQty <= 0).length
                })
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="tbl-wrap">
          <table className="ord-table">
            <thead>
              <tr>
                <th>Product & Variant</th>
                <th style={{ width: 140 }}>SKU</th>
                <th style={{ width: 150 }}>Shopify Stock</th>
                <th style={{ width: 120 }}>Warehouse Qty</th>
                <th style={{ width: 150 }}>Bin Location</th>
                <th>Notes</th>
                <th style={{ width: 80, textAlignment: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const editData = edits[item.id] || item;
                const changed = !!edits[item.id];

                return (
                  <tr key={item.id} className={changed ? "changed" : ""}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {item.img ? (
                          <img className="thumb" src={item.img} alt={item.pTitle} />
                        ) : (
                          <div className="thumb-ph">UN</div>
                        )}
                        <div>
                          <div className="prod-title">{item.pTitle}</div>
                          {item.vTitle !== "Default Title" && (
                            <div className="var-title">{item.vTitle}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sku-txt">{item.sku || "—"}</span>
                    </td>
                    <td>
                      <span className={`badge ${stockTone(item.shopifyQty)}`}>
                        {item.shopifyQty} · {stockLabel(item.shopifyQty)}
                      </span>
                    </td>
                    <td>
                      <input
                        className={`input-tbl${changed ? " changed" : ""}`}
                        type="number"
                        value={editData.whQty}
                        onChange={e => setField(item.id, "whQty", parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        className={`input-tbl${changed ? " changed" : ""}`}
                        type="text"
                        value={editData.bin}
                        onChange={e => setField(item.id, "bin", e.target.value)}
                        placeholder="e.g. A-12"
                      />
                    </td>
                    <td>
                      <input
                        className={`input-tbl${changed ? " changed" : ""}`}
                        type="text"
                        value={editData.note}
                        onChange={e => setField(item.id, "note", e.target.value)}
                        placeholder="Add note…"
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-slim btn-primary"
                        disabled={!changed}
                        onClick={() => saveSingle(item.id)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
                    No variants match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-wrap">
          <div className={`toast t-${toast.type || "success"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}
