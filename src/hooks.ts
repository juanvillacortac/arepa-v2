import type { GetSession, Handle } from '@sveltejs/kit'
import { handleSession } from 'svelte-kit-cookie-session'
import { appRoutes, getLayoutType } from '$lib/utils/layout'
import { getDefaultHost } from '$lib/utils/host'

import { router, type tRPCRouter } from '$lib/trpc/server'
import { sequence } from '@sveltejs/kit/hooks'
import { createTRPCHandle } from '$lib/trpc/handler'

export const session = handleSession({
  secret: 'secret',
  expires: 30,
  cookie: {
    httpOnly: true,
    secure: true,
  },
})

const logic: Handle = async ({ event, resolve }) => {
  let response: Response

  event.locals.layout = getLayoutType(event)

  const isAppPage =
    event.locals.layout === 'app' &&
    (Boolean(appRoutes.find((url) => event.url.pathname.startsWith(url))) ||
      event.url.pathname === '/')

  if (
    isAppPage &&
    !event.locals.session?.data?.userId &&
    event.url.pathname !== '/login'
  ) {
    return Response.redirect(
      `${getDefaultHost() === 'localhost:5173' ? 'http://' : 'https://'}${
        event.url.host
      }/login?callbackUrl=${encodeURIComponent(event.url.pathname)}`,
      303
    )
  }

  const { response: trpcResponse, trpc } = await createTRPCHandle<tRPCRouter>(
    {
      url: '/api/trpc',
      router,
      event,
      resolve,
      createContext: async () => ({
        event,
        layout: event.locals.layout,
      }),
      responseMeta({ type, errors, ctx, paths }) {
        const isPublic = paths?.every(
          (p) =>
            !(
              p.includes('whoami') ||
              p.includes('login') ||
              p.includes('register') ||
              p.includes('orders') ||
              p.includes('customer')
            )
        )
        if (
          type === 'query' &&
          errors.length === 0 &&
          ctx?.layout === 'store' &&
          isPublic
        ) {
          return {
            headers: {
              'cache-control': `s-maxage=1, stale-while-revalidate`,
            },
          }
        }
        return {}
      },
    },
    {
      ssr: event.locals.layout !== 'app',
    }
  )

  response = trpcResponse

  if (
    event.locals.layout === 'store' &&
    !event.url.pathname.startsWith('/account') &&
    !event.url.pathname.startsWith('/bag') &&
    !trpc
  ) {
    response.headers.set('Cache-Control', 's-maxage=1, stale-while-revalidate')
  }

  return response
}

export const handle = sequence(session, logic)

export const getSession: GetSession = (event) => ({
  layout: event.locals.layout,
  userAgent: event.request.headers.get('user-agent') || '',
  host: event.url.host,
  fullHost: `${event.url.protocol}//${event.url.host}`,
  userId: event.locals.session.data.userId || undefined,
})
