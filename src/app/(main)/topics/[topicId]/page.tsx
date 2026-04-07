import { db } from '@/db'
import { topics, articles, words, wordContexts } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, and, desc, sql } from 'drizzle-orm'
import { mergeConfig, calculateDifficulty } from '@/lib/difficulty'
import { notFound } from 'next/navigation'
import { TopicDetailClient } from '@/components/topic/topic-detail-client'

export default async function TopicDetailPage({ params }: { params: Promise<{ topicId: string }> }) {
  const userId = (await requireAuth())!
  const { topicId } = await params

  const topic = await db.query.topics.findFirst({
    where: (t, { eq: e, and: a }) => a(e(t.id, topicId), e(t.userId, userId)),
  })
  if (!topic) notFound()

  // Convert boolean fields from number to boolean
  const normalizedTopic = {
    ...topic,
    isBuiltin: Boolean(topic.isBuiltin),
  }

  const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })
  const config = mergeConfig(settings?.globalConfig || '{}', topic.config)
  const nextDifficulty = calculateDifficulty(topic.articlesCount, config)

  const articleList = await db.select({
    id: articles.id,
    sequence: articles.sequence,
    title: articles.title,
    difficulty: articles.difficulty,
    wordCount: articles.wordCount,
    createdAt: articles.createdAt,
  }).from(articles)
    .where(and(eq(articles.topicId, topicId), eq(articles.userId, userId)))
    .orderBy(desc(articles.sequence))

  // Count words per article
  const wordCounts = await db.select({
    articleId: wordContexts.articleId,
    count: sql<number>`count(*)`,
  }).from(wordContexts)
    .innerJoin(articles, eq(wordContexts.articleId, articles.id))
    .where(eq(articles.topicId, topicId))
    .groupBy(wordContexts.articleId)

  const wordCountMap = Object.fromEntries(wordCounts.map(w => [w.articleId, w.count]))

  // Total words learned in this topic
  const totalWords = wordCounts.reduce((sum, w) => sum + w.count, 0)

  return (
    <TopicDetailClient
      topic={normalizedTopic}
      articles={articleList.map(a => ({
        ...a,
        wordsCount: wordCountMap[a.id] || 0,
        createdAt: new Date(a.createdAt * 1000),
      }))}
      nextDifficulty={nextDifficulty}
      totalWords={totalWords}
      config={config}
    />
  )
}
