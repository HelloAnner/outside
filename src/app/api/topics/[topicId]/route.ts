import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { topics } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId } = await params
  const body = await req.json()

  await db.update(topics)
    .set({
      name: body.name,
      description: body.description,
      contentFormat: body.contentFormat,
      promptTemplate: body.promptTemplate,
      referenceWords: body.referenceWords,
      config: body.config,
    })
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId)))

  const updated = await db.query.topics.findFirst({ where: (t, { eq: e }) => e(t.id, topicId) })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId } = await params
  const topic = await db.query.topics.findFirst({
    where: (t, { eq: e, and: a }) => a(e(t.id, topicId), e(t.userId, userId)),
  })

  if (!topic) return NextResponse.json({ error: '主题不存在' }, { status: 404 })
  if (topic.isBuiltin) return NextResponse.json({ error: '内置主题不可删除' }, { status: 403 })

  await db.delete(topics).where(eq(topics.id, topicId))
  return NextResponse.json({ ok: true })
}
