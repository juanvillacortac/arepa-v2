<script lang="ts">
  import 'bytemd/dist/index.css'
  import { goto } from '$app/navigation'

  import { pageSubtitle, redisWritable } from '$lib'
  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'
  import StripeLogo from '$lib/components/__StripeLogo.svelte'
  import PaypalLogo from '$lib/components/__PaypalLogo.svelte'
  import { Editor } from 'bytemd'

  const contactEmailTemplate = redisWritable(
    `**You've got a new message from {{name}}, their email is [{{email}}](mailto:{{email}}) and their phone number is [{{phone}}](tel:{{phone}})**

### Message:

{{message}}`,
    `contactEmailTemplate`
  )

  const faqContent = redisWritable('', `storeFaq`)

  const options: CaravaggioOptions = {
    progressive: true,
    o: 'png',
    rs: {
      s: '480x480',
      m: 'embed',
      b: '000000.0',
    },
  }

  let saving = false

  const submitContact = async () => {
    saving = true
    try {
      goto(`/settings`, {
        noscroll: true,
        replaceState: true,
      })
    } catch (err) {
      console.log(err.message, err.error)
    } finally {
      saving = false
    }
  }

  const loadImage = (url: string) =>
    new Promise((resolve) => {
      const image = new window.Image()
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.src = url
    })

  const urlBuilder = useCaravaggioBuilder()

  $pageSubtitle = 'Store settings'
</script>

<div class="flex flex-col mx-auto max-w-prose space-y-4">
  <h3 class="font-bold font-title text-black mb-4 text-2xl dark:text-white">
    Store settings
  </h3>
  <div
    class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-dark-800 dark:border-dark-400"
  >
    <div class="flex w-full justify-between items-">
      <h5 class="font-bold font-title text-sm">Contact information</h5>
      <button
        class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 <lg:w-full disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
        on:click={submitContact}
        disabled={saving}>{saving ? 'Saving...' : 'Save'}</button
      >
    </div>
    <div
      class="flex w-full items-center sm:space-x-2 <sm:flex-col <sm:space-y-2"
    >
      <div class="flex flex-col w-full">
        <label class="flex flex-col font-bold space-y-2 text-xs">
          <span>Email for contact</span>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
            type="email"
            placeholder="Ex. contact@gmail.com"
          />
        </label>
      </div>
      <div class="flex flex-col w-full">
        <label class="flex flex-col font-bold space-y-2 text-xs">
          <span>Phone number</span>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
            type="tel"
            placeholder="Ex. +1 23456789"
          />
        </label>
      </div>
    </div>
    <div class="flex flex-col w-full">
      <div class="flex flex-col space-y-2 text-xs w-full">
        <span class="font-bold text-xs"> Contact form email template </span>
        <Editor
          value={$contactEmailTemplate}
          on:change={(e) => ($contactEmailTemplate = e.detail.value)}
        />
      </div>
    </div>
    <div class="flex flex-col w-full">
      <div class="flex flex-col space-y-2 text-xs w-full">
        <span class="font-bold text-xs"> FAQ content </span>
        <Editor
          value={$faqContent}
          on:change={(e) => ($faqContent = e.detail.value)}
        />
      </div>
    </div>
  </div>

  <div
    class="bg-white border rounded-lg flex flex-col h-full space-y-4 border-gray-300 w-full p-4 relative overflow-hidden dark:bg-dark-800 dark:border-dark-400"
  >
    <h5 class="font-bold font-title text-sm">Payment gateways</h5>
    <div
      class="border rounded-lg flex flex-col space-y-2 border-gray-300 w-full p-4 items-start dark:border-dark-400"
    >
      <div class="flex w-full justify-between">
        <StripeLogo class="h-6 w-auto" />
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          disabled={saving}>{saving ? 'Applying...' : 'Apply'}</button
        >
      </div>
      <div class="w-full grid gap-2 grid-cols-2">
        <div class="flex flex-col w-full">
          <div class="font-bold text-xs mb-2 block">Public key</div>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
            type="text"
            style="text-security:disc; -webkit-text-security:disc;"
            required
          />
        </div>
        <div class="flex flex-col w-full">
          <div class="font-bold text-xs mb-2 block">Secret key</div>
          <input
            class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
            type="text"
            style="text-security:disc; -webkit-text-security:disc;"
            required
          />
        </div>
      </div>
    </div>
    <div
      class="border rounded-lg flex flex-col space-y-2 border-gray-300 w-full p-4 items-start dark:border-dark-400"
    >
      <div class="flex w-full justify-between">
        <PaypalLogo class="h-6 w-auto" />
        <button
          class="rounded font-bold ml-auto border-2 border-blue-500 text-xs py-1 px-2 text-blue-500 duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:hover:bg-blue-500 not-disabled:hover:text-white"
          disabled={saving}>{saving ? 'Applying...' : 'Apply'}</button
        >
      </div>
      <div class="flex flex-col w-full">
        <div class="font-bold text-xs mb-2 block">Client ID</div>
        <input
          class="bg-white border rounded border-gray-300 text-xs leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
          type="text"
          style="text-security:disc; -webkit-text-security:disc;"
          required
        />
      </div>
    </div>
  </div>
</div>
