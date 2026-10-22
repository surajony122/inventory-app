import { useState } from "react";
import { useLoaderData, useActionData, useSubmit, useNavigation, redirect, Link } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
import prisma from "../db.server";
import { canManageBlocks, publishBlock, unpublishBlock, publishAll } from "../checkout-blocks.server";

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
`;

export const loader = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user) return redirect("/workflow");
  if (!canManageBlocks(user)) return redirect("/workflow/orders");
  const blocks = await prisma.checkoutBlock.findMany({ orderBy: [{ kind: "asc" }, { sort: "asc" }, { createdAt: "asc" }] });
  return { blocks };
};

export const action = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user) return redirect("/workflow");
  if (!canManageBlocks(user)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await request.formData();
  const type = fd.get("type");

  if (type === "logout") {
    const cookieStr = await wfCookie.serialize("", { maxAge: 0 });
    return redirect("/workflow", { headers: { "Set-Cookie": cookieStr } });
  }

  try {
    if (type === "save") {
      const id    = fd.get("id");
      const kind  = fd.get("kind") === "note" ? "note" : "coupon";
      const title = (fd.get("title") || "").toString().trim();
      const body  = (fd.get("body") || "").toString().trim();
      const code  = (fd.get("code") || "").toString().trim().toUpperCase();
      const sort  = parseInt(fd.get("sort") || "0", 10) || 0;
      if (!title) return { error: "Title is required." };
      if (kind === "coupon" && !code) return { error: "A coupon needs a discount code." };
      const data = { kind, title, body, code: kind === "coupon" ? code : null, sort };
      const block = id
        ? await prisma.checkoutBlock.update({ where: { id }, data })
        : await prisma.checkoutBlock.create({ data: { ...data, active: true } });
      await publishBlock(block);
      return { ok: id ? "Saved and published to checkout." : "Added and published to checkout." };
    }

    if (type === "toggle") {
      const block = await prisma.checkoutBlock.findUnique({ where: { id: fd.get("id") } });
      if (!block) return { error: "Block not found." };
      const updated = await prisma.checkoutBlock.update({ where: { id: block.id }, data: { active: !block.active } });
      await publishBlock(updated);
      return { ok: updated.active ? "Turned on." : "Turned off." };
    }

    if (type === "delete") {
      const id = fd.get("id");
      await prisma.checkoutBlock.delete({ where: { id } });
      await unpublishBlock(id);
      return { ok: "Deleted." };
    }

    if (type === "publishAll") {
      const n = await publishAll();
      return { ok: `Published ${n} block${n === 1 ? "" : "s"} to checkout.` };
    }
  } catch (err) {
    console.error("[checkout-blocks]", err.message);
    return { error: "Saved here, but publishing to Shopify failed: " + err.message };
  }
  return { error: "Unknown action." };
};

const EMPTY = { id: "", kind: "coupon", title: "", body: "", code: "", sort: 0 };

export default function CheckoutBlocksPage() {
  const { blocks } = useLoaderData();
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

  const coupons = blocks.filter((b) => b.kind === "coupon");
  const notes   = blocks.filter((b) => b.kind === "note");

  const renderSection = (title, items) => (
    <div className="card">
      <h2>{title}</h2>
      {items.length === 0 && <div className="sub">None yet.</div>}
      {items.map((b) => (
        <div className="row" key={b.id}>
          <div className="main">
            <div className="t">
              {b.kind === "coupon" ? b.code : b.title}
              <span className={`pill${b.active ? " on" : ""}`}>{b.active ? "On" : "Off"}</span>
              <span className="pill">Order {b.sort}</span>
            </div>
            <div className="b">{b.kind === "coupon" ? `${b.title}${b.body ? " — " + b.body : ""}` : b.body}</div>
          </div>
          <div className="acts">
            <button className="btn" disabled={busy} onClick={() => setForm({ id: b.id, kind: b.kind, title: b.title, body: b.body || "", code: b.code || "", sort: b.sort })}>Edit</button>
            <button className="btn" disabled={busy} onClick={() => send({ type: "toggle", id: b.id })}>{b.active ? "Turn off" : "Turn on"}</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => confirm("Delete this block?") && send({ type: "delete", id: b.id })}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat&family=Raleway:wght@400;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pg-header">
        <span className="brand-name">Checkout Blocks</span>
        <div className="hd-right">
          <Link to="/workflow/orders" className="hd-link">Orders Workflow</Link>
          <Link to="/workflow/inventory" className="hd-link">Warehouse Inventory</Link>
          <Link to="/workflow/users" className="hd-link">Manage Users</Link>
          <button className="hd-link" onClick={() => send({ type: "logout" })}>Sign Out</button>
        </div>
      </header>
      <main className="pg-main">
        <h2>Offers and notes shown at checkout</h2>
        <div className="sub">Changes are published to your Shopify checkout as soon as you save. Coupon codes must already exist as discount codes in Shopify.</div>
        {result?.ok && <div className="msg ok">{result.ok}</div>}
        {result?.error && <div className="msg err">{result.error}</div>}

        <form className="card" onSubmit={onSave}>
          <div className="grid">
            <div>
              <label className="lbl">Type</label>
              <select className="inp" value={form.kind} onChange={set("kind")}>
                <option value="coupon">Coupon</option>
                <option value="note">Note</option>
              </select>
            </div>
            {form.kind === "coupon" ? (
              <div>
                <label className="lbl">Discount code</label>
                <input className="inp" value={form.code} onChange={set("code")} placeholder="DWL20" />
              </div>
            ) : <div />}
            <div>
              <label className="lbl">{form.kind === "coupon" ? "Offer text" : "Heading"}</label>
              <input className="inp" value={form.title} onChange={set("title")} placeholder={form.kind === "coupon" ? "Flat 20% off on orders above ₹599" : "NOTE"} />
            </div>
            <div>
              <label className="lbl">Order</label>
              <input className="inp" type="number" value={form.sort} onChange={set("sort")} />
            </div>
            <div className="wide">
              <label className="lbl">{form.kind === "coupon" ? "Extra detail (optional)" : "Message"}</label>
              <textarea className="inp" value={form.body} onChange={set("body")} placeholder={form.kind === "note" ? "Your order may arrive in multiple packages; all shipments will be accompanied by a tracking message." : ""} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : form.id ? "Save changes" : "Add block"}</button>
            {form.id && <button type="button" className="btn" onClick={() => setForm(EMPTY)}>Cancel edit</button>}
            <span style={{ flex: 1 }} />
            <button type="button" className="btn" disabled={busy} onClick={() => send({ type: "publishAll" })}>Publish all to checkout</button>
          </div>
        </form>

        {renderSection("Coupons", coupons)}
        {renderSection("Notes", notes)}
      </main>
    </>
  );
}
