import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { words } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  familiarity: z.enum(['unfamiliar', 'vague', 'familiar']).optional(),
  reviewCount: z.number().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ wordId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wordId } = await params
  const body = await req.json()
  const data = updateSchema.parse(body)

  const updates: Record<string, unknown> = {}
  if (data.familiarity) updates.familiarity = data.familiarity
  if (data.reviewCount !== undefined) updates.reviewCount = data.reviewCount

  await db.update(words).set(updates).where(and(eq(words.id, wordId), eq(words.userId, userId)))

  const word = await db.query.words.findFirst({ where: (w, { eq: e }) => e(w.id, wordId) })
  return NextResponse.json(word)
}
