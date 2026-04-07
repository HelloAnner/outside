'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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

  // Get set of already-marked words
  const markedWords = new Set(wordContexts.map(wc => wc.text.toLowerCase()))
  const reviewWords = new Set(
    wordContexts.filter(wc => reviewWordIds.includes(wc.wordId)).map(wc => wc.text.toLowerCase())
  )

  // Render content with word highlights
  function renderContent(content: string) {
    // Split into paragraphs
    const paragraphs = content.split('\n').filter(Boolean)
    return paragraphs.map((p, i) => {
      // Highlight marked words
      const tokens = p.split(/(\b\w+\b)/g)
      return (
        <p key={i} className="mb-5">
          {tokens.map((token, j) => {
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
          })}
        </p>
      )
    })
  }

  // Handle text selection
  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setPopover(null)
      return
    }

    const text = selection.toString().trim()
    if (!text) return

    // Check if single word
    const isSingleWord = /^\w+$/.test(text)

    if (settings.autoReadOnSelect) {
      speak(text, settings.accent)
    }

    if (!isSingleWord) return

    // Get the sentence context
    const anchorNode = selection.anchorNode
    let sentence = ''
    if (anchorNode) {
      let parent = anchorNode.parentElement
      while (parent && parent.tagName !== 'P' && parent.tagName !== 'LI') {
        parent = parent.parentElement
      }
      sentence = parent?.textContent || text
    }

    // Position popover
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setPopover({
      word: text.toLowerCase(),
      sentence,
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY + 8,
      loading: true,
    })

    // Fetch translation
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: text, sentence }),
      })
      const data = await res.json()
      if (res.ok) {
        setPopover(prev => prev ? { ...prev, loading: false, data } : null)

        // Save word
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

        // Add to local state
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
    } catch (err) {
      setPopover(prev => prev ? { ...prev, loading: false } : null)
    }
  }, [article.id, settings, markedWords])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/topics/${topic.id}`}
          className="text-xs text-secondary hover:text-foreground transition-colors"
        >
          ← {topic.name} #{String(article.sequence).padStart(2, '0')}
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`text-xs px-2.5 py-1 border transition-colors ${
              showTranslation ? 'border-accent bg-accent text-white' : 'border-border hover:border-accent'
            }`}
          >
            译
          </button>
          <Link href="/vocabulary" className="text-xs text-secondary hover:text-foreground border border-border px-2.5 py-1">
            词
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex gap-8">
        {/* Article */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium mb-2">{article.title}</h1>
          <div className="text-xs text-secondary mb-8">
            Lv.{article.difficulty} · {article.wordCount} 词
          </div>

          <div
            ref={articleRef}
            className="article-body"
            onMouseUp={handleMouseUp}
          >
            {renderContent(article.content)}
          </div>

          {/* Translation */}
          {showTranslation && article.translation && (
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-xs text-secondary tracking-widest uppercase mb-4">中文翻译</h3>
              <div className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                {article.translation}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border text-sm">
            {prevArticleId ? (
              <Link href={`/articles/${prevArticleId}`} className="text-secondary hover:text-foreground transition-colors">
                ← 上一篇
              </Link>
            ) : <span />}
            {nextArticleId ? (
              <Link href={`/articles/${nextArticleId}`} className="text-secondary hover:text-foreground transition-colors">
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
                className="text-secondary hover:text-foreground transition-colors"
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
      </div>

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
