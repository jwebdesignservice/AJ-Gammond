import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#1B4332] rounded-[4px] flex items-center justify-center mx-auto mb-6">
          <ClipboardCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AJ Gammond</h1>
        <p className="text-gray-600 mb-8">Safety & Maintenance Checklist System</p>
        
        <div className="space-y-3">
          <Link href="/login" className="btn-primary block w-full text-center">
            Sign In
          </Link>
          <Link href="/register" className="btn-secondary block w-full text-center">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  )
}
