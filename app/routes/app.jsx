import { Outlet, useLoaderData, useRouteError, Link, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    params: url.search // Keep the shop, host, etc.
  };
};

export default function App() {
  const { apiKey, params } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to={`/app${params}`} rel="home">Dashboard</Link>
        <Link to={`/app?tab=orders${params.replace("?", "&")}`}>Order Workflow</Link>
        <Link to={`/app?tab=products${params.replace("?", "&")}`}>Inventory</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
