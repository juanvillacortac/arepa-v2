import { prisma, slugify } from './common'
import bcrypt from 'bcryptjs'
import type { RequestEvent } from '@sveltejs/kit/types/internal'
import type { User } from '@prisma/client'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15
  return bcrypt.hash(password, saltRounds)
}

export async function login({
  email,
  password,
  isLogin,
}: {
  email: string
  password: string
  isLogin: boolean
}): Promise<{
  status: number
  headers: { 'Set-Cookie': string }
  body: { userId: string }
}> {
  const userFound = await prisma.user.findUnique({
    where: { email },
    rejectOnNotFound: false,
  })
  if (!userFound && isLogin) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  let uid: string | null = null

  if (userFound) {
    const passwordMatch = await bcrypt.compare(password, userFound.password!)
    if (!passwordMatch) {
      throw {
        error: 'Wrong password or email address.',
      }
    }
    uid = userFound.id
  } else if (!isLogin) {
    const count = await prisma.user.count()
    if (count) {
      throw {
        error: "You can't create a new account",
      }
    }
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })
    uid = user.id
  }

  if (!uid) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  return {
    status: 200,
    headers: {
      'Set-Cookie': `teamId=${uid}; HttpOnly; Path=/; Max-Age=15778800;`,
    },
    body: {
      userId: uid,
    },
  }
}

export const getUserDetails = async (
  event: RequestEvent
): Promise<{
  userId: string | null
  status: number
  body: { message: string }
}> => {
  const userId = event?.locals?.session?.data?.userId || null

  const payload = {
    userId,
    status: 200,
    body: {
      message: 'OK',
    },
  }

  return payload
}

export async function getUser({
  userId,
}: {
  userId: string
}): Promise<Omit<User, 'password'> | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      id: true,
      updatedAt: true,
    },
  })
}
