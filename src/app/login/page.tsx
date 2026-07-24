import type { Metadata } from 'next'
import LoginView from '@/modules/auth/LoginView'

export const metadata: Metadata = {
  title: 'Login',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginView />
}
