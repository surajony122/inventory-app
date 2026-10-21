import { randomInt } from "crypto";

// In-memory OTP store — valid 10 minutes per code, 5 wrong tries max
const store = new Map();

export function generateOtp(email) {
  const code = String(randomInt(1000, 10000));
  store.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000, tries: 0 });
  return code;
}

export function verifyOtp(email, code) {
  const key = email.toLowerCase();
  const rec = store.get(key);
  if (!rec) return false;
  if (rec.expires < Date.now() || rec.tries >= 5) { store.delete(key); return false; }
  if (rec.code !== String(code).trim()) { rec.tries += 1; return false; }
  store.delete(key);
  return true;
}
