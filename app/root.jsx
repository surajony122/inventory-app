import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteError, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" },
];

export default function App() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          .global-loader {
            position: fixed; top: 0; left: 0; right: 0; height: 3px;
            background: #2A5F9A; z-index: 99999;
            transform-origin: 0% 50%;
            animation: loaderAnim 2s infinite ease-in-out;
          }
          @keyframes loaderAnim {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); opacity: 0; }
          }
        `}</style>
      </head>
      <body>
        {isLoading && <div className="global-loader" />}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Security Handshake for Shopify
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
