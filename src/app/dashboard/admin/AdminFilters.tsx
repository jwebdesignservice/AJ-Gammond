'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 30 Days', value: '30d' },
]

function getDateFrom(range: string): string {
  const now = new Date()
  switch (range) {
    case 'today':
      return now.toISOString().split('T')[0]
    case '7d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d.toISOString().split('T')[0]
    }
    case 'month': {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    }
    default:
      return ''
  }
}

export default function AdminFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [type, setType] = useState(searchParams.get('type') || 'all')
  const [dateRange, setDateRange] = useState(searchParams.get('range') || 'all')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (type !== 'all') params.set('type', type)
    if (dateRange !== 'all') {
      params.set('range', dateRange)
      params.set('from', getDateFrom(dateRange))
    }

    router.push(`/dashboard/admin?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setType('all')
    setDateRange('all')
    router.push('/dashboard/admin')
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email..."
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input"
          >
            <option value="all">All</option>
            <option value="checklist">Checklists</option>
            <option value="site_record">Site Records</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={applyFilters} className="btn-primary">
          Apply Filters
        </button>
        <button onClick={clearFilters} className="btn-secondary">
          Clear
        </button>
      </div>
    </div>
  )
}
