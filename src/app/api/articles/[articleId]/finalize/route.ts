import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { articles, topics } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, and, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const schema = z.object({
  title: z.string(),
  content: z.string(),
  translation: z.string().optional().default(''),
  difficulty: z.number(),
  topicId: z.string(),
  sequence: z.number(),
  wordCount: z.number().optional().default(0),
  reviewWordIds: z.string().optional().default('[]'),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { articleId } = await params
    const body = await req.json()
    const data = schema.parse(body)

    // Use the articleId from params, or generate new one
    const id = articleId === 'new' ? nanoid(16) : articleId

    await db.insert(articles).values({
      id,
      userId,
      topicId: data.topicId,
      sequence: data.sequence,
      title: data.title,
      content: data.content,
      translation: data.translation,
      difficulty: data.difficulty,
      wordCount: data.wordCount || data.content.split(/\s+/).length,
      reviewWordIds: data.reviewWordIds,
    }).onConflictDoUpdate({
      target: articles.id,
      set: {
        title: data.title,
        content: data.content,
        translation: data.translation,
      },
    })

    // Increment articles count
    await db.update(topics)
      .set({ articlesCount: sql`${topics.articlesCount} + 1` })
      .where(and(eq(topics.id, data.topicId), eq(topics.userId, userId)))

    return NextResponse.json({ id, ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
