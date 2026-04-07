import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  text: z.string().min(1),
  accent: z.enum(['us', 'uk']).default('us'),
})

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { text, accent } = schema.parse(body)

    const { generateEdgeTTS } = require('@/lib/tts')
    const audioBuffer = await generateEdgeTTS(text, accent)

    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length.toString() },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'TTS 失败' }, { status: 500 })
  }
}
