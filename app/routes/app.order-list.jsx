import { useLoaderData, useSubmit, Link, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useMemo } from "react";

// ── LOADER ────────────────────────────────────────────────────────────────────
export const loader = async ({ request }) => {
    const { admin } = await authenticate.admin(request);

    let rawOrders = [];
    try {
        const resp = await admin.graphql(`
      query {
        orders(first: 250, sortKey: CREATED_AT, reverse: true) {
          edges { node {
            id name createdAt displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { firstName lastName email }
            lineItems(first: 5) { edges { node { title quantity } } }
          }}
        }
      }
    `);
        const json = await resp.json();
        rawOrders = json.data?.orders?.edges?.map(e => e.node) || [];
    } catch (err) {
        console.error("Order List Loader Error:", err);
    }

    const orderIds = rawOrders.map(o => o.id);
    const localStates = orderIds.length
        ? await prisma.orderWorkflow.findMany({ where: { id: { in: orderIds } } })
        : [];

    const orders = rawOrders.map(o => {
        const state = localStates.find(s => s.id === o.id);
        return {
            shopifyId: o.id,
            id: o.name,
            customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : "Guest",
            total: `${o.totalPriceSet?.shopMoney?.amount} ${o.totalPriceSet?.shopMoney?.currencyCode}`,
            date: new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
            payment: o.displayFinancialStatus,
            fulfillment: o.displayFulfillmentStatus,
            workflowStatus: state?.status || "Awaiting Inventory Check",
            itemsCount: o.lineItems.edges.reduce((sum, li) => sum + li.node.quantity, 0)
        };
    });

    return { orders, params: new URL(request.url).search };
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function OrderListPage() {
    const { orders } = useLoaderData();
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return orders.filter(o =>
            o.id.toLowerCase().includes(q) ||
            o.customer.toLowerCase().includes(q)
        );
    }, [orders, search]);

    return (
        <div className="order-list-page">
            <header className="page-header">
                <h1 className="page-title">Master Order List</h1>
                <div className="search-box">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    <input
                        type="text"
                        placeholder="Search by order # or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="content">
                <div className="table-card">
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Workflow Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(o => (
                                <tr key={o.shopifyId}>
                                    <td className="order-name">{o.id}</td>
                                    <td className="order-date">{o.date}</td>
                                    <td>{o.customer}</td>
                                    <td>{o.itemsCount} units</td>
                                    <td className="order-total">{o.total}</td>
                                    <td>
                                        <span className={`badge ${o.payment === 'PAID' ? 'b-success' : 'b-warn'}`}>
                                            {o.payment}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="workflow-tag">{o.workflowStatus}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="empty-state">No orders found matching your search.</div>
                    )}
                </div>
            </main>

            <style>{`
        .order-list-page { padding: 40px; }
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
        .page-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; color: #231F17; }
        
        .search-box { 
          display: flex; align-items: center; gap: 10px; background: white; 
          padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); 
          box-shadow: 0 2px 4px rgba(0,0,0,0.02); flex: 1; max-width: 400px;
        }
        .search-box input { border: none; outline: none; width: 100%; font-size: 14px; background: transparent; }
        .search-box svg { color: #A89F8E; }

        .table-card { background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; }
        .order-table { width: 100%; border-collapse: collapse; }
        .order-table th { text-align: left; padding: 16px 24px; background: #FDFBF8; border-bottom: 1px solid #F0EDE6; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A89F8E; }
        .order-table td { padding: 18px 24px; border-bottom: 1px solid #F0EDE6; font-size: 14px; color: #231F17; }
        .order-table tr:hover { background: #FDFBF8; }

        .order-name { font-weight: 600; color: #B8782A; }
        .order-date { color: #6B6251; font-size: 13px; }
        .order-total { font-family: 'DM Mono', monospace; font-weight: 500; }

        .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .b-success { background: #E6F5F2; color: #185448; }
        .b-warn { background: #FBF3E6; color: #7A4F18; }
        
        .workflow-tag { 
          display: inline-block; padding: 4px 10px; background: #F0EDE6; 
          color: #6B6251; border-radius: 6px; font-size: 12px; font-weight: 500;
        }

        .empty-state { padding: 60px; text-align: center; color: #A89F8E; font-size: 16px; }
      `}</style>
        </div>
    );
}

export function ErrorBoundary() {
    return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};
