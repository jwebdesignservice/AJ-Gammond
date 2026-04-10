'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClipboardCheck, LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { UserProfile } from '@/lib/types'

interface NavbarProps {
  user: UserProfile | null
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <nav className="bg-[#1B4332] border-b border-[#143728] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ClipboardCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-white font-bold text-sm tracking-wide">AJ Gammond</span>
              <span className="block text-green-300/70 text-[10px] font-medium tracking-widest uppercase">Safety Management</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/new"
              className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              New Checklist
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/dashboard/admin"
                className="px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Admin
              </Link>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-white/20 mx-2" />

            {/* User + sign out */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
                <div className="w-6 h-6 rounded-full bg-green-400/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-green-100">{initials}</span>
                </div>
                <span className="text-sm text-white/80 max-w-[120px] truncate">
                  {user?.name || user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-3 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/new"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              New Checklist
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/dashboard/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Admin
              </Link>
            )}
            <div className="pt-2 mt-2 border-t border-white/10">
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-green-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-green-100">{initials}</span>
                </div>
                <span className="text-sm text-white/60 truncate">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
