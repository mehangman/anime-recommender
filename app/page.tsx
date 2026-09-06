import { createClient } from '@/utils/supabase/server'
import HomePageClient from './HomePageClient'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Determine user name from metadata or fallback to email part
  let userName = 'Guest'
  if (user) {
    if (user.user_metadata?.full_name) {
      userName = user.user_metadata.full_name.split(' ')[0]
    } else if (user.user_metadata?.name) {
      userName = user.user_metadata.name.split(' ')[0]
    } else if (user.email) {
      userName = user.email.split('@')[0]
    }
  }

  return <HomePageClient user={user} userName={userName} />
}
