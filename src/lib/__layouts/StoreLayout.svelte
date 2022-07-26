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
    LogoFacebook24,
    Menu24,
    OverflowMenuHorizontal24,
    OverflowMenuVertical24,
    Close24,
  } from 'carbon-icons-svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { bag, customer, pageSubtitle, preferences } from '$lib/stores'
  import { goto } from '$app/navigation'
  import Submenu from '$lib/components/Submenu.svelte'
  import trpc from '$lib/trpc/client'
  import { browser, dev } from '$app/env'
  import { fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

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

  let open = false

  $: if ($navigating) {
    open = false
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
  {#if open}
    <div
      class="flex h-full bg-dark-900 w-full inset-0 text-gray-100 z-99 fixed"
      transition:fly={{ duration: 400, x: 100, easing: expoOut }}
    >
      <div
        class="flex flex-col font-bold font-title mx-auto space-y-6 text-lg w-full p-4 items-end lg:w-9/10"
      >
        <div class="flex h-28px items-center">
          <button on:click={() => (open = false)} type="button">
            <Close24 class="flex" />
          </button>
        </div>
        <a href="/menu" class="hover:underline">Menu</a>
        <a href="/#location" class="hover:underline">Location</a>
        <a href="/contact" class="hover:underline">Catering & Events</a>
        <a href="/#about" class="hover:underline">About Us</a>
        <a href="/contact" class="hover:underline">Contact</a>
      </div>
    </div>
  {/if}
  <div
    class="bg-white flex flex-col w-full top-0 z-80 items-center sticky filter blur-lg !bg-opacity-80 <lg:border-b dark:bg-dark-800 dark:border-dark-400"
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
            class="rounded-sm p-px h-2rem w-auto lg:h-3rem dark:(filter invert) "
            width="78"
            height="48"
            options={{
              o: 'png',
              rs: {
                s: '78x48',
                m: 'scale',
              },
            }}
          />
        </a>
        <div class="flex flex-col <lg:hidden">
          <p class="font-bold text-xs">Location</p>
          <p class="text-xs">
            1405 NE 50th St, Seattle, WA 98105, United States
          </p>
        </div>
      </div>
      <div class="flex space-x-2 text-gray-400 items-center lg:space-x-4">
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
          <button
            class="rounded-tr rounded-br flex bg-dark-800 text-white  p-2 items-center dark:bg-dark-400"
          >
            <Search16 class="m-auto" />
          </button>
        </form>
        <a
          href="/menu"
          class="rounded-full font-bold border-2 border-dark-900 text-xs py-1 px-3 text-dark-900 duration-200 sm:py-2 sm:px-4 dark:(border-gray-100 text-gray-100) hover:(bg-dark-900 text-gray-100) hover:dark:(bg-gray-100 text-dark-900) "
          >Order now</a
        >
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
        <button
          class="text-dark-900 lg:hidden dark:text-gray-100"
          on:click={() => (open = true)}
          type="button"
        >
          <OverflowMenuVertical24 />
        </button>
      </div>
    </div>
    <div class="bg-dark-900 w-full text-gray-100 <lg:hidden">
      <div
        class="flex font-bold mx-auto space-x-6 text-xs p-4 w-9/10 justify-center !py-2"
      >
        <a href="/menu" class="hover:underline">Menu</a>
        <a href="/#location" class="hover:underline">Location</a>
        <a href="/contact" class="hover:underline">Catering & Events</a>
        <a href="/#about" class="hover:underline">About Us</a>
        <a href="/contact" class="hover:underline">Contact</a>
      </div>
    </div>
    <form
      class="flex w-full px-4 pb-4 sm:hidden !text-xs"
      on:submit|preventDefault={submitSearch}
    >
      <input
        class="bg-white border rounded-tl rounded-bl border-gray-300 text-xs  leading-tight w-full py-2 px-3 appearance-none lg:w-20rem dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline focus:z-10 "
        type="search"
        name="q"
        bind:value={search}
        placeholder="Enter keywords to search..."
      />
      <!-- <select
        class="bg-white border-b border-l-0 border-r-0 border-gray-300  leading-tight py-2  px-3 w-16rem appearance-none !border-t dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
        bind:value={category}
      >
        <option value="">All categories</option>
        {#each $page.stuff.categories || [] as category}
          <option value={category.slug}>{category.name}</option>
        {/each}
      </select> -->
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
  <div class="mx-auto w-full grid p-4 py-6 gap-6 lg:w-9/10 lg:grid-cols-3">
    <div class="flex flex-col w-full">
      <Image
        src="/images/logo-alt.webp"
        showOriginal={dev ? 'webp' : undefined}
        class="dark:(filter invert) "
        width="128"
        height="128"
        options={{
          o: 'png',
          rs: {
            s: '128x128',
            m: 'scale',
          },
        }}
      />
    </div>
    <div class="flex flex-col space-y-6 text-xs">
      <div class="flex flex-col space-y-2">
        <div class="font-title font-bold text-xl text-dark-900 dark:text-white">
          Location
        </div>
        <p>1405 NE 50th St, Seattle, WA 98105, United States</p>
      </div>
      <div class="flex flex-col space-y-2">
        <div class="font-title font-bold text-xl text-dark-900 dark:text-white">
          Phone
        </div>
        <a href="tel:+12065564879" class="hover:underline">+1 206-556-4879</a>
      </div>
    </div>
    <div
      class="flex flex-col text-xs lg:flex-row lg:w-full lg:justify-between <lg:space-y-6"
    >
      <div class="flex flex-col space-y-2">
        <div class="font-title font-bold text-xl text-dark-900 dark:text-white">
          Pages
        </div>
        <a href="/" class="hover:underline">Home</a>
        <a href="/favorites" class="hover:underline">Favorites</a>
        <a href="/bag" class="hover:underline">Shopping bag</a>
        <a href="/contact" class="hover:underline">Contact</a>
      </div>
      <div class="flex flex-col space-y-2">
        <div class="font-title font-bold text-xl text-dark-900 dark:text-white">
          Menu
        </div>
        <a href="/menu" class="hover:underline">All</a>
        {#each $page.stuff.categories || [] as c}
          <a href="/menu?category={c.slug}" class="hover:underline">{c.name}</a>
        {/each}
      </div>
    </div>
  </div>
  <div
    class="flex mx-auto text-xs w-full p-4 justify-between items-center <sm:flex-col <sm:space-y-4 <sm:items-center lg:w-9/10"
  >
    <p>
      &copy; {new Date().getFullYear()}
      Arepa Venezuelan Kitchen. All rights reserved.
    </p>
    <div class="flex space-x-4 text-dark-900 items-center dark:text-white">
      <a
        href="https://www.facebook.com/ArepaVen/"
        target="__blank"
        class="duration-200 !hover:text-gray-400"
      >
        <LogoFacebook24 />
      </a>
      <a
        href="https://www.instagram.com/arepa.vk"
        target="__blank"
        class="duration-200 !hover:text-gray-400"
      >
        <LogoInstagram24 />
      </a>
    </div>
  </div>
</div>
