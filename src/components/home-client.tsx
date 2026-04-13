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

const TOPIC_ICONS: Record<string, { emoji: string; bg: string }> = {
  '日常口语': { emoji: '💬', bg: '#EEF0FF' },
  '职场英语': { emoji: '💼', bg: '#FFF3E0' },
  '雅思备考': { emoji: '📝', bg: '#E8F5E9' },
  '科技前沿': { emoji: '🔬', bg: '#E3F2FD' },
  '故事阅读': { emoji: '📖', bg: '#FCE4EC' },
}

function getTopicIcon(name: string) {
  return TOPIC_ICONS[name] || { emoji: '📖', bg: '#F5F5F7' }
}

export function HomeClient({ topics, recentArticles, stats }: Props) {
  const router = useRouter()
  const [freeInput, setFreeInput] = useState('')

  const builtinTopics = topics.filter(t => t.isBuiltin)
  const customTopics = topics.filter(t => !t.isBuiltin)

  // Find a recommended topic (first builtin with most articles, or first)
  const recommended = builtinTopics.length > 0
    ? builtinTopics.reduce((a, b) => a.articlesCount >= b.articlesCount ? a : b)
    : topics[0]

  return (
    <div className="px-9 py-7">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '已学单词', value: stats.total, accent: false },
          { label: '本周新增', value: stats.weekNew, accent: true },
          { label: '待复习', value: stats.needReview, accent: false },
        ].map(s => (
          <div key={s.label} className="bg-surface-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-5">
            <div className={`text-[30px] font-bold tracking-tight ${s.accent ? 'text-accent' : 'text-fg-primary'}`} style={{ letterSpacing: '-1px' }}>{s.value}</div>
            <div className="text-[13px] text-fg-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's recommendation */}
      {recommended && (
        <section className="mb-6">
          <h2 className="text-[12px] font-semibold text-fg-muted tracking-[1.5px] mb-3">今日推荐</h2>
          <Link
            href={`/topics/${recommended.id}`}
            className="block bg-surface-card rounded-xl border border-border-light px-5 py-4 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[15px] font-medium text-fg-primary">{recommended.name}</div>
                <div className="text-[13px] text-fg-muted mt-1">{recommended.description}</div>
              </div>
              <span className="text-sm text-accent font-medium px-4 py-1.5 bg-accent-light rounded-lg shrink-0 ml-4">
                开始阅读
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Topics grid */}
      <section className="mb-6">
        <h2 className="text-[12px] font-semibold text-fg-muted tracking-[1.5px] mb-3">选择主题</h2>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {builtinTopics.map(t => {
            const icon = getTopicIcon(t.name)
            return (
              <Link
                key={t.id}
                href={`/topics/${t.id}`}
                className="bg-surface-card rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-3.5 py-3.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow flex items-center gap-3"
              >
                <div
                  className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: icon.bg }}
                >
                  {icon.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-fg-primary truncate">{t.name}</div>
                  <div className="text-[12px] text-fg-muted">已读 {t.articlesCount} 篇</div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {customTopics.map(t => (
            <Link
              key={t.id}
              href={`/topics/${t.id}`}
              className="bg-surface-card rounded-xl border border-border-light px-4 py-3.5 hover:border-accent/30 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-surface-secondary">
                📝
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-fg-primary truncate">{t.name}</div>
                <div className="text-[12px] text-fg-muted">已读 {t.articlesCount} 篇</div>
              </div>
            </Link>
          ))}
          <Link
            href="/topics/new"
            className="rounded-xl border border-dashed border-border px-4 py-3.5 hover:border-accent/50 transition-colors flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-muted bg-surface-secondary shrink-0">
              +
            </div>
            <span className="text-[13px] text-fg-muted">新建主题</span>
          </Link>
        </div>
      </section>

      {/* Free input */}
      <div className="mb-6">
        <div className="flex items-center gap-2 bg-surface-card rounded-xl border border-border-light px-4 h-[42px]">
          <span className="text-fg-muted text-sm">✦</span>
          <input
            type="text"
            value={freeInput}
            onChange={e => setFreeInput(e.target.value)}
            placeholder="自由主题：描述你想读什么..."
            className="flex-1 bg-transparent text-sm border-0 outline-none placeholder:text-fg-muted"
            onKeyDown={e => {
              if (e.key === 'Enter' && freeInput.trim()) {
                router.push(`/topics/new?name=${encodeURIComponent(freeInput)}&format=free`)
              }
            }}
          />
          <span className="text-[12px] text-fg-muted">快速生成</span>
        </div>
      </div>

      {/* Recent articles */}
      {recentArticles.length > 0 && (
        <section>
          <h2 className="text-[12px] font-semibold text-fg-muted tracking-[1.5px] mb-3">最近阅读</h2>
          <div className="grid grid-cols-3 gap-3">
            {recentArticles.slice(0, 3).map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="bg-surface-card rounded-xl border border-border-light px-5 py-4 hover:border-accent/30 transition-colors"
              >
                <div className="text-[14px] font-medium text-fg-primary mb-2">{a.title}</div>
                <div className="text-[12px] text-fg-muted">
                  {a.topicName} · Lv.{a.difficulty} · {a.wordCount} 词
                </div>
                <div className="text-[12px] text-fg-muted mt-0.5">
                  {timeAgo(a.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
