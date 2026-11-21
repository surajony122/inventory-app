import prisma from "./db.server";

export const DEFAULT_OCT = {
  title: "A small apology from Unniyarcha",
  body:
    "Apologies for the delay. Your order is getting our full attention, and tracking will appear here as soon as it ships. Thank you for your patience and trust.",
  fromDate: "2026-10-01",
  toDate: "2026-10-31",
  appliesTo: "all",
};

// First time only: create the October apology message so the page works straight away.
export async function seedNotices() {
  // one-time wording change: replace the first draft (free gift / October) with the chosen text
  await prisma.trackNotice.updateMany({
    where: { title: "A small apology from Unniyarcha", body: { contains: "free gift" } },
    data: { body: DEFAULT_OCT.body },
  });
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
    if (status === "cancelled") return null;
    const day = istDay(o.createdAt);
    const hit = list.find((n) => day >= n.fromDate && day <= n.toDate && (n.appliesTo === "all" || status === "processing"));
    return hit ? { title: hit.title, body: hit.body } : null;
  };
}
