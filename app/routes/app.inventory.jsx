import { useLoaderData, useSubmit, useNavigation, useRouteError, Form } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  Page, Layout, Card, IndexTable, Badge, Text, Box, TextField,
  Thumbnail, InlineStack, Button, BlockStack, Divider, Tabs, Pagination
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useMemo } from "react";

// ── helpers ───────────────────────────────────────────────────────────────────
function stockTone(qty) {
  if (qty <= 0) return "critical";
  if (qty <= 5) return "warning";
  return "success";
}
function stockLabel(qty) {
  if (qty <= 0) return "Out of Stock";
  if (qty <= 5) return "Low Stock";
  return "In Stock";
}

function exportCSV(variants) {
  const header = ["Product", "Variant", "SKU", "Shopify Qty", "Warehouse Qty", "Bin Location", "Notes"];
  const rows = variants.map(v =>
    [v.pTitle, v.vTitle, v.sku || "", v.shopifyQty, v.whQty, v.bin, (v.note || "").replace(/,/g, " ")]
      .map(c => `"${c}"`).join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "warehouse-inventory.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── loader ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const direction = url.searchParams.get("direction"); // "next" or "prev"
  let query = url.searchParams.get("q") || "";

  // Append Shopify query filter based on tab if needed, but for now we just use the raw search
  let shopifyQuery = query;

  let first = 50, last = null, after = null, before = null;
  if (direction === "prev" && cursor) {
    first = null;
    last = 50;
    before = cursor;
  } else if (direction === "next" && cursor) {
    after = cursor;
  }

  const resp = await admin.graphql(`
    query($first: Int, $last: Int, $after: String, $before: String, $query: String) {
      products(first: $first, last: $last, after: $after, before: $before, query: $query) {
        pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
        edges { node {
          id title handle
          featuredImage { url }
          variants(first: 10) {
            edges { node { id title sku inventoryQuantity } }
          }
        }}
      }
    }
  `, {
    variables: {
      first, last, after, before,
      query: shopifyQuery ? `*${shopifyQuery}*` : null
    }
  });

  const json = await resp.json();
  const page = json.data?.products;
  const products = page?.edges?.map(e => e.node) || [];
  const pageInfo = page?.pageInfo || { hasNextPage: false, hasPreviousPage: false };

  const localInventory = await prisma.inventory.findMany();
  return { products, localInventory, pageInfo, q: query };
};

// ── action ────────────────────────────────────────────────────────────────────
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const fd = await request.formData();
  const actionType = fd.get("actionType");

  if (actionType === "updateStock") {
    const variantId = fd.get("variantId");
    const quantity = parseInt(fd.get("quantity") || "0", 10);
    const binLocation = fd.get("binLocation") || "";
    const notes = fd.get("notes") || "";
    const sku = fd.get("sku") || "";
    await prisma.inventory.upsert({
      where: { id: variantId },
      update: { quantity, binLocation, notes, sku },
      create: { id: variantId, quantity, binLocation, notes, sku },
    });
    return { success: true };
  }

  if (actionType === "bulkSave") {
    const updates = JSON.parse(fd.get("updates") || "[]");
    for (const u of updates) {
      await prisma.inventory.upsert({
        where: { id: u.variantId },
        update: { quantity: u.quantity, binLocation: u.bin, notes: u.note, sku: u.sku },
        create: { id: u.variantId, quantity: u.quantity, binLocation: u.bin, notes: u.note, sku: u.sku },
      });
    }
    return { success: true, saved: updates.length };
  }

  return { success: false };
};

// ── filter tabs ────────────────────────────────────────────────────────────────
const FILTER_TABS = ["All", "Low Stock", "Out of Stock"];

