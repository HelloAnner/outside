'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const FORMAT_OPTIONS = [
  { value: 'dialogue', label: '对话体' },
  { value: 'essay', label: '文章体' },
  { value: 'story', label: '故事体' },
  { value: 'email', label: '邮件体' },
  { value: 'mixed', label: '混合体' },
  { value: 'free', label: '自由' },
]

export default function NewTopicPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const prefillName = searchParams.get('name') || ''
  const prefillFormat = searchParams.get('format') || ''

  const [name, setName] = useState(prefillName)
  const [description, setDescription] = useState('')
  const [contentFormat, setContentFormat] = useState(prefillFormat || 'mixed')
  const [promptTemplate, setPromptTemplate] = useState('')
  const [difficultyStart, setDifficultyStart] = useState('')
  const [difficultyStep, setDifficultyStep] = useState('')
  const [reviewRatio, setReviewRatio] = useState('')
  const [newWordDensity, setNewWordDensity] = useState('')
  const [referenceWords, setReferenceWords] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editId) {
      fetch(`/api/topics`)
        .then(r => r.json())
        .then(topics => {
          const topic = topics.find((t: { id: string }) => t.id === editId)
          if (topic) {
            setName(topic.name)
            setDescription(topic.description)
            setContentFormat(topic.contentFormat)
            setPromptTemplate(topic.promptTemplate)
            setShowAdvanced(true)
            try {
              const config = JSON.parse(topic.config || '{}')
              if (config.difficulty_start) setDifficultyStart(String(config.difficulty_start))
              if (config.difficulty_step) setDifficultyStep(String(config.difficulty_step))
              if (config.review_ratio) setReviewRatio(String(Math.round(config.review_ratio * 100)))
              if (config.new_word_density) setNewWordDensity(String(config.new_word_density))
            } catch {}
            try {
              const words = JSON.parse(topic.referenceWords || '[]')
              setReferenceWords(words.join(', '))
            } catch {}
          }
        })
    }
  }, [editId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const config: Record<string, number> = {}
    if (difficultyStart) config.difficulty_start = Number(difficultyStart)
    if (difficultyStep) config.difficulty_step = Number(difficultyStep)
    if (reviewRatio) config.review_ratio = Number(reviewRatio) / 100
    if (newWordDensity) config.new_word_density = Number(newWordDensity)

    const refWords = referenceWords
      .split(/[,，\n]/)
      .map(w => w.trim())
      .filter(Boolean)

    const body = {
      name,
      description,
      contentFormat,
      promptTemplate,
      config: JSON.stringify(config),
      referenceWords: JSON.stringify(refWords),
    }

    try {
      const url = editId ? `/api/topics/${editId}` : '/api/topics'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '保存失败')
        return
      }

      const topic = await res.json()
      router.push(`/topics/${topic.id || editId}`)
      router.refresh()
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editId || !confirm('确定删除此主题？相关文章也会被删除。')) return
    await fetch(`/api/topics/${editId}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="px-9 py-7">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-fg-muted hover:text-fg-secondary transition-colors text-sm">
          ‹
        </Link>
        <h1 className="text-xl font-semibold text-fg-primary">
          {editId ? '编辑主题' : '新建主题'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-[640px] space-y-5">
        <div>
          <label className="block text-[13px] text-fg-secondary mb-1.5">主题名称 *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-card text-sm focus:border-accent transition-colors"
            placeholder="如：医学英语"
          />
        </div>

        <div>
          <label className="block text-[13px] text-fg-secondary mb-1.5">主题描述 *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-card text-sm resize-none focus:border-accent transition-colors"
            placeholder="学习医疗场景下的词汇通识，药名药效、就诊场景、病历文书翻译"
          />
        </div>

        <div>
          <label className="block text-[13px] text-fg-secondary mb-1.5">内容形式 *</label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentFormat(opt.value)}
                className={`px-3 py-1.5 text-[13px] rounded-lg border transition-colors ${
                  contentFormat === opt.value
                    ? 'border-accent bg-accent text-fg-inverse'
                    : 'border-border text-fg-secondary hover:border-accent/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[13px] text-fg-muted hover:text-accent transition-colors"
        >
          {showAdvanced ? '▾ 收起高级设置' : '▸ 高级设置'}
        </button>

        {showAdvanced && (
          <div className="space-y-5 rounded-xl border border-border-light bg-surface-card p-5">
            <div>
              <label className="block text-[13px] text-fg-secondary mb-1.5">生成指令（选填）</label>
              <textarea
                value={promptTemplate}
                onChange={e => setPromptTemplate(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-primary text-sm resize-none focus:border-accent transition-colors"
                placeholder="编相关真实介绍文章，有趣有用，一定包含参考词汇。术语必须在文中详细释义。希望你为无诊疗经历的学生场景学习"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-fg-secondary mb-1.5">起始难度</label>
                <input
                  value={difficultyStart}
                  onChange={e => setDifficultyStart(e.target.value)}
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-primary text-sm focus:border-accent transition-colors"
                  placeholder="默认 3"
                />
              </div>
              <div>
                <label className="block text-[13px] text-fg-secondary mb-1.5">难度递增步长</label>
                <input
                  value={difficultyStep}
                  onChange={e => setDifficultyStep(e.target.value)}
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-primary text-sm focus:border-accent transition-colors"
                  placeholder="0.3"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-fg-secondary mb-1.5">参考词汇（选填，逗号分隔）</label>
              <textarea
                value={referenceWords}
                onChange={e => setReferenceWords(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-primary text-sm resize-none focus:border-accent transition-colors"
                placeholder="diagnosis, symptom, prescription, chronic, acute, inflammation"
              />
            </div>
          </div>
        )}

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-accent text-fg-inverse text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存主题'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-5 py-2.5 text-sm text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors"
            >
              删除主题
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
