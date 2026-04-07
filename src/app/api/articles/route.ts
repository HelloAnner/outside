import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { articles, topics, userSettings } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, and, desc } from 'drizzle-orm'
import { createLLMAdapter } from '@/lib/llm/adapter'
import { buildArticlePrompt } from '@/lib/llm/prompts/article'
import { mergeConfig, calculateDifficulty } from '@/lib/difficulty'
import { selectReviewWords } from '@/lib/review-weaving'
import { decrypt } from '@/lib/crypto'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const topicId = req.nextUrl.searchParams.get('topicId')
  if (!topicId) return NextResponse.json({ error: 'topicId required' }, { status: 400 })

  const result = await db.select().from(articles)
    .where(and(eq(articles.userId, userId), eq(articles.topicId, topicId)))
    .orderBy(desc(articles.sequence))

  return NextResponse.json(result)
}

const generateSchema = z.object({ topicId: z.string() })

export async function POST(req: NextRequest) {
  const userId = await requireAuth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { topicId } = generateSchema.parse(body)

    const topic = await db.query.topics.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.id, topicId), e(t.userId, userId)),
    })
    if (!topic) return NextResponse.json({ error: '主题不存在' }, { status: 404 })

    const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })
    if (!settings) return NextResponse.json({ error: '设置不存在' }, { status: 500 })

    const config = mergeConfig(settings.globalConfig, topic.config)
    const difficulty = calculateDifficulty(topic.articlesCount, config)
    const reviewWords = await selectReviewWords(userId, config)

    let refWords: string[] = []
    try { refWords = JSON.parse(topic.referenceWords || '[]') } catch {}

    const messages = buildArticlePrompt({
      contentFormat: topic.contentFormat,
      promptTemplate: topic.promptTemplate,
      difficulty,
      articleLength: config.article_length,
      newWordDensity: config.new_word_density,
      reviewWords: reviewWords.map(w => w.text),
      referenceWords: refWords,
    })

    const apiKey = settings.llmApiKey ? decrypt(settings.llmApiKey) : process.env.ANTHROPIC_API_KEY || ''
    const adapter = createLLMAdapter(settings.llmProvider, apiKey, settings.llmModel, settings.llmBaseUrl || undefined)

    const llmStream = adapter.streamChat(messages, { temperature: 0.8 })
    const reader = llmStream.getReader()

    const encoder = new TextEncoder()
    const responseStream = new ReadableStream({
      async start(controller) {
        // Send metadata first
        const meta = JSON.stringify({
          topicId,
          sequence: topic.articlesCount + 1,
          difficulty,
          reviewWordIds: reviewWords.map(w => w.id),
        })
        controller.enqueue(encoder.encode(`__META__${meta}__META__\n`))

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          controller.enqueue(encoder.encode(value))
        }
        controller.close()
      },
    })

    return new Response(responseStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    })
  } catch (err) {
    console.error('Article generation error:', err)
    return NextResponse.json({ error: '文章生成失败' }, { status: 500 })
  }
}
