'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/')
      router.refresh()
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-[26px] font-semibold text-fg-primary tracking-tight mb-2">欢迎回来</h2>
      <p className="text-[14px] text-fg-muted mb-8">登录你的账号继续学习</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] text-fg-secondary mb-1.5">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-card text-sm focus:border-accent transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-[13px] text-fg-secondary mb-1.5">密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-card text-sm focus:border-accent transition-colors"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-accent text-fg-inverse text-[14px] font-semibold rounded-[10px] hover:bg-accent-hover transition-colors disabled:opacity-50 shadow-[0_2px_8px_rgba(88,86,214,0.25)]"
        >
          {loading ? '登录中...' : '登录'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-fg-muted">或</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-center text-[13px] text-fg-muted">
          还没有账号？
          <Link href="/register" className="text-accent font-semibold ml-1 hover:underline">注册</Link>
        </p>
      </form>
    </div>
  )
}
