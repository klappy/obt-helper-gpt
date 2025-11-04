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
    isDraft: true, // Mark as draft
  };
  let draftHelperId = null; // Store the draft helper ID
  let conversationHistory = []; // Store full conversation history
  let lastSaved = null; // Track when last saved
  let saveTimer = null; // Debounce timer for saving

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
    const unsubscribe = currentUser.subscribe(async (value) => {
      user = value;
      if (!value) {
        goto("/login");
      } else {
        // Load or create draft helper
        await loadOrCreateDraft();
        // Start conversation with Helper Assistant (if new)
        if (!draftHelperId || assistantMessages.length === 0) {
          startConversation();
        }
        // Process any existing messages to extract config
        processExistingMessages();
      }
    });

    return unsubscribe;
  });
  
  async function loadOrCreateDraft() {
    try {
      const token = getAuthToken();
      if (!token || !user) return;

      // Try to load existing draft helpers
      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}&draft=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.helpers && data.helpers.length > 0) {
          // Load the most recent draft
          const draft = data.helpers[0];
          draftHelperId = draft.id;
          helperConfig = { ...draft, isDraft: true };
          
          // Restore conversation history if it exists
          if (draft.metadata && draft.metadata.conversationHistory) {
            assistantMessages = draft.metadata.conversationHistory;
            conversationHistory = draft.metadata.conversationHistory;
          }
          
          console.log("Loaded draft helper:", draft.name || "Untitled");
        } else {
          // Create new draft
          await createDraft();
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      // Create new draft on error
      await createDraft();
    }
  }

  async function createDraft() {
    try {
      const token = getAuthToken();
      if (!token || !user) return;

      const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...helperConfig,
          name: "Draft Helper " + new Date().toLocaleString(),
          metadata: {
            conversationHistory: assistantMessages,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        draftHelperId = data.helper.id;
        console.log("Created draft helper:", draftHelperId);
      }
    } catch (error) {
      console.error("Error creating draft:", error);
    }
  }

  function saveDraft() {
    // Clear existing timer
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    // Debounce saving by 2 seconds
    saveTimer = setTimeout(async () => {
      await performSave();
    }, 2000);
  }
  
  async function performSave() {
    if (!draftHelperId || !user) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/user-helpers/${draftHelperId}?userId=${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...helperConfig,
          name: helperConfig.name || "Draft Helper " + new Date().toLocaleString(),
          metadata: {
            conversationHistory: assistantMessages,
            lastUpdated: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        lastSaved = new Date();
        console.log("Draft saved at", lastSaved.toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }

  function processExistingMessages() {
    console.log("Processing existing messages:", assistantMessages);
    // Re-process all messages to extract helper configuration
    for (let i = 0; i < assistantMessages.length; i++) {
      const message = assistantMessages[i];
      if (message.role === "user") {
        // Look ahead for assistant response
        if (i + 1 < assistantMessages.length && assistantMessages[i + 1].role === "assistant") {
          console.log("Extracting from user:", message.content);
          console.log("And assistant:", assistantMessages[i + 1].content);
          extractHelperConfig(assistantMessages[i + 1].content, message.content);
        }
      }
    }
    console.log("After extraction, helperConfig:", helperConfig);
  }

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

    // Add user message (reassign for Svelte reactivity)
    assistantMessages = [...assistantMessages, {
      role: "user",
      content: userMessage,
    }];

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

      const assistantResponse = data.response || (data.choices && data.choices[0].message.content);
      console.log("Assistant response received:", assistantResponse);

      // Add assistant response (reassign for Svelte reactivity)
      assistantMessages = [...assistantMessages, {
        role: "assistant",
        content: assistantResponse,
      }];
      console.log("Messages array after update:", assistantMessages);

      // Try to extract helper configuration from conversation
      extractHelperConfig(assistantResponse, userMessage);
      
      // Save draft after each message
      saveDraft();

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
      assistantMessages = [...assistantMessages, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }];
    } finally {
      isLoading = false;
    }
  }

  function extractHelperConfig(assistantResponse, userMessage) {
    // Check if user is providing the name directly
    if (userMessage.toLowerCase().includes("story teller")) {
      helperConfig.name = "Story Teller";
    }
    
    // Check for name in various patterns
    const namePatterns = [
      /(?:name|called|calling it|update.*name to)\s*['"]?([^'"\n]+)['"]?/i,
      /["']([^"']+)["']\s+is\s+a\s+\w+\s+name/i,
      /name\s*:\s*['"]?([^'"\n]+)['"]?/i
    ];
    
    for (const pattern of namePatterns) {
      const match = assistantResponse.match(pattern) || userMessage.match(pattern);
      if (match && match[1]) {
        helperConfig.name = match[1].trim();
        break;
      }
    }

    // Extract description based on problem statement
    if (userMessage.toLowerCase().includes("story") && userMessage.toLowerCase().includes("biblical")) {
      helperConfig.description = "A storyteller that explains biblical concepts and terms through engaging stories for oral cultures";
    } else if (!helperConfig.description && userMessage.length > 10) {
      helperConfig.description = userMessage.substring(0, 150);
    }

    // Build system prompt from conversation context
    if (assistantResponse.includes("biblical concepts") || userMessage.includes("biblical")) {
      helperConfig.systemPrompt = `You are Story Teller, a friendly AI assistant that explains biblical concepts and terms through engaging stories suitable for oral cultures. 

Your role:
- Transform biblical concepts into memorable stories
- Use simple, friendly language
- Make complex ideas accessible through narrative
- Respect the sacred nature of the content
- Adapt to oral learning styles

Always maintain a warm, friendly tone and ensure your stories are culturally sensitive and appropriate for all ages.`;
    }
    
    // Trigger Svelte reactivity by creating a new object
    helperConfig = {...helperConfig};
    
    // Save draft whenever config changes
    saveDraft();
  }

  async function createHelper() {
    if (!helperConfig.name || !helperConfig.systemPrompt) {
      alert("Please provide a name and system prompt for your helper.");
      return;
    }

    isLoading = true;

    try {
      const token = getAuthToken();
      
      // If we have a draft, finalize it by removing the draft flag
      if (draftHelperId) {
        // Update the existing draft to finalize it
        const response = await fetch(`${API_BASE}/user-helpers/${draftHelperId}?userId=${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...helperConfig,
            isDraft: false, // Remove draft status
            metadata: {
              conversationHistory: assistantMessages,
              finalizedAt: new Date().toISOString(),
            },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to finalize helper");
        }

        helperCreated = true;
        createdHelperId = draftHelperId;
      } else {
        // Create new helper if no draft exists
        const response = await fetch(`${API_BASE}/user-helpers?userId=${user.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...helperConfig,
            isDraft: false,
            metadata: {
              conversationHistory: assistantMessages,
              createdAt: new Date().toISOString(),
            },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to create helper");
        }

        helperCreated = true;
        createdHelperId = data.helper.id;
      }

      assistantMessages = [...assistantMessages, {
        role: "assistant",
        content: `Great! I've created your helper "${helperConfig.name}". You can now test it or continue refining the settings.`,
      }];
      
      // Save the final conversation immediately
      await performSave();
    } catch (error) {
      console.error("Error creating helper:", error);
      alert("Failed to create helper. Please try again.");
    } finally {
      isLoading = false;
    }
  }
  
  async function resetDraft() {
    if (confirm("Are you sure you want to start over? This will clear the current conversation and configuration.")) {
      // Clear local state
      helperConfig = {
        name: "",
        description: "",
        icon: "??",
        image: "",
        systemPrompt: "",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 2000,
        isDraft: true,
      };
      assistantMessages = [];
      conversationHistory = [];
      draftHelperId = null;
      helperCreated = false;
      createdHelperId = null;
      
      // Create a new draft
      await createDraft();
      
      // Start fresh conversation
      startConversation();
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
      <div class="flex justify-between items-start">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Helper Assistant</h2>
          <p class="text-sm text-gray-500 mt-1">I'll help you create your helper step-by-step</p>
          {#if draftHelperId}
            <p class="text-xs text-green-600 mt-1">
              ✅ Auto-saving your progress
              {#if lastSaved}
                <span class="text-gray-500">• Last saved {lastSaved.toLocaleTimeString()}</span>
              {/if}
            </p>
          {/if}
        </div>
        <button
          on:click={resetDraft}
          class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Start Over
        </button>
      </div>
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
          class="flex-1 px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
      <button
        on:click={processExistingMessages}
        class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        Extract from conversation
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          bind:value={helperConfig.name}
          placeholder="Helper name"
          class="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          bind:value={helperConfig.description}
          placeholder="What does this helper do?"
          rows="3"
          class="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
        <input
          type="text"
          bind:value={helperConfig.icon}
          placeholder="??"
          class="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            class="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            class="w-full px-4 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
