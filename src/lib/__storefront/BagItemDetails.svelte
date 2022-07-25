<script lang="ts">
  import { browser } from '$app/env'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { tooltip } from '$lib/components/tooltip'
  import type { Product } from '$lib/db'
  import type { BagItem } from '$lib/stores'
  import trpc from '$lib/trpc/client'
  import {
    createModifiersMapStore,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import type { Prisma } from '@prisma/client'
  import { Close24 } from 'carbon-icons-svelte'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import SvelteMarkdown from 'svelte-markdown'
  import { portal } from 'svelte-portal'
  import { elasticOut, expoOut } from 'svelte/easing'
  import { fade, fly, scale } from 'svelte/transition'
  import ModifiersControls from './ModifiersControls.svelte'

  export let item:
    | (BagItem & {
        cost?: number
      })
    | undefined

  let product: Product | undefined
  export let disabled = false

  let compiler: Worker
  let fields = ''

  onMount(async () => {
    const ModifiersWorker = await import(
      '$lib/utils/modifiers.worker?worker'
    ).then((m) => m.default)

    compiler = new ModifiersWorker()

    compiler.onmessage = ({ data }: MessageEvent<string>) => {
      fields = data
    }
  })

  onDestroy(() => {
    compiler?.terminate()
  })

  $: if (item && browser) {
    trpc()
      .query('products:getBySlug', {
        productSlug: item.productSlug,
      })
      .then((p) => {
        if (p) product = p
      })
  }

  let modifiers = createModifiersMapStore()
  const setModifiers = (value: ModifiersMap) => {
    modifiers.set(JSON.parse(JSON.stringify(value)))
  }

  $: if (product) {
    compiler?.postMessage({ product, modifiers: $modifiers })
  } else {
    fields = ''
  }

  $: setModifiers((item?.modifiers as ModifiersMap) || {})

  const dispatch = createEventDispatcher<{
    change: {
      product: Product
      modifiers: ModifiersMap
      newModifiers: ModifiersMap
    }
  }>()

  const change = (
    product?: Product,
    modifiers?: ModifiersMap | Prisma.JsonValue,
    newModifiers?: ModifiersMap | Prisma.JsonValue
  ) => {
    if (!product || !modifiers || !item?.modifiers) return
    dispatch('change', {
      product,
      modifiers: modifiers as ModifiersMap,
      newModifiers: newModifiers as ModifiersMap,
    })
  }

  const close = () => {
    change(product, item?.modifiers, $modifiers)
    item = undefined
    product = undefined
    fields = ''
    imageIdx = 0
    $modifiers = {}
  }

  let imageIdx = 0
  $: image = product?.meta?.images[imageIdx]?.url || ''
</script>

{#if item && product}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    use:portal
    transition:fade={{ duration: 400, easing: expoOut }}
  >
    <div class="bg-black h-full w-full opacity-70 absolute" on:click={close} />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 w-9/10 relative lg:w-8/10 dark:bg-dark-900"
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Details
        </h4>
        <button on:click={close}><Close24 /></button>
      </div>
      <div
        class="h-full grid gap-4 grid-cols-1 items-start overflow-auto lg:grid-cols-2"
      >
        <!-- {#if product?.template && product?.type === 'template'} -->
        <div class="lg:top-0 lg:sticky <lg:relative">
          {#if product}
            <div class="flex flex-col space-y-2 p-px w-full">
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
                    class="rounded-lg object-cover w-full checkerboard"
                  />
                </div>
              {/key}
              <div class="w-full grid gap-2 grid-cols-6">
                {#each product.meta?.images || [] as { url }, idx}
                  <button
                    class="border rounded-lg bg-gray-100 p-1 transform duration-200 overflow-hidden filter dark:bg-dark-400 dark:border-dark-400 hover:scale-102"
                    class:!border-blue-500={idx == imageIdx}
                    class:shadow={idx == imageIdx}
                    class:scale-102={idx == imageIdx}
                    class:grayscale={idx != imageIdx}
                    title="View image"
                    on:click={() => (imageIdx = idx)}
                    use:tooltip={{ show: imageIdx != idx }}
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
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        <!-- {/if} -->
        <div class="flex flex-col space-y-4 w-full">
          {#if product}
            <div class="flex flex-col space-y-2 items-start">
              <h3
                class="font-bold font-title text-black text-xl dark:text-white"
              >
                {product.name || ''}
              </h3>
              <p class="font-bold text-black text-2xl dark:text-white">
                ${(item.cost ?? product.price).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span class="text-base">/ unit</span>
              </p>
              <p class="font-bold text-black text-base dark:text-white">
                Total: ${(product
                  ? getTotalFromProductModifiers(product, $modifiers, item.cost)
                  : 0
                ).toLocaleString()}
              </p>
            </div>
            <div class="w-full lg:w-7/10">
              {#if product}
                <ModifiersControls
                  {product}
                  bind:modifiers={$modifiers}
                  {disabled}
                />
              {/if}
            </div>
            <div
              class="border-t pt-4 pb-2 prose-sm !w-full dark:border-dark-400"
            >
              <SvelteMarkdown
                source={product.description || 'No description'}
              />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
