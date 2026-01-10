import '../css/index.css'
import { AuthProvider } from '../context/AuthContext'

export const metadata = {
    title: 'Client Dashboard',
    description: 'Financial Management System',
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
