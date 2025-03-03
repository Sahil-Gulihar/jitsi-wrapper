// app/root.jsx
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

/**
 * Root layout component that provides the HTML structure for the entire application
 * and includes necessary meta tags, styles, and scripts
 */
export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <title>Jitsi Meet Wrapper</title>
        {/* Add Tailwind CDN for styling (in production, you'd want to include Tailwind properly) */}
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css"
          rel="stylesheet"
        />
        <style>
          {`
            html, body { height: 100%; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .conference-container { height: calc(100vh - 120px); }
          `}
        </style>
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
