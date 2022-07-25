<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import trpc from '$lib/trpc/client'

  export const load: Load = async ({ fetch, session }) => {
    if (session.userId) {
      const user = await trpc(fetch).query('user:whoami')
      if (user) {
        return {
          status: 302,
          redirect: '/',
        }
      } else {
        await trpc(fetch).mutation('user:logout')
      }
    }
    return {}
  }
</script>

<script lang="ts">
  import { page, session } from '$app/stores'
  import { pageSubtitle } from '$lib'
  import { notifications } from '$lib/components/notifications'
  import { onMount } from 'svelte'

  let loading = false
  let isLogin = true
  let emailEl: HTMLInputElement
  let email: string, password: string, rePassword: string

  onMount(() => {
    emailEl.focus()
  })
  async function handleSubmit() {
    loading = true
    if (!isLogin) {
      if (password !== rePassword) {
        notifications.send('Passwords must be the same', 'default', 1000)
        return
      }
    }
    try {
      const data = await trpc().mutation(
        isLogin ? 'user:login' : 'user:register',
        {
          email: email?.toLocaleLowerCase(),
          password,
        }
      )
      notifications.send('Log in successfull', 'default', 1000)
      const callbackUrl = decodeURIComponent(
        $page.url.searchParams.get('callbackUrl') || encodeURIComponent('/')
      )
      window.location.replace(callbackUrl)
    } catch ({ message }) {
      notifications.send(message, 'default', 1000)
      loading = false
    }
  }

  $: $pageSubtitle = isLogin ? 'Log in' : 'Register'
</script>

<div class="flex h-screen text-center w-full p-4 items-center justify-center">
  <div class="flex flex-col items-center">
    <form
      on:submit|preventDefault|stopPropagation={handleSubmit}
      class="flex flex-col space-y-4 transition-opacity duration-400"
    >
      <button
        class="text-blue-500 self-end inline hover:underline"
        on:click={() => (isLogin = !isLogin)}
        type="reset">{isLogin ? 'Register' : 'Log in'}</button
      >
      <input
        class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
        type="email"
        autocomplete="off"
        placeholder="Email address"
        required
        bind:value={email}
        bind:this={emailEl}
      />
      <input
        class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
        type="password"
        autocomplete="off"
        placeholder="Password"
        required
        bind:value={password}
      />
      {#if !isLogin}
        <input
          class="bg-white border rounded border-gray-300 leading-tight w-full py-2 px-3 appearance-none dark:bg-dark-700 dark:border-dark-400 focus:outline-none focus:shadow-outline"
          type="password"
          autocomplete="off"
          placeholder="Repeat the password"
          required
          bind:value={rePassword}
        />
      {/if}
      <button
        class="rounded-lg font-bold border-2 border-blue-500 text-sm py-2 px-2 transform-gpu text-blue-500 duration-200 hover:shadow disabled:cursor-not-allowed disabled:opacity-70 not-disabled:hover:-translate-y-px"
        disabled={loading}
        type="submit"
        >{loading ? 'Loading...' : isLogin ? 'Log in' : 'Register'}</button
      >
    </form>
  </div>
</div>
