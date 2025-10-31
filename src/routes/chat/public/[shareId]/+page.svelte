<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import ChatInterface from "$lib/components/ChatInterface.svelte";

  $: shareId = $page.params.shareId;
  let helper = null;
  let loading = true;
  let error = "";

  const API_BASE = "/.netlify/functions";

  onMount(async () => {
    await loadPublishedHelper();
  });

  async function loadPublishedHelper() {
    if (!shareId) {
      error = "Share ID is required";
      loading = false;
      return;
    }

    loading = true;
    error = "";

    try {
      const response = await fetch(`${API_BASE}/public-helpers?shareId=${shareId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load helper");
      }

      helper = data.helper;

      // Convert helper to tool format for ChatInterface
      helper = {
        ...helper,
        id: helper.shareId, // Use shareId as id for public access
      };
    } catch (err) {
      error = err.message || "Failed to load helper";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>
    {helper ? `${helper.name} - Public Helper` : "Loading..."} - OBT Helper
  </title>
</svelte:head>

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <p class="text-gray-500">Loading helper...</p>
    </div>
  </div>
{:else if error}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Helper Not Found</h1>
      <p class="text-gray-600 mb-6">{error}</p>
      <button
        on:click={() => goto("/gallery")}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Browse Gallery
      </button>
    </div>
  </div>
{:else if helper}
  <div class="h-screen flex flex-col">
    <!-- Back button -->
    <div class="bg-white border-b px-4 py-2">
      <button
        on:click={() => goto("/gallery")}
        class="text-gray-600 hover:text-gray-900 flex items-center space-x-2 text-sm"
      >
        <span>?</span>
        <span>Back to Gallery</span>
      </button>
    </div>

    <!-- Chat Interface -->
    <div class="flex-1">
      <ChatInterface tool={helper} />
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <p class="text-gray-500">Helper not found</p>
    </div>
  </div>
{/if}
