<script lang="ts">
  import { page, session } from '$app/stores'
  import { preferences } from '$lib'
  import { notifications } from '$lib/components/notifications'
  import { tooltip } from '$lib/components/tooltip'
  import {
    Store24,
    Home24,
    Moon24,
    Sun24,
    Settings24,
    Logout24,
    ChevronLeft20,
    Launch16,
    ChevronLeft24,
    Category24,
    Product24,
    ColorPalette24,
    OrderDetails24,
    UserAvatar24,
  } from 'carbon-icons-svelte'
  import Favicons from '$lib/components/Favicons.svelte'
  import { pageSubtitle } from '$lib/stores'
  import Transition from './Transition.svelte'
  import { squareratio } from '$lib/actions/aspectratio'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { getAbsoluteURL } from '$lib/utils/host'
  import { beforeNavigate } from '$app/navigation'
  import { fly, scale } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'
  import trpc from '$lib/trpc/client'
  import { dev } from '$app/env'

  $: path = $page.url.pathname

  $: pages = [
    {
      icon: Home24,
      title: ` Dashboard`,
      href: `/`,
    },
    {
      icon: Category24,
      title: 'Categories',
      href: `/categories`,
    },
    {
      icon: Product24,
      title: 'Products',
      href: `/products`,
    },
    {
      icon: OrderDetails24,
      title: 'Orders',
      href: `/orders`,
    },
    {
      icon: UserAvatar24,
      title: 'Customers',
      href: `/customers`,
    },
    {
      icon: ColorPalette24,
      title: 'Customize landing',
      href: `/landing`,
    },
    {
      icon: Settings24,
      title: 'Store settings',
      href: `/settings`,
    },
  ]

  let subtitle = ''
  $: subtitle = $pageSubtitle ? $pageSubtitle : subtitle
  beforeNavigate(() => {
    $pageSubtitle = ''
  })

  $: pageTitle = (subtitle ? subtitle + ' | ' : '') + 'Arepa Venezuelan Kitchen'

  let sidebar = false

  let el: HTMLDivElement | undefined
  let gradientVisible = false
  let navHeight = 0

  $: if (el) {
    gradientVisible = el.clientWidth < el.scrollWidth
  }

  const scroll = () => {
    if (!el) return
    gradientVisible = el.offsetWidth + el.scrollLeft < el?.scrollWidth
  }
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Favicons
  favicon="/images/favicon.webp"
  themeColor="#000"
  titleName="AVK Admin"
/>

