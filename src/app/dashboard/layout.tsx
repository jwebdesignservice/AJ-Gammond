import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { UserProfile } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userProfile: UserProfile | null = profile ? {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    created_at: profile.created_at,
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userProfile} />
      <main className="max-w-6xl mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
