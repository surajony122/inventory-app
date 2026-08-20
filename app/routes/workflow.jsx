import { Outlet, redirect, useActionData } from "react-router";
import { wfCookie } from "../workflow.cookie.server";
import { findWorkflowUser } from "../workflow.users.server";
import { generateOtp, verifyOtp } from "../otp.server";
import { loadEnv } from "../env.server";

// POST to /workflow is routed here (parent layout) not to the index child
export const action = async ({ request }) => {
  loadEnv();
  const fd   = await request.formData();
  const step = fd.get("step") || "email";

  if (step === "email") {
    const email = (fd.get("email") || "").trim().toLowerCase();
    if (!email) return { step: "email", error: "Please enter your email address." };

    const user = await findWorkflowUser(email);
    if (!user) return { step: "email", error: "This email is not authorized. Contact your admin." };

    const code = generateOtp(email);

    const appsScriptUrl = process.env.APPS_SCRIPT_EMAIL_URL || "https://script.google.com/macros/s/AKfycbw11sUmCSP9UouT4bKeSQoGrpZPdLnWYa1WG7a6LsDTCadUfiK7l3xM8aa8cIj8zXz9_Q/exec";

    try {
      const res = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: email,
          user_name: user.name || "User",
          otp_code: code,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Apps Script " + res.status);
      }
    } catch (err) {
      console.error("[OTP] Send failed:", err.message);
      return { step: "email", error: "Failed to send OTP. Check server logs." };
    }

    return { step: "otp", email, message: `A 4-digit OTP was sent to ${email}` };
  }

  if (step === "otp") {
    const email = (fd.get("email") || "").trim().toLowerCase();
    const code  = (fd.get("code")  || "").trim();

    if (!email) return { step: "email", error: "Session lost. Please enter your email again." };
    if (!code)  return { step: "otp",   email, error: "Please enter the OTP from your email." };

    if (!verifyOtp(email, code)) {
      return { step: "otp", email, error: "Incorrect or expired OTP. Please try again." };
    }

    const cookieHeader = await wfCookie.serialize(email);
    return redirect("/workflow/orders", { headers: { "Set-Cookie": cookieHeader } });
  }

  return { step: "email", error: "Unknown step." };
};

export default function WorkflowLayout() {
  const actionData = useActionData();
  return <Outlet context={actionData} />;
}
