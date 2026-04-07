import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getSession, verifyPassword } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) })
    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    await db.update(users).set({ lastLoginAt: Math.floor(Date.now() / 1000) }).where(eq(users.id, user.id))

    const session = await getSession()
    session.userId = user.id
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 })
    }
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
