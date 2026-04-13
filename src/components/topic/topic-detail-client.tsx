'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface Topic {
  id: string
  name: string
  description: string
  isBuiltin: boolean
  articlesCount: number
  contentFormat: string
  config: string
}

interface Article {
  id: string
  sequence: number
  title: string
  difficulty: number
  wordCount: number
  createdAt: Date | null
  wordsCount: number
}

interface Props {
  topic: Topic
  articles: Article[]
  nextDifficulty: number
  totalWords: number
  config: { article_length: number; review_ratio: number; new_word_density: number }
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
  return `${Math.floor(days / 7)}周前`
}

export function TopicDetailClient({ topic, articles, nextDifficulty, totalWords, config }: Props) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  const reviewWords = Math.ceil(config.article_length / 100 * config.new_word_density * config.review_ratio)
  const difficultyPercent = Math.min((nextDifficulty / 10) * 100, 100)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id }),
      })

      if (!res.ok || !res.body) {
        setGenerating(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let meta: { topicId: string; sequence: number; difficulty: number; reviewWordIds: string[] } | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        if (!meta && fullText.includes('__META__')) {
          const metaMatch = fullText.match(/__META__(.*?)__META__/)
          if (metaMatch) {
            meta = JSON.parse(metaMatch[1])
            fullText = fullText.replace(/__META__.*?__META__\n?/, '')
          }
        }
      }

      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch && meta) {
        const parsed = JSON.parse(jsonMatch[0])
        const wordCount = parsed.content?.split(/\s+/).length || 0

        const finalizeRes = await fetch('/api/articles/new/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: parsed.title || 'Untitled',
            content: parsed.content || fullText,
            translation: parsed.translation || '',
            difficulty: meta.difficulty,
            topicId: meta.topicId,
            sequence: meta.sequence,
            wordCount,
            reviewWordIds: JSON.stringify(meta.reviewWordIds || []),
          }),
        })

        const result = await finalizeRes.json()
        if (result.id) {
          router.push(`/articles/${result.id}`)
          return
        }
      }

      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="px-9 py-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-fg-muted hover:text-fg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </Link>
          <h1 className="text-xl font-semibold text-fg-primary">{topic.name}</h1>
        </div>
        <Link
          href={`/topics/new?edit=${topic.id}`}
          className="flex items-center gap-1.5 text-[12px] text-fg-secondary hover:text-accent border border-border rounded-lg px-3 h-8 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
          主题设置
        </Link>
      </div>

      <p className="text-[14px] text-fg-muted mb-6 pl-5">{topic.description}</p>

      {/* Meta stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface-card rounded-xl border border-border-light px-5 py-4">
          <div className="text-[13px] text-fg-muted mb-2">当前难度</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[6px] bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${difficultyPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-fg-primary">Lv.{nextDifficulty}</span>
          </div>
        </div>
        <div className="bg-surface-card rounded-xl border border-border-light px-5 py-4">
          <div className="text-[13px] text-fg-muted mb-1">已读</div>
          <div className="text-[22px] font-semibold text-fg-primary">{topic.articlesCount} <span className="text-[14px] font-normal text-fg-muted">篇</span></div>
        </div>
        <div className="bg-surface-card rounded-xl border border-border-light px-5 py-4">
          <div className="text-[13px] text-fg-muted mb-1">生词</div>
          <div className="text-[22px] font-semibold text-fg-primary">{totalWords} <span className="text-[14px] font-normal text-fg-muted">个</span></div>
        </div>
      </div>

      {/* Generate button card */}
      <div className="bg-surface-card rounded-xl border border-border-light p-6 mb-6 text-center">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-fg-inverse text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>生成中...</>
          ) : (
            <>✦ 生成下一篇文章</>
          )}
        </button>
        <div className="text-[13px] text-fg-muted mt-3">
          难度 Lv.{nextDifficulty} · 约 {config.article_length} 词 · 含 ~{reviewWords} 个复习词
        </div>
      </div>

      {/* Article list */}
      {articles.length > 0 && (
        <section>
          <h2 className="text-[12px] font-semibold text-fg-muted tracking-[1.5px] mb-2">往期文章</h2>
          <div className="bg-surface-card rounded-xl border border-border-light overflow-hidden divide-y divide-border-light">
            {articles.map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[12px] text-fg-muted w-8 shrink-0">#{String(a.sequence).padStart(2, '0')}</span>
                  <span className="text-[14px] text-fg-primary truncate">{a.title}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-fg-muted shrink-0 ml-4">
                  <span className="text-accent bg-accent-light px-2 py-0.5 rounded">Lv.{a.difficulty}</span>
                  <span>{a.wordsCount} 个生词</span>
                  <span>{timeAgo(a.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
