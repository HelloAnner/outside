import { db } from '@/db'
import { userSettings, topics, users } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { SettingsClient } from '@/components/settings-client'

export default async function SettingsPage() {
  const userId = (await requireAuth())!

  const user = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.id, userId) })
  const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })
  const userTopics = await db.select().from(topics).where(eq(topics.userId, userId))

  // Fetch settings with masked API key via API
  const maskedKey = settings?.llmApiKey ? '••••••••' : ''

  // Convert boolean fields from number to boolean
  const normalizedSettings = settings ? {
    ...settings,
    autoPronounce: Boolean(settings.autoPronounce),
    autoReadOnSelect: Boolean(settings.autoReadOnSelect),
  } : null

  // Convert topics boolean fields
  const normalizedTopics = userTopics.map(t => ({
    ...t,
    isBuiltin: Boolean(t.isBuiltin),
  }))

  return (
    <SettingsClient
      email={user?.email || ''}
      settings={{
        ...normalizedSettings!,
        llmApiKey: maskedKey,
      }}
      topics={normalizedTopics}
    />
  )
}
