import prisma from "./db.server";

export const DEFAULT_OCT = {
  title: "A small apology from Unniyarcha",
  body:
    "We are sorry for the delay on your October order. To thank you for your patience, a free gift will be sent along with your order. We truly appreciate you being with us.",
  fromDate: "2026-10-01",
  toDate: "2026-10-31",
  appliesTo: "all",
};

// First time only: create the October apology message so the page works straight away.
export async function seedNotices() {
  const n = await prisma.trackNotice.count();
  if (n === 0) await prisma.trackNotice.create({ data: { ...DEFAULT_OCT, active: true } });
}

const IST = 5.5 * 60 * 60 * 1000;
export function istDay(iso) {
  return new Date(new Date(iso).getTime() + IST).toISOString().slice(0, 10);
}

export async function noticesFor(orders) {
  await seedNotices();
  const list = await prisma.trackNotice.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  return (o, status) => {
    const day = istDay(o.createdAt);
    const hit = list.find((n) => day >= n.fromDate && day <= n.toDate && (n.appliesTo === "all" || status === "processing"));
    return hit ? { title: hit.title, body: hit.body } : null;
  };
}
