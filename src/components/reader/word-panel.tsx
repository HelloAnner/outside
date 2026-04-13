'use client'

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
  words: WordContext[]
  reviewWordIds: string[]
  accent: 'us' | 'uk'
}

function speak(text: string, accent: 'us' | 'uk') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = accent === 'us' ? 'en-US' : 'en-GB'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function WordPanel({ words, reviewWordIds, accent }: Props) {
  const reviewSet = new Set(reviewWordIds)
  const newWords = words.filter(w => !reviewSet.has(w.wordId))
  const reviewWordsFiltered = words.filter(w => reviewSet.has(w.wordId))

  return (
    <aside className="w-[300px] shrink-0 border-l border-border bg-surface-card overflow-y-auto h-full">
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-fg-primary">
            本文生词
          </h3>
          {words.length > 0 && (
            <span className="text-[12px] font-semibold text-accent bg-accent-light rounded-full h-[22px] min-w-[22px] flex items-center justify-center px-2">
              {words.length}
            </span>
          )}
        </div>

        {words.length === 0 && (
          <p className="text-[13px] text-fg-muted">划选文中单词来标记生词</p>
        )}

        {/* New words */}
        {newWords.length > 0 && (
          <div className="mb-5">
            <div className="text-[12px] text-fg-muted mb-2">新词 · {newWords.length}</div>
            <div className="space-y-2.5">
              {newWords.map(w => (
                <WordCard key={w.id} word={w} accent={accent} isReview={false} />
              ))}
            </div>
          </div>
        )}

        {/* Review words */}
        {reviewWordsFiltered.length > 0 && (
          <div>
            <div className="text-[12px] text-fg-muted mb-2">复习词 · {reviewWordsFiltered.length}</div>
            <div className="space-y-2.5">
              {reviewWordsFiltered.map(w => (
                <WordCard key={w.id} word={w} accent={accent} isReview={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function WordCard({ word: w, accent, isReview }: { word: WordContext; accent: 'us' | 'uk'; isReview: boolean }) {
  return (
    <div className={`rounded-[10px] p-3.5 ${isReview ? 'bg-review' : 'bg-surface-primary'}`}>
      {isReview && (
        <div className="flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
          <span className="text-[11px] text-accent">复习词</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[15px] font-semibold text-fg-primary">{w.text}</span>
        <span className="text-[12px] text-fg-muted">{w.phonetic}</span>
      </div>
      <div className="text-[13px] text-fg-secondary">{w.definition}</div>
      {w.sentence && (
        <div className="text-[12px] text-fg-muted italic mt-2 leading-relaxed">
          &ldquo;{w.sentence}&rdquo;
        </div>
      )}
    </div>
  )
}
