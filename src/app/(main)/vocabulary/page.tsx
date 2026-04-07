import { db } from '@/db'
import { words } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq, desc, sql } from 'drizzle-orm'
import { VocabularyClient } from '@/components/vocabulary/vocabulary-client'

export default async function VocabularyPage() {
  const userId = (await requireAuth())!

  const rawWords = await db.select().from(words)
    .where(eq(words.userId, userId))
    .orderBy(desc(words.createdAt))

  // Convert createdAt from number to Date
  const allWords = rawWords.map(w => ({
    ...w,
    createdAt: new Date(w.createdAt * 1000),
  }))

  const stats = {
    total: allWords.length,
    unfamiliar: allWords.filter(w => w.familiarity === 'unfamiliar').length,
    vague: allWords.filter(w => w.familiarity === 'vague').length,
    familiar: allWords.filter(w => w.familiarity === 'familiar').length,
  }

  return <VocabularyClient words={allWords} stats={stats} />
}
