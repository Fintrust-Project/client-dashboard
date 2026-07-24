import type { Metadata } from 'next'
import VerifyOTPView from '@/modules/auth/VerifyOTPView'

export const metadata: Metadata = {
  title: 'Verify OTP',
  robots: { index: false, follow: false },
}

export default function VerifyOTPPage() {
  return <VerifyOTPView />
}
