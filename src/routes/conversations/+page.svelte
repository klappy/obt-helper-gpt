<script>
  import { onMount } from "svelte";
  import { currentUser, getAuthToken, logout } from "$lib/stores/user-auth.js";
  import { goto } from "$app/navigation";

  let user = null;
  let conversations = [];
  let selectedConversation = null;
  let loading = true;
  let error = "";
  let searchQuery = "";

  const API_BASE = "/.netlify/functions";

  // Load conversations
  onMount(async () => {
    const unsubscribe = currentUser.subscribe((value) => {
      user = value;
      if (!value) {
        goto("/login");
      } else {
        loadConversations();
      }
    });

    return unsubscribe;
  });

  async function loadConversations() {
    if (!user) return;

    loading = true;
    error = "";

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/conversations?userId=${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations");
      }

      conversations = data.conversations || [];
    } catch (err) {
      error = err.message || "Failed to load conversations";
    } finally {
      loading = false;
    }
  }

  function handleSelectConversation(conversation) {
    selectedConversation = conversation;
  }

  function handleNewConversation() {
    selectedConversation = null;
    goto("/dashboard");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  // Filter conversations by search query
  $: filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.messages?.some((msg) => msg.content?.toLowerCase().includes(query))
    );
  });

  // Group conversations by date
  $: groupedConversations = (() => {
    const groups = {};
    filteredConversations.forEach((conv) => {
      const date = new Date(conv.updatedAt || conv.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const convDate = new Date(date);
      convDate.setHours(0, 0, 0, 0);

      let groupKey;
      if (convDate.getTime() === today.getTime()) {
        groupKey = "Today";
      } else if (convDate.getTime() === today.getTime() - 86400000) {
        groupKey = "Yesterday";
      } else if (today.getTime() - convDate.getTime() < 604800000) {
        groupKey = "This Week";
      } else {
        groupKey = "Older";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conv);
    });

    return groups;
  })();
</script>

<div class="flex h-screen bg-gray-50">
  <!-- Sidebar -->
  <aside class="w-80 bg-white border-r border-gray-200 flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <button
        on:click={handleNewConversation}
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm mb-4"
      >
        + New Conversation
      </button>

      <!-- Search -->
      <div class="relative">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search conversations..."
          class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <svg
          class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto">
      {#if loading}
        <div class="p-4 text-center text-gray-500">Loading conversations...</div>
      {:else if filteredConversations.length === 0}
        <div class="p-4 text-center text-gray-500">
          {searchQuery ? "No conversations found" : "No conversations yet"}
        </div>
      {:else}
        {#each Object.keys(groupedConversations) as groupKey}
          <div class="px-4 py-2">
            <h3 class="text-xs font-semibold text-gray-500 uppercase mb-2">{groupKey}</h3>
            <div class="space-y-1">
              {#each groupedConversations[groupKey] as conversation}
                <button
                  on:click={() => handleSelectConversation(conversation)}
                  class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors {selectedConversation?.id ===
                  conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : ''}"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {conversation.title || "New Conversation"}
                      </p>
                      <p class="text-xs text-gray-500 mt-0.5">
                        {formatDate(conversation.updatedAt || conversation.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">{user?.email}</span>
        <button
          on:click={() => logout() || goto("/login")}
          class="text-sm text-gray-600 hover:text-gray-900"
        >
          Logout
        </button>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col">
    {#if selectedConversation}
      <!-- Conversation View -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-3xl mx-auto space-y-4">
          <h1 class="text-2xl font-bold text-gray-900 mb-6">
            {selectedConversation.title || "Conversation"}
          </h1>

          {#each selectedConversation.messages || [] as message}
            <div
              class="flex gap-4 {message.role === 'user' ? 'justify-end' : 'justify-start'}"
            >
              {#if message.role === "assistant"}
                <div class="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  AI
                </div>
              {/if}
              <div
                class="max-w-2xl px-4 py-3 rounded-lg {message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'}"
              >
                <p class="whitespace-pre-wrap">{message.content}</p>
                {#if message.timestamp}
                  <p
                    class="text-xs mt-2 {message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}"
                  >
                    {formatDate(message.timestamp)}
                  </p>
                {/if}
              </div>
              {#if message.role === "user"}
                <div class="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                  U
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="text-6xl mb-4">??</div>
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">No conversation selected</h2>
          <p class="text-gray-500 mb-6">Select a conversation from the sidebar to view messages</p>
          <button
            on:click={handleNewConversation}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Start New Conversation
          </button>
        </div>
      </div>
    {/if}
  </main>
</div>
