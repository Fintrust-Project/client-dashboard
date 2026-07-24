'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const LoginView = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(email, password)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.message || 'Invalid credentials')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-4 before:pointer-events-none before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] before:opacity-10 before:content-['']">
      <div className="relative z-10 w-full max-w-[450px] rounded-[20px] border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur-md sm:p-12">
        <h1 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-white sm:mb-10 sm:text-4xl">
          India Invest Karo
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
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
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-400">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
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
            className="mt-4 w-full rounded-xl bg-blue-500 py-4 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/30"
          >
            Login
          </button>
        </form>
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          <p>Please enter your registered email and password.</p>
        </div>
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="p-0 text-sm font-semibold text-blue-500 underline transition-colors hover:text-blue-600"
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginView
