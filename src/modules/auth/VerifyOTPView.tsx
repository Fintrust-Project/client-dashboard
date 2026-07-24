'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import '@/css/VerifyOTP.css'

const VerifyOTPView = () => {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [resendDisabled, setResendDisabled] = useState(true)
  const { verifyOTP } = useAuth()
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
    setTimeout(() => {
      setLoading(false)
      setCountdown(60)
      setResendDisabled(true)
      setError('OTP resent successfully!')
      setTimeout(() => setError(''), 3000)
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
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
    <div className="verify-otp-container">
      <div className="verify-otp-box">
        <h1>Verify OTP</h1>
        <p className="subtitle">Enter the 6-digit code sent to your email and phone</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              placeholder="123456"
              maxLength={6}
              className="otp-input"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="verify-button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        <div className="resend-section">
          <p>Didn&apos;t receive the code?</p>
          <button
            type="button"
            className="resend-button"
            onClick={handleResendOTP}
            disabled={resendDisabled || loading}
          >
            {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
        <div className="back-link">
          <button type="button" className="back-button" onClick={handleBack}>
            ← Back to Signup
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTPView
