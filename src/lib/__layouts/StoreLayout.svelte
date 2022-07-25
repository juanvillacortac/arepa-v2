<script lang="ts">
  import Favicons from '$lib/components/Favicons.svelte'
  import { navigating, page, session } from '$app/stores'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import {
    Moon24,
    Search16,
    Sun24,
    ShoppingBag24,
    Favorite24,
    UserAvatar24,
    LogoInstagram24,
    LogoTwitter24,
    Logout16,
    Settings16,
    OrderDetails16,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { bag, customer, pageSubtitle, preferences } from '$lib/stores'
  import { goto } from '$app/navigation'
  import Submenu from '$lib/components/Submenu.svelte'
  import trpc from '$lib/trpc/client'
  import { browser, dev } from '$app/env'

  let subtitle = ''
  $: subtitle = $pageSubtitle ? $pageSubtitle : subtitle
  $: if (!$navigating) {
    $pageSubtitle = ''
  }

  $: pageTitle = (subtitle ? subtitle + ' | ' : '') + 'Arepa Venezuelan Kitchen'

  let search = ''
  let category = ''

  const submitSearch = async () => {
    await goto(getSearchUrl())
    search = ''
    category = ''
  }

  $: getSearchUrl = () => {
    const query = new URLSearchParams()
    query.set('search', search)
    query.set('category', category)
    return `/menu?${query.toString()}`
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons
  favicon="/images/favicon.webp"
  themeColor="#000"
  titleName="Arepa Venezuelan Kitchen"
/>

<div
  class="flex flex-col min-h-screen top-0 left-0 text-gray-700 relative dark:text-white"
>
  <div
    class="bg-white border-b flex flex-col w-full top-0 z-80 items-center sticky filter blur-lg !bg-opacity-90 dark:bg-dark-800 dark:border-dark-400"
  >
    <div class="flex mx-auto w-full p-4 justify-between items-center lg:w-9/10">
      <div class="flex space-x-4 items-center">
        <a
          href="/"
          class="flex transform transition-transform duration-200 hover:scale-95"
        >
          <Image
            src="/images/logo.webp"
            showOriginal={dev ? 'webp' : undefined}
            class="rounded-sm p-px h-2rem lg:h-3rem dark:(filter invert) "
            options={{
              o: 'png',
              rs: {
                s: 'x48',
                m: 'scale',
              },
            }}
          />
        </a>
        <form
          class="flex py-2 <sm:hidden !text-xs"
          on:submit|preventDefault={submitSearch}
        >
          <input
            class="bg-white border rounded-tl rounded-bl border-gray-300  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10"
            type="search"
            name="q"
            bind:value={search}
            placeholder="Enter keywords to search..."
          />
          <select
            class="bg-white border-b border-l-0 border-r-0 border-gray-300  leading-tight py-2  px-3 w-16rem appearance-none <sm:hidden !border-t dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
            bind:value={category}
          >
            <option value="">All categories</option>
            <!-- {#each store.categories || [] as category}
              <option value={category.slug}>{category.name}</option>
            {/each} -->
          </select>
          <button
            class="rounded-tr rounded-br flex bg-dark-800 text-white  p-2 items-center dark:bg-dark-400"
          >
            <Search16 class="m-auto" />
          </button>
        </form>
      </div>
      <div class="flex space-x-2 text-gray-400 items-center lg:space-x-4">
        <button
          on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
          class="flex relative hover:text-black dark:hover:text-white"
          title="Toggle theme"
          use:tooltip
          style="width: 24px; height: 24px"
        >
          <div class="top-0 left-0 absolute pointer-events-none">
            <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
          </div>
        </button>
        {#if browser}
          {#if $customer === null}
            <a
              class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
              title="Log in"
              href="/login?callbackUrl={encodeURIComponent(
                $page.url.pathname === '/login'
                  ? '/'
                  : `${$page.url.pathname}${
                      $page.url.searchParams.toString()
                        ? `?${$page.url.searchParams.toString()}`
                        : ''
                    }`
              )}"
              use:tooltip
            >
              <UserAvatar24 />
            </a>
          {:else}
            <Submenu>
              <div class="content" slot="button">
                {#if !$customer}
                  <div class="rounded-full h-32px w-32px skeleton" />
                {:else}
                  <div
                    class="bg-gradient-to-br border rounded-full cursor-pointer flex font-bold font-title from-green-300 to-pink-600 border-gray-200 h-32px text-white text-xs leading-[0] w-32px items-center justify-center uppercase dark:bg-dark-600 dark:from-green-400 dark:to-pink-700"
                  >
                    {$customer?.firstName[0]}
                  </div>
                {/if}
              </div>
              <div
                class="flex flex-col font-bold space-y-3 text-xs text-gray-800 items-end dark:text-white"
                slot="body"
              >
                {#if !$customer}
                  <p>Loading...</p>
                {:else}
                  <p>Hi, {$customer?.firstName}!</p>
                {/if}
                <a
                  class="flex font-normal space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  href="/account/orders"
                >
                  <span>Orders</span> <OrderDetails16 class="flex" /></a
                >
                <a
                  class="flex font-normal space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  href="/account/settings"
                >
                  <span>Settings</span> <Settings16 class="flex" /></a
                >
                <button
                  class="flex space-x-2 items-center disabled:cursor-not-allowed disabled:opacity-50 hover:not-disabled:underline"
                  on:click={() => {
                    trpc()
                      .mutation('customer:logout')
                      .then((logout) => {
                        if (!logout) return
                        if ($page.url.pathname.startsWith('/account')) {
                          window.location.replace('/login')
                        } else {
                          window.location.reload()
                        }
                      })
                  }}
                  type="button"
                >
                  <span>Log out</span> <Logout16 class="flex" /></button
                >
              </div>
            </Submenu>
          {/if}
        {:else}
          <div class="rounded-full h-32px w-32px skeleton" />
        {/if}
        <a
          class="flex relative hover:text-pink-500"
          title="Favorites"
          use:tooltip
          href="/favorites"
          style="width: 24px; height: 24px"
        >
          <Favorite24 />
        </a>
        <a
          class="flex space-x-1 relative items-center hover:text-black dark:hover:text-white"
          title="Shopping Bag"
          href="/bag"
          use:tooltip
        >
          <ShoppingBag24 />
          <p class="font-bold text-xs text-right w-[3ch] <lg:hidden">
            {$bag.length || 0}
          </p>
        </a>
      </div>
    </div>
    <form
      class="flex px-4 pb-4 sm:hidden !text-xs"
      on:submit|preventDefault={submitSearch}
    >
      <input
        class="bg-white border rounded-tl rounded-bl border-gray-300  text-xs leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10"
        type="search"
        name="q"
        bind:value={search}
        placeholder="Enter keywords to search..."
      />
      <select
        class="bg-white border-b border-l-0 border-r-0 border-gray-300  leading-tight py-2  px-3 w-16rem appearance-none !border-t dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
        bind:value={category}
      >
        <option value="">All categories</option>
        <!-- {#each store.categories || [] as category}
              <option value={category.slug}>{category.name}</option>
            {/each} -->
      </select>
      <button
        class="rounded-tr rounded-br flex bg-dark-800 text-white  p-2 items-center dark:bg-dark-400"
      >
        <Search16 class="m-auto" />
      </button>
    </form>
  </div>

  <div class="flex-grow">
    <slot />
  </div>
  <div class="bg-dark-900 w-full !text-white">
    <div
      class="flex mx-auto text-xs w-full p-4 justify-between items-center <sm:flex-col <sm:space-y-4 <sm:items-center lg:w-9/10"
    >
      <p>
        &copy; {new Date().getFullYear()}
        Arepa Venezuelan Kitchen. All rights reserved.
      </p>
      <div class="flex space-x-4 items-center">
        <a
          href="https://twitter.com/decalshutca"
          target="__blank"
          class="duration-200 !hover:text-gray-400"
        >
          <LogoTwitter24 />
        </a>
        <a
          href="https://www.instagram.com/decalshutca"
          target="__blank"
          class="duration-200 !hover:text-gray-400"
        >
          <LogoInstagram24 />
        </a>
      </div>
    </div>
  </div>
</div>
