import { useState } from "react";
import { useLoaderData, useActionData, useSubmit, useNavigation, redirect, Link } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
import prisma from "../db.server";
import { canManageBlocks } from "../checkout-blocks.server";
import {
  cleanHandles, publishRule, unpublishRule, publishAllRules, unknownHandles,
  metaStatus, fetchMetaAds, suggestRules, METRICS, refreshAutoRule, refreshAutoRules,
} from "../ad-pins.server";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#F5F2EC;--surface:#FDFBF8;--surface-2:#F0EDE6;--surface-3:#E8E4DB;--border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);--text:#231F17;--text-2:#6B6251;--text-3:#A89F8E;--gold:#B8782A;--teal-bg:#E6F5F2;--teal-text:#185448;--rose:#9A2A3A;--rose-bg:#F8E6E8;--r-sm:8px;--r-lg:16px;}
html,body{font-family:'Raleway',sans-serif;background:var(--bg);color:var(--text);font-size:14px;}
.pg-header{background:var(--text);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:58px;position:sticky;top:0;z-index:60;}
.brand-name{font-family:'Montserrat',sans-serif;font-size:20px;color:#fff;}
.hd-right{display:flex;align-items:center;gap:12px;}
.hd-link{font-size:11px;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.75);cursor:pointer;text-decoration:none;font-family:inherit;}
.hd-link:hover,.hd-link.active{background:rgba(255,255,255,0.15);color:#fff;}
.pg-main{padding:24px 28px;max-width:1000px;margin:0 auto;}
h2{font-family:'Montserrat',sans-serif;font-size:20px;font-weight:400;margin:6px 0 4px;}
.sub{color:var(--text-2);font-size:12px;margin-bottom:16px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px;margin-bottom:18px;}
.grid{display:grid;grid-template-columns:140px 1fr 1fr 90px;gap:12px;align-items:end;}
.grid .wide{grid-column:1 / -1;}
.lbl{font-size:11px;color:var(--text-2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;display:block;}
.inp{width:100%;padding:8px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);font-family:inherit;font-size:13px;background:#fff;}
textarea.inp{min-height:64px;resize:vertical;}
.btn{font-family:inherit;font-size:13px;padding:8px 16px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;}
.btn-primary{background:var(--text);color:#fff;border-color:var(--text);}
.btn-danger{border-color:var(--rose);color:var(--rose);background:var(--rose-bg);}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.row{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);}
.row:last-child{border-bottom:none;}
.row .main{flex:1;min-width:0;}
.row .t{font-weight:600;}
.row .b{color:var(--text-2);font-size:13px;margin-top:2px;white-space:pre-wrap;}
.pill{display:inline-block;font-size:10px;padding:2px 8px;border-radius:10px;background:var(--surface-3);color:var(--text-2);margin-left:6px;text-transform:uppercase;letter-spacing:.4px;}
.pill.on{background:var(--teal-bg);color:var(--teal-text);}
.msg{padding:10px 14px;border-radius:var(--r-sm);margin-bottom:14px;font-size:13px;}
.msg.ok{background:var(--teal-bg);color:var(--teal-text);}
.msg.err{background:var(--rose-bg);color:var(--rose);}
.acts{display:flex;gap:6px;flex-shrink:0;}

.tbl{width:100%;border-collapse:collapse;font-size:12px;}
.tbl th{text-align:left;padding:8px 10px;background:var(--surface-2);color:var(--text-3);font-size:10px;text-transform:uppercase;letter-spacing:.5px;}
.tbl td{padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:top;}
.mono{font-family:ui-monospace,Menlo,monospace;font-size:11px;word-break:break-all;}
.steps{font-size:12px;color:var(--text-2);margin:6px 0 0 18px;line-height:1.6;}
.grid3{display:grid;grid-template-columns:1fr 1.6fr 1fr auto;gap:12px;align-items:end;}
`;

// Admin only: the same single admin who can open the Checkout Blocks page.
async function requireAdmin(request) {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user) return { redirect: redirect("/workflow") };
  if (!canManageBlocks(user)) return { redirect: redirect("/workflow/orders") };
  return { user };
}

export const loader = async ({ request }) => {
  const g = await requireAdmin(request);
  if (g.redirect) return g.redirect;
  const rules = await prisma.adPinRule.findMany({ orderBy: { createdAt: "asc" } });
  // Where the "Preview" links open. PREVIEW_THEME_ID is the theme to look at (default: the "new ui" theme).
  const preview = {
    themeId: process.env.PREVIEW_THEME_ID || "156757819529",
    domain: process.env.STOREFRONT_DOMAIN || "unniyarcha.com",
  };
  return { rules, meta: metaStatus(), preview, metrics: METRICS };
};

export const action = async ({ request }) => {
  const g = await requireAdmin(request);
  if (g.redirect) return g.redirect;
  const fd = await request.formData();
  const type = fd.get("type");

  if (type === "logout") {
    const cookieStr = await wfCookie.serialize("", { maxAge: 0 });
    return redirect("/workflow", { headers: { "Set-Cookie": cookieStr } });
  }

  try {
    if (type === "save" || type === "addSuggestion") {
      const id = fd.get("id");
      const keyword = (fd.get("keyword") || "").toString().trim();
      const collection = (fd.get("collection") || "").toString().trim().toLowerCase().replace(/^.*\/collections\//, "").split(/[?#\/]/)[0] || null;
      const mode = fd.get("mode") === "auto" ? "auto" : "manual";
      const metric = METRICS.some((m) => m.id === fd.get("metric")) ? fd.get("metric") : "orders";
      const windowDays = Math.min(Math.max(parseInt(fd.get("windowDays") || "7", 10) || 7, 1), 90);
      const topN = Math.min(Math.max(parseInt(fd.get("topN") || "16", 10) || 16, 1), 40);
      const scope = fd.get("scope") === "collection" ? "collection" : "ad";
      if (keyword.length < 3) return { error: "The campaign keyword needs at least 3 characters, so it does not match every visit." };
      const handles = cleanHandles(fd.get("handles"));
      if (mode === "manual" && !handles.length) return { error: "Add at least one product handle (or paste product links), or choose Auto." };
      if (mode === "auto" && !collection && scope === "collection") return { error: "For a whole-store list, choose a collection so the products fit the page." };
      const base = { keyword, collection, mode, metric, windowDays, topN, scope };
      const data = { ...base, handles: mode === "manual" ? handles.join(",") : "", source: type === "addSuggestion" ? "meta" : "manual" };
      let rule = id
        ? await prisma.adPinRule.update({ where: { id }, data: mode === "manual" ? { ...base, handles: data.handles, autoNote: null } : base })
        : await prisma.adPinRule.create({ data: { ...data, active: true } });
      if (mode === "auto") {
        try {
          rule = await refreshAutoRule(rule.id);
          return { ok: (id ? "Saved." : "Added.") + " Live list built: " + rule.autoNote + "." };
        } catch (e) {
          await publishRule(rule).catch(() => {});
          return { error: "Rule saved, but the live list could not be built: " + e.message };
        }
      }
      await publishRule(rule);
      let warn = "";
      try {
        const missing = await unknownHandles(handles);
        if (missing.length) warn = " Warning: no product found for " + missing.join(", ") + ".";
      } catch (e) { /* the check is a courtesy only */ }
      return { ok: (id ? "Saved and published." : "Added and published.") + warn };
    }

    if (type === "refresh") {
      const r = await refreshAutoRule(fd.get("id"));
      return { ok: r && r.autoNote ? "Refreshed: " + r.autoNote + "." : "Refreshed." };
    }

    if (type === "refreshAll") {
      const r = await refreshAutoRules();
      return r.errors.length ? { error: `Refreshed ${r.ok}. Problems: ${r.errors.join(" | ")}` } : { ok: `Refreshed ${r.ok} auto rule${r.ok === 1 ? "" : "s"}.` };
    }

    if (type === "toggle") {
      const r = await prisma.adPinRule.findUnique({ where: { id: fd.get("id") } });
      if (!r) return { error: "Rule not found." };
      const u = await prisma.adPinRule.update({ where: { id: r.id }, data: { active: !r.active } });
      await publishRule(u);
      return { ok: u.active ? "Turned on." : "Turned off." };
    }

    if (type === "delete") {
      const id = fd.get("id");
      await prisma.adPinRule.delete({ where: { id } });
      await unpublishRule(id);
      return { ok: "Deleted." };
    }

    if (type === "publishAll") {
      const n = await publishAllRules();
      return { ok: `Published ${n} rule${n === 1 ? "" : "s"} to the storefront.` };
    }

    if (type === "fetchMeta") {
      const rows = await fetchMetaAds();
      const suggestions = await suggestRules(rows);
      return { ok: `Read ${rows.length} active ad${rows.length === 1 ? "" : "s"} from Meta (nothing was changed in Meta).`, rows, suggestions };
    }
  } catch (err) {
    console.error("[ad-pins]", err.message);
    return { error: err.message };
  }
  return { error: "Unknown action." };
};

const EMPTY = { id: "", keyword: "", handles: "", collection: "", mode: "manual", metric: "orders", windowDays: 7, topN: 16, scope: "ad" };

export default function AdPinsPage() {
  const { rules, meta, preview, metrics } = useLoaderData();
  const result = useActionData();
  const nav = useNavigation();
  const submit = useSubmit();
  const busy = nav.state !== "idle";
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function send(obj) {
    const fd = new FormData();
    Object.entries(obj).forEach(([k, v]) => fd.append(k, v ?? ""));
    submit(fd, { method: "POST" });
  }
  function onSave(e) {
    e.preventDefault();
    send({ type: "save", ...form });
    setForm(EMPTY);
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat&family=Raleway:wght@400;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pg-header">
        <span className="brand-name">Ad Pins</span>
        <div className="hd-right">
          <Link to="/workflow/orders" className="hd-link">Orders Workflow</Link>
          <Link to="/workflow/blocks" className="hd-link">Checkout Blocks</Link>
          <Link to="/workflow/users" className="hd-link">Manage Users</Link>
          <button className="hd-link" onClick={() => send({ type: "logout" })}>Sign Out</button>
        </div>
      </header>
      <main className="pg-main">
        <h2>Pinned products for ad visitors</h2>
        <div className="sub">When a visitor arrives from a campaign whose name contains the keyword, these products show first on the collection page. Everyone else sees the normal page. Rules go live on the storefront as soon as you save.</div>
        {result?.ok && <div className="msg ok">{result.ok}</div>}
        {result?.error && <div className="msg err">{result.error}</div>}

        <div className="card">
          <h2>Meta connection <span className={`pill${meta.configured ? " on" : ""}`}>{meta.configured ? "Connected" : "Not connected"}</span></h2>
          {meta.configured ? (
            <>
              <div className="sub">Reads your active ads (campaign, format, destination and products in the links). It never edits anything in Meta.</div>
              <button className="btn btn-primary" disabled={busy} onClick={() => send({ type: "fetchMeta" })}>{busy ? "Reading…" : "Read ads from Meta"}</button>
            </>
          ) : (
            <>
              <div className="sub">To connect, add two settings to the server (Render → Environment). The token is never entered on this page.</div>
              <ol className="steps">
                <li><b>META_ACCESS_TOKEN</b>: a System User token with the <b>ads_read</b> permission (Business Settings → Users → System users). Catalogue products may also need catalogue access.</li>
                <li><b>META_AD_ACCOUNT_ID</b>: your ad account ID (with or without the act_ prefix).</li>
                <li>Redeploy, then come back and press “Read ads from Meta”. Token set: {meta.token ? "yes" : "no"} · Account set: {meta.account ? "yes" : "no"}</li>
              </ol>
            </>
          )}
        </div>

        {result?.suggestions && (
          <div className="card">
            <h2>Suggested rules from Meta</h2>
            <div className="sub">One per campaign. Products come from the links in the ads (or the catalogue product set). Campaigns whose ads link only to a collection have no product in Meta: add those by hand. Nothing is saved until you press Add.</div>
            <table className="tbl">
              <thead><tr><th>Keyword (matches the shopper's utm_campaign)</th><th>Ads</th><th>Formats</th><th>Landing page (link in the ads)</th><th>Products found</th><th></th></tr></thead>
              <tbody>
                {result.suggestions.map((s) => (
                  <tr key={s.campaign}>
                    <td className="mono">
                      {s.campaign}
                      {s.adNames && s.adNames.length > 0 && (
                        <div style={{ fontFamily: "inherit", marginTop: 3 }}>Ads: {s.adNames.join(" · ")}{s.ads > s.adNames.length ? " …" : ""}</div>
                      )}
                      <div style={{ color: "var(--text-3)", fontFamily: "inherit", marginTop: 3 }}>
                        {s.fromUtm ? "utm_campaign from the ad link" : "Meta campaign name (no utm_campaign in the ad link)"}
                        {s.fromUtm && s.metaNames[0] !== s.campaign ? " · Meta: " + s.metaNames.join(" / ") : ""}
                      </div>
                    </td>
                    <td>{s.ads}</td>
                    <td>{s.formats}</td>
                    <td className="mono">
                      {s.pages && s.pages.length
                        ? s.pages.map((pg) => <div key={pg.path}>{pg.path} <span style={{ color: "var(--text-3)" }}>× {pg.n}</span></div>)
                        : <span style={{ color: "var(--text-3)" }}>no link in Meta ({s.landings})</span>}
                    </td>
                    <td className="mono">{s.handles.length ? s.handles.join(", ") : "none in Meta"}</td>
                    <td>
                      <button className="btn" disabled={busy || !s.handles.length} onClick={() => send({ type: "addSuggestion", keyword: s.campaign, handles: s.handles.join(","), collection: s.collection })}>Add rule</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result?.rows && (
          <div className="card">
            <h2>All active ads ({result.rows.length})</h2>
            <div className="sub">Every ad Meta returned, with where its link goes. “Landing” says whether the link opens a product, a collection or something else.</div>
            <table className="tbl">
              <thead><tr><th>Preview</th><th>Campaign</th><th>Ad name</th><th>Format</th><th>Landing</th><th>Destination link(s)</th></tr></thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r.thumb ? <img src={r.thumb} alt="" width="56" style={{ borderRadius: 6, display: "block" }} /> : <span style={{ color: "var(--text-3)" }}>no image</span>}
                      {r.preview && <a href={r.preview} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>Open ad preview</a>}
                    </td>
                    <td className="mono">{r.campaign}</td>
                    <td>{r.ad}</td>
                    <td>{r.format}</td>
                    <td>{r.landing}</td>
                    <td className="mono">{r.paths && r.paths.length ? r.paths.map((x) => <div key={x}>{x}</div>) : "none"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form className="card" onSubmit={onSave}>
          <h2>{form.id ? "Edit rule" : "Add a rule"}</h2>
          <div className="grid3">
            <div>
              <label className="lbl">Campaign keyword</label>
              <input className="inp" value={form.keyword} onChange={set("keyword")} placeholder="Custom_Reel_CLP_Category_Earrings" />
            </div>
            <div>
              <label className="lbl">Products come from</label>
              <select className="inp" value={form.mode} onChange={set("mode")}>
                <option value="manual">A list I type (manual)</option>
                <option value="auto">Live from store data (auto)</option>
              </select>
            </div>
            <div>
              <label className="lbl">Only on collection {form.mode === "auto" ? "(also filters the products)" : "(optional)"}</label>
              <input className="inp" value={form.collection} onChange={set("collection")} placeholder="earrings" />
            </div>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : form.id ? "Save" : "Add"}</button>
          </div>
          {form.mode === "manual" ? (
            <div style={{ marginTop: 10 }}>
              <label className="lbl">Product handles or links (in order, comma separated)</label>
              <input className="inp" value={form.handles} onChange={set("handles")} placeholder="up to 40 handles, in order" />
            </div>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.7fr 1fr", gap: 12 }}>
              <div>
                <label className="lbl">Rank products by</label>
                <select className="inp" value={form.metric} onChange={set("metric")}>
                  {metrics.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Look back</label>
                <select className="inp" value={form.windowDays} onChange={set("windowDays")}>
                  {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d === 1 ? "1 day" : d + " days"}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">How many</label>
                <select className="inp" value={form.topN} onChange={set("topN")}>
                  {[8, 16, 24, 40].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Count data from</label>
                <select className="inp" value={form.scope} onChange={set("scope")}>
                  <option value="ad">This ad only (keyword)</option>
                  <option value="collection">Everyone (whole store)</option>
                </select>
              </div>
            </div>
          )}
          {form.mode === "auto" && (
            <div className="sub" style={{ marginTop: 8 }}>
              Refreshes by itself with the store's regular sync, or press Refresh on the rule. Needs the app's “read reports” permission. If this ad has no visits or orders yet, nothing is pinned (the page stays normal). “Most viewed” and “most added to cart” only count visits that start on a product page.
            </div>
          )}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            {form.id && <button type="button" className="btn" onClick={() => setForm(EMPTY)}>Cancel edit</button>}
            <span style={{ flex: 1 }} />
            <button type="button" className="btn" disabled={busy} onClick={() => send({ type: "refreshAll" })}>Refresh all auto rules</button>
            <button type="button" className="btn" disabled={busy} onClick={() => send({ type: "publishAll" })}>Publish all to storefront</button>
          </div>
        </form>

        <div className="card">
          <h2>Rules</h2>
          {rules.length === 0 && <div className="sub">None yet.</div>}
          {rules.map((r) => (
            <div className="row" key={r.id}>
              <div className="main">
                <div className="t">
                  {r.keyword}
                  <span className={`pill${r.active ? " on" : ""}`}>{r.active ? "On" : "Off"}</span>
                  <span className="pill">{r.mode === "auto" ? "auto" : r.source}</span>
                  {r.collection && <span className="pill">collection: {r.collection}</span>}
                </div>
                {r.mode === "auto" && (
                  <div className="sub" style={{ margin: "2px 0" }}>
                    {(metrics.find((m) => m.id === r.metric) || {}).label} · last {r.windowDays} day{r.windowDays === 1 ? "" : "s"} · top {r.topN} · {r.scope === "ad" ? "this ad only" : "everyone"}
                    {r.autoNote ? " · " + r.autoNote : ""}{r.refreshedAt ? " · refreshed " + new Date(r.refreshedAt).toLocaleString("en-IN") : " · not refreshed yet"}
                  </div>
                )}
                <div className="b mono">{r.handles ? r.handles.split(",").join("  ›  ") : "(nothing pinned right now)"}</div>
                {(() => {
                  const col = r.collection || "all";
                  const base = `https://${preview.domain}/collections/${col}`;
                  const adLink = `${base}?preview_theme_id=${preview.themeId}&utm_source=Meta&utm_medium=Paid&utm_term=${encodeURIComponent(r.keyword)}&fbclid=preview-test`;
                  const normalLink = `${base}?preview_theme_id=${preview.themeId}`;
                  return (
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      Preview: <a href={adLink} target="_blank" rel="noreferrer">as an ad visitor (pinned)</a>
                      {" · "}
                      <a href={normalLink} target="_blank" rel="noreferrer">normal visitor</a>
                    </div>
                  );
                })()}
              </div>
              <div className="acts">
                {r.mode === "auto" && <button className="btn" disabled={busy} onClick={() => send({ type: "refresh", id: r.id })}>Refresh</button>}
                <button className="btn" disabled={busy} onClick={() => setForm({ id: r.id, keyword: r.keyword, handles: r.handles || "", collection: r.collection || "", mode: r.mode || "manual", metric: r.metric || "orders", windowDays: r.windowDays || 7, topN: r.topN || 16, scope: r.scope || "ad" })}>Edit</button>
                <button className="btn" disabled={busy} onClick={() => send({ type: "toggle", id: r.id })}>{r.active ? "Turn off" : "Turn on"}</button>
                <button className="btn btn-danger" disabled={busy} onClick={() => confirm("Delete this rule?") && send({ type: "delete", id: r.id })}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
