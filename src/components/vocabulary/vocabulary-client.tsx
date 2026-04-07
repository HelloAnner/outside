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
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/" className="text-xs text-secondary hover:text-foreground transition-colors">← 首页</Link>
          <h1 className="text-xl font-medium mt-2">生词本</h1>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索..."
          className="px-3 py-2 border border-border bg-card text-sm w-48"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 text-xs">
        <span className="text-secondary">排序:</span>
        {['time', 'alpha', 'familiarity'].map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-2 py-1 border transition-colors ${sort === s ? 'border-accent bg-accent text-white' : 'border-border'}`}
          >
            {{ time: '时间', alpha: '字母', familiarity: '熟练度' }[s]}
          </button>
        ))}
        <span className="text-secondary ml-4">筛选:</span>
        {['all', 'unfamiliar', 'vague', 'familiar'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 border transition-colors ${filter === f ? 'border-accent bg-accent text-white' : 'border-border'}`}
          >
            {{ all: '全部', unfamiliar: '陌生', vague: '模糊', familiar: '熟悉' }[f]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Word list */}
        <div className="w-80 shrink-0 border border-border divide-y divide-border max-h-[calc(100vh-12rem)] overflow-y-auto">
          {filtered.map(w => (
            <button
              key={w.id}
              onClick={() => setSelectedWord(w)}
              className={`w-full text-left px-4 py-3 hover:bg-hover transition-colors ${
                selectedWord?.id === w.id ? 'bg-hover' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{w.text}</span>
                <span className="text-xs">
                  {w.familiarity === 'unfamiliar' ? '●' : w.familiarity === 'vague' ? '○' : '◉'}
                  <span className="text-tertiary ml-1">
                    {{ unfamiliar: '陌生', vague: '模糊', familiar: '熟悉' }[w.familiarity]}
                  </span>
                </span>
              </div>
              <div className="text-xs text-secondary mt-0.5 truncate">{w.definition}</div>
              {w.reviewCount > 0 && (
                <div className="text-xs text-blue-400 mt-0.5">&#8635;×{w.reviewCount}</div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-tertiary">暂无生词</div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          {selectedWord ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-medium">{selectedWord.text}</h2>
                <button onClick={() => speak(selectedWord.text)} className="text-sm text-secondary hover:text-foreground">
                  &#128266;
                </button>
              </div>
              {selectedWord.phonetic && <div className="text-sm text-tertiary mb-1">{selectedWord.phonetic}</div>}
              {selectedWord.pos && <div className="text-xs text-tertiary mb-2">{selectedWord.pos}</div>}
              <div className="text-sm text-secondary mb-6">{selectedWord.definition}</div>

              {/* Contexts */}
              {contexts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs text-secondary tracking-widest uppercase mb-3">
                    出现语境 ({contexts.length}篇文章)
                  </h3>
                  <div className="space-y-3">
                    {contexts.map(ctx => (
                      <div key={ctx.id} className="border border-border p-3">
                        <Link
                          href={`/articles/${ctx.articleId}`}
                          className="text-xs text-secondary hover:text-foreground transition-colors"
                        >
                          #{String(ctx.sequence).padStart(2, '0')} {ctx.articleTitle}
                        </Link>
                        <div className="text-sm mt-1.5 italic text-secondary">&ldquo;{ctx.sentence}&rdquo;</div>
                        {ctx.sentenceTranslation && (
                          <div className="text-xs text-tertiary mt-1">{ctx.sentenceTranslation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Familiarity control */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs text-secondary mb-2">熟练度</h3>
                <div className="flex gap-2">
                  {['unfamiliar', 'vague', 'familiar'].map(f => (
                    <button
                      key={f}
                      onClick={() => updateFamiliarity(selectedWord.id, f)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        selectedWord.familiarity === f
                          ? 'border-accent bg-accent text-white'
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      {{ unfamiliar: '● 陌生', vague: '○ 模糊', familiar: '◉ 熟悉' }[f]}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-tertiary mt-3">
                  已复习: {selectedWord.reviewCount} 次
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-tertiary">
              选择左侧单词查看详情
            </div>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div className="mt-6 pt-4 border-t border-border flex items-center gap-6 text-xs text-secondary">
        <span>共 {stats.total} 词</span>
        <span>● 陌生 {stats.unfamiliar}</span>
        <span>○ 模糊 {stats.vague}</span>
        <span>◉ 熟悉 {stats.familiar}</span>
      </div>
    </div>
  )
}
