import prisma from "./db.server";

export const ADMIN_API_VERSION = "2025-10";

// Offline access token + shop domain for background/team-portal calls.
// Prefers explicit env vars, then the offline session saved when the app was installed.
export async function getShopCredentials() {
  const envToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const envShop  = process.env.SHOPIFY_STORE_URL;
  if (envToken && envShop) return { accessToken: envToken, shop: envShop };

  const session = await prisma.session.findFirst({
    where:   { isOnline: false },
    orderBy: { expires: "desc" },
  });
  if (!session?.accessToken || !session?.shop) return null;
  return { accessToken: session.accessToken, shop: session.shop };
}
