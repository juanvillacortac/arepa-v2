import * as trpc from '@trpc/server'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { z } from 'zod'
import type { tRPCContext } from '.'
import { get } from '$lib/api'
import { marked } from 'marked'
import { TRPCError } from '@trpc/server'
import { Redis } from '@upstash/redis'
import Stripe from 'stripe'

const coords = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

type Coords = z.infer<typeof coords>

const lookup = async (coords: Coords) => {
  const res = await get(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${
      coords.longitude
    }&apiKey=${import.meta.env.VITE_GEOAPIFY_TOKEN}`
  )
  return res as any
}

const payment = trpc.router<tRPCContext>().mutation('createIntent', {
  input: z.object({
    currency: z.string().min(3).max(3),
    amount: z.number().min(0.5),
  }),
  output: z.string().nullable().describe('Stripe payment intent client secret'),
  resolve: async ({ input: { amount, currency } }) => {
    const stripe = new Stripe(
      'sk_test_51I7RL6J2WplztltUOlXaPetKyPuxBVvltv3Sw1saE28kDZRUBHiabRq4x4CifO8szv41kI8ed5zYp6de3Be36tZ200UiY7OksM',
      {
        // @ts-ignore
        apiVersion: null,
        typescript: true,
      }
    )

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.trunc(amount * 100),
        currency,
        payment_method_types: ['card'],
      })
      return paymentIntent.client_secret
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }
  },
})

export default trpc
  .router<tRPCContext>()
  .query('landingNodes', {
    resolve: async () => {
      const redis = new Redis({
        url: import.meta.env.VITE_UPSTASH_REDIS_URL,
        token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN,
      })
      const nodes = (await redis.get<{ json: any }>(`landingNodes-v2`))
        ?.json || {
        hero: 'Arepa Venezuelan Kitchen',
        parallax: 'black',
        banner: {
          title: 'Our roots, like home',
          body: 'Laboris laboris nostrud et cillum pariatur id deserunt fugiat magna reprehenderit. Reprehenderit laborum quis est pariatur ipsum dolor consequat ut minim.',
          bg: 'black',
        },
        menues: [
          {
            image: 'black',
            button: {
              title: 'title',
              href: '/contact',
            },
            title: 'title',
            body: 'body',
          },
          {
            image: 'black',
            button: {
              title: 'title',
              href: '/contact',
            },
            title: 'title',
            body: 'body',
          },
          {
            image: 'black',
            button: {
              title: 'title',
              href: '/contact',
            },
            title: 'title',
            body: 'body',
          },
        ],
        about: {
          image: 'black',
          button: {
            title: 'title',
            href: '/contact',
          },
          title: 'title',
          body: 'body',
        },
      }

      if (!nodes.about) {
        nodes.about = {
          image: 'black',
          button: {
            title: 'title',
            href: '/contact',
          },
          title: 'title',
          body: 'body',
        }
      }
      return nodes
    },
  })
  .merge('stripe:', payment)
  .query('geocoding', {
    input: coords,
    resolve: ({ input }) => lookup(input),
  })
  .mutation('marketing:sendContactEmail', {
    input: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email(),
      message: z.string(),
    }),
    resolve: async ({ input }) => {
      try {
        sendgrid.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY)
        const redis = new Redis({
          url: import.meta.env.VITE_UPSTASH_REDIS_URL,
          token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN,
        })
        let template =
          (await redis.get<{ json: string }>(`contactEmailTemplate`))?.json ||
          `**You've got a new message from {{name}}, their email is [{{email}}](mailto:{{email}}) and their phone number is [{{phone}}](tel:{{phone}})**

### Message:

{{message}}`

        if (template) {
          template = template.replace(new RegExp('{{email}}', 'g'), input.email)
          template = template.replace(new RegExp('{{phone}}', 'g'), input.phone)
          template = template.replace(new RegExp('{{name}}', 'g'), input.name)
          template = template.replace(
            new RegExp('{{message}}', 'g'),
            input.message
          )
        }

        const html = marked(template, {
          sanitize: true,
        })

        let to = ['juanvillacortac@gmail.com']

        const msg: MailDataRequired = {
          to: [...new Set(to)],
          from: {
            name: `${input.name} via Arepa Venezuelan Kitchen`,
            email: `contact@arepavenezuelakitchen.com`,
          },
          replyTo: input.email,

          headers: {
            Priority: 'Urgent',
            Importance: 'high',
          },
          subject: `[New contact message] ${input.name}`,
          html,
        }
        await sendgrid.send(msg)
        return { ok: true }
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        })
      }
    },
  })
