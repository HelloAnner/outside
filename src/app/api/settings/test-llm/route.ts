import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createLLMAdapter } from '@/lib/llm/adapter'
import { z } from 'zod'

const schema = z.object({
  provider: z.string(),
  apiKey: z.string(),
  model: z.string(),
  baseUrl: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { provider, apiKey, model, baseUrl } = schema.parse(body)

    const adapter = createLLMAdapter(provider, apiKey, model, baseUrl)
    const result = await adapter.chat([
      { role: 'user', content: 'Say "connected" in one word.' },
    ])

    return NextResponse.json({ ok: true, message: result.trim() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
