<script lang="ts">
  import type { CaravaggioOptions } from './urlBuilder'
  import { useCaravaggioBuilder } from './useCaravaggio'

  export let src: string
  export let href = ''
  export let options: CaravaggioOptions
  export let showOriginal: string = ''

  const imageBuilder = useCaravaggioBuilder()

  $: url =
    src?.endsWith(showOriginal) && showOriginal
      ? src
      : imageBuilder(src, options)
</script>

{#if href}
  <a {href} target="__blank">
    <img src={url} alt={$$props.alt} {...$$restProps} />
  </a>
{:else}
  <img src={url} alt={$$props.alt} {...$$restProps} />
{/if}
