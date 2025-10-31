<script>
  import { onMount } from "svelte";
  import { currentUser, logout, getAuthToken } from "$lib/stores/user-auth.js";
  import { goto } from "$app/navigation";

  let user = null;
  let helpers = [];
  let loading = true;
  let error = "";

  const API_BASE = "/.netlify/functions";

  // Load user data
  onMount(async () => {
    const unsubscribe = currentUser.subscribe((value) => {
      user = value;
      if (!value) {
        goto("/login");
      }
    });

    if (user) {
      loadHelpers();
    }

    return unsubscribe;
  });

  async function loadHelpers() {
    if (!user) return;

    loading = true;
    error = "";

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load helpers");
      }

      helpers = data.helpers || [];
    } catch (err) {
      error = err.message || "Failed to load helpers";
    } finally {
      loading = false;
    }
  }

  function handleLogout() {
    logout();
    goto("/login");
  }

  function handleCreateHelper() {
    goto("/create-helper");
  }

  function handleViewConversations() {
    goto("/conversations");
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div class="flex items-center gap-4">
          {#if user}
            <span class="text-sm text-gray-600">{user.email}</span>
          {/if}
          <button
            on:click={handleLogout}
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if error}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    {/if}

    <!-- Quick Actions -->
    <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        on:click={handleCreateHelper}
        class="p-6 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
      >
        <div class="text-2xl mb-2">?</div>
        <h3 class="font-semibold text-gray-900">Create Helper</h3>
        <p class="text-sm text-gray-500 mt-1">Create a new AI helper</p>
      </button>

      <a
        href="/conversations"
        class="p-6 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
      >
        <div class="text-2xl mb-2">??</div>
        <h3 class="font-semibold text-gray-900">Conversations</h3>
        <p class="text-sm text-gray-500 mt-1">View conversation history</p>
      </a>

      <a
        href="/"
        class="p-6 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
      >
        <div class="text-2xl mb-2">??</div>
        <h3 class="font-semibold text-gray-900">Public Gallery</h3>
        <p class="text-sm text-gray-500 mt-1">Browse published helpers</p>
      </a>
    </div>

    <!-- My Helpers -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900">My Helpers</h2>
        <button
          on:click={handleCreateHelper}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Create New
        </button>
      </div>

      {#if loading}
        <div class="text-center py-12">
          <p class="text-gray-500">Loading helpers...</p>
        </div>
      {:else if helpers.length === 0}
        <div class="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p class="text-gray-500 mb-4">No helpers yet. Create your first one!</p>
          <button
            on:click={handleCreateHelper}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Helper
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each helpers as helper}
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="text-3xl">{helper.icon || "??"}</div>
                {#if helper.published}
                  <span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Published
                  </span>
                {:else}
                  <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    Draft
                  </span>
                {/if}
              </div>
              <h3 class="font-semibold text-gray-900 mb-2">{helper.name}</h3>
              <p class="text-sm text-gray-500 mb-4 line-clamp-2">
                {helper.description || "No description"}
              </p>
              <div class="flex gap-2">
                <a
                  href="/chat/{helper.id}"
                  class="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  Chat
                </a>
                <a
                  href="/edit-helper/{helper.id}"
                  class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center"
                >
                  Edit
                </a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>
