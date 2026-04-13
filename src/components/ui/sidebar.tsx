'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  email: string
}

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: 'home', match: (p: string) => p === '/' },
  { href: '/', label: '阅读', icon: 'book', match: (p: string) => p.startsWith('/topics') || p.startsWith('/articles') },
  { href: '/vocabulary', label: '生词本', icon: 'vocabulary', match: (p: string) => p.startsWith('/vocabulary') },
  { href: '/settings', label: '设置', icon: 'settings', match: (p: string) => p.startsWith('/settings') },
]

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--accent)' : 'var(--fg-muted)'
  switch (name) {
    case 'home':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l6-4.5L14 6v7.5a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" />
          <path d="M6 14.5V8h4v6.5" />
        </svg>
      )
    case 'book':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 2.5h4a2 2 0 012 2v9a1.5 1.5 0 00-1.5-1.5H2v-9.5z" />
          <path d="M14 2.5h-4a2 2 0 00-2 2v9a1.5 1.5 0 011.5-1.5H14v-9.5z" />
        </svg>
      )
    case 'vocabulary':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="12" height="12" rx="1.5" />
          <path d="M5.5 5.5h5M5.5 8h3.5M5.5 10.5h5" />
        </svg>
      )
    case 'settings':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2" />
          <path d="M13.1 10a1.1 1.1 0 00.2 1.2l.04.04a1.33 1.33 0 11-1.89 1.89l-.04-.04a1.1 1.1 0 00-1.2-.2 1.1 1.1 0 00-.67 1.01v.11a1.33 1.33 0 11-2.67 0v-.06A1.1 1.1 0 006 13.1a1.1 1.1 0 00-1.2.2l-.04.04a1.33 1.33 0 11-1.89-1.89l.04-.04a1.1 1.1 0 00.2-1.2 1.1 1.1 0 00-1.01-.67h-.11a1.33 1.33 0 110-2.67h.06A1.1 1.1 0 002.9 6a1.1 1.1 0 00-.2-1.2l-.04-.04a1.33 1.33 0 111.89-1.89l.04.04a1.1 1.1 0 001.2.2h.05a1.1 1.1 0 00.67-1.01v-.11a1.33 1.33 0 112.67 0v.06a1.1 1.1 0 00.67.95 1.1 1.1 0 001.2-.2l.04-.04a1.33 1.33 0 111.89 1.89l-.04.04a1.1 1.1 0 00-.2 1.2v.05a1.1 1.1 0 001.01.67h.11a1.33 1.33 0 010 2.67h-.06a1.1 1.1 0 00-.95.67z" />
        </svg>
      )
    default:
      return null
  }
}

export function Sidebar({ email }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-[200px] shrink-0 h-screen bg-surface-card border-r border-border flex flex-col sticky top-0">
      <div className="px-3 pt-5 pb-0">
        <Link href="/" className="block px-3">
          <span className="text-[17px] font-bold tracking-tight text-accent" style={{ fontFamily: 'Geist, sans-serif' }}>
            Outside
          </span>
        </Link>
      </div>

      <div className="h-7" />

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 h-[38px] rounded-lg text-[13px] transition-colors ${
                active
                  ? 'bg-accent-light text-accent font-medium'
                  : 'text-fg-secondary hover:bg-surface-secondary'
              }`}
            >
              <NavIcon name={item.icon} active={active} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="px-3 pb-5">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg">
          <div className="w-[30px] h-[30px] rounded-full bg-accent flex items-center justify-center text-fg-inverse text-xs font-medium shrink-0">
            {email[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-xs text-fg-secondary truncate">{email}</span>
        </div>
      </div>
    </aside>
  )
}
