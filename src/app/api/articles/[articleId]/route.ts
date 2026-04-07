import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { articles, wordContexts, words } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId } = await params
  const article = await db.query.articles.findFirst({
    where: (a, { eq: e, and: a2 }) => a2(e(a.id, articleId), e(a.userId, userId)),
  })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get words for this article
  const contexts = await db.select({
    contextId: wordContexts.id,
    wordId: wordContexts.wordId,
    sentence: wordContexts.sentence,
    sentenceTranslation: wordContexts.sentenceTranslation,
    isReview: wordContexts.isReview,
    text: words.text,
    phonetic: words.phonetic,
    definition: words.definition,
    pos: words.pos,
    familiarity: words.familiarity,
    reviewCount: words.reviewCount,
  })
    .from(wordContexts)
    .innerJoin(words, eq(wordContexts.wordId, words.id))
    .where(eq(wordContexts.articleId, articleId))

  return NextResponse.json({ ...article, words: contexts })
}
