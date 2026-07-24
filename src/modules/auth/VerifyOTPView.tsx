'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const VerifyOTPView = () => {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [resendDisabled, setResendDisabled] = useState(true)
  const { verifyOTP, resendOTP } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const pendingSignup = localStorage.getItem('pending_signup')
    if (!pendingSignup) {
      router.push('/signup')
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setResendDisabled(false)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')

    const pendingSignup = JSON.parse(localStorage.getItem('pending_signup') || '{}')
    const result = await resendOTP(pendingSignup.email)

    setLoading(false)

    if (result.success) {
      setCountdown(60)
      setResendDisabled(true)
      setError('OTP resent successfully!')
      setTimeout(() => setError(''), 3000)
    } else {
      // Surface Supabase's own message as-is — e.g. "you can only request this after 42 seconds"
      setError(result.message || 'Failed to resend OTP')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length < 6) {
      setError('Please enter a valid OTP')
      return
    }

    setLoading(true)

    const pendingSignup = JSON.parse(localStorage.getItem('pending_signup') || '{}')
    const result = await verifyOTP(otp, pendingSignup)

    setLoading(false)

    if (result.success) {
      localStorage.removeItem('pending_signup')
      localStorage.removeItem('temp_password')
      router.push('/dashboard')
    } else {
      setError(result.message || 'Invalid OTP')
    }
  }

  const handleBack = () => {
    localStorage.removeItem('pending_signup')
    router.push('/signup')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-4 before:pointer-events-none before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] before:opacity-10 before:content-['']">
      <div className="relative z-10 w-full max-w-[450px] rounded-[20px] border border-white/10 bg-slate-800/70 p-8 shadow-2xl backdrop-blur-md sm:p-10">
        <h1 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Verify OTP
        </h1>
        <p className="mb-8 text-center text-sm font-medium leading-relaxed text-slate-400">
          Enter the code sent to your email and phone
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="otp" className="mb-2 block text-sm font-semibold text-slate-400">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              placeholder="Enter code"
              maxLength={10}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-5 py-4 text-center text-2xl font-bold tracking-[0.5rem] text-white transition focus:border-blue-500 focus:bg-slate-900/80 focus:outline-none focus:ring-4 focus:ring-blue-500/15 sm:text-2xl"
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
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-500">
          <p className="mb-3">Didn&apos;t receive the code?</p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendDisabled || loading}
            className="rounded-md px-4 py-2 text-sm font-semibold text-blue-500 transition hover:bg-blue-500/10 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-500 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-400/10 hover:text-slate-50"
          >
            ← Back to Signup
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTPView
