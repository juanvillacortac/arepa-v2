import { prisma, slugify } from './common'
import type {
  Prisma,
  Product as _Product,
  ProductModifier as _ProductModifier,
  ProductModifierItem as _ProductModifierItem,
  StoreCategory,
} from '@prisma/client'

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type ProductModifierItem = Omit<_ProductModifierItem, 'ordinal'> & {
  meta: any
}

export type ProductModifier = Omit<_ProductModifier, 'ordinal'> & {
  meta?: any
  items: ProductModifierItem[]
}

export type Product = Overwrite<
  _Product,
  {
    meta?: any
    storeCategory: StoreCategory | null
    modifiers: ProductModifier[]
  }
>

export type StripedProduct = Omit<Product, 'archived' | 'modifiers'>

export const getProductById = (id: string): Promise<Product | null> =>
  prisma.product
    .findUnique({
      where: {
        id,
      },
      include: {
        storeCategory: true,
        modifiers: {
          where: {
            active: true,
          },
          orderBy: {
            ordinal: 'asc',
          },
          include: {
            items: {
              where: {
                active: true,
              },
              orderBy: {
                ordinal: 'asc',
              },
            },
          },
        },
      },
    })
    .then((data: Product | null) => {
      if (data) {
        data.modifiers = data!.modifiers!.map((m) => {
          // @ts-ignore
          delete m?.ordinal
          m.items = m?.items!.map((i) => {
            // @ts-ignore
            delete i.ordinal
            return i
          })
          return m
        })
      }
      return data
    })

export const getProductBySlug = ({
  slug,
}: {
  slug: string
}): Promise<Product | null> =>
  prisma.product
    .findFirst({
      where: {
        slug,
      },
      include: {
        storeCategory: true,
        modifiers: {
          where: {
            active: true,
          },
          orderBy: {
            ordinal: 'asc',
          },
          include: {
            items: {
              where: {
                active: true,
              },
              orderBy: {
                ordinal: 'asc',
              },
            },
          },
        },
      },
    })
    .then((data: Product | null) => {
      if (data) {
        data.modifiers = data!.modifiers!.map((m) => {
          // @ts-ignore
          delete m?.ordinal
          m.items = m?.items!.map((i) => {
            // @ts-ignore
            delete i.ordinal
            return i
          })
          return m
        })
      }
      return data
    })

const getLastDays = (days: number) =>
  new Date(Date.now() - 24 * days * 60 * 60 * 1000)

