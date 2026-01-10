'use client'
import React from 'react';
import Link from 'next/link';
import '../css/NotFound.css';

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page Not Found</h2>
                <p className="not-found-text">
                    The link you followed might be broken, or the page may have been removed.
                </p>
                <div className="not-found-actions">
                    <Link href="/" className="home-button">Go Back Home</Link>
                </div>
            </div>
            <div className="footer-decoration">
                <p>India Invest Karo - Excellence in Financial Research</p>
            </div>
        </div>
    );
}
