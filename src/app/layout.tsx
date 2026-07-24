import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'
import '../css/index.css'

export const metadata: Metadata = {
  title: 'India Invest Karo - Client Dashboard',
  description: 'Financial Management System - Investing in Your Future',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
