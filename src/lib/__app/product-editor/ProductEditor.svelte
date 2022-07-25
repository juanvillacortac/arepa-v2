<script lang="ts">
  import 'bytemd/dist/index.css'
  import type { Product, ProductModifier } from '$lib/db'
  import { notifications } from '$lib/components/notifications'
  import { goto } from '$app/navigation'
  import {
    Close24,
    CloseOutline24,
    CloseOutline32,
    Copy16,
    Error32,
    Launch16,
    TrashCan16,
    View16,
    ViewOff16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import ProductModifiersEditor from './ProductModifiersEditor.svelte'
  import ProductMainFieldsEditor from './ProductMainFieldsEditor.svelte'
  import ProductImagesEditor from './ProductImagesEditor.svelte'
  import { getAbsoluteURL } from '$lib/utils/host'
  import trpc, {
    invalidateQuery,
    type InferQueryOutput,
  } from '$lib/trpc/client'
  import Submenu from '$lib/components/Submenu.svelte'
  import { onMount, setContext } from 'svelte'
  import { writable } from 'svelte/store'
  import { fade, fly, scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import { portal } from 'svelte-portal'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { flip } from 'svelte/animate'

  export let product: Partial<Product> = {
    price: 0.01,
    public: true,
    type: 'template',
  }

  const categories = writable<InferQueryOutput<'products:categories:list'>>([])
  setContext('categories', categories)

  onMount(async () => {
    $categories = await trpc().query('products:categories:list')
  })

  let title = product.name
  let saving = false

  const validate = () => {
    if (!product.name?.trim()) {
      return 'Product should have a title'
    }
    if (!product.meta?.images?.length) {
      return 'Product should have a image at least'
    }
    for (let m of modifiers?.filter((m) => m.active)) {
      const items = m.items!.filter((i) => i.active)
      if (!m.name) {
        return 'Modifiers should have a title'
      }
      if (m.type == 'select' || m.type == 'font') {
        if (!items.length) {
          return 'Selection and multiple selection modifier should have items'
        }
        for (let i of items) {
          if (!i.name) {
            return 'Modifier items should have a title'
          }
        }
      }
      if (m.type == 'upsell') {
        if (!items.length) {
          return 'Selection and multiple selection modifier should have items'
        }
        for (let i of items) {
          if (!i.name) {
            return 'Upsell product should have a name'
          }
          if (!i.meta.image) {
            return 'Upsell product should have an image'
          }
        }
      }
      if (m.type == 'font') {
        for (let i of items) {
          if (!i.meta.url) {
            return 'Font items should have a valid URL'
          }
        }
      }
      if (m.type == 'color') {
        for (let i of items) {
          if (!i.name) {
            return 'Color items should have a value'
          }
          if (!i.meta.name) {
            return 'Color items should have a name'
          }
        }
      }
    }
    return ''
  }

  const duplicate = async () => {
    error = validate()
    if (!error) {
      const data = await trpc().mutation('products:upsert', {
        data: {
          ...product,
          id: '',
          public: false,
          modifiers,
        },
      })
      goto(`/products/${data!.slug!}`)
    }
  }

  const submit = async () => {
    error = validate()
    if (error) {
      return
    }
    try {
      saving = true
      const data = await trpc().mutation('products:upsert', {
        data: {
          ...product,
          modifiers,
        },
      })
      notifications.send(
        `Product ${product.id ? 'updated' : 'created'}`,
        'default',
        3000
      )
      if (!product.id) {
        goto(`/products/${data?.slug}`)
        return
      }
      title = data!.name
      modifiers = data!.modifiers!.map((m) => ({
        ...m,
        internalId: (Math.random() + 1).toString(36).substring(7),
        items: m.items!.map((i) => ({
          ...i,
          internalId: (Math.random() + 1).toString(36).substring(7),
        })),
      }))
    } catch (err) {
      console.log(err.message, err.error)
    } finally {
      saving = false
    }
  }

  const deleteProduct = async () => {
    saving = true
    try {
      const data = await trpc().mutation('products:upsert', {
        data: {
          id: product.id,
          archived: !product.archived,
        },
      })
      if (data?.archived) {
        goto(`/deleted-products`)
      } else {
        await invalidateQuery(
          'products:getBySlug',
          'products:list',
          'products:listDeleted'
        )
        saving = false
        // window.location.reload()
      }
    } catch (err) {
      saving = false
    }
  }

  let modifiers: (ProductModifier & { internalId?: string })[] = [
    ...(product?.modifiers! || []),
  ]

  let error = ''

  let imageIdx = 0
  $: image = product?.meta?.images[imageIdx]?.url || ''
</script>

{#if error}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => (error = '')}
    />
    <div
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-dark-900"
      style="will-change: transform"
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Error
        </h4>
        <button on:click={() => (error = '')}><Close24 /></button>
      </div>
      <div class="flex space-x-4 items-center">
        <CloseOutline32 class="h-48px text-red-500 w-48px" />
        <div class="flex flex-col space-y-2">
          <p class="font-bold">You have an error</p>
          <p class="text-sm text-gray-500">
            {error}
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}

<h2
  class="font-bold font-title mx-auto my-2 text-black text-xl w-full lg:max-w-10/10 dark:text-white"
>
  <span>
    {product.id ? title : 'New product'}&nbsp;
  </span>
  {#if product.id}
    <a
      class="border-transparent inline hover:border-current"
      href={getAbsoluteURL({
        path: `/menu/${product.slug}`,
      })}
      target="__blank"
      title="View product on production"
      use:tooltip
    >
      <Launch16 class="!inline-flex" />
    </a>
  {/if}
</h2>
<form
  on:submit|preventDefault|stopPropagation={submit}
  class="flex flex-col mx-auto space-y-4 w-full lg:max-w-10/10"
>
  <div class="flex flex-col space-y-4 lg:items-end">
    <div
      class="flex justify-end items-end lg:space-x-2 lg:items-center <lg:flex-col <lg:space-y-4"
    >
      <!-- <div class="flex space-x-4 items-center">
        <input type="checkbox" id="published" bind:checked={product.public} />
        <label class="font-bold text-xs block" for="published">
          Published
        </label>
      </div> -->
      <!-- {#if product.type === 'template' && product.id}
        <a
          class="rounded font-bold border-2 border-blue-500 text-xs text-center py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          href="/stores/{store.slug}/products/{product.slug}/ide"
          >Edit template{JSON.stringify(product.templateDraft) !==
          JSON.stringify(product.template)
            ? ' (Draft)'
            : ''}</a
        >
      {/if}
      {#if product.id}
        <button
          class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          type="button"
          on:click={duplicate}
          disabled={saving}>Duplicate</button
        >
      {/if} -->
      {#if !product.archived}
        <Submenu title="Options">
          <div
            class="flex flex-col font-bold space-y-3 text-xs items-end"
            slot="body"
          >
            <!-- <div
            class="flex space-x-2 text-blue-500 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
            disabled={saving}
          >
            <span>Save changes</span> <Save16 class="flex" /></button
          > -->
            <button
              class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
              type="button"
              class:text-red-500={product.public}
              on:click={() => (product.public = !product.public)}
              disabled={saving}
            >
              <span>{product.public ? 'Unpublish' : 'Publish'}</span>
              <svelte:component
                this={product.public ? ViewOff16 : View16}
                class="flex"
              /></button
            >
            {#if product.id}
              <button
                class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                type="button"
                on:click={duplicate}
                disabled={saving}
              >
                <span>Duplicate product</span> <Copy16 class="flex" /></button
              >
              {#if !product.archived}
                <button
                  class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  type="button"
                  on:click={deleteProduct}
                  disabled={saving}
                >
                  <span>Send to trash</span> <TrashCan16 class="flex" /></button
                >
              {/if}
            {/if}
          </div>
        </Submenu>
      {/if}
      {#if product.archived}
        <button
          class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          type="button"
          on:click={deleteProduct}
          disabled={saving}>{saving ? 'Saving...' : 'Restore product'}</button
        >
      {:else}
        <button
          class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
        >
      {/if}
    </div>
  </div>
  <div
    class="w-full grid gap-6 grid-cols-1 items-start"
    class:lg:grid-cols-3={true}
  >
    <div class="flex flex-col space-y-6 w-full" class:lg:col-span-2={true}>
      <ProductMainFieldsEditor bind:product />
      <ProductImagesEditor bind:product />
      <ProductModifiersEditor bind:modifiers disabled={product.archived} />
    </div>
    <div class="flex flex-col space-y-2 p-px w-full">
      {#key image}
        <div in:scale|local={{ start: 1.01, duration: 400 }}>
          {#if image}
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
              class="rounded object-cover w-full checkerboard"
            />
          {:else}
            <div class="relative">
              <div
                class="rounded flex flex-col h-full space-y-2 w-full checkerboard absolute items-center justify-center"
              >
                <CloseOutline32 class="h-18 w-18" />
                <div class="font-title font-bold text-xl">No image</div>
              </div>
              <Image
                width="480"
                height="320"
                options={{
                  rs: {
                    s: '480x320',
                    m: 'scale',
                  },
                }}
                src=""
                class="opacity-0"
              />
            </div>
          {/if}
        </div>
      {/key}
      {#if product.meta?.images.length}
        <div class="w-full grid gap-2 grid-cols-6">
          {#each product.meta?.images || [] as { url }, idx (url)}
            <button
              animate:flip={{ duration: 400, easing: expoOut }}
              class="border rounded-lg bg-gray-100 p-1 transform duration-200 overflow-hidden filter dark:bg-dark-400 dark:border-dark-400 hover:scale-102"
              class:!border-blue-500={idx == imageIdx}
              class:shadow={idx == imageIdx}
              class:scale-102={idx == imageIdx}
              class:grayscale={idx != imageIdx}
              title="View image"
              on:click={() => (imageIdx = idx)}
              type="button"
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
      {/if}
    </div>
  </div>
</form>

<style>
  .checkerboard {
    --black-cell: rgba(55, 65, 81, 0.2);
    background-image: linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      ),
      linear-gradient(
        45deg,
        var(--black-cell) 25%,
        transparent 25%,
        transparent 75%,
        var(--black-cell) 75%,
        var(--black-cell)
      );
    background-size: 60px 60px;
    background-position: 0 0, 30px 30px;
  }
</style>
