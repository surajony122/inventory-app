import { useState } from "react";
import { useLoaderData, useActionData, useSubmit, useNavigation, redirect, Link } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
import prisma from "../db.server";
import { canManageBlocks } from "../checkout-blocks.server";
import { seedNotices } from "../track-notices.server";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#F5F2EC;--surface:#FDFBF8;--surface-3:#E8E4DB;--border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);--text:#231F17;--text-2:#6B6251;--teal-bg:#E6F5F2;--teal-text:#185448;--rose:#9A2A3A;--rose-bg:#F8E6E8;--r-sm:8px;--r-lg:16px;}
html,body{font-family:'Raleway',sans-serif;background:var(--bg);color:var(--text);font-size:14px;}
.pg-header{background:var(--text);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:58px;}
.brand-name{font-family:'Montserrat',sans-serif;font-size:20px;color:#fff;}
.hd-right{display:flex;gap:12px;}
.hd-link{font-size:11px;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.75);cursor:pointer;text-decoration:none;font-family:inherit;}
.pg-main{padding:24px 28px;max-width:900px;margin:0 auto;}
h2{font-family:'Montserrat',sans-serif;font-size:20px;font-weight:400;margin:6px 0 4px;}
.sub{color:var(--text-2);font-size:12px;margin-bottom:16px;line-height:1.5;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px;margin-bottom:18px;}
.lbl{font-size:11px;color:var(--text-2);text-transform:uppercase;letter-spacing:.5px;margin:10px 0 4px;display:block;}
.inp{width:100%;padding:8px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);font-family:inherit;font-size:13px;background:#fff;}
textarea.inp{min-height:90px;resize:vertical;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.btn{font-family:inherit;font-size:13px;padding:8px 16px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);cursor:pointer;margin-right:6px;}
.btn-primary{background:var(--text);color:#fff;border-color:var(--text);}
.btn-danger{border-color:var(--rose);color:var(--rose);background:var(--rose-bg);}
.row{padding:14px 0;border-bottom:1px solid var(--border);}
.row:last-child{border-bottom:none;}
.t{font-weight:600;}.b{color:var(--text-2);font-size:13px;margin:4px 0 8px;white-space:pre-wrap;}
.pill{display:inline-block;font-size:10px;padding:2px 8px;border-radius:10px;background:var(--surface-3);color:var(--text-2);margin-left:6px;text-transform:uppercase;}
.pill.on{background:var(--teal-bg);color:var(--teal-text);}
.msg{padding:10px 14px;border-radius:var(--r-sm);margin-bottom:14px;font-size:13px;}
.msg.ok{background:var(--teal-bg);color:var(--teal-text);}.msg.err{background:var(--rose-bg);color:var(--rose);}
@media(max-width:640px){.two{grid-template-columns:1fr;}}
`;

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
  await seedNotices();
  const notices = await prisma.trackNotice.findMany({ orderBy: { fromDate: "desc" } });
  return { notices };
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const action = async ({ request }) => {
  const g = await requireAdmin(request);
  if (g.redirect) return g.redirect;
  const fd = await request.formData();
  const type = fd.get("type");
  if (type === "logout") {
    const c = await wfCookie.serialize("", { maxAge: 0 });
    return redirect("/workflow", { headers: { "Set-Cookie": c } });
  }
  const id = fd.get("id");
  try {
    if (type === "save") {
      const title = (fd.get("title") || "").toString().trim().slice(0, 120);
      const body = (fd.get("body") || "").toString().trim().slice(0, 800);
      const fromDate = (fd.get("fromDate") || "").toString();
      const toDate = (fd.get("toDate") || "").toString();
      const appliesTo = fd.get("appliesTo") === "processing" ? "processing" : "all";
      if (!title || !body) return { error: "Please fill the heading and the message." };
      if (!DATE.test(fromDate) || !DATE.test(toDate) || fromDate > toDate) return { error: "Please choose a valid date range (From must not be after To)." };
      if (id) await prisma.trackNotice.update({ where: { id }, data: { title, body, fromDate, toDate, appliesTo } });
      else await prisma.trackNotice.create({ data: { title, body, fromDate, toDate, appliesTo, active: true } });
      return { ok: "Saved. It shows on the Track Order page right away." };
    }
    if (type === "toggle") {
      const n = await prisma.trackNotice.findUnique({ where: { id } });
      if (n) await prisma.trackNotice.update({ where: { id }, data: { active: !n.active } });
      return { ok: n?.active ? "Switched off." : "Switched on." };
    }
    if (type === "delete") {
      await prisma.trackNotice.delete({ where: { id } });
      return { ok: "Deleted." };
    }
  } catch (e) {
    return { error: e.message };
  }
  return null;
};

const EMPTY = { id: "", title: "", body: "", fromDate: "", toDate: "", appliesTo: "all" };

export default function TrackMessages() {
  const { notices } = useLoaderData();
  const result = useActionData();
  const nav = useNavigation();
  const submit = useSubmit();
  const busy = nav.state !== "idle";
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const send = (obj) => {
    const fd = new FormData();
    Object.entries(obj).forEach(([k, v]) => fd.append(k, v ?? ""));
    submit(fd, { method: "POST" });
  };
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat&family=Raleway:wght@400;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="pg-header">
        <span className="brand-name">Order Messages</span>
        <div className="hd-right">
          <Link to="/workflow/orders" className="hd-link">Orders Workflow</Link>
          <Link to="/workflow/ad-pins" className="hd-link">Ad Pins</Link>
          <button className="hd-link" onClick={() => send({ type: "logout" })}>Sign Out</button>
        </div>
      </header>
      <main className="pg-main">
        <h2>Message on the Track Order page, by order date</h2>
        <div className="sub">Orders placed between the two dates (India time) show this message on the Track Order page, above their status and tracking. Use it for apologies, delays or free-gift notes. If two messages cover the same date, the older one is shown.</div>
        {result?.ok && <div className="msg ok">{result.ok}</div>}
        {result?.error && <div className="msg err">{result.error}</div>}

        <div className="card">
          <div className="t">{form.id ? "Edit message" : "Add a message"}</div>
          <form onSubmit={(e) => { e.preventDefault(); send({ type: "save", ...form }); setForm(EMPTY); }}>
            <div className="two">
              <div><label className="lbl">Orders from (date)</label><input className="inp" type="date" value={form.fromDate} onChange={set("fromDate")} required /></div>
              <div><label className="lbl">Orders to (date)</label><input className="inp" type="date" value={form.toDate} onChange={set("toDate")} required /></div>
            </div>
            <label className="lbl">Show for</label>
            <select className="inp" value={form.appliesTo} onChange={set("appliesTo")}>
              <option value="all">All orders in this range (shipped and not shipped)</option>
              <option value="processing">Only orders not shipped yet</option>
            </select>
            <label className="lbl">Heading</label>
            <input className="inp" value={form.title} onChange={set("title")} maxLength={120} required />
            <label className="lbl">Message</label>
            <textarea className="inp" value={form.body} onChange={set("body")} maxLength={800} required />
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" disabled={busy}>{form.id ? "Save changes" : "Add message"}</button>
              {form.id && <button type="button" className="btn" onClick={() => setForm(EMPTY)}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="card">
          {notices.length === 0 && <div className="sub">No messages yet.</div>}
          {notices.map((n) => (
            <div className="row" key={n.id}>
              <div className="t">{n.title}<span className={"pill" + (n.active ? " on" : "")}>{n.active ? "On" : "Off"}</span><span className="pill">{n.fromDate} to {n.toDate}</span><span className="pill">{n.appliesTo === "all" ? "all orders" : "not shipped only"}</span></div>
              <div className="b">{n.body}</div>
              <button className="btn" onClick={() => { setForm({ id: n.id, title: n.title, body: n.body, fromDate: n.fromDate, toDate: n.toDate, appliesTo: n.appliesTo }); window.scrollTo(0, 0); }}>Edit</button>
              <button className="btn" onClick={() => send({ type: "toggle", id: n.id })}>{n.active ? "Switch off" : "Switch on"}</button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
