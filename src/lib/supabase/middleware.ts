import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { shouldDevAutoLogin, DEV_AUTO_LOGIN_EMAIL } from '@/lib/auth/dev-auto-login'
import { isMfaGuardedApiPath } from '@/lib/auth/mfa-scope'

/**
 * @param requestHeaders Headers to forward to the app (the proxy uses this to
 *   pass the per-request CSP nonce through as `x-nonce`). Omitted in tests.
 */
export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  const nextOptions = requestHeaders ? { request: { headers: requestHeaders } } : { request }

  let supabaseResponse = NextResponse.next(nextOptions)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next(nextOptions)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  let {
    data: { user },
  } = await supabase.auth.getUser()

  // Local convenience: sign in as the seeded developer automatically.
  // Triple-gated (dev build + DEV_AUTO_LOGIN=1 + MCA-Dev Supabase project);
  // auth pages are exempt so manual login, sign-out, and e2e stay untouched.
  if (
    shouldDevAutoLogin({
      nodeEnv: process.env.NODE_ENV,
      flag: process.env.DEV_AUTO_LOGIN,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      password: process.env.TEST_USER_PASSWORD,
      pathname: request.nextUrl.pathname,
      hasUser: !!user,
    })
  ) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEV_AUTO_LOGIN_EMAIL,
      password: process.env.TEST_USER_PASSWORD!,
    })
    if (error) {
      // Dev DB paused or wrong password — fall through to the login redirect.
      console.warn('[MCA] dev auto-login failed:', error.message)
    } else {
      user = data.user
    }
  }

  // Protected routes - redirect to login if not authenticated.
  // NOTE: this is an allow-list, so a new dashboard route is unprotected until it
  // is added here. `/help` was missing for exactly that reason.
  const protectedPaths = ['/dashboard', '/sessions', '/clients', '/invoices', '/settings', '/team', '/payments', '/analytics', '/earnings', '/help']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/'
    return NextResponse.redirect(url)
  }

  // Deny-by-default for /api/*: guarded unless the route authenticates with a
  // portal token, an HMAC, or a bearer secret. See @/lib/auth/mfa-scope.
  const isGuardedApiPath = isMfaGuardedApiPath(request.nextUrl.pathname)

  // MFA enforcement: check AAL level once for all authenticated user redirects
  // Skip MFA checks entirely in local development
  const skipMfa = process.env.NODE_ENV !== 'production'
  const isMfaVerifyPath = request.nextUrl.pathname.startsWith('/mfa-verify')
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // In dev, redirect away from mfa-verify page since we're skipping MFA
  if (skipMfa && isMfaVerifyPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/'
    return NextResponse.redirect(url)
  }

  // Fetch AAL once for any authenticated path that needs it
  const needsAalCheck =
    !skipMfa && user && (isProtectedPath || isAuthPath || isMfaVerifyPath || isGuardedApiPath)
  const aalData = needsAalCheck
    ? (await supabase.auth.mfa.getAuthenticatorAssuranceLevel()).data
    : null
  const needsMfaVerify = aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2'

  // API routes are not in `protectedPaths`, so before this check an aal1 session
  // (password accepted, TOTP not yet entered) reached every API route — including
  // /api/sessions/export, which decrypts session notes server-side. Reject rather
  // than redirect: an API caller wants a status code, not HTML.
  if (isGuardedApiPath && user && needsMfaVerify) {
    return NextResponse.json(
      { error: 'MFA verification required' },
      { status: 403, headers: { 'x-mfa-required': '1' } }
    )
  }

  if (isProtectedPath && user && needsMfaVerify) {
    // User has MFA enrolled but hasn't verified this session — redirect to MFA
    const url = request.nextUrl.clone()
    url.pathname = '/mfa-verify/'
    return NextResponse.redirect(url)
  }

  if (isAuthPath && user) {
    if (needsMfaVerify) {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa-verify/'
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/'
    return NextResponse.redirect(url)
  }

  // If on MFA verify page, redirect appropriately
  if (isMfaVerifyPath) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/'
      return NextResponse.redirect(url)
    }

    if (aalData?.currentLevel === 'aal2') {
      // Already verified, go to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
