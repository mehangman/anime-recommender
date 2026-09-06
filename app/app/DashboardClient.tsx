'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Send, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import AnimeCard from '@/components/AnimeCard'
import { AnimeModal } from '@/components/AnimeModal'
import type { Anime } from '@/components/AnimeModal'
import { UserMenu } from '@/components/UserMenu'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [autoSubmitDone, setAutoSubmitDone] = useState(false)
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Initial hydration based on user name
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
    const userMessage: Message = { role: 'user', content: queryText }
    const currentMessages = [...messages, userMessage]
    
    setMessages(currentMessages)
    setInput('')
    setChatLoading(true)

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, mode: 'chat' }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch from API')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || "Here are some recommendations!",
        animeResults: data.animes || []
      }
      
      setMessages([...currentMessages, assistantMessage])
    } catch (error) {
      console.error(error)
      setMessages([...currentMessages, { 
        role: 'assistant', 
        content: 'Ah, I tripped on a cable! Can we try that again?' 
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatLoading) return
    await submitQuery(input.trim())
  }

  const fetchRecommendations = async () => {
    if (recommendLoading || messages.length === 0) return
    setRecommendLoading(true)

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode: 'recommend' }),
      })

      if (!response.ok) throw new Error('API failed')
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || "I found some great matches for you!",
        animeResults: data.animes || []
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t fetch recommendations right now.'
      }])
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

    const initial: Message[] = [{
      role: 'assistant',
      content: `Hi ${userName} senpai! ✨ What anime are you into, or what are you in the mood for?`
    }]
    setMessages(initial)
    sessionStorage.removeItem(`anime_chat_history_${user.id}`)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-800/50 px-3 sm:px-8 py-3 bg-black/40 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 cursor-pointer group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="MyNextAnime Logo" className="h-7 sm:h-10 w-auto" />
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-red-400 bg-gray-800/30 hover:bg-red-500/10 border border-gray-700/50 hover:border-red-500/30 transition-all rounded-full hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold tracking-wide"
              title="Clear chat history"
            >
              <Trash2 size={14} />
              <span>Clear Chat</span>
            </button>
            <a
              href="/saved"
              className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold bg-[#1e1e1e] hover:bg-gray-800 border border-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm"
            >
              My List
            </a>
            <UserMenu email={user.email || ''} onClearChat={clearHistory} />
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 min-h-0 max-w-5xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-2 pr-1 sm:pr-2 pb-2">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-[#1e1e1e] text-gray-200 border border-gray-700 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
              
              {/* If this is the assistant message with anime results, show carousel directly below it */}
              {msg.role === 'assistant' && msg.animeResults && msg.animeResults.length > 0 && (
                <InlineCarousel results={msg.animeResults} onSelect={setSelectedAnime} />
              )}
            </div>
          ))}

          {/* Loading States */}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1e1e1e] text-gray-200 border border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="shrink-0 relative">
          {/* Recommend Button */}
          <button
            onClick={fetchRecommendations}
            disabled={recommendLoading || chatLoading || messages.length <= 1}
            className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2 rounded-full shadow-lg transition-all disabled:opacity-0 disabled:scale-95 flex items-center gap-2 font-medium text-sm"
          >
            {recommendLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Fetching...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Get Recommendations
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
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
      </main>

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
