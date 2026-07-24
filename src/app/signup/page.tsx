import type { Metadata } from 'next'
import SignupView from '@/modules/auth/SignupView'

export const metadata: Metadata = {
  title: 'Sign Up',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return <SignupView />
}
