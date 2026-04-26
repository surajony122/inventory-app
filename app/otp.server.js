// In-memory OTP store — valid 10 minutes per code
const store = new Map();

export function generateOtp(email) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  store.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000 });
  return code;
}

export function verifyOtp(email, code) {
  const rec = store.get(email.toLowerCase());
  if (!rec) return false;
  if (rec.expires < Date.now()) { store.delete(email.toLowerCase()); return false; }
  if (rec.code !== String(code).trim()) return false;
  store.delete(email.toLowerCase());
  return true;
}
