/**
 * Content-Security-Policy construction.
 *
 * Lives here rather than in next.config.ts because a nonce has to be generated
 * per request, and `headers()` in next.config.ts can only emit static values —
 * which is why the policy previously shipped `script-src 'self' 'unsafe-inline'`.
 * `'unsafe-inline'` in script-src cancels essentially all of CSP's XSS value,
 * which is the one control that would contain an injection bug in an app holding
 * PHI.
 *
 * Next.js reads the CSP header the proxy sets and stamps the same nonce onto the
 * scripts it injects, so its own bootstrap keeps working under a strict policy.
 * `'strict-dynamic'` lets those trusted scripts load their chunks.
 */

export interface CspOptions {
  nonce: string
  isDev: boolean
}

export function buildCsp({ nonce, isDev }: CspOptions): string {
  const directives = [
    "default-src 'self'",

    // 'strict-dynamic' makes browsers that understand nonces ignore the
    // host-list fallbacks; 'self' is kept for older ones.
    // React dev mode needs eval() for Fast Refresh and callstack reconstruction;
    // production never uses eval.
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,

    // Styles keep 'unsafe-inline': Tailwind and the Radix/shadcn primitives emit
    // inline style attributes, and there is no XSS-equivalent escalation from
    // style injection here. Nonces do not apply to style ATTRIBUTES anyway, so a
    // nonce-only style-src would break the UI without a security gain.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Narrowed from `https:`, which allowed exfiltration to any host via an
    // image beacon. blob:/data: are needed for generated QR/chart/PDF previews;
    // the Supabase host serves organization-assets (logos).
    "img-src 'self' data: blob: https://*.supabase.co",

    "font-src 'self' data: https://fonts.gstatic.com",

    isDev
      ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.squareup.com https://connect.squareup.com https://*.resend.com http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*"
      : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.squareup.com https://connect.squareup.com https://*.resend.com",

    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Belt-and-braces with the proxy's HTTP->HTTPS redirect: any subresource
    // that slips through as http:// is upgraded rather than blocked.
    'upgrade-insecure-requests',
  ]

  return directives.join('; ')
}
