'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Word {
  id: string
  text: string
  phonetic: string
  definition: string
  pos: string
  familiarity: string
  reviewCount: number
  createdAt: Date | null
}

interface Context {
  id: string
  sentence: string
  sentenceTranslation: string
  isReview: boolean
  articleId: string
  articleTitle: string
  topicId: string
  sequence: number
}

interface Props {
  words: Word[]
  stats: { total: number; unfamiliar: number; vague: number; familiar: number }
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

const FAMILIARITY_COLORS: Record<string, string> = {
  unfamiliar: '#FF3B30',
  vague: '#FF9500',
  familiar: '#34C759',
}

export function VocabularyClient({ words: initialWords, stats }: Props) {
  const [words, setWords] = useState(initialWords)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('time')
  const [search, setSearch] = useState('')
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [contexts, setContexts] = useState<Context[]>([])

  const filtered = words
    .filter(w => filter === 'all' || w.familiarity === filter)
    .filter(w => !search || w.text.includes(search.toLowerCase()) || w.definition.includes(search))
    .sort((a, b) => {
      if (sort === 'alpha') return a.text.localeCompare(b.text)
      if (sort === 'familiarity') return a.familiarity.localeCompare(b.familiarity)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

  useEffect(() => {
    if (selectedWord) {
      fetch(`/api/words/${selectedWord.id}/contexts`)
        .then(r => r.json())
        .then(setContexts)
        .catch(() => setContexts([]))
    }
  }, [selectedWord])

  async function updateFamiliarity(wordId: string, familiarity: string) {
    await fetch(`/api/words/${wordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familiarity }),
    })
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, familiarity } : w))
    if (selectedWord?.id === wordId) {
      setSelectedWord(prev => prev ? { ...prev, familiarity } : null)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left panel - word list */}
      <div className="w-[380px] shrink-0 border-r border-border bg-surface-primary overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-fg-primary">生词本</h1>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索..."
                className="pl-3 pr-3 py-1.5 rounded-lg border border-border bg-surface-card text-[13px] w-36 focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-3">
            {[
              { value: 'all', label: '全部' },
              { value: 'unfamiliar', label: '陌生' },
              { value: 'vague', label: '模糊' },
              { value: 'familiar', label: '熟悉' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1 text-[12px] rounded-lg transition-colors ${
                  filter === f.value
                    ? 'bg-accent text-fg-inverse font-medium'
                    : 'text-fg-muted hover:bg-surface-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Word list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(w => (
            <button
              key={w.id}
              onClick={() => setSelectedWord(w)}
              className={`w-full text-left px-5 py-3 border-b border-border-light hover:bg-surface-card transition-colors ${
                selectedWord?.id === w.id ? 'bg-surface-card' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-fg-primary">{w.text}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: FAMILIARITY_COLORS[w.familiarity] || '#8E8E93' }}
                  />
                </div>
              </div>
              <div className="text-[12px] text-fg-muted mt-0.5 truncate">{w.definition}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-[13px] text-fg-muted">暂无生词</div>
          )}
        </div>

        {/* Stats footer */}
        <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-[12px] text-fg-muted shrink-0 bg-surface-card">
          <span>共 {stats.total} 词</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" /> {stats.unfamiliar}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF9500' }} /> {stats.vague}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> {stats.familiar}
          </span>
        </div>
      </div>

      {/* Right panel - detail */}
      <div className="flex-1 overflow-y-auto bg-surface-card p-7">
        {selectedWord ? (
          <div>
            <h2 className="text-[28px] font-semibold text-fg-primary mb-2">{selectedWord.text}</h2>
            <div className="flex items-center gap-3 mb-4">
              {selectedWord.phonetic && <span className="text-[13px] text-fg-muted">{selectedWord.phonetic}</span>}
              {selectedWord.pos && <span className="text-[13px] text-accent">{selectedWord.pos}</span>}
              <button onClick={() => speak(selectedWord.text)} className="text-[13px] text-fg-muted hover:text-accent transition-colors">
                🔊
              </button>
            </div>
            <div className="text-[15px] text-fg-secondary mb-6">{selectedWord.definition}</div>

            {/* Separator */}
            <div className="h-px bg-border-light mb-6" />

            {/* Contexts */}
            {contexts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[13px] text-fg-muted mb-4">
                  出现语境（{contexts.length} 篇文章）
                </h3>
                <div className="space-y-4">
                  {contexts.map(ctx => (
                    <div key={ctx.id}>
                      <Link
                        href={`/articles/${ctx.articleId}`}
                        className="text-[13px] text-accent hover:underline"
                      >
                        日常口语 #{String(ctx.sequence).padStart(2, '0')} — {ctx.articleTitle}
                      </Link>
                      <div className="text-[14px] text-fg-secondary mt-1.5 italic leading-relaxed">
                        &ldquo;{ctx.sentence}&rdquo;
                      </div>
                      {ctx.sentenceTranslation && (
                        <div className="text-[13px] text-fg-muted mt-1">{ctx.sentenceTranslation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="h-px bg-border-light mb-6" />

            {/* Familiarity control */}
            <div>
              <h3 className="text-[13px] text-fg-muted mb-3">熟练度</h3>
              <div className="flex gap-2">
                {[
                  { value: 'unfamiliar', label: '陌生', color: '#FF3B30' },
                  { value: 'vague', label: '模糊', color: '#FF9500' },
                  { value: 'familiar', label: '熟悉', color: '#34C759' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => updateFamiliarity(selectedWord.id, f.value)}
                    className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${
                      selectedWord.familiarity === f.value
                        ? 'text-fg-inverse'
                        : 'border-border text-fg-secondary hover:border-accent/50'
                    }`}
                    style={
                      selectedWord.familiarity === f.value
                        ? { background: f.color, borderColor: f.color }
                        : undefined
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[14px] text-fg-muted">
            选择左侧单词查看详情
          </div>
        )}
      </div>
    </div>
  )
}
