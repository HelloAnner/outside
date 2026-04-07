import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { topics } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

export async function GET() {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await db.select().from(topics).where(eq(topics.userId, userId)).orderBy(topics.createdAt)
  return NextResponse.json(result)
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  contentFormat: z.enum(['dialogue', 'essay', 'story', 'email', 'mixed', 'free']),
  promptTemplate: z.string().optional().default(''),
  referenceWords: z.string().optional().default('[]'),
  config: z.string().optional().default('{}'),
})

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || nanoid(8)
    const id = nanoid(16)

    await db.insert(topics).values({
      id,
      userId,
      slug,
      name: data.name,
      description: data.description,
      contentFormat: data.contentFormat,
      isBuiltin: 0,
      promptTemplate: data.promptTemplate,
      referenceWords: data.referenceWords,
      config: data.config,
    })

    const topic = await db.query.topics.findFirst({ where: (t, { eq }) => eq(t.id, id) })
    return NextResponse.json(topic)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: '参数错误' }, { status: 400 })
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
