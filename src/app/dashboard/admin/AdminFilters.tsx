'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'

export default function AdminFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [type, setType] = useState(searchParams.get('type') || 'all')
  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo] = useState(searchParams.get('to') || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (type !== 'all') params.set('type', type)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    
    router.push(`/dashboard/admin?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setType('all')
    setFrom('')
    setTo('')
    router.push('/dashboard/admin')
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email..."
              className="input !pl-9"
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
            <option value="needs_review">Needs Review</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
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
