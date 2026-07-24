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
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import TickerTape from './TickerTape'
import '@/css/PublicLanding.css'

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
      'Research-backed market insights and stock ideas to help inform your own investment decisions. Provided for informational and educational purposes only.',
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
  'Practice tests modeled on real NISM exam patterns',
  'Transparent communication — no guaranteed-return claims',
  'Dedicated support for every query',
]

const NoteItem = ({ text }: { text: string }) => (
  <div className="note-item">
    <div className="check-icon">✓</div>
    <div className="note-text">{text}</div>
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

  const [enquiryError, setEnquiryError] = useState('')
  const [enquirySubmitting, setEnquirySubmitting] = useState(false)

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

  return (
    <div className="landing-container">
      {/* Important Note Modal */}
      {showNote && (
        <div className="modal-overlay">
          <div className="note-modal">
            <button className="close-modal" onClick={() => setShowNote(false)}>
              ×
            </button>
            <div className="modal-header">
              <h2>Important Note!</h2>
            </div>
            <div className="note-list">
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
      <div className="regulatory-banner" onClick={handleBannerClick} style={{ cursor: 'pointer' }}>
        <div className="regulatory-content">
          India Invest Karo is a not a SEBI Registered Research Analyst Contact Information: Their
          official website is {SITE_URL}
        </div>
      </div>

      {/* Main Header */}
      <header className="public-header">
        <div className="logo-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="India Invest Karo" className="logo-img" />
        </div>

        <nav className="nav-links">
          <a href="#top" className="nav-item active" onClick={(e) => handleNavClick(e, 'top')}>Home</a>
          <a href="#about" className="nav-item" onClick={(e) => handleNavClick(e, 'about')}>About Us</a>
          <a href="#services" className="nav-item" onClick={(e) => handleNavClick(e, 'services')}>Services</a>
          <span className="nav-item nav-item-disabled" title="Coming soon">Payment</span>
          <a href="#grievance" className="nav-item" onClick={(e) => handleNavClick(e, 'grievance')}>Complaints</a>
          <a href="#contact" className="nav-item" onClick={(e) => handleNavClick(e, 'contact')}>Contact Us</a>
        </nav>

        <div className="login-section">
          <Link href="/login" className="login-button">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="top">
        <div className="hero-overlay"></div>
        <div className="hero-content" key={currentSlide}>
          <h1 className="hero-title">{SLIDES[currentSlide].title}</h1>
          <h2 className="hero-subtitle">{SLIDES[currentSlide].subtitle}</h2>
          <button className="cta-button" onClick={() => scrollToId('contact')}>
            Enquiry? Click here!
          </button>

          <div className="carousel-indicators">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`indicator ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                style={{ cursor: 'pointer' }}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="content-section about-section" id="about">
        <div className="section-inner">
          <span className="section-eyebrow">Who Are We?</span>
          <h2 className="section-title">Education-first investing, built for everyday Indians</h2>
          <p className="section-lead">
            India Invest Karo brings together market education, certification prep, and practical
            support to help you navigate your financial journey with clarity. From preparing for
            NISM certification exams to understanding mutual funds, insurance, and demat accounts,
            we focus on helping you learn and decide for yourself — not on making decisions for you.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="content-section services-section" id="services">
        <div className="section-inner">
          <span className="section-eyebrow">What We Offer</span>
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            {SERVICES.map((service) => {
              const Icon = service.icon
              return (
                <div className="service-card" key={service.title}>
                  <div className="service-icon">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="content-section why-section">
        <div className="section-inner">
          <span className="section-eyebrow">Why India Invest Karo</span>
          <h2 className="section-title">Built on transparency and education</h2>
          <div className="why-grid">
            {WHY_CHOOSE_US.map((point) => (
              <div className="why-item" key={point}>
                <CheckCircle2 size={22} className="why-icon" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry / Contact */}
      <section className="content-section contact-section" id="contact">
        <div className="section-inner contact-grid">
          <div className="contact-info">
            <span className="section-eyebrow">Get In Touch</span>
            <h2 className="section-title">Have a question? Reach out.</h2>
            <p className="section-lead">
              Fill out the form and our team will get back to you, or reach us directly using the
              details below.
            </p>
            <div className="contact-detail-list">
              <div className="contact-detail-item">
                <Mail size={20} />
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </div>
              <div className="contact-detail-item">
                <Phone size={20} />
                <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}>{SUPPORT_PHONE}</a>
              </div>
              <div className="contact-detail-item">
                <MapPin size={20} />
                <span>{SITE_URL}</span>
              </div>
            </div>
          </div>

          <form className="enquiry-form" onSubmit={handleEnquirySubmit}>
            {enquirySubmitted ? (
              <div className="enquiry-success">
                <CheckCircle2 size={32} />
                <p>
                  Thanks, {enquiry.name || 'there'}! We&apos;ve received your enquiry and our team
                  will reach out to you shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={enquiry.name}
                    onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={enquiry.email}
                    onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    required
                    value={enquiry.mobile}
                    onChange={(e) => setEnquiry({ ...enquiry, mobile: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    value={enquiry.message}
                    onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })}
                  />
                </div>
                {enquiryError && <div className="enquiry-error">{enquiryError}</div>}
                <button type="submit" className="enquiry-submit" disabled={enquirySubmitting}>
                  {enquirySubmitting ? 'Submitting...' : 'Enquire Now'}
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      {/* Grievance / Complaints */}
      <section className="content-section grievance-section" id="grievance">
        <div className="section-inner">
          <span className="section-eyebrow">Complaints</span>
          <h2 className="section-title">Grievance Redressal</h2>
          <p className="section-lead">
            For any queries, feedback, or complaints, please reach out to us directly and we&apos;ll
            do our best to help promptly.
          </p>
          <div className="contact-detail-list">
            <div className="contact-detail-item">
              <Mail size={20} />
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </div>
            <div className="contact-detail-item">
              <Phone size={20} />
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}>{SUPPORT_PHONE}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="section-inner footer-grid">
          <div className="footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="India Invest Karo" className="footer-logo" />
            <p>
              India Invest Karo is not a SEBI Registered Research Analyst. All information provided
              is for educational and informational purposes only and does not constitute investment
              advice.
            </p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')}>About Us</a>
            <a href="#services" onClick={(e) => handleNavClick(e, 'services')}>Services</a>
            <a href="#grievance" onClick={(e) => handleNavClick(e, 'grievance')}>Complaints</a>
            <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')}>Contact Us</a>
          </div>

          <div className="footer-links">
            <h4>Policies</h4>
            <span className="footer-link-disabled" title="Coming soon">Disclaimer</span>
            <span className="footer-link-disabled" title="Coming soon">Privacy Policy</span>
            <span className="footer-link-disabled" title="Coming soon">Refund Policy</span>
            <span className="footer-link-disabled" title="Coming soon">Payment</span>
          </div>

          <div className="footer-links">
            <h4>Contact</h4>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}>{SUPPORT_PHONE}</a>
            <span>{SITE_URL}</span>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} India Invest Karo. All rights reserved.
        </div>
      </footer>

      {/* Bottom Ticker */}
      <div className="landing-footer">
        <TickerTape />
      </div>
    </div>
  )
}

export default PublicLanding