// ── component ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { products, localInventory, pageInfo, q } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [query, setQuery] = useState(q);
  const [tabIndex, setTabIndex] = useState(0);
  const [edits, setEdits] = useState({});

  // Flatten variants
  const variants = useMemo(() => {
    const list = [];
    products.forEach(p => {
      p.variants.edges.forEach(({ node: v }) => {
        const local = localInventory.find(l => l.id === v.id);
        list.push({
          pId: p.id, pTitle: p.title, img: p.featuredImage?.url || null,
          id: v.id, vTitle: v.title, sku: v.sku || "",
          shopifyQty: v.inventoryQuantity ?? 0,
          whQty: local?.quantity ?? 0,
          bin: local?.binLocation ?? "",
          note: local?.notes ?? "",
        });
      });
    });
    return list;
  }, [products, localInventory]);

  // Client-side filtering ONLY for tabs, since search is server-side
  const filtered = useMemo(() => {
    return variants.filter(v => {
      const filter = FILTER_TABS[tabIndex];
      if (filter === "Low Stock") return (v.shopifyQty > 0 && v.shopifyQty <= 5);
      if (filter === "Out of Stock") return v.shopifyQty <= 0;
      return true;
    });
  }, [variants, tabIndex]);

  const editedCount = Object.keys(edits).length;

  const setField = (id, field, value) =>
    setEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || variants.find(v => v.id === id)), [field]: value },
    }));

  const saveSingle = (id) => {
    const data = edits[id] || variants.find(v => v.id === id);
    const fd = new FormData();
    fd.append("actionType", "updateStock");
    fd.append("variantId", id);
    fd.append("quantity", data.whQty);
    fd.append("binLocation", data.bin);
    fd.append("notes", data.note);
    fd.append("sku", data.sku);
    submit(fd, { method: "POST" });
    setEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveAll = () => {
    const updates = Object.entries(edits).map(([variantId, data]) => ({
      variantId,
      quantity: parseInt(data.whQty) || 0,
      bin: data.bin || "",
      note: data.note || "",
      sku: data.sku || "",
    }));
    const fd = new FormData();
    fd.append("actionType", "bulkSave");
    fd.append("updates", JSON.stringify(updates));
    submit(fd, { method: "POST" });
    setEdits({});
  };

  const tabs = [
    { id: "all", content: `All (${variants.length})`, panelID: "panel-all" },
    { id: "low", content: `Low Stock (${variants.filter(v => v.shopifyQty > 0 && v.shopifyQty <= 5).length})`, panelID: "panel-low" },
    { id: "out", content: `Out of Stock (${variants.filter(v => v.shopifyQty <= 0).length})`, panelID: "panel-out" },
  ];

  const rowMarkup = filtered.map((item, index) => {
    const data = edits[item.id] || item;
    const changed = !!edits[item.id];

    return (
      <IndexTable.Row id={item.id} key={item.id} position={index}>
        <IndexTable.Cell>
          <InlineStack gap="200" blockAlign="center">
            {item.img
              ? <Thumbnail source={item.img} alt={item.pTitle} size="small" />
              : <Box minWidth="32px" minHeight="32px" background="bg-surface-secondary" borderRadius="100" />
            }
            <BlockStack gap="0">
              <Text variant="bodyMd" fontWeight="bold" as="span">{item.pTitle}</Text>
              {item.vTitle !== "Default Title" && (
                <Text variant="bodySm" tone="subdued" as="span">{item.vTitle}</Text>
              )}
            </BlockStack>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" as="span">{item.sku || "—"}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={stockTone(item.shopifyQty)}>
            {item.shopifyQty} · {stockLabel(item.shopifyQty)}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ width: 80 }}>
            <TextField
              type="number"
              value={String(data.whQty)}
              onChange={val => setField(item.id, "whQty", val)}
              autoComplete="off"
              labelHidden
              label="Wh Qty"
            />
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ minWidth: 100 }}>
            <TextField
              value={data.bin}
              onChange={val => setField(item.id, "bin", val)}
              placeholder="e.g. A-12"
              autoComplete="off"
              labelHidden
              label="Bin"
            />
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <TextField
            value={data.note}
            onChange={val => setField(item.id, "note", val)}
            placeholder="Add note…"
            autoComplete="off"
            labelHidden
            label="Notes"
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button
            variant="primary"
            size="slim"
            disabled={!changed}
            loading={isLoading && changed}
            onClick={() => saveSingle(item.id)}
          >
            Save
          </Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page
      title="Warehouse Inventory"
      subtitle={`Showing page of ${variants.length} variants across ${products.length} products`}
      primaryAction={
        editedCount > 0
          ? { content: `Save All (${editedCount})`, onAction: saveAll, loading: isLoading }
          : { content: "Export Page CSV", onAction: () => exportCSV(filtered) }
      }
      secondaryActions={
        editedCount > 0
          ? [{ content: "Export Page CSV", onAction: () => exportCSV(filtered) }]
          : []
      }
    >
      <Layout>
        <Layout.Section>
          {/* Stats row */}
          <InlineStack gap="400" wrap={false}>
            {[
              { label: "Total Variants", value: variants.length, tone: undefined },
              { label: "Low Stock", value: variants.filter(v => v.shopifyQty > 0 && v.shopifyQty <= 5).length, tone: "warning" },
              { label: "Out of Stock", value: variants.filter(v => v.shopifyQty <= 0).length, tone: "critical" },
              { label: "Unsaved Edits", value: editedCount, tone: editedCount > 0 ? "attention" : undefined },
            ].map(({ label, value, tone }) => (
              <Card key={label}>
                <BlockStack gap="100">
                  <Text variant="bodySm" tone="subdued" as="p">{label}</Text>
                  <Text variant="heading2xl" tone={tone} as="p">{value}</Text>
                </BlockStack>
              </Card>
            ))}
          </InlineStack>

          <Box paddingBlockStart="400">
            <Card padding="0">
              <Box padding="400">
                <InlineStack gap="300" align="space-between">
                  <div style={{ flex: 1 }}>
                    <Form method="get" style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <TextField
                          name="q"
                          label="Search"
                          value={query}
                          onChange={setQuery}
                          placeholder="Search entire catalog..."
                          labelHidden
                          autoComplete="off"
                          clearButton
                          onClearButtonClick={() => { setQuery(""); submit(new FormData(), { method: "get" }); }}
                        />
                      </div>
                      <Button submit loading={isLoading}>Search</Button>
                    </Form>
                  </div>
                  {editedCount > 0 && (
                    <Button variant="primary" onClick={saveAll} loading={isLoading}>
                      Save All ({editedCount})
                    </Button>
                  )}
                </InlineStack>
              </Box>

              <Divider />

              <Tabs tabs={tabs} selected={tabIndex} onSelect={setTabIndex} fitted />

              <IndexTable
                resourceName={{ singular: "variant", plural: "variants" }}
                itemCount={filtered.length}
                selectable={false}
                emptyState={
                  <Box padding="600">
                    <Text alignment="center" tone="subdued">No variants match your filter.</Text>
                  </Box>
                }
                headings={[
                  { title: "Product" },
                  { title: "SKU" },
                  { title: "Shopify Stock" },
                  { title: "Warehouse Qty" },
                  { title: "Bin Location" },
                  { title: "Notes" },
                  { title: "Actions" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
              <Box padding="400">
                <InlineStack align="center">
                  <Pagination
                    hasPrevious={pageInfo.hasPreviousPage}
                    onPrevious={() => {
                      const fd = new FormData();
                      fd.append("direction", "prev");
                      fd.append("cursor", pageInfo.startCursor);
                      if (q) fd.append("q", q);
                      submit(fd, { method: "get" });
                    }}
                    hasNext={pageInfo.hasNextPage}
                    onNext={() => {
                      const fd = new FormData();
                      fd.append("direction", "next");
                      fd.append("cursor", pageInfo.endCursor);
                      if (q) fd.append("q", q);
                      submit(fd, { method: "get" });
                    }}
                  />
                </InlineStack>
              </Box>
            </Card>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
