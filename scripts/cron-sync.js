import https from "https";

const secret   = process.env.CRON_SECRET || "";
const hostname = "unnicharya-app.onrender.com";

if (!secret) {
  console.error("[cron-sync] CRON_SECRET env var is not set");
  process.exit(1);
}

console.log(`[cron-sync] Triggering order sync on ${hostname}...`);

const req = https.request(
  {
    hostname,
    path:   "/api/cron/sync",
    method: "POST",
    headers: {
      "x-cron-secret":  secret,
      "content-length": "0",
    },
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => {
      console.log(`[cron-sync] Status: ${res.statusCode}`);
      console.log(`[cron-sync] Response: ${body}`);
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  }
);

req.on("error", (err) => {
  console.error("[cron-sync] Request failed:", err.message);
  process.exit(1);
});

req.end();
