<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ fetch, stuff }) => {
    const data = await trpc(fetch).query('products:list', {
      public: true,
    })
    return {
      props: {
        data: {
          nodes: await trpc(fetch).query('utils:landingNodes'),
          products: data?.slice(0, 4) || [],
        },
      },
    }
  }
</script>

<script lang="ts">
  import { Parallax, ParallaxLayer } from 'svelte-parallax'
  import type { StripedProduct } from '$lib/db'
  import trpc from '$lib/trpc/client'
  import ElementEditor from '$lib/__app/ElementEditor.svelte'
  import Image from '$lib/components/caravaggio/Image.svelte'
  import { favorites, watchMedia } from '$lib/stores'
  import Viewport from '$lib/components/Viewport.svelte'
  import {
    Corn32,
    Favorite24,
    FavoriteFilled24,
    Fire32,
    Restaurant32,
    Star32,
  } from 'carbon-icons-svelte'
  import { goto } from '$app/navigation'
  import { tooltip } from '$lib/components/tooltip'
  import { setContext } from 'svelte'
  import { writable, type Writable } from 'svelte/store'
  import { dev } from '$app/env'
  import { scaleLinear } from 'd3-scale'

  export let data: any | undefined = undefined
  export let editable = false

  setContext('readOnly', !editable)

  $: products = (data?.products as StripedProduct[]) || []

  export let nodes: Writable<any> = writable(data?.nodes)

  const mediaqueries = {
    small: '(max-width: 849px)',
    large: '(min-width: 850px)',
    short: '(max-height: 399px)',
    landscape: '(orientation: landscape) and (max-height: 499px)',
    tiny: '(orientation: portrait) and (max-height: 599px)',
    dark: '(prefers-color-scheme: dark)',
    noanimations: '(prefers-reduced-motion: reduce)',
  }

  const media = watchMedia(mediaqueries)

  let xDeg = 0
  let yDeg = 0
  let windowWidth = 0
  let windowHeight = 0

  $: xScale = scaleLinear().domain([0, windowWidth]).range([-10, 10])
  $: yScale = scaleLinear().domain([0, windowHeight]).range([-10, 10])

  function handleMousemove(event) {
    xDeg = xScale(event.clientX)
    yDeg = yScale(event.clientY)
  }
</script>

<svelte:window
  bind:innerWidth={windowWidth}
  bind:innerHeight={windowHeight}
  on:mousemove={handleMousemove}
/>

<Viewport
  class="bg-cover bg-center flex bg-opacity-5 w-full min-h-[calc(100vh-var(--nh))] p-4 justify-center items-center relative"
  --a-d="100ms"
  --a-y="0.5rem"
>
  <div
    class="bg-cover bg-center flex h-full w-full opacity-50 absolute filter grayscale"
    style="background-image: url('https://media-cdn.tripadvisor.com/media/photo-s/09/1d/24/6c/arepa-venezuelan-kitchen.jpg')"
  />
  <div
    class="bg-gradient-to-b from-transparent to-white flex h-[70%] w-full bottom-0 left-0 absolute dark:to-dark-800"
  />
  <div class="flex relative">
    <div
      class="flex h-full w-full transform  inset-0 absolute justify-center items-center sm:(translate-y-$my translate-x-$mx) <lg:scale-70 "
      style="transition: 1000ms cubic-bezier(.3, 1, 1, .3); --mx: {xDeg}px; --my: {yDeg}px"
    >
      <div class="absolute anim" style:--anim-d="500ms">
        <div
          class="m-auto rounded-2xl h-68 transform shadow-2xl w-48 rotate-16 translate-x-20 translate-y-5 relative overflow-hidden"
        >
          <div
            class="bg-gradient-to-br flex  h-full from-red-300 to-red-500 w-full opacity-80 absolute dark:(from-red-500 to-red-700) "
          />
          <img
            src="https://images.unsplash.com/photo-1619684269684-6a3f2ffa8971?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=876&q=80"
            alt=""
            class="flex h-full object-cover w-full"
          />
        </div>
      </div>
      <div class="absolute anim">
        <div
          class="m-auto rounded-2xl h-68 transform shadow-2xl w-48 -rotate-12 -translate-x-20 translate-y-5 relative overflow-hidden"
        >
          <div
            class="bg-gradient-to-br flex h-full from-yellow-300 to-yellow-500 w-full opacity-80 absolute dark:(from-yellow-500 to-yellow-700) "
          />
          <img
            src="https://images.unsplash.com/photo-1619684269835-152b5bcdad79?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=385&q=80"
            alt=""
            class="flex h-full object-cover w-full"
          />
        </div>
      </div>
      <div class="absolute anim" style:--anim-d="300ms">
        <div
          class="m-auto rounded-2xl h-72 transform shadow-2xl w-52 -translate-y-5 relative overflow-hidden"
        >
          <div
            class="bg-gradient-to-br flex h-full from-green-300 to-blue-500 w-full opacity-80 absolute dark:(from-blue-500 to-blue-700) "
          />
          <Image
            src="https://images.unsplash.com/photo-1587603366933-aa6947174c65?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=389&q=80"
            showOriginal={dev ? 'png' : undefined}
            class="flex h-full object-cover w-full"
            --anim-d="700ms"
            options={{
              o: 'png',
              rs: {
                s: '208x288',
                m: 'scale',
              },
            }}
          />
          <!-- <img
          src="https://images.unsplash.com/photo-1587603366933-aa6947174c65?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=389&q=80"
          alt=""
        /> -->
        </div>
      </div>
    </div>
    <div
      class="transform sm:(translate-y-$my translate-x-$mx) "
      style="transition: 1000ms cubic-bezier(.3, 1, 1, .3); --mx: {xDeg *
        2}px; --my: {yDeg * 2}px"
    >
      <Image
        src="/images/logo.png"
        showOriginal={dev ? 'png' : undefined}
        class="rounded-sm p-px h-30 w-auto relative anim lg:h-50 dark:(filter invert) "
        --anim-d="700ms"
        options={{
          o: 'png',
          rs: {
            s: '238x',
            m: 'scale',
          },
        }}
      />
    </div>
  </div>
