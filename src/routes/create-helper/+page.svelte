<script>
  import { onMount } from "svelte";
  import { currentUser, getAuthToken } from "$lib/stores/user-auth.js";
  import { goto } from "$app/navigation";

  let user = null;
  let helperConfig = {
    name: "",
    description: "",
    icon: "??",
    image: "",
    systemPrompt: "",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2000,
  };

  // Chat with Helper Assistant
  let assistantMessages = [];
  let currentMessage = "";
  let isLoading = false;
  let helperCreated = false;
  let createdHelperId = null;

  const API_BASE = "/.netlify/functions";

  // Helper Assistant system prompt
  const helperAssistantPrompt = `You are a Helper Assistant that guides users through creating their own AI helper (GPT-like assistant). Your goal is to ask questions and gather information to help create a well-defined helper.

Ask questions about:
1. What problem does the helper solve?
2. Who is the target audience?
3. What should the helper be called?
4. What tone/style should it use?
5. What specific tasks should it handle?

Be conversational, friendly, and guide the user step-by-step. Update the helper configuration as you learn more.`;

  onMount(() => {
    const unsubscribe = currentUser.subscribe((value) => {
      user = value;
      if (!value) {
        goto("/login");
      } else {
        // Start conversation with Helper Assistant
        startConversation();
      }
    });

    return unsubscribe;
  });

  async function startConversation() {
    // Welcome message from Helper Assistant
    assistantMessages = [
      {
        role: "assistant",
        content:
          "Hi! I'm your Helper Assistant. I'll guide you through creating your own AI helper. Let's start! What problem are you trying to solve with your helper?",
      },
    ];
  }

  async function sendMessage() {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    currentMessage = "";

    // Add user message
    assistantMessages.push({
      role: "user",
      content: userMessage,
    });

    isLoading = true;

    try {
      // Send to chat endpoint with Helper Assistant system prompt
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: helperAssistantPrompt },
            ...assistantMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          tool: {
            id: "helper-assistant",
            name: "Helper Assistant",
            systemPrompt: helperAssistantPrompt,
            model: "gpt-4o-mini",
            temperature: 0.7,
            maxTokens: 2000,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantResponse = data.choices[0].message.content;

      // Add assistant response
      assistantMessages.push({
        role: "assistant",
        content: assistantResponse,
      });

      // Try to extract helper configuration from conversation
      extractHelperConfig(assistantResponse, userMessage);

      // Check if assistant suggests creating the helper
      if (
        assistantResponse.toLowerCase().includes("create") ||
        assistantResponse.toLowerCase().includes("ready") ||
        assistantResponse.toLowerCase().includes("publish")
      ) {
        // Offer to create helper
        if (helperConfig.name && helperConfig.systemPrompt) {
          await createHelper();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      assistantMessages.push({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      isLoading = false;
    }
  }

  function extractHelperConfig(assistantResponse, userMessage) {
    // Try to extract name
    const nameMatch = assistantResponse.match(/(?:name|called|calling it)\s*['"]?([^'"]+)['"]?/i);
    if (nameMatch && !helperConfig.name) {
      helperConfig.name = nameMatch[1].trim();
    }

    // Try to extract description from context
    if (!helperConfig.description && userMessage.length > 10) {
      helperConfig.description = userMessage.substring(0, 150);
    }

    // If assistant mentions creating a system prompt
    if (assistantResponse.includes("system prompt") || assistantResponse.includes("prompt:")) {
      const promptMatch = assistantResponse.match(/prompt[:\s]+['"]?([^'"]{20,})['"]?/i);
      if (promptMatch) {
        helperConfig.systemPrompt = promptMatch[1].trim();
      }
    }
  }

  async function createHelper() {
    if (!helperConfig.name || !helperConfig.systemPrompt) {
      alert("Please provide a name and system prompt for your helper.");
      return;
    }

    isLoading = true;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(helperConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create helper");
      }

      helperCreated = true;
      createdHelperId = data.helper.id;

      assistantMessages.push({
        role: "assistant",
        content: `Great! I've created your helper "${helperConfig.name}". You can now test it or continue refining the settings.`,
      });
    } catch (error) {
      console.error("Error creating helper:", error);
      alert("Failed to create helper. Please try again.");
    } finally {
      isLoading = false;
    }
  }

  async function testHelper() {
    if (createdHelperId) {
      goto(`/chat/${createdHelperId}`);
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex h-screen bg-gray-50">
  <!-- Left Panel: Helper Assistant Chat -->
  <div class="w-1/2 border-r border-gray-200 flex flex-col">
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <h2 class="text-xl font-semibold text-gray-900">Helper Assistant</h2>
      <p class="text-sm text-gray-500 mt-1">I'll help you create your helper step-by-step</p>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      {#each assistantMessages as message}
        <div
          class="flex gap-3 {message.role === 'user' ? 'justify-end' : 'justify-start'}"
        >
          {#if message.role === "assistant"}
            <div
              class="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold"
            >
              AI
            </div>
          {/if}
          <div
            class="max-w-2xl px-4 py-3 rounded-lg {message.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'}"
          >
            <p class="whitespace-pre-wrap">{message.content}</p>
          </div>
          {#if message.role === "user"}
            <div
              class="flex-shrink-0 w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold"
            >
              U
            </div>
          {/if}
        </div>
      {/each}

      {#if isLoading}
        <div class="flex gap-3">
          <div
            class="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold"
          >
            AI
          </div>
          <div class="bg-gray-100 rounded-lg px-4 py-3">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span
                class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 0.1s"
              ></span>
              <span
                class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 0.2s"
              ></span>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input -->
    <div class="bg-white border-t border-gray-200 p-4">
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={currentMessage}
          on:keypress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          on:click={sendMessage}
          disabled={isLoading || !currentMessage.trim()}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  </div>

  <!-- Right Panel: Helper Configuration -->
  <div class="w-1/2 flex flex-col">
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <h2 class="text-xl font-semibold text-gray-900">Helper Configuration</h2>
      <p class="text-sm text-gray-500 mt-1">This updates as we chat</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          bind:value={helperConfig.name}
          placeholder="Helper name"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          bind:value={helperConfig.description}
          placeholder="What does this helper do?"
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
        <input
          type="text"
          bind:value={helperConfig.icon}
          placeholder="??"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
        <textarea
          bind:value={helperConfig.systemPrompt}
          placeholder="The system prompt that defines how the helper behaves..."
          rows="8"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <select
            bind:value={helperConfig.model}
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
            bind:value={helperConfig.temperature}
            min="0"
            max="2"
            step="0.1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {#if helperCreated}
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-800 font-medium mb-3">Helper Created Successfully!</p>
          <div class="flex gap-2">
            <button
              on:click={testHelper}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Helper
            </button>
            <button
              on:click={() => goto(`/edit-helper/${createdHelperId}`)}
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Edit Helper
            </button>
            <button
              on:click={() => goto("/dashboard")}
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      {:else if helperConfig.name && helperConfig.systemPrompt}
        <button
          on:click={createHelper}
          disabled={isLoading}
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Create Helper
        </button>
      {/if}
    </div>
  </div>
</div>
