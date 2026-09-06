'use client'

import { useState } from 'react'
import { signup, signInWithGoogle } from '@/app/auth/actions'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setStep(2)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Enforce weak password block
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = await signup(formData)
    if (result?.error) {
      // Improve Supabase default errors
      if (result.error.toLowerCase().includes('already registered')) {
        setError('This email is already registered. Please log in instead.')
      } else {
        setError(result.error)
        if (result.error.includes('check your email')) {
          setSuccess(result.error)
          setError('')
        }
      }
      setLoading(false)
    }
    // Success redirects automatically via server action if session exists
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  // Password strength logic
  let strength = 0
  if (password.length > 5) strength += 1
  if (password.length > 8) strength += 1
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) strength += 1

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const currentStrength = password.length === 0 ? -1 : Math.min(3, strength)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] text-white p-4 relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111111]/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-800/60 shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="MyNextAnime" className="h-10 mx-auto mb-5 cursor-pointer opacity-90 hover:opacity-100 transition-opacity" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white/95">Create your account</h2>
          <p className="text-sm text-gray-400 mt-2">Join to unlock personalized recommendations</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg text-sm mb-6 text-center">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#151515] border border-gray-700/50 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!email || loading}
              className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-lg"
            >
              Continue
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink-0 mx-4 text-gray-600 text-xs uppercase tracking-wider font-medium">or</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#151515] hover:bg-[#1f1f1f] border border-gray-700/50 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="bg-[#151515] border border-gray-700/50 rounded-xl p-3.5 flex justify-between items-center mb-6">
              <span className="text-sm text-gray-300 truncate">{email}</span>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 px-2.5 py-1 rounded-md transition-colors"
              >
                Edit
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Create a password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#151515] border border-gray-700/50 rounded-xl py-3 pl-11 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2.5 px-1 flex items-center gap-2">
                  <div className="flex-1 flex gap-1.5 h-1.5">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`flex-1 rounded-full transition-colors ${
                          index <= currentStrength ? strengthColors[currentStrength] : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${
                    currentStrength === 0 ? 'text-red-400' :
                    currentStrength === 1 ? 'text-yellow-400' :
                    currentStrength === 2 ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {strengthLabels[currentStrength]}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              {loading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
              Create Account
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
