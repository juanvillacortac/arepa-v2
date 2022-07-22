<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, stuff }) => {
    const data = await trpc(fetch).query('products:list')
    return {
      stuff: {
        ...stuff,
        products: data,
      },
    }
  }
</script>

<slot />
