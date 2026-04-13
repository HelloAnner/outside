'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) { setError('两次密码不一致'); return }
    if (password.length < 8) { setError('密码至少 8 位'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
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
      <h2 className="text-xl font-semibold text-fg-primary mb-1">创建账号</h2>
      <p className="text-sm text-fg-muted mb-8">注册开始你的英语阅读之旅</p>

      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="至少 8 位"
          />
        </div>
        <div>
          <label className="block text-[13px] text-fg-secondary mb-1.5">确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-card text-sm focus:border-accent transition-colors"
            placeholder="再次输入密码"
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-accent text-fg-inverse text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? '注册中...' : '注册'}
        </button>
        <p className="text-center text-[13px] text-fg-muted pt-2">
          已有账号？
          <Link href="/login" className="text-accent font-medium ml-1 hover:underline">登录</Link>
        </p>
      </form>
    </div>
  )
}
