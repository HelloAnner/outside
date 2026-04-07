import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, userSettings, topics } from '@/db/schema'
import { getSession, hashPassword } from '@/lib/auth'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { builtinTopics } from '@/db/seed'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    }

    const userId = nanoid(16)
    const passwordHash = await hashPassword(password)

    await db.insert(users).values({ id: userId, email, passwordHash })
    await db.insert(userSettings).values({ userId })

    for (const t of builtinTopics) {
      await db.insert(topics).values({
        id: nanoid(16),
        userId,
        slug: t.slug,
        name: t.name,
        description: t.description,
        contentFormat: t.contentFormat,
        isBuiltin: 1,
        promptTemplate: t.promptTemplate,
        config: t.config,
      })
    }

    const session = await getSession()
    session.userId = userId
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '请输入有效的邮箱和密码（密码至少8位）' }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
