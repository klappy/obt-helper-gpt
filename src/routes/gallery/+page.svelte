<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let helpers = [];
  let loading = true;
  let error = "";
  let searchQuery = "";

  const API_BASE = "/.netlify/functions";

  async function loadPublishedHelpers() {
    loading = true;
    error = "";

    try {
      // This endpoint needs to be created - GET /api/helpers (public)
      // For now, we'll note that this needs to be implemented in the backend
      // In a real scenario, we'd fetch from: ${API_BASE}/helpers
      
      // Placeholder - actual endpoint would be:
      // const response = await fetch(`${API_BASE}/helpers`, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      
      // For now, showing empty state with note
      helpers = [];
      error = "Public gallery endpoint needs to be implemented. This will show all published helpers.";
    } catch (err) {
      error = err.message || "Failed to load published helpers";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadPublishedHelpers();
  });

  // Filter helpers by search query
  $: filteredHelpers = helpers.filter((helper) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      helper.name?.toLowerCase().includes(query) ||
      helper.description?.toLowerCase().includes(query)
    );
  });

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Public Gallery</h1>
          <p class="text-gray-500 mt-1">Browse published helpers created by the community</p>
        </div>
        <a
          href="/dashboard"
          class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          My Dashboard
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search helpers..."
          class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          class="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>

    {#if error && !loading}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <p class="text-yellow-800">{error}</p>
        <p class="text-sm text-yellow-600 mt-2">
          Note: The public gallery endpoint (`GET /api/helpers`) needs to be implemented in the
          backend to list all published helpers.
        </p>
      </div>
    {/if}

    {#if loading}
      <div class="text-center py-12">
        <p class="text-gray-500">Loading published helpers...</p>
      </div>
    {:else if filteredHelpers.length === 0}
      <div class="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="text-6xl mb-4">??</div>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">
          {searchQuery ? "No helpers found" : "No published helpers yet"}
        </h2>
        <p class="text-gray-500 mb-6">
          {searchQuery
            ? "Try adjusting your search query"
            : "Be the first to publish a helper!"}
        </p>
        {#if !searchQuery}
          <a
            href="/login"
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Your Helper
          </a>
        {/if}
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredHelpers as helper}
          <div
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            on:click={() => goto(`/chat/public/${helper.shareId}`)}
          >
            <div class="flex items-start justify-between mb-4">
              <div class="text-4xl">{helper.icon || "??"}</div>
              <span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                Published
              </span>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{helper.name}</h3>
            <p class="text-sm text-gray-500 mb-4 line-clamp-3">
              {helper.description || "No description"}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>Published {helper.publishedAt ? formatDate(helper.publishedAt) : ""}</span>
              <span class="px-2 py-1 bg-gray-100 rounded">{helper.model || "gpt-4o-mini"}</span>
            </div>
            <button
              class="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              on:click|stopPropagation={() => goto(`/chat/public/${helper.shareId}`)}
            >
              Try Helper
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
