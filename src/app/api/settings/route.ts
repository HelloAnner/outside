import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userSettings } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { encrypt, decrypt } from '@/lib/crypto'

export async function GET() {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })
  if (!settings) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mask API key for frontend
  const maskedKey = settings.llmApiKey
    ? (() => {
        const decrypted = decrypt(settings.llmApiKey)
        return decrypted.length > 8 ? decrypted.slice(0, 6) + '•'.repeat(decrypted.length - 6) : '••••••••'
      })()
    : ''

  return NextResponse.json({ ...settings, llmApiKey: maskedKey })
}

export async function PUT(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.globalConfig !== undefined) updates.globalConfig = typeof body.globalConfig === 'string' ? body.globalConfig : JSON.stringify(body.globalConfig)
  if (body.accent !== undefined) updates.accent = body.accent
  if (body.autoPronounce !== undefined) updates.autoPronounce = body.autoPronounce
  if (body.autoReadOnSelect !== undefined) updates.autoReadOnSelect = body.autoReadOnSelect
  if (body.llmProvider !== undefined) updates.llmProvider = body.llmProvider
  if (body.llmModel !== undefined) updates.llmModel = body.llmModel
  if (body.llmBaseUrl !== undefined) updates.llmBaseUrl = body.llmBaseUrl
  if (body.ttsService !== undefined) updates.ttsService = body.ttsService

  // Only update API key if user sends a new one (not the masked version)
  if (body.llmApiKey !== undefined && !body.llmApiKey.includes('•')) {
    updates.llmApiKey = body.llmApiKey ? encrypt(body.llmApiKey) : ''
  }

  await db.update(userSettings).set(updates).where(eq(userSettings.userId, userId))

  return NextResponse.json({ ok: true })
}
