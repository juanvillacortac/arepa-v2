<script lang="ts">
  import {
    Checkmark16,
    Close16,
    Close24,
    Edit16,
    Image16,
    Link16,
    Link32,
    Save16,
  } from 'carbon-icons-svelte'

  import { keyed } from 'svelte-keyed'
  import type { Writable } from 'svelte/store'
  import { getContext, tick } from 'svelte'
  import { tooltip } from '$lib/components/tooltip'
  import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'
  import { uploadFile } from '$lib/supabase'
  import { portal } from 'svelte-portal'
  import { fade, fly } from 'svelte/transition'
  import { expoOut } from 'svelte/easing'

  export let root: Writable<Record<string, any>>
  export let keys: { text?: string; image?: string; href?: string }

  export let readOnly: boolean = getContext('readOnly') || false
  let editable = false

  let nodes: HTMLElement[] = []

  const textStore: Writable<string> | undefined = keys.text
    ? keyed(root, keys.text)
    : undefined
  const imageStore: Writable<string> | undefined = keys.image
    ? keyed(root, keys.image)
    : undefined
  const hrefStore: Writable<string> | undefined = keys.href
    ? keyed(root, keys.href)
    : undefined

  const saveText = () => {
    if (readOnly) return
    if (!nodes.length) return
    if (!nodes[0].innerHTML?.trim()) {
      alert('You need to set a value')
      nodes[0].focus()
      return
    }
    $textStore = nodes[0].innerHTML
    editable = false
  }

  const cancelText = () => {
    if (readOnly) return
    if (!nodes.length) return
    for (const node of nodes) {
      node.innerHTML = $textStore || ''
    }
    editable = false
  }

  const contenteditable = (node: HTMLElement) => {
    nodes.push(node)
    return {
      destroy() {
        for (const n of nodes) {
          node.contentEditable = 'false'
        }
      },
    }
  }

  function setContentEditable(status: boolean) {
    if (readOnly) return
    if (!nodes.length) return
    for (const node of nodes) {
      node.contentEditable = status ? 'true' : 'false'
    }
    nodes[0].focus()
  }

  $: setContentEditable(editable)

  const clickOutside = (node: HTMLDivElement) => {
    if (readOnly) return
    const handleClick = (event) => {
      if (node && !node.contains(event.target) && !event.defaultPrevented) {
        cancelText()
      }
    }

    document.addEventListener('click', handleClick, true)

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true)
      },
    }
  }

  const saveHref = () => {
    $hrefStore = href
    hrefDialog = false
  }

  let outScreen = false
  export let innerButtons = false
  let screenWidth = 0

  let buttonsRef: HTMLDivElement | undefined
  $: if (buttonsRef && screenWidth) {
    const rect = buttonsRef.getBoundingClientRect()
    outScreen = innerButtons ? true : rect.left + rect.width - 4 >= screenWidth
  }

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  let uploading = false

  let uploadImage: <
    T extends Event & {
      currentTarget: EventTarget & HTMLInputElement
    }
  >(
    event: T
  ) => Promise<void>

  const urlBuilder = useCaravaggioBuilder()

  $: uploadImage = async (event) => {
    try {
      if (
        !event.currentTarget.files ||
        event.currentTarget.files.length === 0
      ) {
        throw new Error('You must select an image to upload.')
      }
      const file = event.currentTarget.files[0]
      uploading = true
      const { url, path } = await uploadFile({
        file,
        bucket: 'assets',
        path: `/element-assets/images`,
      })

      $imageStore = url || ''

      // const optimizedUrl = urlBuilder(url || '', options)
      // const optimizedUrl2 = urlBuilder(url || '', {
      //   rs: {
      //     s: '480x320',
      //     m: 'scale',
      //   },
      // })
      // const optimizedUrl3 = urlBuilder(url || '', {
      //   rs: {
      //     s: '200x200',
      //     m: 'scale',
      //   },
      // })

      // const _ = await Promise.all([
      //   loadImage(optimizedUrl),
      //   loadImage(optimizedUrl2),
      //   loadImage(optimizedUrl3),
      // ])

      // images.update((img) => [...img, { path, url: url || '' }])
    } catch (error) {
      alert(error.message)
    } finally {
      uploading = false
    }
  }

  let inputRef: HTMLInputElement

  let hrefDialog = false
  let href = ''
</script>

<svelte:window bind:innerWidth={screenWidth} />

