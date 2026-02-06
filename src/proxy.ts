import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting (skipped if Upstash is not configured)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))
  const isApiPath = pathname.startsWith('/api/')

  if (isAuthPath && authRateLimit) {
    const { success, remaining, reset } = await authRateLimit.limit(ip)
    if (!success) {
      return new NextResponse('Too many requests. Please try again later.', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': String(remaining),
        },
      })
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

  return await updateSession(request)
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
