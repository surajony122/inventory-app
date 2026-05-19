import { useState } from "react";
import { useLoaderData, useSubmit, redirect, Link } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
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
  --rose:#9A2A3A;--rose-bg:#F8E6E8;--rose-text:#661825;
  --r-sm:8px;--r-md:12px;--r-lg:16px;
  --shadow-xs:0 1px 2px rgba(60,45,20,0.06);
  --shadow-sm:0 2px 6px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;}

.pg-header{background:var(--text);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:58px;position:sticky;top:0;z-index:60;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
.brand{display:flex;align-items:center;gap:10px;}
.brand-mark{width:22px;height:22px;border:1.5px solid rgba(255,255,255,0.85);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:#fff;}
.brand-tag{font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:1px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);padding:2px 6px;border-radius:4px;margin-left:4px;font-family:'DM Sans',sans-serif;}
.hd-right{display:flex;align-items:center;gap:16px;}
.hd-link{font-size:11px;font-weight:500;padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.75);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;}
.hd-link:hover,.hd-link.active{background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.35);}

.pg-main{padding:24px 28px;max-width:1000px;margin:0 auto;}
.section-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px;margin-bottom:20px;box-shadow:var(--shadow-xs);}
.form-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;}
.field-lbl{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;display:block;}
.field-input{width:100%;padding:8px 12px;border:1px solid var(--border-md);border-radius:var(--r-sm);font-family:'DM Sans',sans-serif;font-size:13px;}
.field-input:focus{border-color:var(--gold);outline:none;}

