import trpc from '$lib/trpc/client'
import type { RequestEvent, LoadEvent } from '@sveltejs/kit'

export type LayoutType = 'app' | 'store'

export const getLayoutType = ({
  url,
}: LoadEvent | RequestEvent): LayoutType => {
  if (url.searchParams.get('admin')) return 'app'
  if (url.host.split('.')[0] === 'admin') return 'app'
  return 'store'
}

export const storeRoutes = [
  '/menu',
  '/bag',
  '/favorites',
  '/contact',
  '/faq',
  '/account',
]
export const appRoutes = [
  '/products',
  '/settings',
  '/categories',
  '/orders',
  '/customers',
]

export const validateLayoutRoute = (event: LoadEvent | RequestEvent) => {
  const layout = getLayoutType(event)
  switch (layout) {
    case 'store':
      return !Boolean(
        appRoutes.find((url) => event.url.pathname.startsWith(url))
      )
    case 'app':
      return !Boolean(
        storeRoutes.find((url) => event.url.pathname.startsWith(url))
      )
  }
}

export const fetchLayoutData = async ({
  url,
  fetch,
  session,
}: LoadEvent): Promise<{
  response: LayoutData
  notFound?: boolean
}> => {
  const client = trpc(fetch)
  const layout = session.layout
  let response: LayoutData = {
    layout,
  }
  switch (session.layout) {
    case 'store':
      try {
        const categories = await trpc().query('products:categories:list')
        response.categories = categories
        return {
          response,
        }
      } catch (err) {}
    default:
      return {
        response,
      }
  }
}