{#if $session.userId}
  <div class="flex flex-col h-screen w-full overflow-hidden">
    <div class="flex h-full w-full">
      <div
        class="bg-white border-t flex flex-col border-light-900 w-full  bottom-0 left-0 text-gray-400 z-60 fixed justify-between sm:hidden dark:bg-dark-900 dark:border-dark-700"
      >
        {#if gradientVisible}
          <div
            class="bg-gradient-to-r from-transparent to-white h-full top-0 right-0 w-96px z-20 absolute pointer-events-none dark:to-gray-900"
            transition:fly|local={{ x: 10, duration: 200 }}
          />
        {/if}
        <div
          class="w-full overflow-auto relative no-scrollbar"
          bind:this={el}
          bind:clientHeight={navHeight}
          on:scroll={scroll}
        >
          <div class="flex space-x-4 m-4 w-full">
            {#each pages as p (p.href)}
              {@const current =
                p.href === '/' ? path === '/' : path?.startsWith(p.href)}
              <a
                title={p.title}
                use:tooltip
                class="flex hover:text-black dark:hover:text-white"
                in:scale|local={{ start: 0.8, duration: 400, easing: expoOut }}
                sveltekit:prefetch
                class:text-black={current}
                class:dark:text-white={current}
                href={p.href}
                style="width: 24px; height: 24px"
                on:click={() => (sidebar = false)}
              >
                <div class="flex space-x-2">
                  <svelte:component this={p.icon} />
                </div>
              </a>
            {/each}
            <button
              on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
              class="flex relative hover:text-black dark:hover:text-white"
              title="Toggle theme"
              use:tooltip
              style="min-width: 24px; min-height: 24px"
            >
              <div class="absolute pointer-events-none">
                <svelte:component
                  this={$preferences.darkMode ? Moon24 : Sun24}
                />
              </div>
            </button>
            <button
              on:click={() => {
                trpc()
                  .mutation('user:logout')
                  .then(() => {
                    notifications.send('Log out successfully', 'default', 1000)
                    window.location.replace('/login')
                  })
              }}
              class="flex relative hover:text-black dark:hover:text-white"
              title="Log out"
              use:tooltip
              style="min-width: 24px; min-height: 24px"
            >
              <Logout24 />
            </button>
          </div>
        </div>
      </div>
      <div
        class="bg-white border-r flex flex-col h-full  border-light-900 p-4 text-gray-400 z-60 justify-between sidebar dark:bg-dark-900 dark:border-dark-700"
        class:open={sidebar}
      >
        <!-- <div
          class="opacity-50 right-[calc(-52px-16px)] bottom-4 absolute sm:hidden"
        >
          <button
            class="rounded-full outline-none bg-blue-500 shadow text-white p-4"
            on:click={() => (sidebar = !sidebar)}
          >
            <ChevronLeft20
              class="transform duration-400 {!sidebar ? 'rotate-180' : ''}"
            />
          </button>
        </div> -->
        <div class="flex flex-col h-full space-y-6">
          {#each pages as p (p.href)}
            {@const current =
              p.href === '/' ? path === '/' : path?.startsWith(p.href)}
            <a
              title={p.title}
              use:tooltip
              class="flex hover:text-black dark:hover:text-white"
              in:scale|local={{ start: 0.8, duration: 400, easing: expoOut }}
              sveltekit:prefetch
              class:text-black={current}
              class:dark:text-white={current}
              href={p.href}
              on:click={() => (sidebar = false)}
            >
              <div class="flex space-x-2">
                <svelte:component this={p.icon} />
                <span class="sm:hidden">{p.title}</span>
              </div>
            </a>
          {/each}
        </div>
        <div
          class="flex sm:flex-col sm:space-y-6 <sm:space-x-6 <sm:items-center"
        >
          <button
            on:click={() => ($preferences.darkMode = !$preferences.darkMode)}
            class="flex relative hover:text-black dark:hover:text-white"
            title="Toggle theme"
            use:tooltip
            style="width: 24px; height: 24px"
          >
            <div class="absolute pointer-events-none">
              <svelte:component this={$preferences.darkMode ? Moon24 : Sun24} />
            </div>
          </button>
          <button
            on:click={() => {
              trpc()
                .mutation('user:logout')
                .then(() => {
                  notifications.send('Log out successfully', 'default', 1000)
                  window.location.replace('/login')
                })
            }}
            class="flex relative items-end justify-end hover:text-black dark:hover:text-white"
            title="Log out"
            use:tooltip
            style="width: 24px; height: 24px"
          >
            <Logout24 />
          </button>
        </div>
      </div>
      <div
        class="h-full bg-light-500 w-full p-4 overflow-auto lg:p-6 dark:bg-dark-900"
      >
        <div
          class="flex mb-6 items-center sm:space-x-4"
          in:fly={{ y: -5, duration: 600, easing: expoOut }}
        >
          <div
            class="flex mr-auto items-start sm:space-x-4 sm:items-center <sm:flex-col <sm:space-y-4"
          >
            <div class="flex items-center">
              <a
                class="flex mr-4"
                title="Go back"
                use:tooltip
                href={$page.url.pathname.substring(
                  0,
                  $page.url.pathname.lastIndexOf('/')
                ) === $page.url.pathname
                  ? '/'
                  : $page.url.pathname.substring(
                      0,
                      $page.url.pathname.lastIndexOf('/')
                    )}><ChevronLeft24 /></a
              >
              <a href="/" class="p-1 dark:(filter invert) ">
                <Image
                  src="/images/logo.webp"
                  showOriginal={dev ? 'webp' : undefined}
                  options={{
                    q: 100,
                  }}
                  class="h-3rem"
                />
              </a>
              <a
                class="border-transparent flex ml-4 hover:border-current"
                href={getAbsoluteURL({
                  path: '/',
                })}
                target="__blank"
                title="Go to site"
                use:tooltip
              >
                <Launch16 />
              </a>
            </div>
          </div>
        </div>
        <Transition url={$page.url.pathname}>
          <div class="<lg:pb-$nh" style:--nh="{navHeight}px">
            <slot />
          </div>
        </Transition>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  @media (max-width: 639.9px) {
    .sidebar:not(.open) {
      transform: translateX(-100%);
    }
    .sidebar {
      @apply transition-transform top-0 left-0 duration-400 fixed;
    }
  }
</style>
