import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { wordContexts, articles } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ wordId: string }> }) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { wordId } = await params
  const contexts = await db.select({
    id: wordContexts.id,
    sentence: wordContexts.sentence,
    sentenceTranslation: wordContexts.sentenceTranslation,
    isReview: wordContexts.isReview,
    createdAt: wordContexts.createdAt,
    articleId: wordContexts.articleId,
    articleTitle: articles.title,
    topicId: articles.topicId,
    sequence: articles.sequence,
  })
    .from(wordContexts)
    .innerJoin(articles, eq(wordContexts.articleId, articles.id))
    .where(eq(wordContexts.wordId, wordId))
    .orderBy(desc(wordContexts.createdAt))

  return NextResponse.json(contexts)
}
