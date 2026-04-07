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
  if (words.length === 0) {
    return (
      <aside className="w-72 shrink-0 hidden lg:block">
        <div className="sticky top-20">
          <h3 className="text-xs text-secondary tracking-widest uppercase mb-4">本文生词</h3>
          <p className="text-sm text-tertiary">划选文中单词来标记生词</p>
        </div>
      </aside>
    )
  }

  const reviewSet = new Set(reviewWordIds)

  return (
    <aside className="w-72 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <h3 className="text-xs text-secondary tracking-widest uppercase mb-4">
          本文生词 ({words.length})
        </h3>
        <div className="space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          {words.map(w => {
            const isReview = reviewSet.has(w.wordId)
            return (
              <div key={w.id} className="border border-border p-3 bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    {isReview && <span className="text-xs text-blue-500 mr-1">&#8635;</span>}
                    <span className="text-sm font-medium">{w.text}</span>
                    {w.phonetic && (
                      <span className="text-xs text-tertiary ml-2">{w.phonetic}</span>
                    )}
                  </div>
                  <button
                    onClick={() => speak(w.text, accent)}
                    className="text-xs text-secondary hover:text-foreground transition-colors p-1"
                    title="朗读"
                  >
                    &#128266;
                  </button>
                </div>
                {w.pos && <div className="text-xs text-tertiary mt-0.5">{w.pos}</div>}
                <div className="text-xs text-secondary mt-1">{w.definition}</div>
                {w.sentence && (
                  <div className="text-xs text-tertiary mt-2 italic leading-relaxed">
                    &ldquo;{w.sentence}&rdquo;
                  </div>
                )}
                {isReview && (
                  <div className="text-xs text-blue-400 mt-1">复习词</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
