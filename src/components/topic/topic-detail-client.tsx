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

      // Read stream to get metadata and content
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

      // Parse the JSON response
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
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/" className="text-xs text-secondary hover:text-foreground transition-colors">
            ← 返回
          </Link>
          <h1 className="text-xl font-medium mt-3">{topic.name}</h1>
          <p className="text-sm text-secondary mt-1">{topic.description}</p>
        </div>
        {!topic.isBuiltin && (
          <Link
            href={`/topics/new?edit=${topic.id}`}
            className="text-xs text-secondary hover:text-foreground border border-border px-3 py-1.5 transition-colors"
          >
            编辑主题
          </Link>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div>
          <span className="text-secondary">当前难度</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 h-1.5 bg-border">
              <div className="h-full bg-accent transition-all" style={{ width: `${difficultyPercent}%` }} />
            </div>
            <span className="text-xs">Lv.{nextDifficulty}</span>
          </div>
        </div>
        <div>
          <span className="text-secondary">已读</span>
          <div className="mt-1">{topic.articlesCount} 篇</div>
        </div>
        <div>
          <span className="text-secondary">生词</span>
          <div className="mt-1">{totalWords} 个</div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-card border border-border p-6 hover:border-accent transition-colors text-center disabled:opacity-50 mb-10"
      >
        {generating ? (
          <div>
            <div className="text-sm">生成中...</div>
            <div className="text-xs text-secondary mt-1">正在为你创作新文章</div>
          </div>
        ) : (
          <div>
            <div className="text-sm">生成下一篇文章</div>
            <div className="text-xs text-secondary mt-1">
              难度 Lv.{nextDifficulty} · 约 {config.article_length} 词 · 含 ~{reviewWords} 个复习词
            </div>
          </div>
        )}
      </button>

      {/* Article list */}
      {articles.length > 0 && (
        <section>
          <h2 className="text-xs text-secondary tracking-widest uppercase mb-4">往期文章</h2>
          <div className="divide-y divide-border border border-border">
            {articles.map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-tertiary w-8">#{String(a.sequence).padStart(2, '0')}</span>
                  <span className="text-sm">{a.title}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-secondary">
                  <span>Lv.{a.difficulty}</span>
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
