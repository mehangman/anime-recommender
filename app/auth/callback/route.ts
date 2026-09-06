import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
      const cleanSiteUrl = siteUrl.replace(/\/$/, '')
      
      return NextResponse.redirect(`${cleanSiteUrl}${next}`)
    } else {
      console.error('Auth error:', error.message)
    }
  }

  // Fallback if no code or error occurred
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  const cleanSiteUrl = siteUrl.replace(/\/$/, '')
  return NextResponse.redirect(`${cleanSiteUrl}/login?error=OAuthFailed`)
}
