<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ params, fetch, stuff }) => {
    try {
      const data = await trpc(fetch).query('products:getBySlug', {
        productSlug: params.productSlug,
      })
      if (!data)
        return {
          status: 404,
        }
      return {
        stuff: {
          ...stuff,
          product: data,
        },
      }
    } catch (err) {
      return {
        status: 404,
      }
    }
  }
</script>

<slot />
