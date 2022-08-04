<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import Page, { load as storeLoad } from '$lib/__storefront/home/Page.svelte'
  import { pageSubtitle, redisWritable } from '$lib'
  import trpc from '$lib/trpc/client'

  export const load: Load = async () => {
    return {
      props: {
        nodes: await trpc().query('utils:landingNodes'),
      },
    }
  }
</script>

<script>
  export let nodes

  const store = redisWritable(nodes, 'landingNodes-v3')

  $pageSubtitle = 'Landing customization'
</script>

<div class="lg:-mx-6 dark:bg-dark-900">
  <Page nodes={store} editable />
</div>
