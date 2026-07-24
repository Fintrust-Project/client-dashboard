'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PracticeTestView from '@/modules/practice-test/PracticeTestView'

interface PracticeTestPageProps {
  params: { courseId: string }
}

export default function PracticeTestPage({ params }: PracticeTestPageProps) {
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

  return <PracticeTestView courseId={params.courseId} />
}
