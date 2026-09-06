import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const CANONICAL_DOMAIN = 'mynextanime-ai.vercel.app'

export async function middleware(request: NextRequest) {
  // 1. Enforce Canonical Domain
  const hostname = request.nextUrl.hostname

  if (
    hostname !== CANONICAL_DOMAIN &&
    hostname !== 'localhost' &&
    !hostname.endsWith('.local')
  ) {
    const url = request.nextUrl.clone()
    url.hostname = CANONICAL_DOMAIN
    url.protocol = 'https:'
    url.port = '' // ensure no port is attached
    return NextResponse.redirect(url, 308)
  }

  // 2. Auth session management
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
