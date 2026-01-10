import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TickerTape from './TickerTape'
import logo from '../assets/logo.png'
import '../css/PublicLanding.css'

const PublicLanding = () => {
    const navigate = useNavigate();
    const [showNote, setShowNote] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const lastClickTime = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setShowNote(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleBannerClick = () => {
        const now = Date.now();
        if (now - lastClickTime.current < 500) {
            const newCount = clickCount + 1;
            if (newCount >= 5) {
                navigate('/login');
            }
            setClickCount(newCount);
        } else {
            setClickCount(1);
        }
        lastClickTime.current = now;
    };

    const NoteItem = ({ text }) => (
        <div className="note-item">
            <div className="check-icon">✓</div>
            <div className="note-text">{text}</div>
        </div>
    );

    return (
        <div className="landing-container">
            {/* Important Note Modal */}
            {showNote && (
                <div className="modal-overlay">
                    <div className="note-modal">
                        <button className="close-modal" onClick={() => setShowNote(false)}>×</button>
                        <div className="modal-header">
                            <h2>Important Note!</h2>
                        </div>
                        <div className="note-list">
                            <NoteItem text="Our Official website is www.indiainvestkaro.com, E-Mail Id: support@indiainvestkaro.com; Our Official Support Contact No.: +91 9206915470" />
                            <NoteItem text="We Do Not Offer Any Assured / Guaranteed / Profit Sharing / Demat Account Or Broking Services / Portfolio Management Services. Clients are never asked for their Banking Or Broking Credentials at India Invest Karo." />
                            <NoteItem text="Do Not Share Your Credit Card / Debit Card / Netbanking Credentials / Demat Account Credentials With Any Of Our Employee. If you are being asked then inform us on +91 9206915470 or E-Mail us at support@indiainvestkaro.com" />
                            <NoteItem text="We accept payments only in registered BANK ACCOUNT. Please check on 'Payment' in our website to get our Bank Details." />
                            <NoteItem text="Investing In The Market Is Subject To Market Risk Hence Read All Our Disclaimer And T&C Carefully Before Investing." />
                        </div>
                    </div>
                </div>
            )}

            {/* Top Regulatory Banner */}
            <div className="regulatory-banner" onClick={handleBannerClick} style={{ cursor: 'pointer' }}>
                <div className="regulatory-content">
                    India Invest Karo is a not a SEBI Registered Research Analyst
                    Contact Information: Their official website is www.indiainvestkaro.com
                </div>
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
