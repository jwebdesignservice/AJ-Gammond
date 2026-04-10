import Link from 'next/link'
import { ClipboardCheck, ShieldCheck, FileText, Bell } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
            <ClipboardCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AJ Gammond</h1>
          <p className="text-green-200 text-base">Daily Safety &amp; Maintenance Checklist</p>
        </div>

        {/* Feature bullets */}
        <div className="bg-white/10 rounded-2xl p-5 mb-8 space-y-3">
          {[
            { icon: ShieldCheck, text: 'Site induction & safety checks' },
            { icon: FileText, text: 'Machine daily inspection records' },
            { icon: Bell, text: 'Admin review & notifications' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/90 text-sm">
              <Icon className="w-4 h-4 flex-shrink-0 text-green-300" />
              {text}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-white text-[#1B4332] text-center px-5 py-3.5 rounded-xl font-bold text-base shadow hover:bg-green-50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="block w-full bg-white/20 text-white text-center px-5 py-3.5 rounded-xl font-semibold text-base border border-white/30 hover:bg-white/30 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  )
}
