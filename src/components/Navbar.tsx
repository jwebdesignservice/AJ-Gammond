'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClipboardCheck, LogOut, Menu, X } from 'lucide-react'
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

  return (
    <nav className="bg-[#1B4332] text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            <span className="font-semibold">AJ Gammond</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
              Dashboard
            </Link>
            <Link href="/dashboard/new" className="hover:opacity-80 transition-opacity">
              New Checklist
            </Link>
            {user?.role === 'admin' && (
              <Link href="/dashboard/admin" className="hover:opacity-80 transition-opacity">
                Admin
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block py-2 hover:opacity-80"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/new"
              onClick={() => setMenuOpen(false)}
              className="block py-2 hover:opacity-80"
            >
              New Checklist
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/dashboard/admin"
                onClick={() => setMenuOpen(false)}
                className="block py-2 hover:opacity-80"
              >
                Admin
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 py-2 hover:opacity-80"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
