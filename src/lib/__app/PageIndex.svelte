<script lang="ts">
  import { pageSubtitle } from '$lib'
  import {
    Category32,
    ColorPalette32,
    Image32,
    OrderDetails32,
    Product32,
    Settings32,
    UserAvatar32,
  } from 'carbon-icons-svelte'

  $: actions = [
    {
      icon: Category32,
      title: 'Categories',
      href: `/categories`,
    },
    {
      icon: Product32,
      title: 'Products',
      href: `/products`,
    },
    {
      icon: OrderDetails32,
      title: 'Orders',
      href: `/orders`,
    },
    {
      icon: UserAvatar32,
      title: 'Customers',
      href: `/customers`,
    },
    {
      icon: Image32,
      title: 'Gallery',
      href: `/gallery`,
    },
    {
      icon: ColorPalette32,
      title: 'Customize landing',
      href: `/landing`,
    },
    {
      icon: Settings32,
      title: 'Store settings',
      href: `/settings`,
    },
  ]

  $pageSubtitle = 'Dasboard'
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Actions
  </h3>

  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
    {#each actions as a}
      <a
        class="bg-white border rounded-lg flex flex-col h-full space-y-2 border-gray-300 w-full p-4 transform transition-transform duration-200 relative overflow-hidden items-center dark:bg-dark-800 dark:border-dark-400 hover:scale-105"
        sveltekit:prefetch
        href={a.href}
        style="will-change: transform"
      >
        <svelte:component this={a.icon} />
        <h4 class="font-title font-bold text-black dark:text-white">
          {a.title}
        </h4>
      </a>
    {/each}
  </div>
</div>
