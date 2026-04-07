import { db } from '@/db'
import { topics, articles, words } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, desc, and, sql, gt } from 'drizzle-orm'
import { HomeClient } from '@/components/home-client'

export default async function HomePage() {
  const userId = (await requireAuth())!

  const rawTopics = await db.select().from(topics)
    .where(eq(topics.userId, userId))
    .orderBy(sql`${topics.isBuiltin} DESC`, topics.createdAt)

  // Convert boolean fields from number to boolean
  const userTopics = rawTopics.map(t => ({
    ...t,
    isBuiltin: Boolean(t.isBuiltin),
  }))

  const recentArticles = await db.select({
    id: articles.id,
    title: articles.title,
    topicId: articles.topicId,
    difficulty: articles.difficulty,
    wordCount: articles.wordCount,
    createdAt: articles.createdAt,
    sequence: articles.sequence,
  }).from(articles)
    .where(eq(articles.userId, userId))
    .orderBy(desc(articles.createdAt))
    .limit(6)

  const stats = await db.select({
    total: sql<number>`count(*)`,
    unfamiliar: sql<number>`sum(case when ${words.familiarity} = 'unfamiliar' then 1 else 0 end)`,
    vague: sql<number>`sum(case when ${words.familiarity} = 'vague' then 1 else 0 end)`,
    familiar: sql<number>`sum(case when ${words.familiarity} = 'familiar' then 1 else 0 end)`,
  }).from(words).where(eq(words.userId, userId))

  const weekAgoTs = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
  const weekNew = await db.select({ count: sql<number>`count(*)` })
    .from(words)
    .where(and(eq(words.userId, userId), sql`${words.createdAt} > ${weekAgoTs}`))

  // Build topic name map for articles
  const topicMap = Object.fromEntries(userTopics.map(t => [t.id, t.name]))

  return (
    <HomeClient
      topics={userTopics}
      recentArticles={recentArticles.map(a => ({ ...a, topicName: topicMap[a.topicId] || '', createdAt: new Date(a.createdAt * 1000) }))}
      stats={{
        total: stats[0]?.total || 0,
        weekNew: weekNew[0]?.count || 0,
        needReview: (stats[0]?.unfamiliar || 0) + (stats[0]?.vague || 0),
      }}
    />
  )
}
