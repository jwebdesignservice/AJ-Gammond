'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClipboardCheck, LogOut, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'
import { UserProfile } from '@/lib/types'

interface NavbarProps {
  user: UserProfile | null
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', exact: true },
    { href: '/dashboard/new', label: 'New Checklist' },
    { href: '/dashboard/site-record', label: 'Site Record' },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="bg-[#1B4332] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-wide hidden sm:block">AJ Gammond</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                  isActive(link.href, link.exact)
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                href="/dashboard/admin"
                className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard/admin')
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shield className="w-3 h-3" />
                Admin
              </Link>
            )}
          </div>

          {/* User + sign out */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10">
              <div className="w-5 h-5 rounded-full bg-green-400/30 flex items-center justify-center">
                <span className="text-[9px] font-bold text-green-100">{initials}</span>
              </div>
              <span className="text-[13px] text-white/80 max-w-[100px] truncate">
                {user?.name?.split(' ')[0] || user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-white/50 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
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
          <div className="md:hidden border-t border-white/10 py-2 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href, link.exact)
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                href="/dashboard/admin"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/dashboard/admin')
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            <div className="pt-2 mt-1 border-t border-white/10">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-400/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-green-100">{initials}</span>
                  </div>
                  <span className="text-sm text-white/60 truncate">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
