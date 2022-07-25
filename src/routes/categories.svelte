<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'

  const getCategories = (fetcher?: typeof fetch) =>
    trpc(fetcher).query('products:categories:list')

  export const load: Load = async ({ fetch }) => {
    const categories = await getCategories(fetch)
    return {
      props: {
        categories,
      },
    }
  }
</script>

<script lang="ts">
  import { pageSubtitle } from '$lib'
  import { notifications } from '$lib/components/notifications'
  import trpc, { type InferQueryOutput } from '$lib/trpc/client'
  import type { StoreCategory } from '@prisma/client'

  export let categories: InferQueryOutput<'products:categories:list'> = []

  let selected: StoreCategory | undefined = undefined
  let name = ''

  async function saveCategory() {
    if (!name) return
    try {
      await trpc().mutation('products:categories:upsert', {
        name,
        id: selected?.id,
        ordinal: selected?.ordinal,
      })
      categories = await getCategories()
      notifications.send(
        'Category ' + (selected?.id ? 'updated' : 'created'),
        'default',
        3000
      )
      // await invalidateQuery('stores:getBySlug')
    } catch ({ message }) {
      notifications.send(message, 'default', 3000)
    }
    selected = undefined
  }

  function setName() {
    name = selected?.name || ''
  }

  $: if (selected) {
    setName()
  }

  $pageSubtitle = 'Categories'
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Categories
  </h3>
  <div class="flex space-x-4 justify-between items">
    <input
      class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
      type="text"
      placeholder="Category name"
      bind:value={name}
    />
    <button
      class="rounded font-bold border-2 border-blue-500 text-xs py-2 px-4 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
      disabled={!name}
      on:click={saveCategory}>{selected?.id ? 'Save' : 'Create'}</button
    >
  </div>
  <div class="shadow relative overflow-x-auto sm:rounded-lg">
    <table class="text-sm text-left w-full text-gray-500 dark:text-gray-400">
      <thead
        class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-dark-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="py-3 px-6"> Name </th>
          <th scope="col" class="py-3 px-6"> Products count </th>
          <th scope="col" class="py-3 px-6">
            <span class="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each categories as c, idx}
          <tr
            class="bg-white dark:bg-dark-800"
            class:border-b={idx !== categories.length - 1}
            class:dark:border-dark-700={idx !== categories.length - 1}
          >
            <th
              scope="row"
              class="font-bold py-4 px-6 text-gray-900 whitespace-nowrap dark:text-white"
            >
              {c.name}
            </th>
            <td class="py-4 px-6">{c._count.products} products</td>
            <td class="text-right py-4 px-6">
              <button
                disabled={selected?.id == c.id}
                on:click={() => (selected = c)}
                class="font-medium text-blue-600 dark:text-blue-500 hover:underline disabled:opacity-70 disabled:pointer-not-allowed"
                >Edit</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