</Viewport>

<Viewport>
  <div
    class="mx-auto w-full grid gap-6 items-center overflow-hidden lg:h-[calc(100vh-81px)] lg:w-8/10 lg:grid-cols-2 "
  >
    <div
      class="p-2 pr-6 anim <sm:pb-16"
      style:--anim-d="200ms"
      style:--anim-x="-1rem"
    >
      <ElementEditor
        root={nodes}
        keys={{ text: 'hero' }}
        let:text
        let:contenteditable
        let:editable
      >
        <h1
          class="font-bold font-handwritten p-2 text-4xl xl:text-4xl"
          class:text-green-500={!editable}
          use:contenteditable
        >
          {@html text}
        </h1>
      </ElementEditor>
      <ElementEditor
        root={nodes}
        keys={{ text: 'hero_txt' }}
        let:text
        let:contenteditable
      >
        <p class="px-2" use:contenteditable>
          {@html text}
        </p>
      </ElementEditor>
    </div>
    <div
      class="p-8 anim <lg:row-start-1"
      style:--anim-x="1rem"
      style:--anim-y="-1rem"
    >
      <div class="flex w-full justify-center relative items-center <lg:mb-16">
        <div class="h-full h-60 w-60 -z-10 absolute lg:h-80 lg:w-80">
          <div
            class="h-full rounded-[50%] w-full transform translate-x-5 translate-y-5 polka"
          />
        </div>

        <div
          class="flex bg-green-300 bg-opacity-50 rounded-[50%] h-60 w-60 aspect-square items-center justify-center relative lg:h-80 lg:w-80"
        >
          <Parallax
            threshold={{ top: 0, bottom: 0 }}
            sections={1}
            style="width: 100%"
          >
            <ParallaxLayer rate={0.2} offset={$media.small ? 0.3 : 0.2}>
              <ElementEditor
                root={nodes}
                keys={{ image: 'arepa' }}
                innerButtons
                let:image
              >
                <Image
                  src={image || ''}
                  options={{
                    rs: {
                      s: '248x248',
                      m: 'embed',
                      b: '000000.0',
                    },
                  }}
                  class="flex w-full aspect-square"
                  width={248}
                  height={248}
                />
              </ElementEditor>
            </ParallaxLayer>
          </Parallax>
        </div>
      </div>
    </div>
  </div>
</Viewport>

<ElementEditor
  root={nodes}
  keys={{ image: 'banner.bg' }}
  let:image
  innerButtons
