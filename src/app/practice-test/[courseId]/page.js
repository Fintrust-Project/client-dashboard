'use client'
import { useAuth } from '../../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PracticeTest from '../../../components/PracticeTest'

export default function PracticeTestPage({ params }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Verifying session...</p>
            </div>
        )
    }

    if (!user) return null

    return <PracticeTest courseId={params.courseId} />
}
