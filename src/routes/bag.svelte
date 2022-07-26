<script lang="ts">
  import { page } from '$app/stores'
  import {
    bag,
    currentOrder,
    pageSubtitle,
    preferences,
    type BagItem,
  } from '$lib'
  import { tooltip } from '$lib/components/tooltip'
  import type { Order, Product } from '$lib/db'
  import {
    getCostFromProductModifiers,
    getTemplateFieldsFromModifiers,
    getTotalFromProductModifiers,
    type ModifiersMap,
  } from '$lib/utils/modifiers'
  import {
    Add16,
    ArrowRight16,
    ArrowRight24,
    Subtract16,
    TrashCan16,
    View16,
  } from 'carbon-icons-svelte'

  import { onMount, tick } from 'svelte'
  import { expoOut } from 'svelte/easing'
  import { fly, slide } from 'svelte/transition'
  import trpc from '$lib/trpc/client'
  import CheckoutSidebar from '$lib/__storefront/CheckoutSidebar.svelte'
  import BagItemDetails from '$lib/__storefront/BagItemDetails.svelte'
  import type { Prisma } from '@prisma/client'
  import { writable } from 'svelte/store'
  import Ufo from '$lib/components/__Ufo.svelte'
  import Image from '$lib/components/caravaggio/Image.svelte'
  let mounted = false
  onMount(() => {
    const unsuscribe = bag.subscribe((items) => {
      loadProducts(items)?.then(async () => {
        if (mounted) return
        const flag = $page.url.searchParams.get('checkout')
        const orderId = $page.url.searchParams.get('order')
        if (orderId) {
          const customer = await trpc().query('customer:whoami')
          const order = await trpc().query('orders:get', {
            orderId,
          })
          if (order && customer && order?.customerId === customer?.id) {
            $currentOrder = order
            await loadProducts(
              order.items.map((i) => ({
                key: '',
                productSlug: i.product.slug,
                quantity: i.quantity,
                modifiers: i.modifiers,
              }))
            )
            const i = order.items.map((item) => {
              const product = products ? products[item.product.slug] : null
              if (!product) {
                throw new Error("Product can't be restored")
              }
              return {
                product,
                modifiers: item.modifiers,
                quantity: item.quantity,
              }
            })
            bag.restoreBag(i)
          }
        }
        checkout = Boolean(flag === '' || flag)
        mounted = true
      })
    })
    return () => {
      unsuscribe()
    }
  })
  let products: Record<string, Product>

  $: loaded = Object.values(products || {}).every((p) => Boolean(p))

  const loadProducts = (items: BagItem[]) => {
    if (!items.length) {
      products = {}
      return
    }
    let client = trpc()
    const promises = [...new Set(items.map((p) => p.productSlug))].map(
      (productSlug) =>
        client.query('products:getBySlug', {
          productSlug,
        })
    )
    return Promise.all(promises).then(
      (p) =>
        (products = p.reduce(
          (a, v) => ({
            ...a,
            [v!.slug]: v,
          }),
          {}
        ))
    )
  }

  const onChangeQuantity = (
    e: Event & {
      currentTarget?: EventTarget & HTMLInputElement
    },
    p: Product | null,
    m: ModifiersMap | Prisma.JsonValue
  ) => {
    if (p) {
      bag.setItem(p, m, Math.max(p?.minQuantity || 1, +e.currentTarget.value))
    }
  }

  let checkout = false

  $: items = $bag.map((v, idx) => ({ ...v, idx }))

  $: total = $bag
    .map((v) => ({
      product: products ? products[v.productSlug] : null,
      modifiers: v.modifiers,
      quantity: v.quantity,
    }))
    .map(({ product, modifiers, quantity }) =>
      product ? getTotalFromProductModifiers(product, modifiers) * quantity : 0
    )
    .reduce((a, b) => a + b, 0)

  let details: BagItem | undefined

  let fonts: { name: string; url: string }[] = []

  $: if (details && products[details?.productSlug]) {
    const p = products[details.productSlug]
    fonts = Object.entries(details.modifiers || {})
      .map(([mId, m]) => ({
        modifier: m.modifier || p?.modifiers?.find((m) => m.id == mId),
        item: (
          m?.modifier || p?.modifiers?.find((m) => m.id == mId)
        )?.items?.find((i) => i.id === m.itemId),
      }))
      .filter(({ modifier }) => modifier?.type === 'font')
      .filter(({ item }) => item?.name)
      .map(({ item }) => ({
        name: item?.name || '',
        url: item?.meta?.web
          ? (item?.meta?.url as string)
          : `/api/fontface?name=${encodeURIComponent(
              item?.name || ''
            )}&src=${encodeURIComponent(item?.meta?.url)}`,
      }))
  }

  const disableTransition = writable(false)

  const changeItem = async ({
    detail: { product, modifiers, newModifiers },
  }) => {
    $disableTransition = true
    await tick()
    bag.setItem(product, modifiers, newModifiers)
    $disableTransition = false
  }
  let customTip = false
  let tip = 0.15

  $pageSubtitle = 'Bag'