>
  <div
    class="bg-center bg-cover flex w-full py-16 overflow-hidden relative"
    style:--bgc="rgba(0, 0, 0, 0.7)"
    style="background-image: linear-gradient(0deg, var(--bgc), var(--bgc))"
  >
    <Parallax
      threshold={{ top: 0, bottom: 0 }}
      config={{ damping: 1, stiffness: 1 }}
      sections={1}
      style="width: 100%; overflow: hidden; display: flex; left: 0; top: 0; position: absolute;"
    >
      <ParallaxLayer rate={-0.2}>
        <Image
          src={image || ''}
          options={{
            rs: {
              s: '800x800',
              m: 'scale',
              b: '000000.0',
            },
          }}
          class="flex h-full object-cover w-full select-none pointer-events-none"
          width={248}
          height={248}
        />
      </ParallaxLayer>
    </Parallax>
    <div
      class="flex h-full w-full top-0 left-0 absolute"
      style="background-image: linear-gradient(0deg, var(--bgc), var(--bgc))"
    />
    <div
      class="flex flex-col mx-auto space-y-4 w-full p-4 relative items-center justify-center lg:w-9/10"
    >
      <ElementEditor
        root={nodes}
        keys={{ text: 'banner.title' }}
        let:text
        let:contenteditable
      >
        <h3
          class="font-handwritten text-center text-white p-2 text-3xl !font-normal xl:text-5xl"
          use:contenteditable
        >
          {@html text}
        </h3>
      </ElementEditor>
      <div class="w-8/10">
        <ElementEditor
          root={nodes}
          keys={{ text: 'banner.body' }}
          let:text
          let:contenteditable
        >
          <p
            class="text-center text-white text-base !font-normal"
            use:contenteditable
          >
            {@html text}
          </p>
        </ElementEditor>
      </div>
    </div>
  </div>
</ElementEditor>

<div class="flex-col flex mx-auto w-full p-4 py-16 items-center lg:w-9/10">
  <Viewport
    oneWay
    class="flex flex-col space-y-4 w-full items-center"
    --a-y="0.5rem"
  >
    <Fire32 class="h-64px text-dark-900 w-64px anim dark:text-gray-100" />
    <h3
      class="font-bold font-title text-center text-3xl text-dark-900 anim lg:text-4xl dark:text-gray-100"
      style:--anim-d="200ms"
    >
      Taste our <span class="font-handwritten px-1 orange-gradient"
        >caribbean</span
      > menu
    </h3>
  </Viewport>
  {#each $nodes.menues as _, idx}
    <div class="flex w-full py-16">
      <Viewport
        oneWay
        class="flex-col-reverse flex w-full items-center {idx % 2 === 0
          ? 'lg:flex-row'
          : 'lg:flex-row-reverse'}"
        --a-y="1rem"
      >
        <div class="flex flex-col space-y-6 w-full items-center justify-center">
          <Restaurant32
            class="h-52px text-dark-900 w-52px anim dark:text-gray-100 "
          />
          <ElementEditor
            root={nodes}
            keys={{ text: `menues[${idx}].title` }}
            let:text
            let:contenteditable
          >
            <h4
              class="font-handwritten text-dark-900 text-4xl anim dark:text-gray-100"
              style:--anim-d="100ms"
              use:contenteditable
            >
              {@html text}
            </h4>
          </ElementEditor>
          <ElementEditor
            root={nodes}
            keys={{ text: `menues[${idx}].body` }}
            let:text
            let:contenteditable
          >
            <p
              use:contenteditable
              class="text-center anim"
              style:--anim-d="200ms"
            >
              {@html text}
            </p>
          </ElementEditor>
          <div class="anim" style:--anim-d="300ms">
            <ElementEditor
              root={nodes}
              keys={{
                text: `menues[${idx}].button.title`,
                href: `menues[${idx}].button.href`,
              }}
              let:text
              let:href
              let:contenteditable
            >
              <a
                {href}
                use:contenteditable
                class="rounded-full font-bold border-2 border-dark-900 text-center text-sm py-2 px-4 text-dark-900 duration-200 dark:(border-gray-100 text-gray-100) hover:(bg-dark-900 text-gray-100) hover:dark:(text-dark-900 bg-gray-100) "
              >
                {@html text}
              </a>
            </ElementEditor>
          </div>
        </div>
        <div
          class="flex w-full justify-center relative items-center anim <lg:mb-16"
          style:--anim-d="400ms"
        >
          <div class="h-full h-60 w-60 -z-10 absolute lg:h-80 lg:w-80">
            <div
              class="h-full rounded-[50%] w-full transform translate-x-5 translate-y-5 polka"
            />
          </div>

          <ElementEditor
            root={nodes}
            keys={{
              image: `menues[${idx}].image`,
            }}
            innerButtons
            let:image
          >
            <div
              class="flex bg-green-300 bg-opacity-50 rounded-[50%] h-60 w-60 aspect-square items-center justify-center relative overflow-hidden lg:h-80 lg:w-80"
            >
              <Image
                src={image || ''}
                options={{
                  rs: {
                    s: '248x248',
                    m: 'scale',
                    b: '000000.0',
                  },
                }}
                class="flex w-full aspect-square"
                width={248}
                height={248}
              />
            </div>
          </ElementEditor>
        </div>
      </Viewport>
    </div>
  {/each}
