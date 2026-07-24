'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  PieChart,
  ShieldCheck,
  Wallet,
  GraduationCap,
  BrainCircuit,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import TickerTape from './TickerTape'

const logo = '/india-invest-karo-logo.png'

const SUPPORT_EMAIL = 'support@indiainvestkaro.com'
const SUPPORT_PHONE = '+91 9128371439'
const SITE_URL = 'www.indiainvestkaro.com'

interface Slide {
  title: React.ReactNode
  subtitle: React.ReactNode
}

const SLIDES: Slide[] = [
  {
    title: <>Trusted Research <br /> Driven Analysis.</>,
    subtitle: (
      <>
        Get comprehensive market insights and research-backed data to <br /> make informed decisions
        in the ever-evolving stock market.
      </>
    ),
  },
  {
    title: <>Your gateway to <br /> smart investing starts here.</>,
    subtitle: (
      <>
        Discover the potential of stock trading with our user-friendly <br /> platform designed for
        both beginners and seasoned investors alike.
      </>
    ),
  },
  {
    title: <>Master the Markets <br /> with India Invest Karo.</>,
    subtitle: (
      <>
        Access expert tools and real-time updates to navigate <br /> market volatility and unlock
        your financial potential.
      </>
    ),
  },
]

interface ServiceItem {
  icon: LucideIcon
  title: string
  description: string
}

const SERVICES: ServiceItem[] = [
  {
    icon: TrendingUp,
    title: 'Stock Suggestion',
    description:
      'Research-backed market insights and AI-assisted stock ideas to help inform your own investment decisions. Provided for informational and educational purposes only.',
  },
  {
    icon: BrainCircuit,
    title: 'AI-Powered Market Research',
    description:
      'We use Artificial Intelligence alongside human research to support in-depth market research, company valuation, and identifying potentially favorable entry and exit points. Data-driven, always reviewed — for informational and educational purposes only.',
  },
  {
    icon: PieChart,
    title: 'Mutual Fund',
    description:
      'Guidance on selecting mutual fund schemes that align with your financial goals, risk appetite, and investment horizon.',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance',
    description:
      'Assistance choosing the right life, health, and general insurance cover to protect what matters most to you and your family.',
  },
  {
    icon: Wallet,
    title: 'Demat Account Opening',
    description:
      'Guided, hassle-free assistance opening a demat and trading account so you can start participating in the markets with confidence.',
  },
  {
    icon: GraduationCap,
    title: 'NISM Exam — Complete Guide',
    description:
      'End-to-end NISM certification preparation: structured study material and practice tests modeled closely on the real exam pattern.',
  },
]

const WHY_CHOOSE_US = [
  'Education-first approach to investing and certification prep',
  'AI-assisted research and valuation, reviewed by our team',
  'Practice tests modeled on real NISM exam patterns',
  'Transparent communication — no guaranteed-return claims',
  'Dedicated support for every query',
]

const NoteItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3.5">
    <div className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
      ✓
    </div>
    <div className="text-sm font-medium leading-relaxed text-slate-600">{text}</div>
  </div>
)

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const PublicLanding = () => {
  const router = useRouter()
  const [showNote, setShowNote] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [clickCount, setClickCount] = useState(0)
  const lastClickTime = useRef(0)

  const [enquiry, setEnquiry] = useState({ name: '', email: '', mobile: '', message: '' })
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [enquiryError, setEnquiryError] = useState('')
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)

  useEffect(() => {
    const modalTimer = setTimeout(() => setShowNote(true), 1000)
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => {
      clearTimeout(modalTimer)
      clearInterval(slideTimer)
    }
  }, [])

  const handleBannerClick = () => {
    const now = Date.now()
    if (now - lastClickTime.current < 500) {
      const newCount = clickCount + 1
      if (newCount >= 5) {
        router.push('/login')
      }
      setClickCount(newCount)
    } else {
      setClickCount(1)
    }
    lastClickTime.current = now
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    scrollToId(id)
  }

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnquiryError('')
    setEnquirySubmitting(true)

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry),
      })
      const data = await res.json()

      if (data.success) {
        setEnquirySubmitted(true)
      } else {
        setEnquiryError(data.message || 'Failed to submit enquiry. Please try again.')
      }
    } catch {
      setEnquiryError('Failed to submit enquiry. Please try again.')
    } finally {
      setEnquirySubmitting(false)
    }
  }

  const inputClasses =
    'w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0f172a] text-white">
      {/* Important Note Modal */}
      {showNote && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-[650px] animate-[modalPop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] rounded-2xl bg-white p-6 shadow-2xl sm:p-10">
            <button
              onClick={() => setShowNote(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 transition hover:rotate-90 hover:bg-slate-200 hover:text-slate-900"
            >
              ×
            </button>
            <div className="mb-7 text-center">
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Important Note!</h2>
            </div>
            <div className="flex flex-col gap-4">
              <NoteItem text={`Our Official website is ${SITE_URL}, E-Mail Id: ${SUPPORT_EMAIL}; Our Official Support Contact No.: ${SUPPORT_PHONE}`} />
              <NoteItem text="We Do Not Offer Any Assured / Guaranteed / Profit Sharing / Demat Account Or Broking Services / Portfolio Management Services. Clients are never asked for their Banking Or Broking Credentials at India Invest Karo." />
              <NoteItem text={`Do Not Share Your Credit Card / Debit Card / Netbanking Credentials / Demat Account Credentials With Any Of Our Employee. If you are being asked then inform us on ${SUPPORT_PHONE} or E-Mail us at ${SUPPORT_EMAIL}`} />
              <NoteItem text="We accept payments only in registered BANK ACCOUNT. Please check on 'Payment' in our website to get our Bank Details." />
              <NoteItem text="Investing In The Market Is Subject To Market Risk Hence Read All Our Disclaimer And T&C Carefully Before Investing." />
            </div>
          </div>
        </div>
      )}

      {/* Top Regulatory Banner */}
      <div
        onClick={handleBannerClick}
        className="cursor-pointer overflow-hidden whitespace-nowrap border-b border-slate-200 bg-white py-2.5 text-sm font-medium text-red-500"
      >
        <div className="inline-block animate-[marquee_20s_linear_infinite] pl-[100%]">
          India Invest Karo is a not a SEBI Registered Research Analyst Contact Information: Their
          official website is {SITE_URL}
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-[1000] flex flex-col gap-2.5 bg-[#fdfbf7] px-4 py-2.5 shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-[5%]">
        <div className="flex w-full items-center justify-between sm:w-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="India Invest Karo" className="relative z-[1001] -mb-3 mt-1 h-16 sm:h-28" />
        </div>

        <nav className="flex w-full gap-4 overflow-x-auto pb-1 sm:w-auto sm:gap-8 sm:overflow-visible sm:pb-0">
          <a href="#top" onClick={(e) => handleNavClick(e, 'top')} className="whitespace-nowrap text-sm font-semibold text-blue-500">
            Home
          </a>
          <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="whitespace-nowrap text-sm font-semibold text-slate-500 transition hover:text-blue-500">
            About Us
          </a>
          <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className="whitespace-nowrap text-sm font-semibold text-slate-500 transition hover:text-blue-500">
            Services
          </a>
          <span title="Coming soon" className="whitespace-nowrap text-sm font-semibold text-slate-300">
            Payment
          </span>
          <a href="#grievance" onClick={(e) => handleNavClick(e, 'grievance')} className="whitespace-nowrap text-sm font-semibold text-slate-500 transition hover:text-blue-500">
            Complaints
          </a>
          <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="whitespace-nowrap text-sm font-semibold text-slate-500 transition hover:text-blue-500">
            Contact Us
          </a>
        </nav>

        <div className="flex w-full justify-end sm:w-auto">
          <Link
            href="/login"
            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="top"
        className="relative flex min-h-[550px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-10 text-center sm:min-h-[650px] sm:px-[5%] sm:py-16"
      >
        <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div key={currentSlide} className="relative z-[2] max-w-3xl animate-[fadeInUp_0.8s_ease-out]">
          <h1 className="mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-extrabold leading-tight text-transparent sm:text-5xl lg:text-6xl">
            {SLIDES[currentSlide].title}
          </h1>
          <h2 className="mb-8 text-base leading-relaxed text-slate-400 sm:mb-10 sm:text-xl">
            {SLIDES[currentSlide].subtitle}
          </h2>
          <button
            onClick={() => scrollToId('contact')}
            className="rounded-full bg-pink-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-pink-500/30 transition hover:-translate-y-1 hover:bg-pink-600 hover:shadow-2xl hover:shadow-pink-500/40 sm:px-8 sm:py-4 sm:text-lg"
          >
            Enquiry? Click here!
          </button>

          <div className="mt-10 flex justify-center gap-2.5 sm:mt-16">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 cursor-pointer rounded-full transition-all ${
                  currentSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/30'
                }`}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="scroll-mt-[90px] bg-slate-50 px-4 py-14 sm:px-[5%] sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-blue-500">
            Who Are We?
          </span>
          <h2 className="mb-5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Education-first investing, built for everyday Indians
          </h2>
          <p className="max-w-[720px] text-base leading-relaxed text-slate-600">
            India Invest Karo brings together market education, certification prep, and practical
            support to help you navigate your financial journey with clarity. From preparing for
            NISM certification exams to understanding mutual funds, insurance, and demat accounts,
            we focus on helping you learn and decide for yourself — not on making decisions for you.
          </p>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-[90px] bg-white px-4 py-14 sm:px-[5%] sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-blue-500">
            What We Offer
          </span>
          <h2 className="mb-5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Our Services
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.title}
                  className="rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl sm:p-8"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="mb-2.5 text-lg font-bold text-slate-900">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{service.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-14 text-white sm:px-[5%] sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-blue-500">
            Why India Invest Karo
          </span>
          <h2 className="mb-5 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
            Built on transparency and education
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {WHY_CHOOSE_US.map((point) => (
              <div
                key={point}
                className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-slate-800/70 p-5 font-semibold"
              >
                <CheckCircle2 size={22} className="shrink-0 text-green-400" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry / Contact */}
      <section id="contact" className="scroll-mt-[90px] bg-slate-50 px-4 py-14 sm:px-[5%] sm:py-20">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-blue-500">
              Get In Touch
            </span>
            <h2 className="mb-5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Have a question? Reach out.
            </h2>
            <p className="max-w-[720px] text-base leading-relaxed text-slate-600">
              Fill out the form and our team will get back to you, or reach us directly using the
              details below.
            </p>
            <div className="mt-7 flex flex-col gap-4">
              <div className="flex items-center gap-3 font-semibold text-slate-700">
                <Mail size={20} className="shrink-0 text-blue-500" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-blue-500">
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-3 font-semibold text-slate-700">
                <Phone size={20} className="shrink-0 text-blue-500" />
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="hover:text-blue-500">
                  {SUPPORT_PHONE}
                </a>
              </div>
              <div className="flex items-center gap-3 font-semibold text-slate-700">
                <MapPin size={20} className="shrink-0 text-blue-500" />
                <span>{SITE_URL}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleEnquirySubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            {enquirySubmitted ? (
              <div className="py-5 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-3 text-green-600" />
                <p className="text-sm leading-relaxed text-slate-700">
                  Thanks, {enquiry.name || 'there'}! We&apos;ve received your enquiry and our team
                  will reach out to you shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={enquiry.name}
                    onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={enquiry.email}
                    onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    required
                    value={enquiry.mobile}
                    onChange={(e) => setEnquiry({ ...enquiry, mobile: e.target.value })}
                    className={inputClasses}
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    value={enquiry.message}
                    onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })}
                    className={`${inputClasses} resize-y`}
                  />
                </div>
                {enquiryError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {enquiryError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="w-full rounded-lg bg-blue-500 py-3.5 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {enquirySubmitting ? 'Submitting...' : 'Enquire Now'}
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      {/* Grievance / Complaints */}
      <section id="grievance" className="scroll-mt-[90px] bg-white px-4 py-14 sm:px-[5%] sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-blue-500">
            Complaints
          </span>
          <h2 className="mb-5 text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Grievance Redressal
          </h2>
          <p className="max-w-[720px] text-base leading-relaxed text-slate-600">
            For any queries, feedback, or complaints, please reach out to us directly and we&apos;ll
            do our best to help promptly.
          </p>
          <div className="mt-7 flex flex-col gap-4">
            <div className="flex items-center gap-3 font-semibold text-slate-700">
              <Mail size={20} className="shrink-0 text-blue-500" />
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-blue-500">
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-3 font-semibold text-slate-700">
              <Phone size={20} className="shrink-0 text-blue-500" />
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="hover:text-blue-500">
                {SUPPORT_PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] px-4 pt-12 text-slate-400 sm:px-[5%] sm:pt-16">
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-8 border-b border-white/10 pb-10 sm:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="India Invest Karo" className="h-14" />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              India Invest Karo is not a SEBI Registered Research Analyst. All information provided
              is for educational and informational purposes only and does not constitute investment
              advice.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="mb-2 text-sm text-white">Quick Links</h4>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="text-sm text-slate-400 transition hover:text-blue-500">
              About Us
            </a>
            <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className="text-sm text-slate-400 transition hover:text-blue-500">
              Services
            </a>
            <a href="#grievance" onClick={(e) => handleNavClick(e, 'grievance')} className="text-sm text-slate-400 transition hover:text-blue-500">
              Complaints
            </a>
            <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="text-sm text-slate-400 transition hover:text-blue-500">
              Contact Us
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="mb-2 text-sm text-white">Policies</h4>
            <span title="Coming soon" className="text-sm text-slate-600">Disclaimer</span>
            <span title="Coming soon" className="text-sm text-slate-600">Privacy Policy</span>
            <span title="Coming soon" className="text-sm text-slate-600">Refund Policy</span>
            <span title="Coming soon" className="text-sm text-slate-600">Payment</span>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="mb-2 text-sm text-white">Contact</h4>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-slate-400 transition hover:text-blue-500">
              {SUPPORT_EMAIL}
            </a>
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="text-sm text-slate-400 transition hover:text-blue-500">
              {SUPPORT_PHONE}
            </a>
            <span className="text-sm text-slate-400">{SITE_URL}</span>
          </div>
        </div>

        <div className="mx-auto mb-[78px] max-w-[1100px] py-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} India Invest Karo. All rights reserved.
        </div>
      </footer>

      {/* Bottom Ticker */}
      <div className="fixed inset-x-0 bottom-0 z-[1000] bg-black">
        <TickerTape />
      </div>
    </div>
  )
}

export default PublicLanding
