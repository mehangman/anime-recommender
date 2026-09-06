'use client'

import { Star } from 'lucide-react'
import type { Anime } from './AnimeModal'

export default function AnimeCard({
  anime,
  onClick,
}: {
  anime: Anime
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500/50 flex flex-col h-full shadow-lg transition-all hover:shadow-blue-500/10 hover:scale-[1.02] cursor-pointer text-left w-full group"
    >
      <div className="h-[200px] overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={anime.poster_url || 'https://via.placeholder.com/225x318?text=No+Image'}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 font-bold px-2 py-0.5 rounded text-xs flex items-center gap-1">
          <Star size={12} className="fill-yellow-400" />
          {anime.score ? anime.score.toFixed(1) : 'N/A'}
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-white line-clamp-2 mb-1.5" title={anime.title}>
          {anime.title}
        </h3>
        <div className="flex flex-wrap gap-1 mt-auto">
          {anime.genres?.slice(0, 3).map((genre) => (
            <span key={genre} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
              {genre}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
