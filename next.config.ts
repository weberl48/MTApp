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
          // NOTE: the document Content-Security-Policy is NOT set here.
          //
          // It needs a per-request nonce so that `script-src` can drop
          // 'unsafe-inline' (which otherwise cancels most of CSP's XSS value),
          // and headers() can only emit static values. The policy is built in
          // src/lib/security/csp.ts and applied by src/proxy.ts.
          //
          // API responses get no CSP from the proxy, so they rely on the
          // X-Frame-Options / nosniff headers above plus the per-route
          // exception below.
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