{#if hrefDialog}
  <div
    class="flex h-full w-full top-0 z-99 fixed items-center justify-center backdrop-filter backdrop-blur-md"
    transition:fade={{ duration: 300, easing: expoOut }}
    use:portal
  >
    <div
      class="bg-black h-full w-full opacity-70 absolute"
      on:click={() => {
        hrefDialog = false
        href = $hrefStore || ''
      }}
    />
    <form
      class="bg-white rounded-xl flex flex-col space-y-4 shadow max-h-9/10 p-4 relative lg:max-w-4/10 dark:bg-dark-900"
      style="will-change: transform"
      on:submit|preventDefault|stopPropagation={saveHref}
      transition:fly={{ y: 10, duration: 400, easing: expoOut }}
    >
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-xl text-black leading-thight dark:text-white">
          Element URL
        </h4>
        <button
          type="button"
          on:click={() => {
            hrefDialog = false
            href = $hrefStore || ''
          }}><Close24 /></button
        >
      </div>
      <div class="flex space-x-4 items-center">
        <Link32 class="h-48px text-blue-500 w-48px" />
        <div class="flex flex-col space-y-2">
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline disabled:bg-gray-200 disabled:text-gray-500 disabled:dark:bg-dark-900"
            type="text"
            pattern="(https?|http?|/).*?"
            autocomplete="nooooope"
            bind:value={href}
            aria-autocomplete="none"
            placeholder="Ex. /contact"
            required
          />
        </div>
      </div>
      <div class="flex space-x-2 items-center justify-end">
        <button
          type="button"
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          on:click={() => {
            hrefDialog = false
            href = $hrefStore || ''
          }}>Cancel</button
        >
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          >Save</button
        >
      </div>
    </form>
  </div>
{/if}

{#if readOnly}
  <slot
    text={$textStore || ''}
    href={$hrefStore || ''}
    image={$imageStore || ''}
  />
{:else}
  <input
    type="file"
    name=""
    class="h-0 opacity-0 top-0 w-0 hidden absolute"
    accept="image/*"
    bind:this={inputRef}
    on:change={(e) => uploadImage(e)}
  />
  <div class="relative wrapper" use:clickOutside>
    <div
      class="flex space-x-2 -top-5 -right-5 z-99 absolute items-center"
      class:!top-5={innerButtons || outScreen}
      class:!right-5={innerButtons || outScreen}
      bind:this={buttonsRef}
    >
      {#if !editable}
        {#if keys.text}
          <button
            type="button"
            on:click={() => (editable = true)}
            class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
            title="Edit content"
            use:tooltip><Edit16 /></button
          >
        {/if}
        {#if keys.href}
          <button
            type="button"
            on:click={() => {
              href = $hrefStore || ''
              hrefDialog = true
            }}
            class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
            title="Change url"
            use:tooltip><Link16 /></button
          >
        {/if}
        {#if keys.image}
          {#if uploading}
            <button
              type="button"
              class="rounded-full cursor-wait bg-dark-900 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) "
              title="Uploading image"
              use:tooltip
            >
              <div class="lds-ring">
                <div />
                <div />
                <div />
                <div />
              </div></button
            >
          {:else}
            <button
              type="button"
              on:click={() => inputRef?.click()}
              class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
              title="Change image"
              use:tooltip><Image16 /></button
            >
          {/if}
        {/if}
      {:else}
        <button
          type="button"
          on:click={cancelText}
          class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
          title="Cancel"
          use:tooltip><Close16 /></button
        >
        <button
          type="button"
          on:click={saveText}
          class="rounded-full bg-dark-900 opacity-50 p-2 transform text-gray-100 duration-200 dark:(text-gray-900 bg-gray-100) hover:opacity-100 hover:scale-105 "
          title="Save"
          use:tooltip><Checkmark16 /></button
        >
      {/if}
    </div>
    <slot
      text={$textStore}
      href={$hrefStore}
      image={$imageStore}
      {contenteditable}
      {editable}
    />
  </div>
{/if}

<style>
  .wrapper :global(*[contenteditable='true']:focus) {
    outline: 0px solid transparent;
  }

  .lds-ring {
    display: flex;
    position: relative;
    width: 16px;
    height: 16px;
    overflow: hidden;
  }
  .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 16px;
    height: 16px;
    margin: 0px;
    border: 2px solid currentColor;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: currentColor transparent transparent transparent;
  }
  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }
  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
