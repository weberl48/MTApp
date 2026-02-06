import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit'

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

  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))
  const isPortalApiPath = pathname.startsWith('/api/portal/')
  const isApiPath = pathname.startsWith('/api/')

  if ((isAuthPath || isPortalApiPath) && authRateLimit) {
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
