import { createCookie } from "react-router";

export const wfCookie = createCookie("wf_auth", {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  // Signed so the email inside the cookie cannot be forged
  secrets: [process.env.SESSION_SECRET || process.env.SHOPIFY_API_SECRET || "dev-only-secret"],
});
