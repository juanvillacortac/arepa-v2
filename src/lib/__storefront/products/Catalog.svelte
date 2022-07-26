<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { squareratio } from '$lib/actions/aspectratio'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import Ufo from '$lib/components/__Ufo.svelte'

  import type { StripedProduct } from '$lib/db'
  import { favorites } from '$lib/stores'
  import { search as s } from '$lib/utils/search'
  import {
    Categories16,
    Category16,
    Favorite24,
    FavoriteFilled24,
  } from 'carbon-icons-svelte'
  import { flip } from 'svelte/animate'
  import { expoOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'

  $: categories = $page.stuff.categories || []

  export let products: StripedProduct[] = []
  export let category: string = ''
  export let search: string = ''

  function getCategoryLink(slug: string) {
    const query = new URLSearchParams($page.url.searchParams)
    query.set('category', slug)
    return `?${query.toString()}`
  }

  $: filteredProducts = s(products, search || '', ['name']).filter((p) =>
    category ? p.storeCategory?.slug === category : true
  )
</script>

<div class="flex w-full lg:space-x-4 <lg:flex-col <lg:space-y-4">
  <div
    class="flex-col flex h-full space-y-2 w-full lg:w-2/10 lg:overflow-hidden"
  >
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10"
      type="search"
      name="q"
      bind:value={search}
      placeholder="Enter keywords to search..."
    />
    <div class="flex flex-col">
      <div
        class="rounded-tl rounded-tr flex space-x-2  bg-dark-900 text-white w-full p-2 items-center dark:bg-dark-400"
      >
        <Category16 />
        <h3 class="font-bold text-xs">Categories</h3>
      </div>
      <div
        class="border-b border-l border-r rounded-bl rounded-br flex flex-col h-full space-y-2 border-gray-300 p-2 dark:border-dark-400"
      >
        <a
          href={getCategoryLink('')}
          sveltekit:prefetch
          sveltekit:noscroll
          class="flex space-x-2 text-xs hover:underline"
        >
          <Categories16 />
          <span> All categories</span>
        </a>
        {#each categories as category}
          <a
            href={getCategoryLink(category.slug)}
            sveltekit:prefetch
            sveltekit:noscroll
            class="flex space-x-2 text-xs hover:underline"
          >
            <Categories16 />
            <span>
              {category.name}
            </span>
          </a>
        {/each}
      </div>
    </div>
  </div>
  {#if filteredProducts.length}
    <div
      class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:w-8/10 lg:grid-cols-4"
      in:fly|local={{ y: 10, duration: 400 }}
    >
      {#each filteredProducts as p (p.id)}
        <div
          class="bg-white border rounded-lg cursor-pointer flex flex-col space-y-2 border-gray-300 p-2 transform transition-all relative dark:bg-dark-800 dark:border-dark-400 hover:shadow-lg hover:scale-102"
          animate:flip={{ duration: 400, easing: expoOut }}
          style="will-change: transform"
          on:click={() => goto(`/menu/${p.slug}`)}
        >
          <!-- {#if p.template} -->
          <div class="flex h-full w-full aspect-square" use:squareratio>
            <Image
              src={p?.meta.images[0].url || ''}
              class="rounded checkerboard"
              width="480"
              height="480"
              options={{
                rs: {
                  s: '480x480',
                  m: 'scale',
                },
              }}
            />
          </div>
          <!-- {/if} -->
          <div class="flex flex-col flex-grow h-full space-y-1 justify-between">
            <div class="flex flex-col space-y-1">
              <a
                href="/menu/{p.slug}"
                class="font-bold text-sm <sm:text-xl hover:underline"
                >{p.name}</a
              >
              <a
                href="/menu?category={p.storeCategory?.slug}"
                class="text-xs text-blue-500 hover:underline"
                >{p.storeCategory?.name}</a
              >
            </div>
            <div class="flex w-full justify-between items-end">
              <p class="font-bold self-end">
                ${p.price.toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {#if $favorites.existInFavorites(p.id)}
                <button
                  class="flex text-pink-500 relative hover:text-pink-400"
                  title="Remove from favorites"
                  on:click|preventDefault|stopPropagation={() =>
                    favorites.delete(p.id)}
                  use:tooltip
                >
                  <FavoriteFilled24 />
                </button>
              {:else}
                <button
                  class="flex text-gray-400 relative hover:text-pink-500"
                  title="Add to favorites"
                  on:click|preventDefault|stopPropagation={() =>
                    favorites.addToFavorites(p.id)}
                  use:tooltip
                >
                  <Favorite24 />
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div
      class="flex flex-col h-full space-y-6 w-full py-8 items-center lg:w-8/10"
      in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="w-2/10">
        <Ufo class="h-auto w-full" />
      </div>
      <div class="font-bold font-title text-xl">Nothing here</div>
    </div>
  {/if}
</div>
