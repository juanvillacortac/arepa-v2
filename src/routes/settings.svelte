<script lang="ts">
  import 'bytemd/dist/index.css'
  import { goto } from '$app/navigation'

  import { pageSubtitle, redisWritable } from '$lib'
  import type { CaravaggioOptions } from '$lib/components/caravaggio/urlBuilder'
  import { useCaravaggioBuilder } from '$lib/components/caravaggio/useCaravaggio'
  import { Editor } from 'bytemd'

  const contactEmailTemplate = redisWritable(
    `**You've got a new message from {{name}}, their email is [{{email}}](mailto:{{email}}) and their phone number is [{{phone}}](tel:{{phone}})**

### Message:

{{message}}`,
    `contactEmailTemplate`
  )

  const emailContact = redisWritable(
    'juanvillacortac@gmail.com',
    `contactEmail`
  )

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
            bind:value={$emailContact}
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
  </div>
</div>
