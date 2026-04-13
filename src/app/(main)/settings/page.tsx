import { db } from '@/db'
import { userSettings, users } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { SettingsClient } from '@/components/settings-client'

export default async function SettingsPage() {
  const userId = (await requireAuth())!

  const user = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.id, userId) })
  const settings = await db.query.userSettings.findFirst({ where: (s, { eq: e }) => e(s.userId, userId) })

  const maskedKey = settings?.llmApiKey ? '••••••••' : ''

  const normalizedSettings = settings ? {
    ...settings,
    autoPronounce: Boolean(settings.autoPronounce),
    autoReadOnSelect: Boolean(settings.autoReadOnSelect),
  } : null

  return (
    <SettingsClient
      email={user?.email || ''}
      settings={{
        ...normalizedSettings!,
        llmApiKey: maskedKey,
      }}
    />
  )
}
