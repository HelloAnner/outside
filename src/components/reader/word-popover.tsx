'use client'

import { useEffect, useRef } from 'react'

interface Props {
  word: string
  x: number
  y: number
  loading: boolean
  data?: {
    phonetic: string
    definition: string
    pos: string
    sentence_translation: string
  }
  accent: 'us' | 'uk'
  onClose: () => void
}

function speak(text: string, accent: 'us' | 'uk') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = accent === 'us' ? 'en-US' : 'en-GB'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function WordPopover({ word, x, y, loading, data, accent, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Adjust position to not overflow viewport
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${Math.max(16, Math.min(x - 120, window.innerWidth - 260))}px`,
    top: `${y}px`,
    zIndex: 100,
  }

  return (
    <div ref={ref} style={style} className="w-60 bg-card border border-border shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{word}</span>
        <button
          onClick={() => speak(word, accent)}
          className="text-xs text-secondary hover:text-foreground p-1"
        >
          &#128266;
        </button>
      </div>

      {loading ? (
        <div className="text-xs text-secondary">翻译中...</div>
      ) : data ? (
        <div className="space-y-1.5">
          {data.phonetic && (
            <div className="text-xs text-tertiary">{data.phonetic}</div>
          )}
          {data.pos && (
            <div className="text-xs text-tertiary">{data.pos}</div>
          )}
          <div className="text-xs text-secondary">{data.definition}</div>
          {data.sentence_translation && (
            <div className="text-xs text-tertiary mt-2 pt-2 border-t border-border italic">
              {data.sentence_translation}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-error">翻译失败</div>
      )}
    </div>
  )
}
