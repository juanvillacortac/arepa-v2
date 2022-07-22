<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ fetch, stuff }) => {
    const data = await trpc(fetch).query('products:list')
    return {
      props: {
        data: {
          products: data?.filter((p) => p.public) || [],
        },
      },
    }
  }
</script>

<script lang="ts">
  import type { StripedProduct } from '$lib/db'
  import trpc from '$lib/trpc/client'

  export let data: any

  $: products = data.products as StripedProduct[]
</script>