export const getProducts = async ({
  published,
  archived,
}: {
  published?: boolean
  archived?: boolean
}): Promise<StripedProduct[]> =>
  prisma.product.findMany({
    where: {
      public: published,
      archived: archived || false,
      OR: archived
        ? [
            {
              archivedAt: {
                gte: getLastDays(30).toISOString(),
              },
            },
            {
              archivedAt: {
                equals: null,
              },
            },
          ]
        : undefined,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      price: true,
      type: true,
      public: true,
      slug: true,
      description: true,
      storeCategoryId: true,
      updatedAt: true,
      minQuantity: true,
      meta: true,
      archivedAt: true,
      storeCategory: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

export const upsertProduct = async (
  product: Partial<Product>,
  userId: string
): Promise<Product | null> => {
  let c: _Product | null
  if (product.id) {
    c = await prisma.product.findFirst({
      where: {
        id: product.id,
      },
    })
    if (!c) {
      throw new Error('not allowed')
    }
    await prisma.product.update({
      where: {
        id: c?.id,
      },
      data: {
        name: product.name,
        price: product.price,
        type: product.type,
        minQuantity: product.minQuantity || null,
        public: product.public,
        description: product.description,
        meta: product.meta,
        archived: product.archived,
        archivedAt:
          product.archived !== undefined || product.archived !== null
            ? product.archived
              ? new Date()
              : null
            : undefined,
        storeCategory: product.storeCategoryId
          ? {
              connect: {
                id: product.storeCategoryId || undefined,
              },
            }
          : undefined,
      },
    })
    if (product.modifiers) {
      const transactions = product.modifiers!.map((m, idx) =>
        prisma.productModifier.upsert({
          include: {
            items: {
              where: {
                active: true,
              },
            },
          },
          create: {
            name: m.name,
            id: undefined,
            product: {
              connect: {
                id: product.id,
              },
            },
            ordinal: idx,
            type: m.type,
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
            items: {
              create: m.items?.map((i) => ({
                name: i.name,
                cost: i.cost,
                percentage: i.percentage,
              })),
            },
          },
          update: {
            name: m.name,
            type: m.type,
            active: m.active,
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
            ordinal: idx,
            items: {
              create: m.items
                ?.filter((i) => !i.id)
                .map((i, idx) => ({
                  ordinal: idx,
                  name: i.name,
                  meta: i.meta,
                  cost: i.cost,
                  percentage: i.percentage,
                })),
            },
          },
          where: {
            id: m.id,
          },
        })
      )

      const itemsTransactions = (product?.modifiers || [])
        .map((m) => m?.items?.filter((i) => i.id) || [])
        .reduce((a, b) => [...a, ...b], [])
        .map((i, idx) =>
          prisma.productModifierItem.update({
            where: {
              id: i.id,
            },
            data: {
              ordinal: idx,
              active: i.active,
              name: i.name,
              meta: i.meta,
              cost: i.cost,
              percentage: i.percentage,
            },
          })
        )

      const _modifiers = await prisma.$transaction(transactions)
      const _items = await prisma.$transaction(itemsTransactions)
    }

    const final = await getProductBySlug({
      slug: product.slug!,
    })
    return final
  }
  let slug = slugify(product.name!)
  const coincidences = await prisma.product.findMany({
    where: {
      slug: {
        startsWith: slug,
      },
    },
  })
  if (coincidences.length) {
    slug = `${slug}-${coincidences.length}`
  }

  return (await prisma.product.create({
    data: {
      name: product.name!,
      price: product.price!,
      type: product.type,
      public: product.public!,
      description: product.description,
      meta: product.meta,
      storeCategory: {
        connect: {
          id: product.storeCategoryId!,
        },
      },
      modifiers: {
        create: product
          .modifiers!.filter((m) => m.active)
          .map((m, idx) => ({
            ordinal: idx,
            name: m.name,
            type: m.type,
            defaultValue: m.defaultValue || undefined,
            templateAccessor: m.templateAccessor || undefined,
            items: {
              create: m.items!.map((i, idx) => ({
                ordinal: idx,
                name: i.name,
                cost: i.cost,
                meta: i.meta,
                percentage: i.percentage,
              })),
            },
          })),
      },
      slug,
    },
  })) as unknown as Product
}

export const listCategories = (visible?: boolean) =>
  prisma.storeCategory.findMany({
    where: {
      visible,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      ordinal: 'asc',
    },
  })

export const upsertStoreCategory = async (
  category: Partial<Omit<StoreCategory, 'slug'>>
): Promise<StoreCategory> => {
  let c: StoreCategory | null
  if (category.id) {
    c = await prisma.storeCategory.findFirst({
      where: { id: category.id },
    })
    if (!c || !category.id) {
      throw new Error('not allowed')
    }
    let slug = c.slug
    if (category.name) {
      slug = slugify(category.name)
      const coincidences = await prisma.storeCategory.findMany({
        where: {
          slug: {
            startsWith: slug,
          },
          id: {
            not: category.id,
          },
        },
      })
      if (coincidences.length) {
        slug = `${slug}-${coincidences.length}`
      }
    }
    return await prisma.storeCategory.update({
      where: {
        id: c.id,
      },
      data: {
        name: category.name,
        ordinal: category.ordinal,
        visible: category.visible,
        slug,
      },
    })
  }
  if (!category.name) {
    throw new Error('not allowed')
  }
  let slug = slugify(category.name)
  const coincidences = await prisma.storeCategory.findMany({
    where: {
      slug: {
        startsWith: slug,
      },
    },
  })
  if (coincidences.length) {
    slug = `${slug}-${coincidences.length}`
  }
  const count = await prisma.storeCategory.count()
  return await prisma.storeCategory.create({
    data: {
      name: category.name,
      ordinal: count + 1,
      slug,
    },
  })
}
