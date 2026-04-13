import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Sidebar } from '@/components/ui/sidebar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireAuth()
  if (!userId) redirect('/login')

  const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
  const email = user[0]?.email || ''

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar email={email} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
