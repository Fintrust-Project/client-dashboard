import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const SITE_URL = 'https://www.indiainvestkaro.com'
const SITE_NAME = 'India Invest Karo'
const SITE_TITLE = 'India Invest Karo | Share Market Research, Market News & NISM Exam Prep'
const SITE_DESCRIPTION =
  'India Invest Karo (IndiaInvestKaro) helps you navigate the share market and stock market with AI-powered research analyst insights, live market news, mutual fund and insurance guidance, demat account opening assistance, and a complete NISM exam preparation guide with practice tests.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | India Invest Karo',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'India Invest Karo',
    'IndiaInvestKaro',
    'IndiaKaroInvest',
    'share market',
    'stock market',
    'share market India',
    'research analyst',
    'market news',
    'stock market news',
    'NISM exam preparation',
    'NISM practice test',
    'NISM certification',
    'mutual fund investment',
    'demat account opening',
    'stock market research',
    'AI market research',
    'company valuation',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/india-invest-karo-logo.png',
        width: 800,
        height: 300,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/india-invest-karo-logo.png'],
  },
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
