import { db } from '@/db'
import { articles, words, wordContexts } from '@/db/schema'
import { eq, and, ne, desc, asc, inArray, sql } from 'drizzle-orm'
import type { TopicConfig } from './difficulty'

export async function selectReviewWords(
  userId: string,
  config: Required<TopicConfig>
): Promise<{ id: string; text: string }[]> {
  const totalNewWords = Math.ceil(config.article_length / 100 * config.new_word_density)
  const reviewCount = Math.ceil(totalNewWords * config.review_ratio)

  if (reviewCount === 0) return []

  const recentArticles = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.userId, userId))
    .orderBy(desc(articles.createdAt))
    .limit(config.review_window)

  if (recentArticles.length === 0) return []

  const recentIds = recentArticles.map(a => a.id)

  const candidates = await db
    .select({ id: words.id, text: words.text, familiarity: words.familiarity, reviewCount: words.reviewCount })
    .from(words)
    .innerJoin(wordContexts, eq(words.id, wordContexts.wordId))
    .where(and(
      eq(words.userId, userId),
      inArray(wordContexts.articleId, recentIds),
      ne(words.familiarity, 'familiar'),
    ))
    .orderBy(
      sql`CASE WHEN ${words.familiarity} = 'unfamiliar' THEN 0 ELSE 1 END`,
      asc(words.reviewCount),
    )

  const unique = [...new Map(candidates.map(c => [c.id, { id: c.id, text: c.text }])).values()]
  return unique.slice(0, reviewCount)
}
