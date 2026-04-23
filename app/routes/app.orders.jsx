import { useLoaderData, useRouteError } from "react-router";
import { Page, Layout, Card, IndexTable, Text, Badge, BlockStack, Box, InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

const CSS = `
  .orders-container { padding-bottom: 40px; }
  .Polaris-IndexTable-Table { --pc-index-table-cell-padding: 16px 20px; }
  .Polaris-IndexTable__TableRow:hover { background-color: #fafafa !important; }
  .order-name { color: #B8782A; font-weight: 600; font-family: 'DM Mono', monospace; }
  .customer-name { color: #231F17; }
  .total-amount { font-weight: 500; }
  .date-cell { color: #6B6251; font-size: 13px; }
`;

export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(`
    query {
      orders(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id name createdAt displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName }
          }
        }
      }
    }
  `);
    const json = await response.json();
    const orders = json.data.orders.edges.map(e => e.node);
    return { orders };
};

export default function OrdersPage() {
    const { orders } = useLoaderData();

    const rowMarkup = orders.map(
        ({ id, name, createdAt, customer, totalPriceSet, displayFinancialStatus, displayFulfillmentStatus }, index) => (
            <IndexTable.Row id={id} key={id} position={index}>
                <IndexTable.Cell>
                    <span className="order-name">{name}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <span className="date-cell">{new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <span className="customer-name">{customer ? `${customer.firstName} ${customer.lastName}` : "Guest"}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <span className="total-amount">{totalPriceSet.shopMoney.amount} {totalPriceSet.shopMoney.currencyCode}</span>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone={displayFinancialStatus === 'PAID' ? 'success' : 'attention'}>
                        {displayFinancialStatus}
                    </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone={displayFulfillmentStatus === 'FULFILLED' ? 'success' : 'info'}>
                        {displayFulfillmentStatus}
                    </Badge>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page title="Orders Dashboard" fullWidth>
            <style>{CSS}</style>
            <div className="orders-container">
                <Layout>
                    <Layout.Section>
                        <Card padding="0">
                            <Box padding="400">
                                <BlockStack gap="200">
                                    <Text variant="headingLg" as="h2">Recent Store Orders</Text>
                                    <Text variant="bodySm" tone="subdued">Viewing your most recent 50 transactions</Text>
                                </BlockStack>
                            </Box>
                            <IndexTable
                                resourceName={{ singular: 'order', plural: 'orders' }}
                                itemCount={orders.length}
                                headings={[
                                    { title: 'Order' },
                                    { title: 'Date' },
                                    { title: 'Customer' },
                                    { title: 'Total' },
                                    { title: 'Payment' },
                                    { title: 'Fulfillment' },
                                ]}
                                selectable={false}
                            >
                                {rowMarkup}
                            </IndexTable>
                        </Card>
                    </Layout.Section>
                </Layout>
            </div>
        </Page>
    );
}

export function ErrorBoundary() {
    return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};
