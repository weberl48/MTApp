import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trailing slashes help with routing consistency
  trailingSlash: true,

  // Security headers for HIPAA compliance
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // React dev mode needs eval() for debugging features (callstack
              // reconstruction, Fast Refresh); production never uses eval and
              // keeps the strict policy.
              process.env.NODE_ENV === "development"
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              // The local Supabase stack (scripts/local-env) serves auth and REST
              // from http://127.0.0.1:54321, which the production allow-list does
              // not cover. Without this every local sign-in is blocked by CSP, and
              // because the fetch never reaches the server it surfaces as the
              // paused-project "Server unavailable" banner rather than a CSP error.
              // Loopback only, development only — production keeps the strict list.
              process.env.NODE_ENV === "development"
                ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.squareup.com https://connect.squareup.com https://*.resend.com capacitor://localhost http://localhost http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*"
                : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.squareup.com https://connect.squareup.com https://*.resend.com capacitor://localhost http://localhost",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      // Invoice PDFs are previewed in a same-origin <iframe> on the invoice
      // detail page. The global DENY / frame-ancestors 'none' would block
      // that, so this endpoint (and only this endpoint) allows same-origin
      // framing. Everything else keeps the strict global policy.
      ...["/api/invoices/:id/pdf", "/api/invoices/:id/pdf/"].map((source) => ({
        source,
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      })),
    ];
  },
};

export default nextConfig;
