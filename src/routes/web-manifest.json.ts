import type { RequestHandler } from '@sveltejs/kit'
import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'

export const GET: RequestHandler = async (event) => {
  let layout = event.locals.layout
  const imageBuilder = useCaravaggioBuilder(
    event.url.protocol + '//' + event.url.host
  )
  const icon = '/images/favicon.webp'
  const iconsRes = [36, 48, 72, 96, 144, 192, 256, 384, 512]
  const getIcon = (res: number) =>
    imageBuilder(icon, {
      o: 'png',
      progressive: true,
      rs: {
        s: `${res}x${res}`,
        g: 'center',
        m: 'embed',
        b: '000000.0',
      },
    })

  const title =
    layout === 'app'
      ? 'Arepa Venezuelan Kitchen Admin'
      : 'Arepa Venezuelan Kitchen Admin'

  return {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: {
      name: title,
      short_name: title,
      description: title,
      dir: 'auto',
      lang: 'en-US',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      background_color: '#000',
      theme_color: '#000',
      icons: iconsRes.map((s) => ({
        src: getIcon(s),
        sizes: `${s}x${s}`,
        type: 'image/png',
      })),
    },
  }
}
