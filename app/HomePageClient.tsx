'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Sparkles, LayoutList, Tv } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import AnimeCard from '@/components/AnimeCard'
import { AnimeModal, type Anime } from '@/components/AnimeModal'

interface HomePageClientProps {
  user: User | null
  userName: string
}

export default function HomePageClient({ user, userName }: HomePageClientProps) {
  const [input, setInput] = useState('')
  const [greetingTime, setGreetingTime] = useState('Good day')
  const [trending, setTrending] = useState<Anime[]>([])
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const router = useRouter()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingTime('Good morning')
    else if (hour < 18) setGreetingTime('Good afternoon')
    else setGreetingTime('Good evening')
  }, [])

  // Fetch trending anime for logged-in users
  useEffect(() => {
    if (user) {
      fetch('https://api.jikan.moe/v4/seasons/now?limit=25')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const mapped: Anime[] = data.data.map((a: any) => ({
               mal_id: a.mal_id,
               title: a.title_english || a.title,
               poster_url: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
               score: a.score || null,
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               genres: a.genres?.map((g: any) => g.name) || [],
               synopsis: a.synopsis || '',
               source: 'Jikan'
             }))
             // Randomize and take 5
             const shuffled = mapped.sort(() => 0.5 - Math.random())
             setTrending(shuffled.slice(0, 5))
          }
        })
        .catch(err => console.error('Failed to fetch trending:', err))
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Save the pending query so the dashboard can auto-submit it after login/navigation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pending_anime_query', input.trim())
    }

    if (user) {
      router.push('/app')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#0a0a0a] to-[#0a0a0a] text-white">
      
      {/* Navbar for Landing Page */}
      <header className="w-full px-4 sm:px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="MyNextAnime Logo" className="h-8 w-auto" />
          </a>
        </div>
        
        {/* Dynamic Header based on auth */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 bg-[#1e1e1e] border border-gray-700 rounded-full px-3 sm:px-4 py-1.5">
              <span className="text-xs sm:text-sm text-gray-300 font-medium truncate max-w-[80px] sm:max-w-[120px]">{user.email}</span>
              <div className="w-[1px] h-3 sm:h-4 bg-gray-700"></div>
              <a
                href="/saved"
                className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold"
              >
                My List
              </a>
              <div className="w-[1px] h-3 sm:h-4 bg-gray-700"></div>
              <form action="/auth/signout" method="post">
                <button className="text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors font-semibold">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 sm:gap-4">
            <button onClick={() => router.push('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Log In
            </button>
            <button onClick={() => router.push('/signup')} className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
              Sign Up
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-5xl mx-auto py-12">
        
        {user ? (
          /* Logged In: Refined Claude-like Interface */
          <div className="w-full flex flex-col items-center justify-center mt-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#e5e5e5] mb-10 text-center flex items-center justify-center gap-3">
              <Sparkles className="text-orange-400" size={32} />
              {greetingTime}, {userName} senpai
            </h1>
            
            <div className="w-full max-w-3xl relative mb-16">
              <form onSubmit={handleSubmit} className="relative flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="How can I help you find anime today?"
                  className="flex-1 rounded-full px-5 sm:px-6 py-4 sm:py-5 bg-[#1a1a1a] text-white border border-gray-700 focus:outline-none focus:border-blue-500/50 text-sm sm:text-lg shadow-xl placeholder:text-gray-500 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-200 text-black p-3 sm:p-3.5 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg"
                >
                  <Send size={18} className="sm:w-5 sm:h-5" />
                </button>
              </form>
            </div>

            {/* Trending Suggestions */}
            {trending.length > 0 && (
              <div className="w-full max-w-5xl flex flex-col items-center fade-in">
                <div className="flex items-center justify-center gap-2 text-gray-400 mb-6 px-2 w-full">
                  <Tv size={18} className="text-blue-400" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-center">Suggestions for your next watch</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full">
                  {trending.map(anime => (
                    <div key={anime.mal_id} className="w-full">
                      <AnimeCard anime={anime} onClick={() => setSelectedAnime(anime)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Logged Out: Marketing Landing Page */
          <>
            <div className="text-center mb-12 mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#151515] border border-gray-800 text-gray-300 text-sm font-medium mb-8">
                <Sparkles size={14} className="text-orange-400" />
                <span>Your Personal Anime Concierge</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif mb-6 tracking-tight text-[#e5e5e5] leading-tight">
                Find your next favorite <br className="hidden sm:block" />
                <span className="text-gray-400">anime in seconds.</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed px-4">
                Stop scrolling endlessly through generic lists. Tell our AI exactly what you&apos;re in the mood for — a dark psychological thriller, a relaxing slice of life, or an epic fantasy — and get highly personalized recommendations instantly.
              </p>
            </div>

            <div className="w-full max-w-3xl mb-20 relative px-2 sm:px-0">
              <form onSubmit={handleSubmit} className="relative flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. 'I want a fast-paced action anime...'"
                  className="flex-1 rounded-full px-5 sm:px-6 py-4 sm:py-5 bg-[#1a1a1a] text-white border border-gray-700 focus:outline-none focus:border-blue-500/50 text-sm sm:text-lg shadow-xl placeholder:text-gray-500 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-200 text-black p-3 sm:p-3.5 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg"
                >
                  <Send size={18} className="sm:w-5 sm:h-5" />
                </button>
              </form>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto w-full mb-12 px-4">
              <div className="bg-[#111] border border-gray-800/60 rounded-2xl p-6 text-center hover:bg-[#151515] transition-colors">
                <div className="w-12 h-12 bg-[#1a1a1a] text-gray-300 rounded-xl flex items-center justify-center mx-auto mb-5 border border-gray-800">
                  <Tv size={20} />
                </div>
                <h3 className="font-semibold text-[#e5e5e5] text-lg mb-2">Smart Discovery</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Our AI understands complex genres, specific tropes, and mood-based requests to find exactly what you want.</p>
              </div>
              <div className="bg-[#111] border border-gray-800/60 rounded-2xl p-6 text-center hover:bg-[#151515] transition-colors">
                <div className="w-12 h-12 bg-[#1a1a1a] text-gray-300 rounded-xl flex items-center justify-center mx-auto mb-5 border border-gray-800">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-semibold text-[#e5e5e5] text-lg mb-2">Detailed Insights</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Get posters, community ratings, synopsis, and genre tags instantly for every recommendation.</p>
              </div>
              <div className="bg-[#111] border border-gray-800/60 rounded-2xl p-6 text-center hover:bg-[#151515] transition-colors sm:col-span-2 md:col-span-1">
                <div className="w-12 h-12 bg-[#1a1a1a] text-gray-300 rounded-xl flex items-center justify-center mx-auto mb-5 border border-gray-800">
                  <LayoutList size={20} />
                </div>
                <h3 className="font-semibold text-[#e5e5e5] text-lg mb-2">Personal Watchlist</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Save the anime you discover directly to your account so you never lose track of what to watch next.</p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="w-full py-8 sm:py-10 border-t border-gray-800/50 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="MyNextAnime" className="h-5 sm:h-6 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
            <span className="text-xs sm:text-sm text-gray-500">© {new Date().getFullYear()} MyNextAnime. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="https://github.com/mehangman" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a href="https://www.instagram.com/shashxnk_verma" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-pink-400 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram
            </a>
          </div>
        </div>
      </footer>

      {/* Anime Detail Modal */}
      {user && selectedAnime && (
        <AnimeModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}
    </div>
  )
}
