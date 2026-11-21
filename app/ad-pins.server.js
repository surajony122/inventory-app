import prisma from "./db.server";
import { unauthenticated } from "./shopify.server";
import { getShopCredentials } from "./shopify-admin.server";

// Regular (not app-reserved) metaobject type, so the theme can read it as shop.metaobjects.unnicharya_ad_pin.
// The definition is created on first publish, with storefront read access.
export const AD_PIN_TYPE = "unnicharya_ad_pin";

async function getAdmin() {
  const creds = await getShopCredentials();
  if (!creds) throw new Error("No Shopify store found. Set SHOPIFY_STORE_URL or open the app in Shopify admin once.");
  const { admin } = await unauthenticated.admin(creds.shop);
  return admin;
}

async function gql(admin, query, variables) {
  const res = await admin.graphql(query, { variables });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// Accepts handles or full product URLs, comma / space / line separated. Returns clean unique handles.
export function cleanHandles(input) {
  const out = [];
  String(input || "")
    .split(/[,\n\r\s]+/)
    .forEach((raw) => {
      let v = raw.trim();
      if (!v) return;
      try { v = decodeURIComponent(v); } catch (e) { /* keep as is */ }
      v = v.replace(/\/+$/, "");
      if (v.includes("/products/")) v = v.split("/products/").pop();
      v = v.split("?")[0].split("#")[0].split("/")[0].trim().toLowerCase();
      if (v && !out.includes(v)) out.push(v);
    });
  return out.slice(0, 40);
}

async function ensureDefinition(admin) {
  const found = await gql(admin, `query($type: String!) { metaobjectDefinitionByType(type: $type) { id } }`, { type: AD_PIN_TYPE });
  if (found.metaobjectDefinitionByType?.id) return;
  const data = await gql(admin, `
    mutation($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id }
        userErrors { field message }
      }
    }`, {
    definition: {
      type: AD_PIN_TYPE,
      name: "Ad pin rule",
      access: { storefront: "PUBLIC_READ" },
      fieldDefinitions: [
        { key: "keyword",    name: "Keyword",    type: "single_line_text_field", required: true },
        { key: "handles",    name: "Handles",    type: "multi_line_text_field" },
        { key: "collection", name: "Collection", type: "single_line_text_field" },
        { key: "active",     name: "Active",     type: "boolean" },
      ],
    },
  });
  const errs = data.metaobjectDefinitionCreate.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

function fieldsFor(r) {
  return [
    { key: "keyword",    value: r.keyword },
    { key: "handles",    value: r.handles },
    { key: "collection", value: r.collection || "" },
    { key: "active",     value: r.active ? "true" : "false" },
  ];
}

// Pushes one rule to Shopify so the storefront can read it.
export async function publishRule(rule) {
  const admin = await getAdmin();
  await ensureDefinition(admin);
  const data = await gql(admin, `
    mutation($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        userErrors { field message }
      }
    }`, { handle: { type: AD_PIN_TYPE, handle: rule.id }, metaobject: { fields: fieldsFor(rule) } });
  const errs = data.metaobjectUpsert.userErrors;
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

export async function unpublishRule(id) {
  const admin = await getAdmin();
  const found = await gql(admin, `query($handle: MetaobjectHandleInput!) { metaobjectByHandle(handle: $handle) { id } }`,
    { handle: { type: AD_PIN_TYPE, handle: id } });
  const gid = found.metaobjectByHandle?.id;
  if (!gid) return;
  await gql(admin, `mutation($id: ID!) { metaobjectDelete(id: $id) { userErrors { message } } }`, { id: gid });
}

export async function publishAllRules() {
  const rules = await prisma.adPinRule.findMany();
  for (const r of rules) await publishRule(r);
  return rules.length;
}

// Which of these handles are not products in the store (so the page can warn, not block).
export async function unknownHandles(handles) {
  const admin = await getAdmin();
  const missing = [];
  for (const h of handles) {
    const d = await gql(admin, `query($handle: String!) { productByHandle(handle: $handle) { id status } }`, { handle: h });
    if (!d.productByHandle) missing.push(h);
  }
  return missing;
}

// ───────────────────────── Meta (read-only) ─────────────────────────
// Needs two server settings: META_ACCESS_TOKEN (System User token with ads_read) and META_AD_ACCOUNT_ID.
// Never edits an ad. The token is only ever read from the environment.
const META_VERSION = process.env.META_API_VERSION || "v23.0";

export function metaStatus() {
  return {
    token: !!process.env.META_ACCESS_TOKEN,
    account: !!process.env.META_AD_ACCOUNT_ID,
    configured: !!process.env.META_ACCESS_TOKEN && !!process.env.META_AD_ACCOUNT_ID,
  };
}

async function graph(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${META_VERSION}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } });
  const json = await res.json();
  if (json.error) throw new Error(`Meta: ${json.error.message}`);
  return json;
}

