'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WordPanel } from './word-panel'
import { WordPopover } from './word-popover'

interface WordContext {
  id: string
  wordId: string
  sentence: string
  sentenceTranslation: string
  isReview: boolean
  text: string
  phonetic: string
  definition: string
  pos: string
  familiarity: string
  reviewCount: number
}

interface Props {
  article: {
    id: string
    title: string
    content: string
    translation: string
    difficulty: number
    wordCount: number
    topicId: string
    sequence: number
  }
  topic: { id: string; name: string }
  wordContexts: WordContext[]
  reviewWordIds: string[]
  prevArticleId: string | null
  nextArticleId: string | null
  settings: {
    accent: 'us' | 'uk'
    autoReadOnSelect: boolean
    ttsService: string
  }
}

function speak(text: string, accent: 'us' | 'uk') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = accent === 'us' ? 'en-US' : 'en-GB'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function ReadingClient({ article, topic, wordContexts: initialContexts, reviewWordIds, prevArticleId, nextArticleId, settings }: Props) {
  const router = useRouter()
  const [wordContexts, setWordContexts] = useState(initialContexts)
  const [showTranslation, setShowTranslation] = useState(false)
  const [popover, setPopover] = useState<{
    word: string
    sentence: string
    x: number
    y: number
    loading: boolean
    data?: { phonetic: string; definition: string; pos: string; sentence_translation: string }
  } | null>(null)
  const articleRef = useRef<HTMLDivElement>(null)

  const markedWords = new Set(wordContexts.map(wc => wc.text.toLowerCase()))
  const reviewWords = new Set(
    wordContexts.filter(wc => reviewWordIds.includes(wc.wordId)).map(wc => wc.text.toLowerCase())
  )

  function renderContent(content: string) {
    const paragraphs = content.split('\n').filter(Boolean)
    return paragraphs.map((p, i) => {
      // Check if it's a dialogue line (starts with name:)
      const dialogueMatch = p.match(/^([A-Za-z]+):\s*(.*)$/)

      const tokens = (dialogueMatch ? dialogueMatch[2] : p).split(/(\b\w+\b)/g)
      const rendered = tokens.map((token, j) => {
        const lower = token.toLowerCase()
        if (markedWords.has(lower)) {
          const isReview = reviewWords.has(lower)
          return (
            <span
              key={j}
              className={isReview ? 'word-review cursor-pointer' : 'word-highlight cursor-pointer'}
              data-word={lower}
            >
              {token}
            </span>
          )
        }
        return <span key={j}>{token}</span>
      })

      if (dialogueMatch) {
        return (
          <div key={i} className="flex gap-3 mb-4">
            <span className="text-accent font-medium text-sm shrink-0 pt-0.5">{dialogueMatch[1]}:</span>
            <p className="flex-1">{rendered}</p>
          </div>
        )
      }

      return <p key={i} className="mb-5">{rendered}</p>
    })
  }

  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setPopover(null)
      return
    }

    const text = selection.toString().trim()
    if (!text) return

    const isSingleWord = /^\w+$/.test(text)

    if (settings.autoReadOnSelect) {
      speak(text, settings.accent)
    }

    if (!isSingleWord) return

    const anchorNode = selection.anchorNode
    let sentence = ''
    if (anchorNode) {
      let parent = anchorNode.parentElement
      while (parent && parent.tagName !== 'P' && parent.tagName !== 'LI' && parent.tagName !== 'DIV') {
        parent = parent.parentElement
      }
      sentence = parent?.textContent || text
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setPopover({
      word: text.toLowerCase(),
      sentence,
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY + 8,
      loading: true,
    })

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: text, sentence }),
      })
      const data = await res.json()
      if (res.ok) {
        setPopover(prev => prev ? { ...prev, loading: false, data } : null)

        await fetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.toLowerCase(),
            phonetic: data.phonetic || '',
            definition: data.definition || '',
            pos: data.pos || '',
            articleId: article.id,
            sentence,
            sentenceTranslation: data.sentence_translation || '',
          }),
        })

        if (!markedWords.has(text.toLowerCase())) {
          setWordContexts(prev => [
            ...prev,
            {
              id: 'temp-' + Date.now(),
              wordId: 'temp-' + Date.now(),
              sentence,
              sentenceTranslation: data.sentence_translation || '',
              isReview: false,
              text: text.toLowerCase(),
              phonetic: data.phonetic || '',
              definition: data.definition || '',
              pos: data.pos || '',
              familiarity: 'unfamiliar',
              reviewCount: 0,
            },
          ])
        }
      }
    } catch {
      setPopover(prev => prev ? { ...prev, loading: false } : null)
    }
  }, [article.id, settings, markedWords])

  return (
    <div className="flex h-full">
      {/* Article area */}
      <div className="flex-1 overflow-y-auto px-9 py-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/topics/${topic.id}`}
            className="text-[13px] text-fg-muted hover:text-accent transition-colors"
          >
            ‹ {topic.name} #{String(article.sequence).padStart(2, '0')}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`text-[13px] px-3 py-1 rounded-lg border transition-colors ${
                showTranslation
                  ? 'border-accent bg-accent text-fg-inverse'
                  : 'border-border text-fg-muted hover:border-accent/50'
              }`}
            >
              译
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-fg-primary mb-2">{article.title}</h1>
        <div className="text-[13px] text-fg-muted mb-6">
          Lv.{article.difficulty} · {article.wordCount} 词
        </div>

        {/* Scene tag if dialogue */}
        {article.content.match(/^[A-Za-z]+:/) && (
          <div className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted bg-surface-secondary rounded-lg px-3 py-1.5 mb-6">
            <span>🏢</span> Office lobby, Monday 8:15am
          </div>
        )}

        {/* Content */}
        <div
          ref={articleRef}
          className="article-body"
          onMouseUp={handleMouseUp}
        >
          {renderContent(article.content)}
        </div>

        {/* Translation */}
        {showTranslation && article.translation && (
          <div className="mt-8 pt-6 border-t border-border-light">
            <h3 className="text-[13px] text-fg-muted mb-4">中文翻译</h3>
            <div className="text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap">
              {article.translation}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border-light text-sm">
          {prevArticleId ? (
            <Link href={`/articles/${prevArticleId}`} className="text-fg-muted hover:text-accent transition-colors">
              ← 上一篇
            </Link>
          ) : <span />}
          {nextArticleId ? (
            <Link href={`/articles/${nextArticleId}`} className="text-fg-muted hover:text-accent transition-colors">
              下一篇 →
            </Link>
          ) : (
            <button
              onClick={async () => {
                const res = await fetch('/api/articles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ topicId: topic.id }),
                })
                if (res.ok && res.body) {
                  const reader = res.body.getReader()
                  const decoder = new TextDecoder()
                  let fullText = ''
                  let meta: { topicId: string; sequence: number; difficulty: number; reviewWordIds: string[] } | null = null
                  while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    fullText += decoder.decode(value, { stream: true })
                    if (!meta && fullText.includes('__META__')) {
                      const m = fullText.match(/__META__(.*?)__META__/)
                      if (m) { meta = JSON.parse(m[1]); fullText = fullText.replace(/__META__.*?__META__\n?/, '') }
                    }
                  }
                  const jsonMatch = fullText.match(/\{[\s\S]*\}/)
                  if (jsonMatch && meta) {
                    const parsed = JSON.parse(jsonMatch[0])
                    const r = await fetch('/api/articles/new/finalize', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: parsed.title, content: parsed.content, translation: parsed.translation || '', difficulty: meta.difficulty, topicId: meta.topicId, sequence: meta.sequence, wordCount: parsed.content?.split(/\s+/).length || 0, reviewWordIds: JSON.stringify(meta.reviewWordIds || []) }),
                    })
                    const result = await r.json()
                    if (result.id) router.push(`/articles/${result.id}`)
                  }
                }
              }}
              className="text-fg-muted hover:text-accent transition-colors"
            >
              生成下一篇 →
            </button>
          )}
        </div>
      </div>

      {/* Word Panel */}
      <WordPanel
        words={wordContexts}
        reviewWordIds={reviewWordIds}
        accent={settings.accent}
      />

      {/* Popover */}
      {popover && (
        <WordPopover
          word={popover.word}
          x={popover.x}
          y={popover.y}
          loading={popover.loading}
          data={popover.data}
          accent={settings.accent}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  )
}
