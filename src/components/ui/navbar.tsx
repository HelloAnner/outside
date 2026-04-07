'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-light tracking-wide">
          Outside
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/vocabulary"
            className={`text-sm ${pathname === '/vocabulary' ? 'text-foreground' : 'text-secondary hover:text-foreground'} transition-colors`}
          >
            生词本
          </Link>
          <Link
            href="/settings"
            className={`text-sm ${pathname === '/settings' ? 'text-foreground' : 'text-secondary hover:text-foreground'} transition-colors`}
          >
            设置
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-secondary hover:text-foreground transition-colors"
          >
            退出
          </button>
        </nav>
      </div>
    </header>
  )
}
