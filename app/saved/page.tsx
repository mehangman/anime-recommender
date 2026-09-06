import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SavedListClient from './SavedListClient'

export default async function SavedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('anime_list')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  return <SavedListClient initialData={data || []} userEmail={user.email || ''} />
}
