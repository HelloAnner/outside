'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface Topic {
  id: string
  name: string
  slug: string
  description: string
  isBuiltin: boolean
  articlesCount: number
  contentFormat: string
}

interface RecentArticle {
  id: string
  title: string
  topicId: string
  topicName: string
  difficulty: number
  wordCount: number
  createdAt: Date | null
  sequence: number
}

interface Props {
  topics: Topic[]
  recentArticles: RecentArticle[]
  stats: { total: number; weekNew: number; needReview: number }
}

function timeAgo(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${Math.floor(days / 30)}月前`
}

export function HomeClient({ topics, recentArticles, stats }: Props) {
  const router = useRouter()
  const [freeInput, setFreeInput] = useState('')
  const [generating, setGenerating] = useState(false)

  const builtinTopics = topics.filter(t => t.isBuiltin)
  const customTopics = topics.filter(t => !t.isBuiltin)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: '已学单词', value: stats.total },
          { label: '本周新增', value: stats.weekNew },
          { label: '待复习', value: stats.needReview },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border p-5">
            <div className="text-2xl font-light">{s.value}</div>
            <div className="text-xs text-secondary mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Topic Grid */}
      <section className="mb-12">
        <h2 className="text-xs text-secondary tracking-widest uppercase mb-5">选择主题，生成新文章</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {builtinTopics.map(t => (
            <Link
              key={t.id}
              href={`/topics/${t.id}`}
              className="bg-card border border-border p-4 hover:border-accent transition-colors group"
            >
              <div className="text-sm font-medium group-hover:text-accent">{t.name}</div>
              <div className="text-xs text-secondary mt-2">已读 {t.articlesCount} 篇</div>
            </Link>
          ))}
          {customTopics.map(t => (
            <Link
              key={t.id}
              href={`/topics/${t.id}`}
              className="bg-card border border-border p-4 hover:border-accent transition-colors group"
            >
              <div className="text-sm font-medium group-hover:text-accent">{t.name}</div>
              <div className="text-xs text-secondary mt-2">已读 {t.articlesCount} 篇</div>
            </Link>
          ))}
          <Link
            href="/topics/new"
            className="border border-dashed border-border p-4 hover:border-accent transition-colors flex items-center justify-center"
          >
            <span className="text-sm text-secondary">+ 新建主题</span>
          </Link>
        </div>
      </section>

      {/* Free topic input */}
      <section className="mb-12">
        <div className="relative">
          <input
            type="text"
            value={freeInput}
            onChange={e => setFreeInput(e.target.value)}
            placeholder="自由主题：描述你想读什么..."
            className="w-full px-4 py-3 border border-border bg-card text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && freeInput.trim()) {
                router.push(`/topics/new?name=${encodeURIComponent(freeInput)}&format=free`)
              }
            }}
          />
        </div>
      </section>

      {/* Recent articles */}
      {recentArticles.length > 0 && (
        <section>
          <h2 className="text-xs text-secondary tracking-widest uppercase mb-5">最近阅读</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentArticles.map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="bg-card border border-border p-4 hover:border-accent transition-colors"
              >
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-secondary mt-2">
                  {a.topicName} · Lv.{a.difficulty} · {a.wordCount} 词 · {timeAgo(a.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
