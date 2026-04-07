'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Settings {
  globalConfig: string
  accent: string
  autoPronounce: boolean
  autoReadOnSelect: boolean
  llmProvider: string
  llmModel: string
  llmApiKey: string
  llmBaseUrl: string
  ttsService: string
}

interface Topic {
  id: string
  name: string
  isBuiltin: boolean
  config: string
}

interface Props {
  email: string
  settings: Settings
  topics: Topic[]
}

export function SettingsClient({ email, settings: initial, topics }: Props) {
  const router = useRouter()
  const [settings, setSettings] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  let globalConfig: Record<string, number> = {}
  try { globalConfig = JSON.parse(settings.globalConfig || '{}') } catch {}

  async function save(updates: Partial<Settings>) {
    setSaving(true)
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)

    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
  }

  async function saveGlobalConfig(key: string, value: number) {
    const newConfig = { ...globalConfig, [key]: value }
    await save({ globalConfig: JSON.stringify(newConfig) })
  }

  async function testConnection() {
    setTestResult(null)
    try {
      const res = await fetch('/api/settings/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.llmProvider,
          apiKey: apiKeyInput || settings.llmApiKey,
          model: settings.llmModel,
          baseUrl: settings.llmBaseUrl || undefined,
        }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ ok: false, message: '连接失败' })
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/" className="text-xs text-secondary hover:text-foreground transition-colors">← 首页</Link>
      <h1 className="text-xl font-medium mt-3 mb-10">设置</h1>

      {/* Account */}
      <section className="mb-10">
        <h2 className="text-xs text-secondary tracking-widest uppercase mb-4">账号</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-secondary">邮箱</span>
            <span className="text-sm">{email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-secondary">退出登录</span>
            <button onClick={handleLogout} className="text-xs border border-border px-3 py-1.5 hover:border-accent transition-colors">
              退出
            </button>
          </div>
        </div>
      </section>

      {/* AI Model */}
      <section className="mb-10">
        <h2 className="text-xs text-secondary tracking-widest uppercase mb-4">AI 模型</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-secondary mb-1.5">模型供应商</label>
            <div className="flex gap-2">
              {['anthropic', 'openai', 'custom'].map(p => (
                <button
                  key={p}
                  onClick={() => save({ llmProvider: p })}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    settings.llmProvider === p ? 'border-accent bg-accent text-white' : 'border-border hover:border-accent'
                  }`}
                >
                  {{ anthropic: 'Anthropic', openai: 'OpenAI', custom: '自定义' }[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-secondary mb-1.5">模型名称</label>
            <input
              value={settings.llmModel}
              onChange={e => setSettings(s => ({ ...s, llmModel: e.target.value }))}
              onBlur={() => save({ llmModel: settings.llmModel })}
              className="w-full px-3 py-2.5 border border-border bg-card text-sm"
              placeholder="claude-sonnet-4-5"
            />
          </div>

          <div>
            <label className="block text-xs text-secondary mb-1.5">API Key</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput || settings.llmApiKey}
                onChange={e => setApiKeyInput(e.target.value)}
                onBlur={() => {
                  if (apiKeyInput && !apiKeyInput.includes('•')) {
                    save({ llmApiKey: apiKeyInput })
                  }
                }}
                className="flex-1 px-3 py-2.5 border border-border bg-card text-sm"
                placeholder="sk-..."
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-xs border border-border px-3 hover:border-accent transition-colors"
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          {settings.llmProvider === 'custom' && (
            <div>
              <label className="block text-xs text-secondary mb-1.5">API 端点</label>
              <input
                value={settings.llmBaseUrl}
                onChange={e => setSettings(s => ({ ...s, llmBaseUrl: e.target.value }))}
                onBlur={() => save({ llmBaseUrl: settings.llmBaseUrl })}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              className="text-xs border border-border px-3 py-1.5 hover:border-accent transition-colors"
            >
              测试连接
            </button>
            {testResult && (
              <span className={`text-xs ${testResult.ok ? 'text-success' : 'text-error'}`}>
                {testResult.ok ? '✓ 连接成功' : `✗ ${testResult.message}`}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Learning params */}
      <section className="mb-10">
        <h2 className="text-xs text-secondary tracking-widest uppercase mb-4">学习参数</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1.5">文章长度（词）</label>
              <input
                type="number"
                value={globalConfig.article_length || 300}
                onChange={e => saveGlobalConfig('article_length', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1.5">新词密度（每百词）</label>
              <input
                type="number"
                value={globalConfig.new_word_density || 3}
                onChange={e => saveGlobalConfig('new_word_density', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1.5">复习词占比 (%)</label>
              <input
                type="number"
                value={Math.round((globalConfig.review_ratio || 0.3) * 100)}
                onChange={e => saveGlobalConfig('review_ratio', Number(e.target.value) / 100)}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1.5">复习窗口（最近 N 篇）</label>
              <input
                type="number"
                value={globalConfig.review_window || 5}
                onChange={e => saveGlobalConfig('review_window', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-secondary mb-1.5">难度递增步长</label>
              <input
                type="number"
                value={globalConfig.difficulty_step || 0.3}
                onChange={e => saveGlobalConfig('difficulty_step', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
                step="0.1"
                min="0.1"
                max="2"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1.5">难度上限</label>
              <input
                type="number"
                value={globalConfig.difficulty_max || 8}
                onChange={e => saveGlobalConfig('difficulty_max', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border bg-card text-sm"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topic configs */}
      <section className="mb-10">
        <h2 className="text-xs text-secondary tracking-widest uppercase mb-4">各主题设置</h2>
        <div className="border border-border">
          <div className="grid grid-cols-5 text-xs text-secondary border-b border-border">
            <div className="px-3 py-2">主题</div>
            <div className="px-3 py-2">起始难度</div>
            <div className="px-3 py-2">递增步长</div>
            <div className="px-3 py-2">复习占比</div>
            <div className="px-3 py-2">新词密度</div>
          </div>
          {topics.map(t => {
            let cfg: Record<string, number> = {}
            try { cfg = JSON.parse(t.config || '{}') } catch {}
            return (
              <div key={t.id} className="grid grid-cols-5 text-xs border-b border-border last:border-0">
                <div className="px-3 py-2.5 text-sm">{t.name}</div>
                <div className="px-3 py-2.5">{cfg.difficulty_start || '-'}</div>
                <div className="px-3 py-2.5">{cfg.difficulty_step || '-'}</div>
                <div className="px-3 py-2.5">{cfg.review_ratio ? Math.round(cfg.review_ratio * 100) + '%' : '-'}</div>
                <div className="px-3 py-2.5">{cfg.new_word_density || '-'}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* TTS */}
      <section className="mb-10">
        <h2 className="text-xs text-secondary tracking-widest uppercase mb-4">发音</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-secondary mb-1.5">TTS 服务</label>
            <div className="flex gap-2">
              {['web-speech-api', 'edge-tts'].map(s => (
                <button
                  key={s}
                  onClick={() => save({ ttsService: s })}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    settings.ttsService === s ? 'border-accent bg-accent text-white' : 'border-border hover:border-accent'
                  }`}
                >
                  {{ 'web-speech-api': '浏览器内置', 'edge-tts': 'Edge TTS' }[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-secondary mb-1.5">口音偏好</label>
            <div className="flex gap-2">
              {['us', 'uk'].map(a => (
                <button
                  key={a}
                  onClick={() => save({ accent: a })}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    settings.accent === a ? 'border-accent bg-accent text-white' : 'border-border hover:border-accent'
                  }`}
                >
                  {{ us: '美式', uk: '英式' }[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-secondary">划词自动朗读</span>
            <button
              onClick={() => save({ autoReadOnSelect: !settings.autoReadOnSelect })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.autoReadOnSelect ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.autoReadOnSelect ? 'left-5' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-secondary">标记生词时自动发音</span>
            <button
              onClick={() => save({ autoPronounce: !settings.autoPronounce })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                settings.autoPronounce ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.autoPronounce ? 'left-5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {saving && <div className="fixed bottom-4 right-4 text-xs text-secondary bg-card border border-border px-3 py-1.5">保存中...</div>}
    </div>
  )
}
