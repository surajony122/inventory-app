import { redirect, useLoaderData, useActionData, useNavigation } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
import { generateOtp, verifyOtp } from "../otp.server";

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F5F2EC;--surface:#FDFBF8;--border:rgba(60,45,20,0.09);--border-md:rgba(60,45,20,0.15);
  --text:#231F17;--text-2:#6B6251;--text-3:#A89F8E;
  --gold:#B8782A;--gold-bg:#FBF3E6;--gold-text:#7A4F18;--gold-border:rgba(184,120,42,0.25);
  --rose:#9A2A3A;--rose-bg:#F8E6E8;--rose-text:#661825;
  --teal:#2A7A6A;--teal-bg:#E6F5F2;--teal-text:#185448;
  --r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:20px;
  --shadow-lg:0 16px 40px rgba(60,45,20,0.13),0 4px 8px rgba(60,45,20,0.07);
}
html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:14px;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.wrap{width:100%;max-width:400px;padding:20px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:36px 32px;box-shadow:var(--shadow-lg);text-align:center;}
.brand-mark{width:48px;height:48px;border:1.5px solid var(--border-md);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:var(--text);margin-bottom:4px;}
.brand-sub{font-size:12px;color:var(--text-3);margin-bottom:28px;}
.step-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px;}
.step-desc{font-size:12px;color:var(--text-2);margin-bottom:24px;line-height:1.5;}
.field-lbl{font-size:11px;font-weight:500;color:var(--text-2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;text-align:left;display:block;}
.field-input{width:100%;padding:11px 14px;border:1.5px solid var(--border-md);border-radius:var(--r-sm);background:var(--bg);font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);outline:none;transition:border-color 0.15s;margin-bottom:14px;}
.field-input:focus{border-color:var(--gold);}
.otp-input{font-family:'DM Mono',monospace;font-size:22px;font-weight:500;text-align:center;letter-spacing:8px;}
.submit-btn{width:100%;padding:12px;border:none;border-radius:var(--r-sm);background:var(--text);color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:opacity 0.15s;}
.submit-btn:hover:not(:disabled){opacity:0.85;}
.submit-btn:disabled{opacity:0.5;cursor:not-allowed;}
.back-link{display:inline-block;margin-top:14px;font-size:12px;color:var(--text-3);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline;}
.back-link:hover{color:var(--text-2);}
.msg-ok{background:var(--teal-bg);border:1px solid rgba(42,122,106,0.2);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:16px;font-size:13px;color:var(--teal-text);text-align:left;}
.msg-err{background:var(--rose-bg);border:1px solid rgba(154,42,58,0.2);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:16px;font-size:13px;color:var(--rose-text);text-align:left;}
.footer{margin-top:20px;font-size:11px;color:var(--text-3);}
.email-pill{display:inline-block;background:var(--gold-bg);border:1px solid var(--gold-border);color:var(--gold-text);font-family:'DM Mono',monospace;font-size:12px;padding:3px 10px;border-radius:20px;margin-bottom:4px;}
`;

export const loader = async ({ request }) => {
  const email = await wfCookie.parse(request.headers.get("Cookie"));
  if (email && findWorkflowUser(email)) return redirect("/workflow/orders");
  return {};
};

export const action = async ({ request }) => {
  const fd = await request.formData();
  const step = fd.get("step") || "email";

  if (step === "email") {
    const email = (fd.get("email") || "").trim().toLowerCase();
    if (!email) return { step: "email", error: "Please enter your email address." };

    const user = findWorkflowUser(email);
    if (!user) return { step: "email", error: "This email is not authorized. Contact your admin." };

    const code = generateOtp(email);

    const serviceId  = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey) {
      // Dev fallback: log OTP to console
      console.log(`[OTP] Code for ${email}: ${code}`);
      return { step: "otp", email, message: `OTP sent to ${email} (check server logs in dev mode).` };
    }

    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id:  serviceId,
          template_id: templateId,
          user_id:     publicKey,
          accessToken: privateKey,
          template_params: {
            to_email:  email,
            user_name: user.name || "User",
            otp_code:  code,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[OTP] EmailJS error:", body);
        throw new Error("EmailJS responded with " + res.status);
      }
    } catch (err) {
      console.error("[OTP] Send failed:", err.message);
      return { step: "email", error: "Failed to send OTP. Check EmailJS configuration in Render env vars." };
    }

    return { step: "otp", email, message: `A 4-digit OTP was sent to ${email}` };
  }

  if (step === "otp") {
    const email = (fd.get("email") || "").trim().toLowerCase();
    const code  = (fd.get("code") || "").trim();

    if (!email) return { step: "email", error: "Session lost. Please enter your email again." };
    if (!code)  return { step: "otp", email, error: "Please enter the OTP from your email." };

    if (!verifyOtp(email, code)) {
      return { step: "otp", email, error: "Incorrect or expired OTP. Please try again." };
    }

    const cookieHeader = await wfCookie.serialize(email);
    return redirect("/workflow/orders", { headers: { "Set-Cookie": cookieHeader } });
  }

  return { step: "email", error: "Unknown step." };
};

export default function WorkflowLogin() {
  const actionData  = useActionData();
  const navigation  = useNavigation();
  const isLoading   = navigation.state === "submitting";

  const step  = actionData?.step  || "email";
  const error = actionData?.error || null;
  const msg   = actionData?.message || null;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"/>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      <div className="wrap">
        <div className="card">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <circle cx="12" cy="8" r="4" stroke="#B8782A" strokeWidth="1.5"/>
              <path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="#B8782A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-name">Unniyarcha</div>
          <div className="brand-sub">Team Workflow</div>

          {step === "email" ? (
            <>
              <div className="step-title">Sign in to continue</div>
              <div className="step-desc">Enter your work email. We'll send you a one-time code.</div>

              {error && <div className="msg-err">{error}</div>}

              <form method="post">
                <input type="hidden" name="step" value="email"/>
                <label className="field-lbl">Email address</label>
                <input
                  className="field-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                  required
                />
                <button className="submit-btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Sending OTP…" : "Send OTP →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="step-title">Enter your OTP</div>
              <div className="step-desc">
                <span className="email-pill">{actionData?.email}</span>
                <br/>Check your inbox for a 4-digit code. It expires in 10 minutes.
              </div>

              {msg   && <div className="msg-ok">{msg}</div>}
              {error && <div className="msg-err">{error}</div>}

              <form method="post">
                <input type="hidden" name="step" value="otp"/>
                <input type="hidden" name="email" value={actionData?.email}/>
                <label className="field-lbl">One-time code</label>
                <input
                  className="field-input otp-input"
                  type="text"
                  name="code"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="····"
                  autoFocus
                  autoComplete="one-time-code"
                  required
                />
                <button className="submit-btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Verifying…" : "Verify & Sign In"}
                </button>
              </form>

              <form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="step" value="email"/>
                <button type="submit" className="back-link">← Use a different email</button>
              </form>
            </>
          )}

          <div className="footer">Contact your admin if you don't have access</div>
        </div>
      </div>
    </>
  );
}
