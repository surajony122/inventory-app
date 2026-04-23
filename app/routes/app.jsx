import { Outlet, useLoaderData, useRouteError, Link, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useMemo } from "react";

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
  const location = useLocation();

  // Ensure search params are persisted if they exist in current URL but not in params
  const searchParams = useMemo(() => {
    const current = new URLSearchParams(location.search);
    const fromLoader = new URLSearchParams(params);

    // Explicitly keep important Shopify params
    const shop = current.get("shop") || fromLoader.get("shop");
    const host = current.get("host") || fromLoader.get("host");

    const next = new URLSearchParams();
    if (shop) next.set("shop", shop);
    if (host) next.set("host", host);

    const str = next.toString();
    return str ? `?${str}` : "";
  }, [location.search, params]);

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to={`/app${searchParams}`} rel="home">Dashboard</Link>
        <Link to={`/app/orders${searchParams}`}>Order Flow</Link>
        <Link to={`/app/inventory${searchParams}`}>Inventory</Link>
      </NavMenu>

      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">U</div>
            <span className="brand-text">Unnicharya</span>
          </div>

          <nav className="sidebar-nav">
            <Link to={`/app${searchParams}`} className={`nav-item ${location.pathname === "/app" ? "active" : ""}`}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              <span>Dashboard</span>
            </Link>

            <Link to={`/app/orders${searchParams}`} className={`nav-item ${location.pathname.startsWith("/app/orders") ? "active" : ""}`}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
              <span>Order Flow</span>
            </Link>

            <Link to={`/app/inventory${searchParams}`} className={`nav-item ${location.pathname.startsWith("/app/inventory") ? "active" : ""}`}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
              <span>Inventory</span>
            </Link>
          </nav>

          <div className="sidebar-footer">
            <div className="status-dot"></div>
            <span>System Active</span>
          </div>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          background: #F5F2EC;
        }
        .app-sidebar {
          width: 240px;
          background: #231F17;
          color: white;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 1000;
          box-shadow: 4px 0 15px rgba(0,0,0,0.1);
        }
        .sidebar-brand {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .brand-logo {
          width: 32px;
          height: 32px;
          background: #B8782A;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
        }
        .brand-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .sidebar-nav {
          padding: 20px 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .nav-item.active {
          background: #B8782A;
          color: white;
          box-shadow: 0 4px 12px rgba(184,120,42,0.3);
        }
        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #2A7A6A;
          border-radius: 50%;
          box-shadow: 0 0 8px #2A7A6A;
        }
        .app-main {
          flex: 1;
          overflow-x: hidden;
        }
        /* Mobile adjustment */
        @media (max-width: 768px) {
          .app-sidebar { width: 68px; }
          .brand-text, .nav-item span, .sidebar-footer span { display: none; }
          .nav-item { justify-content: center; padding: 12px 0; }
          .sidebar-brand { justify-content: center; padding: 20px 0; }
        }
      `}</style>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
