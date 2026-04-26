import { Outlet, useLoaderData, useRouteError, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    search: url.search
  };
};

// Prevent this layout loader from re-running on every child route navigation.
// authenticate.admin() throws a Shopify 200 session-token response on each call
// which boundary.error() renders as just "200" on screen.
// Auth is validated on first load — no need to re-check on every link click.
export const shouldRevalidate = () => false;

export default function App() {
  const { apiKey, search } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <PolarisProvider i18n={enTranslations}>
        <NavMenu>
          <Link to={`/app${search}`} rel="home">Home</Link>
          <Link to={`/app/orders${search}`}>Orders</Link>
        </NavMenu>
        <Outlet />
      </PolarisProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
