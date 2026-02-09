import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/sessions', '/clients', '/invoices', '/settings', '/team', '/payments', '/analytics', '/earnings']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/'
    return NextResponse.redirect(url)
  }

  // MFA enforcement: if user is authenticated on a protected route,
  // check that they've completed MFA verification (AAL2) when required
  const isMfaVerifyPath = request.nextUrl.pathname.startsWith('/mfa-verify')

  if (isProtectedPath && user) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
      // User has MFA enrolled but hasn't verified this session — redirect to MFA
      const url = request.nextUrl.clone()
      url.pathname = '/mfa-verify'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    // If user needs MFA, send them to verify instead of dashboard
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = '/mfa-verify'
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/'
    return NextResponse.redirect(url)
  }

  // If on MFA verify page but no user or already AAL2, redirect appropriately
  if (isMfaVerifyPath) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/'
      return NextResponse.redirect(url)
    }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalData && aalData.currentLevel === 'aal2') {
      // Already verified, go to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
