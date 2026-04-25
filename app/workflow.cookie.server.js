import { createCookie } from "react-router";

export const wfCookie = createCookie("wf_auth", {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: true,
  sameSite: "lax",
  secrets: ["wf-secret-2025"],
});