function handleFromUrl(u) {
  const m = String(u || "").match(/\/products\/([^\/?#]+)/);
  if (!m) return "";
  try { return decodeURIComponent(m[1]).toLowerCase(); } catch (e) { return m[1].toLowerCase(); }
}
function collectionFromUrl(u) {
  const m = String(u || "").match(/\/collections\/([^\/?#]+)/);
  return m ? m[1].toLowerCase() : "";
}

function pathOf(u) {
  try {
    const x = new URL(u);
    return x.pathname.replace(/\/+$/, "") || "/";
  } catch (e) {
    return "";
  }
}

// The tag the storefront can match on. Your ads put the AD name in utm_term (utm_term={{ad.name}}) and the campaign name in
// utm_campaign. Meta fills the macros {{ad.name}}, {{adset.name}}, {{campaign.name}} at click time; we fill them the same way.
// Order of preference: utm_term (the ad), then utm_campaign.
function fillMacros(v, names) {
  v = String(v || "").trim();
  if (!v) return "";
  v = v
    .replace(/\{\{\s*campaign\.name\s*\}\}/gi, names.campaign || "")
    .replace(/\{\{\s*adset\.name\s*\}\}/gi, names.adset || "")
    .replace(/\{\{\s*ad\.name\s*\}\}/gi, names.ad || "");
  return v.includes("{{") ? "" : v.trim();
}
function utmCampaignFrom(urlTags, names) {
  if (!urlTags) return "";
  let params;
  try { params = new URLSearchParams(String(urlTags).replace(/^\?/, "")); } catch (e) { return ""; }
  return fillMacros(params.get("utm_term"), names) || fillMacros(params.get("utm_campaign"), names);
}

// Copies of an ad ("... – Copy 3") carry their own name in the link, so rules match the name without the copy suffix.
function baseName(s) {
  return String(s || "").replace(/\s*[–-]\s*Copy(\s*\d+)?\s*$/i, "").trim();
}

function describeCreative(c) {
  const oss = c?.object_story_spec || {};
  const ld = oss.link_data || {};
  const vd = oss.video_data || {};
  const links = [];
  const add = (u) => { if (u && !links.includes(u)) links.push(u); };
  add(c?.link_url);
  add(ld.link);
  add(ld.call_to_action?.value?.link);
  (ld.child_attachments || []).forEach((a) => add(a.link));
  add(vd.call_to_action?.value?.link);
  (c?.asset_feed_spec?.link_urls || []).forEach((l) => add(l.website_url));
  let format = "Image";
  if ((ld.child_attachments || []).length) format = "Carousel";
  else if (oss.video_data || c?.object_type === "VIDEO") format = "Video / Reel";
  else if (c?.product_set_id || oss.template_data) format = "Catalogue";
  else if (c?.asset_feed_spec) format = "Dynamic creative";
  return { links, format, urlTags: c?.url_tags || "", productSetId: c?.product_set_id || oss.template_data?.product_set_id || "" };
}

// Reads active ads: campaign, ad, format, destination links and products found in them.
export async function fetchMetaAds({ maxPages = 5 } = {}) {
  if (!metaStatus().configured) throw new Error("Meta is not connected yet. Add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in the server settings.");
  const acct = "act_" + String(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, "");
  let json = await graph(`${acct}/ads`, {
    fields: "name,effective_status,preview_shareable_link,campaign{name},adset{name},creative{object_type,object_story_spec,asset_feed_spec,product_set_id,link_url,url_tags,thumbnail_url}",
    effective_status: JSON.stringify(["ACTIVE"]),
    limit: "100",
  });
  const rows = [];
  let page = 0;
  while (json && page < maxPages) {
    for (const ad of json.data || []) {
      const d = describeCreative(ad.creative);
      const handles = [...new Set(d.links.map(handleFromUrl).filter(Boolean))];
      const collection = d.links.map(collectionFromUrl).find(Boolean) || "";
      rows.push({
        campaign: ad.campaign?.name || "(no campaign)",
        utm: utmCampaignFrom(d.urlTags, { campaign: ad.campaign?.name, adset: ad.adset?.name, ad: ad.name }),
        adset: ad.adset?.name || "",
        adId: ad.id,
        thumb: ad.creative?.thumbnail_url || "",
        preview: ad.preview_shareable_link || "",
        ad: ad.name,
        format: d.format,
        links: d.links.slice(0, 6),
        paths: [...new Set(d.links.map(pathOf).filter(Boolean))].slice(0, 6),
        handles,
        collection,
        productSetId: d.productSetId,
        landing: d.links.length === 0 ? "unknown" : handles.length ? "product" : collection ? "collection" : "other",
      });
    }
    const next = json.paging?.next;
    page += 1;
    if (!next) break;
    const r = await fetch(next, { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } });
    json = await r.json();
    if (json.error) throw new Error(`Meta: ${json.error.message}`);
  }
  return rows;
}

// Products inside a catalogue product set (best effort: needs catalogue access on the token).
export async function productSetHandles(productSetId, limit = 12) {
  try {
    const json = await graph(`${productSetId}/products`, { fields: "url", limit: String(limit) });
    return [...new Set((json.data || []).map((p) => handleFromUrl(p.url)).filter(Boolean))];
  } catch (e) {
    return [];
  }
}

// Groups ads by campaign and proposes one rule per campaign (not saved until the admin approves).
export async function suggestRules(rows) {
  const by = new Map();
  for (const r of rows) {
    const key = baseName(r.utm) || r.campaign;
    const g = by.get(key) || { campaign: key, metaNames: new Set(), fromUtm: !!r.utm, formats: new Set(), handles: [], collection: "", ads: 0, landings: new Set(), sets: new Set(), paths: new Map(), adNames: [] };
    g.formats.add(r.format);
    g.landings.add(r.landing);
    g.ads += 1;
    r.handles.forEach((h) => { if (!g.handles.includes(h)) g.handles.push(h); });
    if (!g.collection && r.collection) g.collection = r.collection;
    if (r.productSetId) g.sets.add(r.productSetId);
    (r.paths || []).forEach((p) => g.paths.set(p, (g.paths.get(p) || 0) + 1));
    if (r.ad && g.adNames.length < 3 && !g.adNames.includes(r.ad)) g.adNames.push(r.ad);
    g.metaNames.add(r.campaign);
    by.set(key, g);
  }
  const out = [];
  for (const g of by.values()) {
    if (!g.handles.length && g.sets.size) {
      for (const id of g.sets) {
        for (const h of await productSetHandles(id)) if (!g.handles.includes(h)) g.handles.push(h);
      }
    }
    out.push({
      campaign: g.campaign,
      fromUtm: g.fromUtm,
      adNames: g.adNames,
      metaNames: [...g.metaNames].slice(0, 3),
      formats: [...g.formats].join(", "),
      landings: [...g.landings].join(", "),
      ads: g.ads,
      collection: g.collection,
      handles: g.handles.slice(0, 8),
      pages: [...g.paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, n]) => ({ path, n })),
    });
  }
  return out;
}


// ───────────────────────── Auto mode: live product lists ─────────────────────────
// Needs the "read reports" permission on the app (ShopifyQL). Orders-based modes read the store's sales data;
// views / add-to-cart are Shopify's session reports and only cover visits that LAND on a product page.
export const METRICS = [
  { id: "orders",  label: "Most orders",                         note: "number of orders containing the product" },
  { id: "units",   label: "Most units sold",                     note: "total quantity sold" },
  { id: "revenue", label: "Most revenue",                        note: "net sales" },
  { id: "views",   label: "Most viewed (product-page landings)", note: "sessions that started on the product page" },
  { id: "carts",   label: "Most added to cart (product-page landings)", note: "sessions that started on the product page and added to cart" },
];
const EXCLUDE = new Set((process.env.AD_PIN_EXCLUDE_HANDLES || "gift-wrap,free-silver-coin,potli").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
const normText = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

async function shopifyql(admin, query) {
  let d;
  try {
    d = await gql(admin, `query($q: String!) { shopifyqlQuery(query: $q) { tableData { rows } parseErrors } }`, { q: query });
  } catch (e) {
    if (/read_reports|access denied/i.test(e.message)) {
      throw new Error("The app needs the 'read reports' permission to build live lists. Add read_reports to the app's access scopes, deploy, and approve it in Shopify admin (see the steps on the page).");
    }
    throw e;
  }
  const r = d.shopifyqlQuery;
  if (r.parseErrors && r.parseErrors.length) throw new Error("Shopify report error: " + r.parseErrors.join("; "));
  return (r.tableData && r.tableData.rows) || [];
}

function handleFromPath(path) {
  const m = String(path || "").match(/\/products\/([^\/?#]+)/);
  if (!m) return "";
  try { return decodeURIComponent(m[1]).toLowerCase(); } catch (e) { return m[1].toLowerCase(); }
}

async function collectionHandles(admin, handle) {
  const out = new Set();
  let after = null;
  for (let i = 0; i < 12; i++) {
    const d = await gql(admin, `query($h: String!, $after: String) { collectionByHandle(handle: $h) { products(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { handle } } } }`, { h: handle, after });
    const c = d.collectionByHandle;
    if (!c) break;
    c.products.nodes.forEach((n) => out.add(n.handle));
    if (!c.products.pageInfo.hasNextPage) break;
    after = c.products.pageInfo.endCursor;
  }
  return out;
}

// product ids -> handles of ACTIVE, in-stock products
async function liveHandles(admin, ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100).map((id) => `gid://shopify/Product/${id}`);
    const d = await gql(admin, `query($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { id handle status totalInventory tracksInventory } } }`, { ids: chunk });
    (d.nodes || []).forEach((n) => {
      if (!n || !n.handle) return;
      if (n.status !== "ACTIVE") return;
      if (n.tracksInventory && !(n.totalInventory > 0)) return;
      out.set(String(n.id).split("/").pop(), n.handle.toLowerCase());
    });
  }
  return out;
}

// Returns { handles, note }. scope "ad" only counts visitors / orders whose tags contain the rule keyword.
export async function computeAutoHandles(rule) {
  const admin = await getAdmin();
  const days = Math.min(Math.max(parseInt(rule.windowDays, 10) || 7, 1), 90);
  const topN = Math.min(Math.max(parseInt(rule.topN, 10) || 16, 1), 40);
  const metric = METRICS.some((m) => m.id === rule.metric) ? rule.metric : "orders";
  const scope = rule.scope === "collection" ? "collection" : "ad";
  const kw = normText(rule.keyword);
  const since = `-${days}d`;
  const sales = ["orders", "units", "revenue"].includes(metric);
  const col = { orders: "orders", units: "quantity_ordered", revenue: "net_sales", views: "sessions", carts: "sessions_with_cart_additions" }[metric];

  // score per key (product id for sales, handle for sessions); with scope "ad" take the best of the three tag fields
  const perDim = [];
  const dims = scope === "ad"
    ? (sales ? ["order_utm_campaign", "order_utm_term", "order_utm_content"] : ["utm_campaign", "utm_term", "utm_content"])
    : [null];
  for (const dim of dims) {
    const m = new Map();
    let q;
    if (sales) {
      q = dim ? `FROM sales SHOW ${col} GROUP BY ${dim}, product_id SINCE ${since} UNTIL today ORDER BY ${col} DESC LIMIT 1000`
              : `FROM sales SHOW ${col} GROUP BY product_id SINCE ${since} UNTIL today ORDER BY ${col} DESC LIMIT 1000`;
    } else {
      q = dim ? `FROM sessions SHOW ${col} GROUP BY ${dim}, landing_page_path SINCE ${since} UNTIL today ORDER BY ${col} DESC LIMIT 1000`
              : `FROM sessions SHOW ${col} GROUP BY landing_page_path SINCE ${since} UNTIL today ORDER BY ${col} DESC LIMIT 1000`;
    }
    const rows = await shopifyql(admin, q);
    for (const r of rows) {
      if (dim && !normText(r[dim]).includes(kw)) continue;
      const key = sales ? String(r.product_id || "") : handleFromPath(r.landing_page_path);
      if (!key) continue;
      m.set(key, (m.get(key) || 0) + (Number(r[col]) || 0));
    }
    perDim.push(m);
  }
  const score = new Map();
  perDim.forEach((m) => m.forEach((v, k) => score.set(k, Math.max(score.get(k) || 0, v))));
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]);

  let handles = [];
  if (sales) {
    const live = await liveHandles(admin, ranked.slice(0, 200).map(([id]) => id));
    handles = ranked.map(([id]) => live.get(id)).filter(Boolean);
  } else {
    handles = ranked.map(([h]) => h);
  }
  handles = handles.filter((h) => !EXCLUDE.has(h));
  if (rule.collection) {
    const members = await collectionHandles(admin, rule.collection);
    if (members.size) handles = handles.filter((h) => members.has(h));
  }
  handles = [...new Set(handles)].slice(0, topN);
  const label = METRICS.find((x) => x.id === metric).label.toLowerCase();
  const note = handles.length
    ? `${handles.length} products by ${label}, last ${days} day${days === 1 ? "" : "s"}, ${scope === "ad" ? "this ad only" : "everyone"}`
    : `no ${scope === "ad" ? "visits or orders from this ad" : "data"} in the last ${days} day${days === 1 ? "" : "s"}: nothing is pinned`;
  return { handles, note };
}

// Recomputes one auto rule and publishes it. Returns the updated rule.
export async function refreshAutoRule(id) {
  const rule = await prisma.adPinRule.findUnique({ where: { id } });
  if (!rule || rule.mode !== "auto") return rule;
  const { handles, note } = await computeAutoHandles(rule);
  const updated = await prisma.adPinRule.update({ where: { id }, data: { handles: handles.join(","), autoNote: note, refreshedAt: new Date() } });
  await publishRule(updated);
  return updated;
}

export async function refreshAutoRules() {
  const rules = await prisma.adPinRule.findMany({ where: { mode: "auto", active: true } });
  let ok = 0; const errors = [];
  for (const r of rules) {
    try { await refreshAutoRule(r.id); ok += 1; } catch (e) { errors.push(`${r.keyword}: ${e.message}`); }
  }
  return { ok, errors };
}
