import * as db from '$lib/db'
import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'

const categories = trpc
  .router<tRPCContext>()
  .mutation('upsert', {
    input: z.object({
      id: z.string().cuid().optional(),
      name: z.string().optional(),
      visible: z.boolean().optional(),
      ordinal: z.number().int().optional(),
    }),
    resolve: async ({ input }) => {
      return await db.upsertStoreCategory(input)
    },
  })
  .query('list', {
    input: z.boolean().optional().describe('visible'),
    resolve: ({ input }) => db.listCategories(input),
  })

const mutations = trpc.router<tRPCContext>().mutation('upsert', {
  input: (input: { data: Partial<db.Product> }) => input,
  resolve: async ({ ctx, input }) => {
    const { userId } = await db.getUserDetails(ctx.event)
    if (!userId) {
      throw new Error('not allowed')
    }
    return await db.upsertProduct(input.data, userId)
  },
})

const queries = trpc
  .router<tRPCContext>()
  .query('list', {
    input: z
      .object({
        public: z.boolean().optional(),
      })
      .optional(),
    resolve: async ({ input }) => {
      return await db.getProducts({
        published: input?.public,
        archived: false,
      })
    },
  })
  .query('listDeleted', {
    resolve: async () => {
      return await db.getProducts({
        archived: true,
      })
    },
  })
  .query('getById', {
    input: z.string().cuid(),
    resolve: async ({ input }) => {
      return await db.getProductById(input)
    },
  })
  .query('getBySlug', {
    input: z.object({
      productSlug: z.string(),
    }),
    resolve: async ({ input }) => {
      return await db.getProductBySlug({
        slug: input.productSlug,
      })
    },
  })

export default trpc
  .router<tRPCContext>()
  .merge(mutations)
  .merge(queries)
  .merge('categories:', categories)
