import { useLoaderData, useRouteError } from "react-router";
import { Page, Layout, Card, IndexTable, Text, Badge, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`
    query {
      orders(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              firstName
              lastName
            }
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

    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const rowMarkup = orders.map(
        (
            { id, name, createdAt, customer, totalPriceSet, displayFinancialStatus, displayFulfillmentStatus },
            index,
        ) => (
            <IndexTable.Row id={id} key={id} position={index}>
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {name}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{new Date(createdAt).toLocaleDateString()}</IndexTable.Cell>
                <IndexTable.Cell>{customer ? `${customer.firstName} ${customer.lastName}` : "No customer"}</IndexTable.Cell>
                <IndexTable.Cell>
                    {totalPriceSet.shopMoney.amount} {totalPriceSet.shopMoney.currencyCode}
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
        <Page title="All Orders" fullWidth>
            <Layout>
                <Layout.Section>
                    <Card padding="0">
                        <IndexTable
                            resourceName={resourceName}
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
        </Page>
    );
}

export function ErrorBoundary() {
    return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};
