'use client'

import { useState } from 'react'
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

interface Props {
  email: string
  settings: Settings
}

export function SettingsClient({ email, settings: initial }: Props) {
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
    <div className="px-9 py-7 max-w-[720px]">
      <h1 className="text-[22px] font-semibold text-fg-primary tracking-tight mb-7">设置</h1>

      {/* Account */}
      <section className="mb-7">
        <h2 className="text-[14px] font-medium text-fg-primary mb-3">账号</h2>
        <div className="bg-surface-card rounded-xl border border-border-light divide-y divide-border-light">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">邮箱</span>
            <span className="text-[13px] text-fg-primary">{email}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">修改密码</span>
            <button className="text-[13px] text-fg-muted hover:text-accent transition-colors">修改</button>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-danger">注销账号</span>
            <button onClick={handleLogout} className="text-[13px] text-fg-muted hover:text-danger transition-colors flex items-center gap-1">
              🚪
            </button>
          </div>
        </div>
      </section>

      {/* AI Model */}
      <section className="mb-7">
        <h2 className="text-[14px] font-medium text-fg-primary mb-3">AI 模型</h2>
        <div className="bg-surface-card rounded-xl border border-border-light divide-y divide-border-light">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">模型供应商</span>
            <div className="flex gap-1.5">
              {['anthropic', 'openai', 'custom'].map(p => (
                <button
                  key={p}
                  onClick={() => save({ llmProvider: p })}
                  className={`px-3 py-1 text-[12px] rounded-lg transition-colors ${
                    settings.llmProvider === p
                      ? 'bg-accent text-fg-inverse font-medium'
                      : 'text-fg-muted hover:bg-surface-secondary'
                  }`}
                >
                  {{ anthropic: 'Anthropic', openai: 'OpenAI', custom: '自定义' }[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">模型名称</span>
            <input
              value={settings.llmModel}
              onChange={e => setSettings(s => ({ ...s, llmModel: e.target.value }))}
              onBlur={() => save({ llmModel: settings.llmModel })}
              className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-48 placeholder:text-fg-muted"
              placeholder="claude-sonnet-4-5"
            />
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">API Key</span>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput || settings.llmApiKey}
              onChange={e => setApiKeyInput(e.target.value)}
              onBlur={() => {
                if (apiKeyInput && !apiKeyInput.includes('•')) {
                  save({ llmApiKey: apiKeyInput })
                }
              }}
              className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-48 placeholder:text-fg-muted"
              placeholder="sk-ant-..."
            />
          </div>
          {settings.llmProvider === 'custom' && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px] text-fg-secondary">API 端点</span>
              <input
                value={settings.llmBaseUrl}
                onChange={e => setSettings(s => ({ ...s, llmBaseUrl: e.target.value }))}
                onBlur={() => save({ llmBaseUrl: settings.llmBaseUrl })}
                className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-56 placeholder:text-fg-muted"
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
          )}
          <div className="px-5 py-3.5 flex items-center gap-3">
            <button
              onClick={testConnection}
              className="text-[13px] text-fg-inverse bg-accent px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-colors"
            >
              测试连接
            </button>
            {testResult && (
              <span className={`text-[13px] ${testResult.ok ? 'text-success' : 'text-danger'}`}>
                {testResult.ok ? '✓ 连接成功' : `✗ ${testResult.message}`}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Learning params */}
      <section className="mb-7">
        <h2 className="text-[14px] font-medium text-fg-primary mb-3">学习参数</h2>
        <div className="bg-surface-card rounded-xl border border-border-light divide-y divide-border-light">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">文章长度</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={globalConfig.article_length || 300}
                onChange={e => saveGlobalConfig('article_length', Number(e.target.value))}
                className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-16"
              />
              <span className="text-[13px] text-fg-muted">词</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">新词密度</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-fg-muted">每百词</span>
              <input
                type="number"
                value={globalConfig.new_word_density || 3}
                onChange={e => saveGlobalConfig('new_word_density', Number(e.target.value))}
                className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-12"
              />
              <span className="text-[13px] text-fg-muted">个</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">复习词占比</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={Math.round((globalConfig.review_ratio || 0.3) * 100)}
                onChange={e => saveGlobalConfig('review_ratio', Number(e.target.value) / 100)}
                className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-12"
                min="0"
                max="100"
              />
              <span className="text-[13px] text-fg-muted">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">复习窗口序长</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={globalConfig.review_window || 5}
                onChange={e => saveGlobalConfig('review_window', Number(e.target.value))}
                className="text-right text-[13px] text-fg-primary bg-transparent border-0 outline-none w-12"
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TTS */}
      <section className="mb-7">
        <h2 className="text-[14px] font-medium text-fg-primary mb-3">发音</h2>
        <div className="bg-surface-card rounded-xl border border-border-light divide-y divide-border-light">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-fg-secondary">TTS 服务</span>
            <div className="flex gap-1.5">
              {['web-speech-api', 'edge-tts'].map(s => (
                <button
                  key={s}
                  onClick={() => save({ ttsService: s })}
                  className={`px-3 py-1 text-[12px] rounded-lg transition-colors ${
                    settings.ttsService === s
                      ? 'bg-accent text-fg-inverse font-medium'
                      : 'text-fg-muted hover:bg-surface-secondary'
                  }`}
                >
                  {{ 'web-speech-api': '浏览器内置', 'edge-tts': 'Edge TTS' }[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {saving && (
        <div className="fixed bottom-4 right-4 text-[13px] text-fg-muted bg-surface-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
          保存中...
        </div>
      )}
    </div>
  )
}
