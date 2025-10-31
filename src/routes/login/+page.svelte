<script>
  import { onMount } from "svelte";
  import { login, isAuthenticated } from "$lib/stores/user-auth.js";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;
  let isAuth = false;

  // Check if already authenticated
  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((value) => {
      isAuth = value;
      if (value) {
        goto("/dashboard");
      }
    });
    return unsubscribe;
  });

  async function handleLogin(e) {
    e.preventDefault();
    error = "";
    loading = true;

    try {
      await login(email, password);
      goto("/dashboard");
    } catch (err) {
      error = err.message || "Login failed. Please check your email and password.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
  <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
    <h1 class="text-3xl font-bold text-center mb-8 text-gray-900">Login</h1>

    {#if error}
      <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    {/if}

    <form on:submit={handleLogin} class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your@email.com"
          disabled={loading}
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="????????"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <a href="/register" class="text-blue-600 hover:text-blue-700 font-medium">
          Register
        </a>
      </p>
    </div>
  </div>
</div>
