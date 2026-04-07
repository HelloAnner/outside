import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { words, wordContexts } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, and, desc, asc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const familiarity = req.nextUrl.searchParams.get('familiarity')
  const sort = req.nextUrl.searchParams.get('sort') || 'time'

  let query = db.select().from(words).where(eq(words.userId, userId)).$dynamic()

  if (familiarity && familiarity !== 'all') {
    query = query.where(and(eq(words.userId, userId), eq(words.familiarity, familiarity)))
  }

  const orderBy = sort === 'alpha' ? asc(words.text)
    : sort === 'familiarity' ? asc(words.familiarity)
    : desc(words.createdAt)

  const result = await query.orderBy(orderBy)
  return NextResponse.json(result)
}

const createSchema = z.object({
  text: z.string().min(1),
  phonetic: z.string().optional().default(''),
  definition: z.string().optional().default(''),
  pos: z.string().optional().default(''),
  articleId: z.string(),
  sentence: z.string().optional().default(''),
  sentenceTranslation: z.string().optional().default(''),
})

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const wordText = data.text.toLowerCase().trim()

    // Check if word already exists for this user
    let word = await db.query.words.findFirst({
      where: (w, { eq: e, and: a }) => a(e(w.userId, userId), e(w.text, wordText)),
    })

    if (!word) {
      const wordId = nanoid(16)
      await db.insert(words).values({
        id: wordId,
        userId,
        text: wordText,
        phonetic: data.phonetic,
        definition: data.definition,
        pos: data.pos,
      })
      word = await db.query.words.findFirst({ where: (w, { eq: e }) => e(w.id, wordId) })
    }

    if (word) {
      // Check if context already exists
      const existingCtx = await db.query.wordContexts.findFirst({
        where: (wc, { eq: e, and: a }) => a(e(wc.wordId, word!.id), e(wc.articleId, data.articleId)),
      })

      if (!existingCtx) {
        await db.insert(wordContexts).values({
          id: nanoid(16),
          wordId: word.id,
          articleId: data.articleId,
          sentence: data.sentence,
          sentenceTranslation: data.sentenceTranslation,
        })
      }
    }

    return NextResponse.json(word)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: '参数错误' }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: '添加失败' }, { status: 500 })
  }
}
