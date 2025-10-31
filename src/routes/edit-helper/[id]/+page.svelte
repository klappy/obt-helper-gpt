<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { currentUser, getAuthToken } from "$lib/stores/user-auth.js";
  import { goto } from "$app/navigation";

  let user = null;
  let helper = null;
  let loading = true;
  let saving = false;
  let error = "";
  let success = false;

  $: helperId = $page.params.id;
  const API_BASE = "/.netlify/functions";

  let editedHelper = {
    name: "",
    description: "",
    icon: "",
    image: "",
    systemPrompt: "",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2000,
  };

  onMount(async () => {
    const unsubscribe = currentUser.subscribe((value) => {
      user = value;
      if (!value) {
        goto("/login");
      } else {
        loadHelper();
      }
    });

    return unsubscribe;
  });

  async function loadHelper() {
    if (!user || !helperId) return;

    loading = true;
    error = "";

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}&helperId=${helperId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load helper");
      }

      helper = data.helper;
      editedHelper = {
        name: helper.name || "",
        description: helper.description || "",
        icon: helper.icon || "??",
        image: helper.image || "",
        systemPrompt: helper.systemPrompt || "",
        model: helper.model || "gpt-4o-mini",
        temperature: helper.temperature || 0.7,
        maxTokens: helper.maxTokens || 2000,
      };
    } catch (err) {
      error = err.message || "Failed to load helper";
    } finally {
      loading = false;
    }
  }

  async function saveHelper() {
    if (!user || !helperId) return;

    saving = true;
    error = "";
    success = false;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}&helperId=${helperId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedHelper),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save helper");
      }

      helper = data.helper;
      success = true;
      setTimeout(() => {
        success = false;
      }, 3000);
    } catch (err) {
      error = err.message || "Failed to save helper";
    } finally {
      saving = false;
    }
  }

  async function deleteHelper() {
    if (!confirm("Are you sure you want to delete this helper? This cannot be undone.")) {
      return;
    }

    if (!user || !helperId) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}&helperId=${helperId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete helper");
      }

      goto("/dashboard");
    } catch (err) {
      error = err.message || "Failed to delete helper";
    }
  }

  async function publishHelper() {
    if (!user || !helperId) return;

    saving = true;
    error = "";

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE}/user-helpers?userId=${user.id}&helperId=${helperId}&action=publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish helper");
      }

      helper = data.helper;
      success = true;
    } catch (err) {
      error = err.message || "Failed to publish helper";
    } finally {
      saving = false;
    }
  }

  async function unpublishHelper() {
    if (!user || !helperId) return;

    saving = true;
    error = "";

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE}/user-helpers?userId=${user.id}&helperId=${helperId}&action=unpublish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unpublish helper");
      }

      helper = data.helper;
      success = true;
    } catch (err) {
      error = err.message || "Failed to unpublish helper";
    } finally {
      saving = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Header -->
      <div class="border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">Edit Helper</h1>
          <button
            on:click={() => goto("/dashboard")}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {#if loading}
        <div class="p-12 text-center">
          <p class="text-gray-500">Loading helper...</p>
        </div>
      {:else if helper}
        <div class="p-6 space-y-6">
          {#if error}
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          {/if}

          {#if success}
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Helper saved successfully!
            </div>
          {/if}

          <!-- Status Badge -->
          <div class="flex items-center gap-4">
            {#if helper.published}
              <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Published
              </span>
              <span class="text-sm text-gray-600">
                Share link: <code class="bg-gray-100 px-2 py-1 rounded">/chat/public/{helper.shareId}</code>
              </span>
            {:else}
              <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                Draft
              </span>
            {/if}
          </div>

          <!-- Form -->
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                bind:value={editedHelper.name}
                placeholder="Helper name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                bind:value={editedHelper.description}
                placeholder="What does this helper do?"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <input
                type="text"
                bind:value={editedHelper.icon}
                placeholder="??"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
              <textarea
                bind:value={editedHelper.systemPrompt}
                placeholder="The system prompt that defines how the helper behaves..."
                rows="10"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">
                This is the most important part. It defines how your helper behaves and responds.
              </p>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  bind:value={editedHelper.model}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                <input
                  type="number"
                  bind:value={editedHelper.temperature}
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
                <input
                  type="number"
                  bind:value={editedHelper.maxTokens}
                  min="100"
                  max="4000"
                  step="100"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              on:click={deleteHelper}
              class="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Delete Helper
            </button>

            <div class="flex gap-3">
              {#if helper.published}
                <button
                  on:click={unpublishHelper}
                  disabled={saving}
                  class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  {saving ? "Unpublishing..." : "Unpublish"}
                </button>
              {:else}
                <button
                  on:click={publishHelper}
                  disabled={saving}
                  class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Publishing..." : "Publish"}
                </button>
              {/if}

              <button
                on:click={saveHelper}
                disabled={saving}
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <a
                href="/chat/{helper.id}"
                class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Test Helper
              </a>
            </div>
          </div>
        </div>
      {:else}
        <div class="p-12 text-center">
          <p class="text-gray-500">Helper not found</p>
        </div>
      {/if}
    </div>
  </div>
</div>
