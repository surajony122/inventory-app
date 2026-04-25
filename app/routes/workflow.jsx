import { redirect, useLoaderData, useActionData } from "react-router";
import { wfCookie } from "../workflow.cookie.server";

const PIN_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F5F2EC;--surface:#FDFBF8;--border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);
  --text:#231F17;--text-2:#6B6251;--text-3:#A89F8E;
  --gold:#B8782A;--gold-bg:#FBF3E6;--gold-text:#7A4F18;--gold-border:rgba(184,120,42,0.25);
  --rose:#9A2A3A;--rose-bg:#F8E6E8;--rose-text:#661825;
  --r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.pin-wrap{width:100%;max-width:380px;padding:20px;}
.pin-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:36px 32px;box-shadow:var(--shadow-lg);text-align:center;}
.brand-mark{width:48px;height:48px;border:1.5px solid var(--border-md);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:var(--text);margin-bottom:4px;}
.brand-sub{font-size:12px;color:var(--text-3);margin-bottom:28px;}
.pin-label{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;text-align:left;}
.pin-input{width:100%;padding:12px 16px;border:1.5px solid var(--border-md);border-radius:var(--r-sm);background:var(--bg);font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:var(--text);text-align:center;letter-spacing:6px;outline:none;transition:border-color 0.15s;margin-bottom:16px;}
.pin-input:focus{border-color:var(--gold);}
.pin-btn{width:100%;padding:12px;border:none;border-radius:var(--r-sm);background:var(--text);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:opacity 0.15s;}
.pin-btn:hover{opacity:0.85;}
.pin-err{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.2);border-radius:var(--r-sm);padding:10px 14px;margin-top:14px;font-size:13px;color:var(--rose-text);}
.pin-footer{margin-top:20px;font-size:11px;color:var(--text-3);}
`;

export const loader = async ({ request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const val = await wfCookie.parse(cookieHeader);
  if (val === "authenticated") return redirect("/workflow/orders");
  return { error: null };
};

export const action = async ({ request }) => {
  const fd = await request.formData();
  const pin = fd.get("pin") || "";
  const correctPin = process.env.WORKFLOW_PIN || "1234";

  if (pin !== correctPin) {
    return { error: "Incorrect PIN. Please try again." };
  }

  const cookieHeader = await wfCookie.serialize("authenticated");
  return redirect("/workflow/orders", {
    headers: { "Set-Cookie": cookieHeader },
  });
};

export default function WorkflowPin() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const error = actionData?.error || loaderData?.error;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"/>
      <style dangerouslySetInnerHTML={{ __html: PIN_CSS }}/>

      <div className="pin-wrap">
        <div className="pin-card">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <circle cx="12" cy="8" r="4" stroke="#B8782A" strokeWidth="1.5"/>
              <path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#B8782A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-name">Unniyarcha</div>
          <div className="brand-sub">Team Workflow Access</div>

          <form method="post">
            <div className="pin-label">Enter PIN</div>
            <input
              className="pin-input"
              type="password"
              name="pin"
              maxLength={8}
              autoFocus
              placeholder="····"
              inputMode="numeric"
            />
            <button className="pin-btn" type="submit">Access Workflow</button>
          </form>

          {error && <div className="pin-err">{error}</div>}

          <div className="pin-footer">Contact your admin if you don't know the PIN</div>
        </div>
      </div>
    </>
  );
}
