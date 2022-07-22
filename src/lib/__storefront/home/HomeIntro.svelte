<script lang="ts">
  import { page } from '$app/stores'
  import { tooltip } from '$lib/components/tooltip'
  import type { StripedProduct } from '$lib/db'

  import {
    Categories16,
    Category16,
    Favorite24,
    ShoppingBag24,
  } from 'carbon-icons-svelte'

  export let products: StripedProduct[]
</script>
