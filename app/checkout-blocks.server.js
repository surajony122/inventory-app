import prisma from "./db.server";
import { unauthenticated } from "./shopify.server";
import { getShopCredentials } from "./shopify-admin.server";

const TYPE = "$app:checkout_block";
export const BLOCKS_ADMIN_EMAIL = (process.env.BLOCKS_ADMIN_EMAIL || "skpjony@gmail.com").toLowerCase();

// Only this one admin can open or change the checkout blocks page.
export function canManageBlocks(user) {
  return !!user && user.email?.toLowerCase() === BLOCKS_ADMIN_EMAIL && user.access.includes("admin");
}

async function getAdmin() {
  const creds = await getShopCredentials();
  if (!creds) throw new Error("No Shopify store found. Set SHOPIFY_STORE_URL or open the app in Shopify admin once.");
  const { admin } = await unauthenticated.admin(creds.shop);
  return admin;
}

async function gql(admin, query, variables) {
  const res = await admin.graphql(query, { variables });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

function fieldsFor(b) {
  return [
    { key: "kind",   value: b.kind },
    { key: "title",  value: b.title },
    { key: "body",   value: b.body || "" },
    { key: "code",   value: b.code || "" },
    { key: "active", value: b.active ? "true" : "false" },
    { key: "sort",   value: String(b.sort ?? 0) },
  ];
}

// Pushes one block to Shopify so the checkout extension can read it.
export async function publishBlock(block) {
  const admin = await getAdmin();
  const data = await gql(admin, `
    mutation($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        userErrors { field message }
      }
    }`, { handle: { type: TYPE, handle: block.id }, metaobject: { fields: fieldsFor(block) } });
  const errs = data.metaobjectUpsert.userErrors;
  if (errs.length) throw new Error(errs.map(e => e.message).join("; "));
}

export async function unpublishBlock(id) {
  const admin = await getAdmin();
  const found = await gql(admin, `
    query($handle: MetaobjectHandleInput!) { metaobjectByHandle(handle: $handle) { id } }`,
    { handle: { type: TYPE, handle: id } });
  const gid = found.metaobjectByHandle?.id;
  if (!gid) return;
  await gql(admin, `mutation($id: ID!) { metaobjectDelete(id: $id) { userErrors { message } } }`, { id: gid });
}

// Re-sends every block (used by the "Publish all" button).
export async function publishAll() {
  const blocks = await prisma.checkoutBlock.findMany();
  for (const b of blocks) await publishBlock(b);
  return blocks.length;
}
