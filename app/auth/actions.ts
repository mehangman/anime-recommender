'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/app')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || headers().get('origin')
  
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session === null) {
    return { error: 'Registration successful! Please check your email to confirm your account.' }
  }

  redirect('/app')
}

export async function signInWithGoogle() {
  const supabase = createClient()
  
  // Use explicit NEXT_PUBLIC_SITE_URL if available, otherwise safely build origin
  let origin: string | null | undefined = process.env.NEXT_PUBLIC_SITE_URL
  if (!origin) {
    const requestHeaders = headers()
    origin = requestHeaders.get('origin')
    if (!origin) {
      const host = requestHeaders.get('host')
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
      origin = `${protocol}://${host}`
    }
  }

  // Ensure no trailing slash
  const finalOrigin = origin ? origin.replace(/\/$/, '') : ''

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${finalOrigin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url) // Navigate to Google OAuth screen
  }
}
