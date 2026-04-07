import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const now = sql`(unixepoch())`

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull().default(now),
  lastLoginAt: integer('last_login_at'),
})

export const topics = sqliteTable('topics', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  contentFormat: text('content_format').notNull().default('essay'),
  isBuiltin: integer('is_builtin').notNull().default(0),
  promptTemplate: text('prompt_template').notNull().default(''),
  referenceWords: text('reference_words').notNull().default('[]'),
  config: text('config').notNull().default('{}'),
  articlesCount: integer('articles_count').notNull().default(0),
  createdAt: integer('created_at').notNull().default(now),
}, (table) => [
  uniqueIndex('idx_topics_user_slug').on(table.userId, table.slug),
  index('idx_topics_user').on(table.userId),
])

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  topicId: text('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  translation: text('translation').notNull().default(''),
  difficulty: real('difficulty').notNull(),
  wordCount: integer('word_count').notNull().default(0),
  reviewWordIds: text('review_word_ids').notNull().default('[]'),
  createdAt: integer('created_at').notNull().default(now),
}, (table) => [
  uniqueIndex('idx_articles_topic_seq').on(table.topicId, table.sequence),
  index('idx_articles_user_created').on(table.userId, table.createdAt),
])

export const words = sqliteTable('words', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  phonetic: text('phonetic').notNull().default(''),
  definition: text('definition').notNull().default(''),
  pos: text('pos').notNull().default(''),
  familiarity: text('familiarity').notNull().default('unfamiliar'),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: integer('created_at').notNull().default(now),
}, (table) => [
  uniqueIndex('idx_words_user_text').on(table.userId, table.text),
  index('idx_words_user_familiarity').on(table.userId, table.familiarity, table.createdAt),
  index('idx_words_user_review').on(table.userId, table.familiarity, table.reviewCount),
])

export const wordContexts = sqliteTable('word_contexts', {
  id: text('id').primaryKey(),
  wordId: text('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
  articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  sentence: text('sentence').notNull(),
  sentenceTranslation: text('sentence_translation').notNull().default(''),
  isReview: integer('is_review').notNull().default(0),
  createdAt: integer('created_at').notNull().default(now),
}, (table) => [
  uniqueIndex('idx_word_contexts_word_article').on(table.wordId, table.articleId),
  index('idx_word_contexts_word').on(table.wordId, table.createdAt),
  index('idx_word_contexts_article').on(table.articleId),
])

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  globalConfig: text('global_config').notNull().default('{}'),
  accent: text('accent').notNull().default('us'),
  autoPronounce: integer('auto_pronounce').notNull().default(0),
  autoReadOnSelect: integer('auto_read_on_select').notNull().default(1),
  llmProvider: text('llm_provider').notNull().default('anthropic'),
  llmModel: text('llm_model').notNull().default('claude-sonnet-4-5'),
  llmApiKey: text('llm_api_key').notNull().default(''),
  llmBaseUrl: text('llm_base_url').notNull().default(''),
  ttsService: text('tts_service').notNull().default('web-speech-api'),
})
