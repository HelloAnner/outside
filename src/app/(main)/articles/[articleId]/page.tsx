import { db } from '@/db'
import { articles, topics, wordContexts, words, userSettings } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ReadingClient } from '@/components/reader/reading-client'

export default async function ArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const userId = (await requireAuth())!
  const { articleId } = await params

  const article = await db.query.articles.findFirst({
    where: (a, { eq: e, and: a2 }) => a2(e(a.id, articleId), e(a.userId, userId)),
  })
  if (!article) notFound()

  const topic = await db.query.topics.findFirst({
    where: (t, { eq: e }) => e(t.id, article.topicId),
  })

  const rawContexts = await db.select({
    id: wordContexts.id,
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

  // Convert isReview from number to boolean
  const contexts = rawContexts.map(ctx => ({
    ...ctx,
    isReview: Boolean(ctx.isReview),
  }))

  const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })

  // Get prev/next articles
  const prevArticle = article.sequence > 1
    ? await db.query.articles.findFirst({
        where: (a, { eq: e, and: a2 }) => a2(e(a.topicId, article.topicId), e(a.sequence, article.sequence - 1)),
      })
    : null

  const nextArticle = await db.query.articles.findFirst({
    where: (a, { eq: e, and: a2 }) => a2(e(a.topicId, article.topicId), e(a.sequence, article.sequence + 1)),
  })

  let reviewWordIds: string[] = []
  try { reviewWordIds = JSON.parse(article.reviewWordIds || '[]') } catch {}

  return (
    <ReadingClient
      article={article}
      topic={topic!}
      wordContexts={contexts}
      reviewWordIds={reviewWordIds}
      prevArticleId={prevArticle?.id || null}
      nextArticleId={nextArticle?.id || null}
      settings={{
        accent: (settings?.accent as 'us' | 'uk') || 'us',
        autoReadOnSelect: Boolean(settings?.autoReadOnSelect ?? true),
        ttsService: (settings?.ttsService as string) || 'web-speech-api',
      }}
    />
  )
}
