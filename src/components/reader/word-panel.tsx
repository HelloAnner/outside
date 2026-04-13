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
      <div className="px-5 py-5">
        <h3 className="text-[14px] font-medium text-fg-primary mb-4">
          本文生词
        </h3>

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
    <div className={`rounded-lg p-3 ${isReview ? 'bg-review' : 'bg-surface-primary'}`}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-medium text-fg-primary">{w.text}</span>
          {w.phonetic && <span className="text-[12px] text-fg-muted">{w.phonetic}</span>}
        </div>
        <button
          onClick={() => speak(w.text, accent)}
          className="text-[12px] text-fg-muted hover:text-accent transition-colors p-0.5"
          title="朗读"
        >
          🔊
        </button>
      </div>
      {w.pos && <div className="text-[12px] text-accent mb-0.5">{w.pos}</div>}
      <div className="text-[13px] text-fg-secondary">{w.definition}</div>
    </div>
  )
}
