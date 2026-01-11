import '../css/index.css'
import { AuthProvider } from '../context/AuthContext'

export const metadata = {
    title: 'India Invest Karo - Client Dashboard',
    description: 'Financial Management System - Investing in Your Future',
    icons: {
        icon: '/favicon.png',
        apple: '/favicon.png',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
