'use client'

import { useState } from 'react'
import { X, Star, Plus, Check, BookOpen } from 'lucide-react'
import { addToList } from '@/app/actions/anime'

export type Anime = {
  mal_id: number
  title: string
  poster_url: string
  score: number | null
  genres: string[]
  synopsis: string
}

export function AnimeModal({ anime, onClose, hideAddButton = false }: { anime: Anime; onClose: () => void; hideAddButton?: boolean }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')
  const [showFullSynopsis, setShowFullSynopsis] = useState(false)

  const handleAdd = async () => {
    setAdding(true)
    setError('')
    const result = await addToList(anime)
    if (result.error) {
      setError(result.error)
    } else {
      setAdded(true)
    }
    setAdding(false)
  }

  const synopsis = anime.synopsis || 'No synopsis available.'
  const shortSynopsis = synopsis.length > 300 ? synopsis.slice(0, 300) + '...' : synopsis

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/50 rounded-full p-1 z-10"
        >
          <X size={20} />
        </button>

        {/* Content — horizontal layout on desktop */}
        <div className="flex flex-col sm:flex-row">
          {/* Poster */}
          <div className="sm:w-[250px] flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={anime.poster_url || 'https://via.placeholder.com/225x318?text=No+Image'}
              alt={anime.title}
              className="w-full h-[300px] sm:h-full object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
            />
          </div>

          {/* Details */}
          <div className="flex-1 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-3">{anime.title}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-bold text-lg">
                {anime.score ? anime.score.toFixed(1) : 'N/A'}
              </span>
              <span className="text-gray-500 text-sm">/ 10</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {anime.genres?.map((genre) => (
                <span
                  key={genre}
                  className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="flex-1 mb-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Synopsis</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {showFullSynopsis ? synopsis : shortSynopsis}
              </p>
              {synopsis.length > 300 && (
                <button
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2 flex items-center gap-1"
                >
                  <BookOpen size={14} />
                  {showFullSynopsis ? 'Show less' : 'Read full synopsis'}
                </button>
              )}
            </div>

            {/* Add to list */}
            {!hideAddButton && (
              <div>
                {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
                <button
                  onClick={handleAdd}
                  disabled={adding || added}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all text-sm ${
                    added
                      ? 'bg-green-700 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={18} /> Added to My List
                    </>
                  ) : adding ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Add to My List
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
