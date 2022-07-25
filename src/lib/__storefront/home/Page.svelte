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
</script>

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
          class="font-bold font-handwritten p-2 text-4xl xl:text-6xl"
          class:flag-gradient={!editable}
          use:contenteditable
        >
          {@html text}
        </h1>
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
          class="flex bg-blue-300 bg-opacity-50 rounded-[50%] h-60 w-60 aspect-square items-center justify-center relative lg:h-80 lg:w-80"
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
                class="rounded-full font-bold border-2 border-dark-900 text-center text-sm py-2 px-4 text-dark-900 duration-200 dark:(border-gray-100 text-gray-100) hover:dark:(text-dark-900 bg-gray-100) "
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
              class="flex bg-blue-300 bg-opacity-50 rounded-[50%] h-60 w-60 aspect-square items-center justify-center relative overflow-hidden lg:h-80 lg:w-80"
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
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {#each products as p (p.id)}
        <div
          class="bg-white border rounded-lg cursor-pointer flex flex-col space-y-2 border-gray-300 p-2 transform transition-all relative dark:bg-dark-800 dark:border-dark-400 hover:shadow-lg hover:scale-102"
          style="will-change: transform"
          on:click={() => goto(`/menu/${p.slug}`)}
        >
          <!-- {#if p.template} -->
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
          <!-- {/if} -->
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

<div class="flex-col flex mx-auto w-full p-4 py-16 items-center lg:w-9/10">
  <div class="flex w-full py-16">
    <Viewport
      oneWay
      class="flex-col flex w-full items-center lg:flex-row-reverse <lg:mb-16"
      --a-y="1rem"
    >
      <div class="flex flex-col space-y-6 w-full items-center justify-center">
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
              class="rounded-full font-bold border-2 border-dark-900 text-center text-sm py-2 px-4 text-dark-900 duration-200 dark:(border-gray-100 text-gray-100) hover:dark:(text-dark-900 bg-gray-100) "
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
        <div
          class="h-full h-60 w-60 -z-10 absolute aspect-square lg:h-auto lg:h-80 lg:w-80"
        >
          <div
            class="h-full w-full transform translate-x-5 translate-y-5 polka"
          />
        </div>

        <ElementEditor
          root={nodes}
          keys={{
            image: `about.image`,
          }}
          innerButtons
          let:image
        >
          <div
            class="flex bg-blue-300 bg-opacity-50 aspect-square items-center justify-center relative overflow-hidden lg:h-80 lg:w-80"
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
              class="flex h-auto w-full aspect-square"
              width={248}
              height={248}
            />
          </div>
        </ElementEditor>
      </div>
    </Viewport>
  </div>
</div>
