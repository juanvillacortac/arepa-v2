<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, stuff }) => {
    const products = await trpc(fetch).query('products:list', {
      public: true,
    })
    return {
      stuff: { ...stuff, products },
    }
  }
</script>

<script lang="ts">
  import Catalog from '$lib/__storefront/products/Catalog.svelte'
  import { createQueryStore, favorites } from '$lib'
  import { onMount } from 'svelte'
  import type { StripedProduct } from '$lib/db'

  const search = createQueryStore('search')
  const category = createQueryStore('category')

  onMount(() => {
    const unsuscribe = favorites.subscribe((f) => {
      loadProducts(f.items())
    })
    return () => {
      unsuscribe()
    }
  })
  let products: StripedProduct[] = []

  const loadProducts = (items: string[]) => {
    if (!items.length) {
      products = []
      return
    }
    let client = trpc()
    const promises = [...new Set(items)].map((productId) =>
      client.query('products:getById', productId)
    )
    return Promise.all(promises).then(
      (p) => (products = p.filter((p) => p!).map((p) => p!))
    )
  }
</script>

<div class="flex flex-col mx-auto space-y-4 w-full p-4 lg:w-[90%]">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <a href="/products" class="hover:underline">Favorites</a>
    <span>/</span>
    <p>
      <!-- {$category ? categories.find((c) => c.slug === $category)?.name : 'All'} -->
    </p>
  </div>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Favorites
  </h3>
  <Catalog {products} bind:search={$search} bind:category={$category} />
</div>
