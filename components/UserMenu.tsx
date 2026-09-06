'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings, LogOut, Trash2 } from 'lucide-react'

interface UserMenuProps {
  email: string
  onClearChat?: () => void
}

export function UserMenu({ email, onClearChat }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 sm:p-2 bg-[#1e1e1e] hover:bg-gray-800 border border-gray-700 rounded-full transition-colors flex items-center justify-center text-gray-300 shadow-sm"
      >
        <Settings size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-700/80 rounded-xl shadow-2xl py-2 z-[60] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800/80 mb-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Signed in as</p>
            <p className="text-sm text-gray-200 truncate font-medium">{email}</p>
          </div>
          
          {onClearChat && (
            <button
              onClick={() => {
                onClearChat()
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 font-medium"
            >
              <Trash2 size={16} />
              Clear Chat
            </button>
          )}

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/80 transition-colors flex items-center gap-2 font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
