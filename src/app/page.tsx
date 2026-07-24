import PublicLanding from '@/modules/shared/PublicLanding'

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.indiainvestkaro.com/#organization',
      name: 'India Invest Karo',
      alternateName: ['IndiaInvestKaro', 'IndiaKaroInvest'],
      url: 'https://www.indiainvestkaro.com',
      logo: 'https://www.indiainvestkaro.com/india-invest-karo-logo.png',
      description:
        'India Invest Karo helps you navigate the share market and stock market with AI-powered research analyst insights, market news, mutual fund and insurance guidance, demat account opening assistance, and NISM exam preparation.',
      email: 'support@indiainvestkaro.com',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9128371439',
        contactType: 'customer support',
        email: 'support@indiainvestkaro.com',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.indiainvestkaro.com/#website',
      url: 'https://www.indiainvestkaro.com',
      name: 'India Invest Karo',
      alternateName: ['IndiaInvestKaro', 'IndiaKaroInvest'],
      publisher: { '@id': 'https://www.indiainvestkaro.com/#organization' },
      inLanguage: 'en-IN',
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <PublicLanding />
    </>
  )
}
