'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

type Status = 'PENDING' | 'CONTACTED' | 'RESOLVED'

interface EnquiryRow {
  id: number
  name: string
  email: string
  mobile: string
  message: string | null
  status: Status
  created_at: string
}

const STATUS_OPTIONS: Status[] = ['PENDING', 'CONTACTED', 'RESOLVED']

// PENDING: not yet contacted. CONTACTED: a rep has called the lead.
// RESOLVED: the enquiry is closed out. Mirrors prisma/schema.prisma's EnquiryStatus.
const STATUS_STYLES: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
}

const EnquiriesView = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([])
  const [fetching, setFetching] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role !== 'ADMIN') return

    const fetchEnquiries = async () => {
      setFetching(true)
      setError('')
      try {
        const res = await fetch('/api/enquiries')
        const data = await res.json()
        if (res.ok) {
          setEnquiries(data.enquiries)
        } else {
          setError(data.message || 'Failed to load enquiries')
        }
      } catch {
        setError('Failed to load enquiries')
      } finally {
        setFetching(false)
      }
    }

    fetchEnquiries()
  }, [user])

  const handleStatusChange = async (id: number, status: Status) => {
    setUpdatingId(id)
    setError('')
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
      } else {
        setError(data.message || 'Failed to update status')
      }
    } catch {
      setError('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
            <p className="text-sm text-slate-500">
              Leads from the home page enquiry form. Update status as your team follows up.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:self-auto"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Mobile</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetching ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No enquiries yet.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr key={enq.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{enq.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <a href={`mailto:${enq.email}`} className="hover:text-blue-600">
                        {enq.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <a href={`tel:${enq.mobile}`} className="hover:text-blue-600">
                        {enq.mobile}
                      </a>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-slate-600" title={enq.message || ''}>
                      {enq.message || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(enq.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={enq.status}
                        disabled={updatingId === enq.id}
                        onChange={(e) => handleStatusChange(enq.id, e.target.value as Status)}
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 ${STATUS_STYLES[enq.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EnquiriesView
