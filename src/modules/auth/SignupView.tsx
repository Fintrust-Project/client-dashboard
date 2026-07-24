'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const SignupView = () => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const result = await signup({ email, phone, password, username })

    setLoading(false)

    if (result.success) {
      localStorage.setItem('pending_signup', JSON.stringify({ email, phone, username }))
      localStorage.setItem('temp_password', password)
      router.push('/verify-otp')
    } else {
      setError(result.message || 'Signup failed')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-4 before:pointer-events-none before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] before:opacity-10 before:content-['']">
      <div className="relative z-10 w-full max-w-[450px] rounded-[20px] border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur-md sm:p-12">
        <h1 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Create Account
        </h1>
        <p className="mb-8 text-center text-sm font-medium text-slate-400">India Invest Karo</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-400">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3.5 text-base text-white transition focus:border-blue-500 focus:bg-slate-900/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-400">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3.5 text-base text-white transition focus:border-blue-500 focus:bg-slate-900/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-400">
              Phone Number
            </label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 transition focus-within:border-blue-500 focus-within:bg-slate-900/80 focus-within:ring-4 focus-within:ring-blue-500/15">
              <span className="flex items-center border-r border-white/10 px-4 text-base text-slate-400">
                +91
              </span>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="Enter phone number"
                className="w-full bg-transparent px-5 py-3.5 text-base text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-400">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password (min 6 characters)"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3.5 text-base text-white transition focus:border-blue-500 focus:bg-slate-900/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-400">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm password"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-5 py-3.5 text-base text-white transition focus:border-blue-500 focus:bg-slate-900/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
            />
          </div>
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-blue-500 py-4 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="p-0 text-sm font-semibold text-blue-500 underline transition-colors hover:text-blue-600"
              onClick={() => router.push('/login')}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupView
