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

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${Math.max(16, Math.min(x - 120, window.innerWidth - 280))}px`,
    top: `${y}px`,
    zIndex: 100,
  }

  return (
    <div ref={ref} style={style} className="w-64 bg-surface-card rounded-xl border border-border shadow-lg shadow-black/8 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-medium text-fg-primary">{word}</span>
        <button
          onClick={() => speak(word, accent)}
          className="text-[12px] text-fg-muted hover:text-accent transition-colors p-0.5"
        >
          🔊
        </button>
      </div>

      {loading ? (
        <div className="text-[13px] text-fg-muted">翻译中...</div>
      ) : data ? (
        <div className="space-y-1.5">
          {data.phonetic && (
            <div className="text-[12px] text-fg-muted">{data.phonetic}</div>
          )}
          {data.pos && (
            <div className="text-[12px] text-accent">{data.pos}</div>
          )}
          <div className="text-[13px] text-fg-secondary">{data.definition}</div>
          {data.sentence_translation && (
            <div className="text-[12px] text-fg-muted mt-2 pt-2 border-t border-border-light italic">
              {data.sentence_translation}
            </div>
          )}
        </div>
      ) : (
        <div className="text-[13px] text-danger">翻译失败</div>
      )}
    </div>
  )
}
