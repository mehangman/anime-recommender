'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Send, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import AnimeCard from '@/components/AnimeCard'
import { AnimeModal } from '@/components/AnimeModal'
import type { Anime } from '@/components/AnimeModal'

type Message = {
  role: 'user' | 'assistant'
  content: string
  animeResults?: Anime[]
}

const getStorageKey = (userId: string) => `mynextanime-chat-history-${userId}`

function loadMessages(userId: string): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(getStorageKey(userId))
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

function saveMessages(userId: string, messages: Message[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(messages))
  } catch {}
}

export default function DashboardClient({ user }: { user: User }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [autoSubmitDone, setAutoSubmitDone] = useState(false)

  // 1. Load saved history on mount
  useEffect(() => {
    let userName = 'Guest'
    if (user.user_metadata?.full_name) {
      userName = user.user_metadata.full_name.split(' ')[0]
    } else if (user.user_metadata?.name) {
      userName = user.user_metadata.name.split(' ')[0]
    } else if (user.email) {
      userName = user.email.split('@')[0]
    }

    const dynamicGreeting: Message = {
      role: 'assistant',
      content: `Hi ${userName} senpai! ✨ What anime are you into, or what are you in the mood for?`
    }

    const saved = loadMessages(user.id)
    if (saved.length > 0) {
      setMessages(saved)
    } else {
      setMessages([dynamicGreeting])
    }
    setHydrated(true)
  }, [user.id, user])

  // 2. Save history whenever messages change (after hydration)
  useEffect(() => {
    if (hydrated && messages.length > 0) saveMessages(user.id, messages)
  }, [messages, hydrated, user.id])

  // 3. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 4. Auto-submit pending query from homepage
  useEffect(() => {
    if (!hydrated || autoSubmitDone) return

    const pendingQuery = sessionStorage.getItem('pending_anime_query')
    if (pendingQuery) {
      sessionStorage.removeItem('pending_anime_query')
      void submitQuery(pendingQuery)
    }
    setAutoSubmitDone(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, autoSubmitDone])

  const submitQuery = async (queryText: string) => {
    if (chatLoading || recommendLoading) return

    const userMessage: Message = { role: 'user', content: queryText }
    const currentMessages = [...messages, userMessage]
    
    setMessages(currentMessages)

    setInput('')
    setChatLoading(true)
    setError('')

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: 'chat',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      if (data.type === 'recommendations' && data.results) {
        // AI decided to show recommendations — add message with card results
        const sorted = (data.results as Anime[]).sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        )
        const resultMessage: Message = {
          role: 'assistant',
          content: data.reply,
          animeResults: sorted,
        }
        setMessages((prev) => [...prev, resultMessage])
      } else {
        // Normal conversational reply
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setChatLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await submitQuery(input.trim())
  }

  // Manual "Show Recommended List" button — uses the separate recommend mode
  const getRecommendations = async () => {
    setRecommendLoading(true)
    setError('')

    const excludeTitles = messages
      .flatMap((m) => m.animeResults || [])
      .map((a) => a.title)

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          mode: 'recommend',
          excludeTitles,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendations')

      const sorted = (data.results as Anime[]).sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0)
      )

      const resultMessage: Message = {
        role: 'assistant',
        content: `Here are my picks for you! Click any card for details. 🎯`,
        animeResults: sorted,
      }
      setMessages((prev) => [...prev, resultMessage])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRecommendLoading(false)
    }
  }

  const clearHistory = () => {
    let userName = 'Guest'
    if (user.user_metadata?.full_name) {
      userName = user.user_metadata.full_name.split(' ')[0]
    } else if (user.user_metadata?.name) {
      userName = user.user_metadata.name.split(' ')[0]
    } else if (user.email) {
      userName = user.email.split('@')[0]
    }
    const dynamicGreeting: Message = {
      role: 'assistant',
      content: `Hi ${userName} senpai! ✨ What anime are you into, or what are you in the mood for?`
    }
    setMessages([dynamicGreeting])
    localStorage.removeItem(getStorageKey(user.id))
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 px-4 sm:px-8 py-3 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 cursor-pointer group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="MyNextAnime Logo" className="h-10 w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-red-400 bg-gray-800/30 hover:bg-red-500/10 border border-gray-700/50 hover:border-red-500/30 transition-all rounded-full hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold tracking-wide"
              title="Clear chat history"
            >
              <Trash2 size={14} />
              <span>Clear Chat</span>
            </button>
            <div className="flex items-center gap-3 bg-[#1e1e1e] border border-gray-700 rounded-full px-4 py-1.5">
              <span className="text-sm text-gray-300 font-medium truncate max-w-[120px] sm:max-w-none">{user.email}</span>
              <div className="w-[1px] h-4 bg-gray-700"></div>
              <a
                href="/saved"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold flex items-center gap-1"
              >
                My List
              </a>
              <div className="w-[1px] h-4 bg-gray-700"></div>
              <form action="/auth/signout" method="post">
                <button className="text-sm text-red-400 hover:text-red-300 transition-colors font-semibold">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-[#1e1e1e] text-gray-200 border border-gray-700 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>

              {/* Inline anime results carousel */}
              {msg.animeResults && msg.animeResults.length > 0 && (
                <InlineCarousel
                  results={msg.animeResults}
                  onSelect={(anime) => setSelectedAnime(anime)}
                />
              )}
            </div>
          ))}

          {(chatLoading) && (
            <div className="flex justify-start">
              <div className="bg-[#1e1e1e] border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          {recommendLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1e1e1e] border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-md text-sm text-gray-300">
                <span className="animate-pulse">🔍 Finding the perfect anime for you...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <p className="text-red-500 text-center text-sm mb-3">{error}</p>}

        {/* Bottom controls */}
        <div className="flex flex-col gap-3">
          {/* Recommend Button */}
          <button
            onClick={getRecommendations}
            disabled={recommendLoading || chatLoading}
            className="mx-auto flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-full font-semibold transition-all disabled:opacity-50 shadow-lg text-sm"
          >
            {recommendLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Fetching...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Show Recommended List
              </>
            )}
          </button>

          {/* Chat Input */}
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your anime taste..."
              className="flex-1 rounded-full px-5 py-3 bg-[#1e1e1e] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={chatLoading || recommendLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || recommendLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Modal */}
      {selectedAnime && (
        <AnimeModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
      )}
    </div>
  )
}

/* ─── Inline Carousel subcomponent ───────────────────── */
function InlineCarousel({
  results,
  onSelect,
}: {
  results: Anime[]
  onSelect: (anime: Anime) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
  }

  return (
    <div className="relative mt-3 ml-0 sm:ml-4 mb-2">
      {results.length > 2 && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-1.5 rounded-full shadow-lg"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto scroll-smooth px-8 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {results.map((anime) => (
          <div key={anime.mal_id} className="flex-shrink-0 w-[180px]">
            <AnimeCard anime={anime} onClick={() => onSelect(anime)} />
          </div>
        ))}
      </div>

      {results.length > 2 && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-1.5 rounded-full shadow-lg"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