</script>

<svelte:head>
  {#each fonts as f}
    <link href={f.url} rel="stylesheet" />
  {/each}
</svelte:head>

<BagItemDetails bind:item={details} on:change={changeItem} />

<CheckoutSidebar
  on:checkout={() => bag.clear()}
  bind:order={$currentOrder}
  bind:open={checkout}
  tip={!customTip ? total * tip : tip}
  dark={$preferences.darkMode}
  items={$bag}
  {products}
/>

<div
  class="flex flex-col mx-auto space-y-4 w-full py-12 px-4 lg:max-w-9/10 lg:px-6"
  class:pointer-events-none={checkout}
>
  <h3 class="font-bold font-title text-black text-3xl dark:text-white">
    Shopping bag
  </h3>
  <div class="relative">
    {#if items?.length}
      <button
        type="button"
        transition:fly|local={{
          y: 5,
          easing: expoOut,
          duration: 400,
        }}
        title="Clear bag"
        use:tooltip
        on:click={() => {
          bag.clear()
          $currentOrder = null
        }}
        class="border rounded-full bg-red-500 border-gray-300 shadow text-white p-1 transform transition-transform top-0 right-0 z-20 translate-x-[25%] translate-y-[-25%] duration-200 absolute hover:translate-y-[-35%]"
      >
        <TrashCan16 class="h-20px w-20px" />
      </button>
    {/if}
    <div class="flex flex-grow flex-col h-full space-y-4 w-full">
      {#if items?.length}
        <div
          class="flex-grow w-full overflow-x-auto relative"
          in:slide|local={{ duration: 400, easing: expoOut }}
        >
          <div
            class="divide-y border rounded-lg flex flex-col w-full max-h-50vh relative overflow-x-auto dark:divide-dark-400 dark:border-dark-400"
          >
            {#key $disableTransition}
              {#each items as item, idx ($disableTransition ? idx : item.key)}
                {@const p = products ? products[item.productSlug] : null}
                <div class="relative">
                  <div
                    class="flex p-4 text-gray-500 justify-between relative sm:items-center <sm:flex-col <sm:space-y-4 dark:text-gray-400"
                    class:skeleton={!p}
                    class:pointer-events-none={!p}
                    out:slide|local={{
                      duration: $disableTransition ? 0 : 400,
                      easing: expoOut,
                    }}
                  >
                    <div
                      class="flex items-center sm:space-x-4 <lg:flex-col <lg:space-y-4"
                    >
                      <div
                        class="rounded bg-gray-100 w-full overflow-hidden pointer-events-none select-none sm:w-42 dark:bg-dark-400"
                        style="aspect-ratio: 1/1"
                      >
                        <div
                          class="flex h-full w-full items-center justify-center"
                        >
                          {#if p}
                            <Image
                              src={p?.meta.images[0].url || ''}
                              options={{
                                rs: {
                                  s: '480x480',
                                  m: 'scale',
                                },
                              }}
                            />
                            <!-- <TemplatePreview
                              lazy
                              showFonts
                              template={{
                                ...(p?.template || {}),
                                fields: getTemplateFieldsFromModifiers(
                                  p,
                                  $bag[item.idx].modifiers
                                ),
                              }}
                              watermark
                              controls={false}
                            /> -->
                          {/if}
                        </div>
                      </div>
                      <div
                        class="flex flex-col space-y-1 w-full whitespace-normal sm:w-48"
                      >
                        <a
                          href="/menu/{p?.slug}"
                          class="font-bold text-lg text-black leading-tight sm:text-xs dark:text-white hover:underline"
                        >
                          {p?.name}
                        </a>
                      </div>
                    </div>
                    <div class="flex flex-col space-y-3">
                      <div class="flex flex-col">
                        <p class="font-bold text-xs text-black dark:text-white">
                          Cost
                        </p>
                        <p class="font-bold text-sm">
                          ${p?.price.toLocaleString('en', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} / unit
                        </p>
                      </div>
                      <div class="flex flex-col">
                        <p class="font-bold text-xs text-black dark:text-white">
                          Aditional cost
                        </p>
                        <p class="font-bold text-sm">
                          ${(p
                            ? getCostFromProductModifiers(p, item.modifiers)
                            : 0
                          ).toLocaleString('en', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} / unit
                        </p>
                      </div>
                    </div>
                    <div class="flex flex-col space-y-1">
                      <p class="font-bold text-xs text-black dark:text-white">
                        Quantity
                      </p>
                      <div class="flex !text-xs">
                        <button
                          class="border rounded-l-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-dark-700  dark:border-dark-400"
                          on:click={() =>
                            p
                              ? bag.setItem(
                                  p,
                                  item.modifiers,
                                  Math.max(
                                    p?.minQuantity || 1,
                                    $bag[item.idx].quantity - 1
                                  )
                                )
                              : null}
                        >
                          <Subtract16 class="m-auto" />
                        </button>
                        <input
                          class="bg-white border-t border-b border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-8ch quantity dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10"
                          type="number"
                          min={Math.max(p?.minQuantity || 1)}
                          value={$bag[item.idx].quantity}
                          on:input={(e) =>
                            onChangeQuantity(e, p, item.modifiers)}
                          on:change={(e) =>
                            onChangeQuantity(e, p, item.modifiers)}
                        />
                        <button
                          class="border rounded-r-full flex bg-light-600 border-gray-300 p-1 items-center dark:bg-dark-700  dark:border-dark-400"
                          on:click={() =>
                            p
                              ? bag.setItem(
                                  p,
                                  item.modifiers,
                                  Math.max(
                                    p?.minQuantity || 1,
                                    $bag[item.idx].quantity + 1
                                  )
                                )
                              : null}
                        >
                          <Add16 class="m-auto" />
                        </button>
                      </div>
                    </div>
                    <div class="flex flex-col space-y-1">
                      <p class="font-bold text-xs text-black dark:text-white">
                        Total
                      </p>
                      <p class="font-bold text-sm">
                        ${(p
                          ? getTotalFromProductModifiers(p, item.modifiers) *
                            item.quantity
                          : 0
                        ).toLocaleString('en', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div class="flex space-x-2 items-center <sm:ml-auto">
                      <button
                        class="border-transparent rounded flex space-x-1 border-2 p-1 duration-200 items-center hover:border-gray-300 dark:hover:border-gray-500"
                        on:click={() => {
                          details = { ...item }
                        }}
                        type="button"
                      >
                        <div class="text-xs">View order details</div>
                        <View16 /></button
                      >
                      <button
                        class="border-transparent rounded flex space-x-1 border-2 p-1 text-red-500 duration-200 items-center hover:border-red-500"
                        on:click={() => {
                          p ? bag.delete(p, item.modifiers) : null
                        }}
                        type="button"
                      >
                        <div class="text-xs">Delete</div>
                        <TrashCan16 /></button
                      >
                    </div>
                  </div>
                </div>
              {/each}
            {/key}
          </div>
        </div>
        {#if loaded}
          <p class="font-bold text-lg text-right">
            Total: ${total.toLocaleString('en', {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}
          </p>
        {/if}
        <div class="flex flex-col font-title space-y-2 w-full lg:items-end">
          <div class="font-bold text-lg">
            Do you want to support us with a tip?
          </div>
          <div class="grid gap-2 grid-cols-4">
            <button
              type="button"
              on:click={() => {
                tip = 0.15
                customTip = false
              }}
              class="border rounded flex flex-col border-gray-300 p-2 items-center justify-center lg:rounded-lg dark:border-gray-600"
              class:!border-blue-500={tip === 0.15 && !customTip}
              class:!shadow-lg={tip === 0.15 && !customTip}
            >
              <div class="font-bold text-lg">15%</div>
              <div class="font-bold text-xs">
                ${(total * 0.15).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </button>
            <button
              type="button"
              on:click={() => {
                tip = 0.1
                customTip = false
              }}
              class="border rounded flex flex-col border-gray-300 p-2 justify-center items-center lg:rounded-lg dark:border-gray-600"
              class:!border-blue-500={tip === 0.1 && !customTip}
              class:!shadow-lg={tip === 0.1 && !customTip}
            >
              <div class="font-bold text-lg">10%</div>
              <div class="font-bold text-xs">
                ${(total * 0.1).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </button>
            <button
              type="button"
              on:click={() => {
                tip = 0.05
                customTip = false
              }}
              class="border rounded flex flex-col border-gray-300 p-2 justify-center items-center lg:rounded-lg dark:border-gray-600"
              class:!border-blue-500={tip === 0.05 && !customTip}
              class:!shadow-lg={tip === 0.05 && !customTip}
            >
              <div class="font-bold text-lg">5%</div>
              <div class="font-bold text-xs">
                ${(total * 0.05).toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </button>
            <button
              type="button"
              on:click={() => {
                tip = 10
                customTip = true
              }}
              class:!border-blue-500={customTip}
              class:!shadow-lg={customTip}
              class="border rounded flex flex-col border-gray-300 p-2 justify-center items-center lg:rounded-lg dark:border-gray-600"
            >
              <div class="font-bold text-xs">Custom</div>
            </button>
          </div>
          {#if customTip}
            <div
              class="flex flex-col space-y-2 items-end"
              transition:slide={{ duration: 400, easing: expoOut }}
            >
              <div class="font-bold !text-xs">Enter a quantity</div>
              <div class="flex !text-xs">
                <div
                  class="border rounded-l flex bg-light-600 border-gray-300 p-1 items-center dark:bg-dark-700  dark:border-dark-400"
                >
                  $
                </div>
                <input
                  class="bg-white border-t border-r border-b rounded-r border-gray-300 border-l-0 border-r-0 text-xs text-center leading-tight py-1 px-2 w-8ch quantity dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10"
                  type="number"
                  bind:value={tip}
                  on:input={() => {
                    tip = Math.abs(tip)
                  }}
                  min="0"
                />
              </div>
            </div>
          {/if}
        </div>
        <div class="flex space-x-4 w-full justify-end items-center">
          <button
            class="rounded-full flex font-bold space-x-2 bg-dark-800 shadow text-white text-xs p-2 transform duration-200 items-center dark:(bg-gray-100 text-dark-900) disabled:(cursor-not-allowed opacity-50) hover:not-disabled:scale-105 "
            style="will-change: transform"
            disabled={!loaded}
            on:click={() => {
              if (!loaded) return
              checkout = true
            }}
          >
            <span>Checkout</span>
            <ArrowRight16 class="m-auto" />
          </button>
        </div>
      {:else}
        <div
          class="flex flex-col h-full mx-auto space-y-6 w-full py-8 items-center lg:w-8/10"
          in:fly|local={{ y: 10, duration: 400, easing: expoOut }}
        >
          <div class="w-5/10 lg:w-2/10">
            <Ufo class="h-auto w-full" />
          </div>
          <div class="font-bold font-title text-xl">Add items to bag first</div>
        </div>
      {/if}
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

  .skeleton * {
    opacity: 0;
  }
  .no-transition {
    animation: none !important;
  }
</style>
