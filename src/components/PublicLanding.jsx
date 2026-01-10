import React from 'react'
import { Link } from 'react-router-dom'
import TickerTape from './TickerTape'
import logo from '../assets/logo.png'
import '../css/PublicLanding.css'

const PublicLanding = () => {
    return (
        <div className="landing-container">
            {/* Top Regulatory Banner */}
            <div className="regulatory-banner">
                India Invest Karo is a not a SEBI Registered Research Analyst
                Contact Information: Their official website is www.indiainvestkaro.com
            </div>

            {/* Main Header */}
            <header className="public-header">
                <div className="logo-section">
                    <img src={logo} alt="India Invest Karo" className="logo-img" />
                    <span className="company-name">India Invest Karo</span>
                </div>

                <nav className="nav-links">
                    <a href="#" className="nav-item active">Home</a>
                    <a href="#" className="nav-item">About Us</a>
                    <a href="#" className="nav-item">Services</a>
                    <a href="#" className="nav-item">Payment</a>
                    <a href="#" className="nav-item">Complaints</a>
                    <a href="#" className="nav-item">Contact Us</a>
                    <Link to="/login" className="nav-item">Login</Link>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">
                        We bring solutions <br />
                        to make life easier.
                    </h1>
                    <p className="hero-subtitle">
                        Explore our stock trading website for insights and tools <br />
                        to enhance your investment strategy.
                    </p>
                    <button className="cta-button">
                        Enquiry? Click here!
                    </button>

                    <div className="carousel-indicators">
                        <span className="indicator active"></span>
                        <span className="indicator"></span>
                        <span className="indicator"></span>
                    </div>
                </div>
            </section>

            {/* Bottom Ticker */}
            <div className="landing-footer">
                <TickerTape />
            </div>
        </div>
    )
}

export default PublicLanding
