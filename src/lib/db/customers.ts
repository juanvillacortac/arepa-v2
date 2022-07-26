import { prisma } from './common'
import bcrypt from 'bcryptjs'
import type { RequestEvent } from '@sveltejs/kit/types/internal'
import type { Customer, Prisma } from '@prisma/client'

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15
  return bcrypt.hash(password, saltRounds)
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export async function getCustomers({
  filter,
  orderBy = {
    createdAt: 'desc',
  },
  page = 1,
  pageSize = 20,
}: {
  filter?: {
    name?: string
    email?: string
  }
  orderBy?: {
    id?: 'desc' | 'asc'
    firstName?: 'desc' | 'asc'
    lastName?: 'desc' | 'asc'
    email?: 'desc' | 'asc'
    createdAt?: 'desc' | 'asc'
  }
  page?: number
  pageSize?: number
}) {
  const segments = filter?.name?.split(' ') || []
  const isFullSearch = segments.length > 1
  const where: Prisma.CustomerWhereInput = {
    email: filter?.email
      ? {
          contains: filter.email,
        }
      : undefined,
    OR: filter?.name
      ? [
          {
            id: {
              startsWith: filter.name,
            },
          },
          {
            email: {
              startsWith: filter.name,
            },
          },
          {
            firstName: {
              startsWith: isFullSearch ? segments[0] : filter.name,
            },
          },
          {
            lastName: {
              startsWith: isFullSearch ? segments[1] : filter.name,
            },
          },
        ]
      : undefined,
  }
  const [count, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy,
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
  ])
  return { count, customers }
}

export async function loginCustomer({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<{
  status: number
  headers: { 'Set-Cookie': string }
  body: { customerId: string }
}> {
  const customerFound = await prisma.customer.findFirst({
    where: { email },
    include: {
      accounts: true,
    },
    rejectOnNotFound: false,
  })
  if (!customerFound) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  let uid: string | null = null
  const account = customerFound?.accounts.find(
    (a) => a.provider === 'credentials'
  )?.authMeta as {
    password: string
  } | null

  if (customerFound && account) {
    const passwordMatch = await bcrypt.compare(password, account.password)
    if (!passwordMatch) {
      throw {
        error: 'Wrong password or email address.',
      }
    }
    uid = customerFound.id
  }

  if (!uid) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  return {
    status: 200,
    headers: {
      'Set-Cookie': `customerId=${uid}; HttpOnly; Path=/; Max-Age=15778800;`,
    },
    body: {
      customerId: uid,
    },
  }
}

export async function registerCustomer({
  firstName,
  lastName,
  phone,
  email,
  password,
}: {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
}): Promise<Customer> {
  const customerFound = await prisma.customer.findFirst({
    where: { email },
    select: {
      email: true,
    },
    rejectOnNotFound: false,
  })
  if (customerFound) {
    throw {
      error: 'Email already registered.',
    }
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      firstName,
      lastName,
      phoneNumber: phone,
      accounts: {
        create: {
          authMeta: {
            password: await hashPassword(password),
          },
          provider: 'credentials',
        },
      },
    },
  })

  return customer
}

export async function modifyCustomer({
  id,
  firstName,
  lastName,
  email,
  phoneNumber,
  currency,
}: Overwrite<
  Partial<Customer>,
  {
    id: string
  }
>): Promise<Customer> {
  const customerFound = await prisma.customer.findFirst({
    where: {
      email,
      id: {
        not: id,
      },
    },
    select: {
      email: true,
    },
    rejectOnNotFound: false,
  })
  if (customerFound) {
    throw {
      error: 'Email already registered.',
    }
  }

  const customer = await prisma.customer.update({
    data: {
      email,
      firstName,
      lastName,
      currency,
      phoneNumber,
    },
    where: {
      id,
    },
  })

  return customer
}

export const getCustomerDetails = async (
  event: RequestEvent
): Promise<{
  customerId: string | null
  status: number
  body: { message: string }
}> => {
  const customerId = event?.locals?.session?.data?.customerId || null

  const payload = {
    customerId,
    status: 200,
    body: {
      message: 'OK',
    },
  }

  return payload
}

export async function getCustomer({
  customerId,
}: {
  customerId: string
}): Promise<Customer | null> {
  return await prisma.customer.findUnique({
    where: { id: customerId },
  })
}
