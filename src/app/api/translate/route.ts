import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userSettings } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { createLLMAdapter } from '@/lib/llm/adapter'
import { buildTranslatePrompt } from '@/lib/llm/prompts/translate'
import { decrypt } from '@/lib/crypto'
import { z } from 'zod'

const schema = z.object({
  word: z.string().min(1),
  sentence: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { word, sentence } = schema.parse(body)

    const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })
    if (!settings) return NextResponse.json({ error: '设置不存在' }, { status: 500 })

    const apiKey = settings.llmApiKey ? decrypt(settings.llmApiKey) : process.env.ANTHROPIC_API_KEY || ''
    const adapter = createLLMAdapter(settings.llmProvider, apiKey, settings.llmModel, settings.llmBaseUrl || undefined)

    const messages = buildTranslatePrompt(word, sentence)
    const result = await adapter.chat(messages)

    // Parse JSON from LLM response
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '翻译解析失败' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Translate error:', err)
    return NextResponse.json({ error: '翻译失败' }, { status: 500 })
  }
}
