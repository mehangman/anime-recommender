'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type AnimeData = {
  mal_id: number
  title: string
  poster_url: string
  score: number | null
  genres: string[]
  synopsis: string
}

export async function addToList(anime: AnimeData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to save anime.' }
  }

  const { error } = await supabase.from('anime_list').insert({
    user_id: user.id,
    mal_id: anime.mal_id,
    title: anime.title,
    poster_url: anime.poster_url,
    score: anime.score,
    genres: anime.genres,
    synopsis: anime.synopsis,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This anime is already in your list!' }
    }
    console.error('Supabase insert error:', error)
    return { error: error.message }
  }

  revalidatePath('/saved')
  return { success: true }
}

export async function removeFromList(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { error } = await supabase
    .from('anime_list')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Supabase delete error:', error)
    return { error: error.message }
  }

  revalidatePath('/saved')
  return { success: true }
}

export async function getSavedList() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.', data: [] }
  }

  const { data, error } = await supabase
    .from('anime_list')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error)
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}
