import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { NavBar } from '@/components/ui/navbar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireAuth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
