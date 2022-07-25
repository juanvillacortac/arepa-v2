<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import type { Product, ProductModifier } from '$lib/db'

  export const load: Load = async ({ params, fetch, stuff, url }) => {
    const store = stuff.store!
    const product = await trpc(fetch).query('products:getBySlug', {
      productSlug: params.productSlug,
    })
    // const data = await get(
    //   `/api/stores/${store?.slug}/products/${params.productSlug}`,
    //   { fetch }
    // )
    if (!product || !product.public)
      return {
        status: 404,
      }
    return {
      props: {
        product,
      },
    }
  }
</script>

<script lang="ts">
  import { bag, favorites, pageSubtitle } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import Markdown from 'svelte-markdown'
  import {
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import { browser } from '$app/env'
  import trpc from '$lib/trpc/client'
  import {
    Add16,
    Favorite32,
    FavoriteFilled32,
    Subtract16,
  } from 'carbon-icons-svelte'
  import ModifiersControls from '$lib/__storefront/ModifiersControls.svelte'
  import { scale } from 'svelte/transition'

  export let product!: Product

  let quantity = product.minQuantity || 1

  $pageSubtitle = product?.name

  let modifiers: ModifiersMap

  $: total = getTotalFromProductModifiers(product, modifiers) * quantity

  let inBag = false
  $: if (browser && $bag && modifiers) {
    inBag = bag.existInBag(product, modifiers)
  }

  let imageIdx = 0
  $: image = product.meta?.images[imageIdx]?.url || ''
</script>

<div class="flex flex-col mx-auto space-y-2 w-full py-4 px-4 lg:max-w-9/10">
  <div class="flex font-bold space-x-2 text-xs text-gray-400 uppercase">
    <a href="/" class="hover:underline">Home</a>
    <span>/</span>
    <a href="/products" class="hover:underline">Products</a>
    <span>/</span>
    <a
      href="/products?category={product?.storeCategory?.slug}"
      class="hover:underline">{product.storeCategory?.name}</a
    >
  </div>
  <div class="flex lg:items-center lg:justify-between <lg:flex-col" />
  <div class="grid gap-4 grid-cols-1 items-start lg:grid-cols-2">
    <div class="flex flex-col space-y-2 w-full">
      {#key image}
        <div in:scale={{ start: 1.01, duration: 400 }}>
          <Image
            width="480"
            height="320"
            options={{
              rs: {
                s: '480x320',
                m: 'scale',
              },
            }}
            src={image}
            class="rounded-lg object-cover w-full"
          />
        </div>
      {/key}
      <div class="w-full grid gap-2 grid-cols-6">
        {#each product.meta?.images || [] as { url }, idx}
          <div
            class="border rounded-lg bg-gray-100 p-1 transform duration-200 overflow-hidden filter dark:bg-dark-400 dark:border-dark-400 hover:scale-102"
            class:!border-blue-500={idx == imageIdx}
            class:shadow={idx == imageIdx}
            class:scale-102={idx == imageIdx}
            class:grayscale={idx != imageIdx}
            on:click={() => (imageIdx = idx)}
          >
            <Image
              width="200"
              height="200"
              options={{
                rs: {
                  s: '200x200',
                  m: 'scale',
                },
              }}
              class="rounded {idx != imageIdx ? 'opacity-50' : ''}"
              src={url}
            />
          </div>
        {/each}
      </div>
    </div>
    <!-- {#if product.template && product.type === 'template'}
      <TemplatePreview watermark {template} mockups={product.meta?.mockups} />
    {/if} -->
    <div class="flex flex-col space-y-4 w-full">
      <div class="flex flex-col space-y-2 items-start">
        <h3 class="font-bold font-title text-black text-3xl dark:text-white">
          {product.name}
        </h3>
      </div>
      <div class="flex flex-col space-y-4 w-full lg:items-start">
        <div class="flex flex-col space-y-2">
          <p class="font-bold text-black text-2xl dark:text-white">
            ${product.price.toLocaleString()}
          </p>
          <div class="font-bold text-lg text-black dark:text-white">
            Total: ${total.toLocaleString()}
          </div>
        </div>
        <div class="border-t py-4 prose-sm !w-full dark:border-dark-400">
          <Markdown source={product.description || 'No description'} />
        </div>
        <div class="flex w-full lg:w-7/10">
          <ModifiersControls bind:product bind:modifiers />
        </div>
        <div class="flex space-x-2 items-center">
          <div class="font-bold font-title text-black text-xs dark:text-white">
            Quantity{product.minQuantity
              ? ` (min ${product.minQuantity} per order)`
              : ''}
          </div>
          <div class="flex !text-xs">
            <button
              class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-dark-700  dark:border-dark-400"
              on:click={() =>
                (quantity = Math.max(product.minQuantity || 1, quantity - 1))}
            >
              <Subtract16 class="m-auto" />
            </button>
            <input
              class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-6ch quantity dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10"
              type="number"
              min={Math.max(product.minQuantity || 1)}
              bind:value={quantity}
            />
            <button
              class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-dark-700  dark:border-dark-400"
              on:click={() => quantity++}
            >
              <Add16 class="m-auto" />
            </button>
          </div>
        </div>
        <div
          class="flex justify-between sm:space-x-4 sm:items-center <sm:flex-col <sm:space-y-4 !w-full"
        >
          <div class="flex space-x-4 w-full items-center">
            <div class="flex space-x-2">
              <button
                class="rounded flex font-bold space-x-2 bg-dark-800 shadow text-white text-sm py-4 px-4 transform duration-200 items-center dark:(bg-gray-100 text-dark-900) disabled:cursor-not-allowed hover:not-disabled:scale-105 active:not-disabled:scale-95 "
                on:click={() => bag.addToBag(product, modifiers, quantity)}
                style="will-change: transform"
              >
                <Add16 class="m-auto" />
                <span>{inBag ? 'Add more' : 'Add'} to bag</span></button
              >
              {#if inBag}
                <a
                  class="rounded flex font-bold space-x-2 bg-dark-800 shadow text-white text-sm py-4 px-4 transform duration-200 items-center dark:(bg-gray-100 text-dark-900) disabled:cursor-not-allowed hover:not-disabled:scale-105 "
                  href="/bag?checkout"
                  style="will-change: transform"
                >
                  Go to checkout</a
                >
              {/if}
            </div>
            {#if $favorites.existInFavorites(product.id)}
              <button
                class="flex text-pink-500 relative hover:text-pink-400"
                title="Remove from favorites"
                on:click|preventDefault|stopPropagation={() =>
                  favorites.delete(product.id)}
                use:tooltip
              >
                <FavoriteFilled32 />
              </button>
            {:else}
              <button
                class="flex text-gray-400 relative hover:text-pink-500"
                title="Add to favorites"
                on:click|preventDefault|stopPropagation={() =>
                  favorites.addToFavorites(product.id)}
                use:tooltip
              >
                <Favorite32 />
              </button>
            {/if}
          </div>
          <div class="font-bold text-lg text-black dark:text-white">
            Total ${total.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .quantity::-webkit-outer-spin-button,
  .quantity::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .quantity {
    -moz-appearance: textfield;
  }
</style>