.btn{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 16px;border-radius:var(--r-sm);border:1px solid var(--border-md);background:var(--surface);color:var(--text);cursor:pointer;transition:all 0.12s;}
.btn:hover{background:var(--surface-2);}
.btn-primary{background:var(--text);color:#fff;border-color:var(--text);}
.btn-primary:hover{opacity:0.85;}
.btn-danger{border-color:var(--rose);color:var(--rose);background:var(--rose-bg);}
.btn-danger:hover{background:var(--rose);color:#fff;}

.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
.usr-table{width:100%;border-collapse:collapse;font-size:13px;}
.usr-table th{text-align:left;padding:12px 16px;background:var(--surface-2);color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;}
.usr-table td{padding:12px 16px;border-bottom:1px solid var(--border);}
.usr-table tr:last-child td{border-bottom:none;}

.badge{display:inline-block;font-size:10px;font-weight:500;padding:2px 6px;border-radius:10px;margin-right:4px;background:var(--surface-3);color:var(--text-2);}
.badge.active{background:var(--teal-bg);color:var(--teal-text);}

.checkbox-group{display:flex;gap:10px;flex-wrap:wrap;}
.checkbox-lbl{display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;}
`

const ROLES = ["admin", "inventory", "production", "dispatch"];

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user || !user.access.includes("admin")) {
    return redirect("/workflow");
  }

  const users = await prisma.workflowUser.findMany({ orderBy: { email: "asc" } });
  return {
    users: users.map(u => ({ ...u, access: JSON.parse(u.access || "[]") })),
    currentUser: user,
  };
};

// ── ACTION ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  const user = await findWorkflowUser(email);
  if (!user || !user.access.includes("admin")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fd = await request.formData();
  const type = fd.get("type");

  if (type === "create") {
    const uEmail = fd.get("email")?.trim().toLowerCase();
    const uName = fd.get("name")?.trim();
    const uAccess = fd.get("access") || "[]";
    
    if (!uEmail) return Response.json({ error: "Email is required" }, { status: 400 });
    
    try {
      await prisma.workflowUser.create({
        data: {
          email: uEmail,
          name: uName,
          access: uAccess,
        },
      });
      return { ok: true };
    } catch (err) {
      return Response.json({ error: "User already exists or database error" }, { status: 400 });
    }
  }

  if (type === "update") {
    const id = fd.get("id");
    const uAccess = fd.get("access") || "[]";
    
    await prisma.workflowUser.update({
      where: { id },
      data: { access: uAccess },
    });
    return { ok: true };
  }

  if (type === "delete") {
    const id = fd.get("id");
    
    // Prevent self-deletion
    const target = await prisma.workflowUser.findUnique({ where: { id } });
    if (target?.email === email) {
      return Response.json({ error: "You cannot delete yourself" }, { status: 400 });
    }

    await prisma.workflowUser.delete({ where: { id } });
    return { ok: true };
  }

  if (type === "logout") {
    const cookieStr = await wfCookie.serialize("", { maxAge: 0 });
    return redirect("/workflow", { headers: { "Set-Cookie": cookieStr } });
  }

  return { ok: false };
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function WorkflowUsers() {
  const { users, currentUser } = useLoaderData();
  const submit = useSubmit();

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAccess, setNewAccess] = useState([]);

  function toggleRole(role) {
    setNewAccess(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function handleCreate(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("type", "create");
    fd.append("name", newName);
    fd.append("email", newEmail);
    fd.append("access", JSON.stringify(newAccess));
    submit(fd, { method: "POST" });
    setNewName(""); setNewEmail(""); setNewAccess([]);
  }

  function handleRoleChange(user, role) {
    const hasRole = user.access.includes(role);
    const updated = hasRole 
      ? user.access.filter(r => r !== role) 
      : [...user.access, role];
      
    const fd = new FormData();
    fd.append("type", "update");
    fd.append("id", user.id);
    fd.append("access", JSON.stringify(updated));
    submit(fd, { method: "POST" });
  }

  function handleDelete(id) {
    if (!confirm("Are you sure you want to remove this user?")) return;
    const fd = new FormData();
    fd.append("type", "delete");
    fd.append("id", id);
    submit(fd, { method: "POST" });
  }

  function doLogout() {
    const fd = new FormData();
    fd.append("type", "logout");
    submit(fd, { method: "POST" });
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap"/>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

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
          {currentUser?.name && (
            <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontFamily:"'DM Sans',sans-serif"}}>
              {currentUser.name}
            </span>
          )}
          <Link to="/workflow/orders" className="hd-link">Orders Workflow</Link>
          {(currentUser?.access?.includes("inventory") || currentUser?.access?.includes("admin")) && (
            <Link to="/workflow/inventory" className="hd-link">Warehouse Inventory</Link>
          )}
          {currentUser?.access?.includes("admin") && (
            <Link to="/workflow/users" className="hd-link active">Manage Users</Link>
          )}
          <button className="hd-link" onClick={doLogout}>Sign Out</button>
        </div>
      </header>

      <main className="pg-main">
        <div className="section-title">Team Member Management</div>

        {/* Add User Card */}
        <div className="card">
          <div style={{fontSize:12, fontWeight:600, marginBottom:12, color:"var(--text-2)"}}>ADD NEW MEMBER</div>
          <form onSubmit={handleCreate} className="form-grid">
            <div>
              <label className="field-lbl">Name</label>
              <input className="field-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full Name"/>
            </div>
            <div>
              <label className="field-lbl">Email</label>
              <input className="field-input" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="email@example.com" required/>
            </div>
            <div>
              <button className="btn btn-primary" type="submit">Add Member</button>
            </div>
            <div style={{gridColumn:"1/-1", marginTop:8}}>
              <label className="field-lbl">Permissions</label>
              <div className="checkbox-group">
                {ROLES.map(r => (
                  <label key={r} className="checkbox-lbl">
                    <input type="checkbox" checked={newAccess.includes(r)} onChange={()=>toggleRole(r)}/>
                    {r[0].toUpperCase()+r.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="tbl-wrap">
          <table className="usr-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name || "—"}</td>
                  <td style={{fontFamily:"'DM Mono',monospace"}}>{u.email}</td>
                  <td>
                    <div className="checkbox-group">
                      {ROLES.map(r => (
                        <label key={r} className="checkbox-lbl">
                          <input type="checkbox" checked={u.access.includes(r)} onChange={()=>handleRoleChange(u, r)}/>
                          {r}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{fontSize:11, padding:"4px 8px"}} onClick={()=>handleDelete(u.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
