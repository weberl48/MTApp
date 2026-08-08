import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit'
import { buildCsp } from '@/lib/security/csp'

let _encryptionWarned = false

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // HIPAA: Refuse to serve if encryption key is missing in production
  if (!process.env.ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production') {
      if (pathname.startsWith('/api/health')) {
        return NextResponse.json(
          { status: 'unhealthy', reason: 'ENCRYPTION_KEY not configured' },
          { status: 503 }
        )
      }
      return new NextResponse('Service unavailable: encryption not configured', { status: 503 })
    } else if (!_encryptionWarned) {
      console.warn('[MCA] WARNING: ENCRYPTION_KEY not set. PHI will not be encrypted.')
      _encryptionWarned = true
    }
  }

  // HTTPS enforcement in production
  const proto = request.headers.get('x-forwarded-proto')
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = 'https'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // Rate limiting (skipped if Upstash is not configured)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  // `/api/auth/*` belongs in the strict auth bucket, not the 60/60s API one.
  // Credential exchange now happens at POST /api/auth/login (so the lockout
  // policy is enforced server-side); leaving it in the API bucket would have
  // handed brute-force 60 attempts a minute instead of 5.
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/api/auth/']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  // The frontend error sink carries its own PER-USER bucket (errorRateLimit, in
  // the route itself) and is deliberately kept OUT of the shared per-IP one.
  // A practice's staff share one office NAT, so leaving telemetry in the 60/60s
  // IP bucket meant one person's render loop could exhaust the allowance and
  // 429 everybody's real requests — telemetry taking the app down with it.
  const isErrorSink = pathname.startsWith('/api/errors')
  const isApiPath = pathname.startsWith('/api/') && !isErrorSink

  // Only CREDENTIAL SUBMISSIONS get the strict 5/60s bucket — not page views.
  //
  // This used to count every GET of /login, /signup, /forgot-password and
  // /reset-password. The bucket is keyed by IP, so a household or an office on
  // one public address burned it just by navigating: open the login page,
  // mistype, go to Forgot password, come back, and you are locked out for a
  // minute having never submitted a password. Brute force is a POST problem, so
  // limiting POSTs preserves the protection exactly (still 5 attempts a minute
  // per IP) while page views stop being rationed.
  const isCredentialSubmission =
    isAuthPath && request.method !== 'GET' && request.method !== 'HEAD'

  // Portal API traffic uses the normal API bucket: one portal dashboard load
  // makes 4-6 requests, which instantly exhausted the 5/60s auth bucket and
  // surfaced as silent empty states (each page swallows the 429).
  if (isCredentialSubmission && authRateLimit) {
    const { success, remaining, reset } = await authRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      )
    }
  } else if (isApiPath && apiRateLimit) {
    const { success, remaining, reset } = await apiRateLimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      )
    }
  }

  // Per-request CSP nonce. This has to happen here rather than in
  // next.config.ts's headers() because that can only emit static values — which
  // is why the policy used to carry `script-src 'unsafe-inline'`.
  //
  // Document responses only. API responses keep the static headers from
  // next.config.ts, whose per-route exception lets the invoice PDF be framed
  // same-origin; a second CSP from here would intersect with that and re-break
  // the preview iframe.
  const nonce = crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = await updateSession(request, requestHeaders)

  if (!isApiPath) {
    // Next.js reads this header and stamps the same nonce onto the scripts it
    // injects, so its bootstrap still runs under a strict policy.
    response.headers.set(
      'Content-Security-Policy',
      buildCsp({ nonce, isDev: process.env.NODE_ENV === 'development' })
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
