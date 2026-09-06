'use client'

import { useState } from 'react'
import { Trash2, Star, ArrowLeft } from 'lucide-react'
import { removeFromList } from '@/app/actions/anime'
import { UserMenu } from '@/components/UserMenu'

import { AnimeModal } from '@/components/AnimeModal'
import type { Anime } from '@/components/AnimeModal'

type SavedAnime = {
  id: string
  mal_id: number
  title: string
  poster_url: string
  score: number | null
  genres: string[]
  synopsis: string
  added_at: string
}

export default function SavedListClient({
  initialData,
  userEmail,
}: {
  initialData: SavedAnime[]
  userEmail: string
}) {
  const [items, setItems] = useState<SavedAnime[]>(initialData)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setRemoving(id)
    setError('')
    const result = await removeFromList(id)
    if (result.error) {
      setError(result.error)
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
    setRemoving(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] text-white relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-gray-800/50 px-3 sm:px-8 py-3 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-6">
            <a href="/app" className="flex items-center gap-2 sm:gap-3 cursor-pointer group hover:bg-gray-800/30 px-2 sm:px-3 py-1.5 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-gray-400 group-hover:text-white transition-colors" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/logo.png" alt="MyNextAnime Logo" className="h-7 sm:h-9 w-auto" />
              <span className="hidden sm:block text-xs font-medium text-gray-500 group-hover:text-gray-300">Back to chat</span>
            </a>
          </div>
          <div className="flex items-center">
            <UserMenu email={userEmail} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Watchlist</h1>
          <p className="text-gray-400 text-sm">
            {items.length === 1 ? 'You have 1 anime in your watchlist.' : `You have ${items.length} anime in your watchlist.`}
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm mb-6 bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <div className="text-center py-24 bg-[#111111]/60 backdrop-blur-sm rounded-3xl border border-gray-800/60 shadow-xl">
            <p className="text-gray-400 text-lg mb-2">Your watchlist is completely empty!</p>
            <p className="text-gray-500 text-sm mb-8">Head back to the chat to find your next favorite series. 🎌</p>
            <a
              href="/app"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg"
            >
              Discover Anime
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAnime(item as Anime)}
                className="group flex gap-4 bg-[#151515]/80 backdrop-blur-sm rounded-2xl border border-gray-800/60 overflow-hidden hover:border-blue-500/40 hover:bg-[#1a1a1a] transition-all cursor-pointer shadow-lg hover:shadow-blue-500/5 relative"
              >
                {/* Poster */}
                <div className="w-[110px] sm:w-[130px] flex-shrink-0 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.poster_url || 'https://via.placeholder.com/130x190?text=No+Image'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Info */}
                <div className="flex-1 py-4 pr-4 flex flex-col justify-between relative z-10">
                  <div>
                    <h3 className="font-bold text-base text-white/95 mb-1.5 line-clamp-2 leading-tight">{item.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-500">
                        <Star size={12} className="fill-yellow-500" />
                        <span className="text-xs font-bold">
                          {item.score ? Number(item.score).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Added {item.added_at.split('T')[0]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.genres?.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="text-[10px] uppercase tracking-wider font-semibold bg-gray-800/50 text-gray-400 px-2 py-0.5 rounded"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    disabled={removing === item.id}
                    className="self-start mt-2 flex items-center gap-1.5 text-gray-500 hover:text-red-400 bg-gray-800/30 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-xs font-medium transition-all disabled:opacity-50 px-3 py-1.5 rounded-lg"
                  >
                    {removing === item.id ? (
                      <span className="animate-spin w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedAnime && (
        <AnimeModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          hideAddButton={true}
        />
      )}
    </div>
  )
}