</div>

{#if products.length}
  <div
    class="flex-col flex mx-auto space-y-16 w-full p-4 py-16 items-center lg:w-9/10"
  >
    <Viewport
      oneWay
      class="flex flex-col font-handwritten font-bold space-y-4 w-full items-center"
      --a-y="0.5rem"
    >
      <Star32 class="h-64px text-dark-900 w-64px anim dark:text-gray-100" />
      <h3
        class="font-bold text-3xl text-dark-900 anim lg:text-4xl dark:text-gray-100"
        style:--anim-d="200ms"
      >
        Some of our our <span class="font-handwritten px-1 orange-gradient"
          >dishes</span
        >
      </h3>
    </Viewport>
    <div class="w-full grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {#each products as p (p.id)}
        <div
          class="bg-white border rounded-lg cursor-pointer flex flex-col space-y-2 border-gray-300 p-2 transform transition-all relative dark:bg-dark-800 dark:border-dark-400 hover:shadow-lg hover:scale-102"
          style="will-change: transform"
          on:click={() => goto(`/menu/${p.slug}`)}
        >
          <div class="flex h-full w-full aspect-square">
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
  </div>
{/if}

<div
  class="flex-col flex mx-auto w-full p-4 py-16 items-center overflow-hidden lg:w-9/10"
>
  <div class="flex w-full py-16">
    <Viewport
      oneWay
      class="flex-col flex w-full items-center lg:flex-row-reverse <lg:space-y-8"
      --a-y="1rem"
    >
      <div
        class="flex flex-col space-y-6 w-full items-center justify-center lg:px-8"
      >
        <Corn32 class="h-52px text-dark-900 w-52px anim dark:text-gray-100 " />
        <ElementEditor
          root={nodes}
          keys={{ text: `about.title` }}
          let:text
          let:editable
          let:contenteditable
        >
          <h4
            class="font-handwritten text-dark-900 text-4xl anim dark:text-gray-100"
            style:--anim-d="100ms"
            class:flag-gradient={!editable}
            use:contenteditable
          >
            {@html text}
          </h4>
        </ElementEditor>
        <ElementEditor
          root={nodes}
          keys={{ text: `about.body` }}
          let:text
          let:contenteditable
        >
          <p
            use:contenteditable
            class="text-center anim"
            style:--anim-d="200ms"
          >
            {@html text}
          </p>
        </ElementEditor>
        <div class="anim" style:--anim-d="300ms">
          <ElementEditor
            root={nodes}
            keys={{
              text: `about.button.title`,
              href: `about.button.href`,
            }}
            let:text
            let:href
            let:contenteditable
          >
            <a
              {href}
              use:contenteditable
              class="rounded-full font-bold border-2 border-dark-900 text-center text-sm py-2 px-4 text-dark-900 duration-200 dark:(border-gray-100 text-gray-100) hover:(bg-dark-900 text-gray-100) hover:dark:(text-dark-900 bg-gray-100) "
            >
              {@html text}
            </a>
          </ElementEditor>
        </div>
      </div>
      <div
        class="flex w-full justify-center relative items-center anim"
        style:--anim-d="400ms"
      >
        <div class="h-full h-auto w-full -z-10 absolute aspect-square">
          <div
            class="rounded-lg h-full w-full transform translate-x-5 translate-y-5 polka"
          />
        </div>
        <div
          class="rounded flex h-full bg-green-300 bg-opacity-50 w-full aspect-square items-center justify-center relative overflow-hidden"
        >
          <iframe
            title="Location"
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10748.051701860451!2d-122.3127703!3d47.6647453!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x36f42ccb107444f6!2sArepa%20Restaurante%20venezolano!5e0!3m2!1ses-419!2sve!4v1659414237411!5m2!1ses-419!2sve"
            class="border rounded flex h-full border-gray-300 w-full aspect-square dark:border-gray-600"
            style="border:0;"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </Viewport>
  </div>
</div>

<style>
  :global(*) {
    --nh: 114px;
  }
  @screen lg {
    :global(*) {
      --nh: 81px;
    }
  }
</style>
