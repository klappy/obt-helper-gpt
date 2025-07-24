# Phase 3 Issues – Future-Proofing & Optimizations (Epic 3)

> **PRD Goal**: Prepare for multimodal AI future and ensure vendor-agnostic architecture for long-term sustainability  
> **Major Release**: 4.0.0 | **Minor Releases**: 4.1.x / 4.2.x

## Status Legend

- ☑ Closed
- ☐ Open

---

## Step 3.1 – Multimodal & Offline Stubs (Minor 4.1.0)

**Why This Matters**: PRD requires future-ready architecture for image/audio inputs and offline capability to maintain antifragile operation even during network issues.

### Issue 3.1.1: Add image/audio upload stubs

- **Status**: ☑ Closed
- **Files**: `src/lib/components/ChatInterface.svelte`
- **Dependencies**: None (stubs only)
- **PRD Connection**: "Add image/audio handlers in chat" from Future Enhancements

**Implementation Details**:

```svelte
<!-- Add to ChatInterface.svelte -->
<script>
  let showMediaUpload = false;
  let uploadedFiles = [];

  function handleFileUpload(event) {
    const files = Array.from(event.target.files);

    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFiles = [...uploadedFiles, {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            placeholder: true // Mark as stub
          }];
        };
        reader.readAsDataURL(file);
      }
    });
  }

  async function sendMessageWithMedia() {
    if (uploadedFiles.length > 0) {
      // Stub: Show placeholder response for multimodal
      addMessage({
        role: 'assistant',
        content: `🚧 Multimodal feature coming soon!\n\nI can see you uploaded:\n${uploadedFiles.map(f => `• ${f.name} (${f.type})`).join('\n')}\n\nThis will work with future vision/audio models.`,
        isStub: true
      });

      uploadedFiles = [];
      showMediaUpload = false;
      return;
    }

    // Continue with normal text flow
    await sendMessage();
  }
</script>

<!-- Add media upload button -->
<div class="flex items-center gap-2 p-4 border-t bg-gray-50">
  <button
    on:click={() => showMediaUpload = !showMediaUpload}
    class="btn-secondary text-sm"
    title="Upload image or audio (coming soon)"
  >
    📎 Media
  </button>

  <!-- Regular message input -->
  <input
    type="text"
    bind:value={message}
    placeholder="Type your message..."
    class="flex-1 p-3 border rounded-lg"
    on:keypress={e => e.key === 'Enter' && sendMessageWithMedia()}
  />

  <button
    on:click={sendMessageWithMedia}
    class="btn-primary"
    disabled={!message.trim() && uploadedFiles.length === 0}
  >
    Send
  </button>
</div>

<!-- Media upload panel -->
{#if showMediaUpload}
  <div class="p-4 bg-yellow-50 border-t">
    <h4 class="font-medium mb-2">📎 Upload Media (Preview)</h4>
    <p class="text-sm text-gray-600 mb-3">
      Upload images or audio files. This is a preview - full multimodal support coming in future releases.
    </p>

    <input
      type="file"
      accept="image/*,audio/*"
      multiple
      on:change={handleFileUpload}
      class="mb-3"
    />

    {#if uploadedFiles.length > 0}
      <div class="space-y-2">
        <h5 class="text-sm font-medium">Ready to send:</h5>
        {#each uploadedFiles as file, i}
          <div class="flex items-center justify-between p-2 bg-white rounded border">
            <span class="text-sm">
              {file.type.startsWith('image/') ? '🖼️' : '🎵'} {file.name}
            </span>
            <button
              on:click={() => uploadedFiles = uploadedFiles.filter((_, idx) => idx !== i)}
              class="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
```

**Testing Requirements**:

- Component test: Verify file upload UI renders
- Test file type validation (images/audio only)
- Test stub response generation

**Validation Criteria**:

- [ ] Media upload button visible in chat interface
- [ ] File picker accepts images and audio files only
- [ ] Uploaded files display in preview list
- [ ] Stub response explains future multimodal capability
- [ ] Files can be removed before sending

**Success Definition**: Infrastructure ready for future multimodal integration with clear user feedback about upcoming capabilities

---

### Issue 3.1.2: Register service worker with Workbox

- **Status**: ☑ Closed
- **Files**: `src/app.html`, `static/sw.js`
- **Dependencies**: `npm install workbox-window workbox-webpack-plugin`
- **PRD Connection**: "Service workers for on-device sessions" from Future Enhancements

**Implementation Details**:

```bash
npm install workbox-window workbox-webpack-plugin
```

```html
<!-- Update src/app.html -->
<script>
  // Register service worker for offline support
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("SW registered:", registration);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content available, prompt user to refresh
              if (confirm("New version available! Refresh to update?")) {
                window.location.reload();
              }
            }
          });
        });
      } catch (error) {
        console.log("SW registration failed:", error);
      }
    });
  }
</script>
```

```javascript
// Create static/sw.js
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";

// Clean up old caches
cleanupOutdatedCaches();

// Precache build files
precacheAndRoute(self.__WB_MANIFEST);

// Cache chat sessions for offline access
registerRoute(
  ({ url }) => url.pathname.startsWith("/chat/"),
  new StaleWhileRevalidate({
    cacheName: "chat-pages",
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Cache chat pages but not API calls
          return request.url.includes("/.netlify/functions/") ? null : request.url;
        },
      },
    ],
  })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Basic offline fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ event }) => {
    try {
      const response = await fetch(event.request);
      return response;
    } catch (error) {
      // Return cached page or offline fallback
      const cache = await caches.open("chat-pages");
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Basic offline page
      return new Response(
        `
        <html>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1>🔌 You're Offline</h1>
            <p>Check your connection and try again.</p>
            <button onclick="location.reload()">Retry</button>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  }
);

// Handle chat session persistence offline
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SAVE_CHAT_SESSION") {
    // Store chat session in IndexedDB for offline access
    const { sessionId, messages } = event.data.payload;

    // Open IndexedDB
    const request = indexedDB.open("ChatSessions", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "sessionId" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["sessions"], "readwrite");
      const store = transaction.objectStore("sessions");
      store.put({
        sessionId,
        messages,
        timestamp: Date.now(),
      });
    };
  }
});
```

```javascript
// Add to ChatInterface.svelte
import { onMount } from "svelte";

onMount(() => {
  // Sync chat sessions with service worker
  function saveChatSession() {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SAVE_CHAT_SESSION",
        payload: {
          sessionId: currentSessionId,
          messages: $messages,
        },
      });
    }
  }

  // Save on message changes
  const unsubscribe = messages.subscribe(saveChatSession);

  // Check online status
  let isOnline = navigator.onLine;

  function updateOnlineStatus() {
    isOnline = navigator.onLine;
    if (isOnline) {
      // Sync offline messages when back online
      syncOfflineMessages();
    }
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  return () => {
    unsubscribe();
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  };
});
```

**Testing Requirements**:

- Integration test: Verify service worker registration
- Test offline page caching
- Test IndexedDB session storage

**Validation Criteria**:

- [ ] Service worker registers successfully
- [ ] Chat pages cached for offline access
- [ ] Offline fallback page displays when disconnected
- [ ] Chat sessions persist in IndexedDB
- [ ] Sessions sync when coming back online

**Success Definition**: Basic offline functionality enables continued chat access during network interruptions

---

### Issue 3.1.3: Stub audio handlers in VoiceControls

- **Status**: ☑ Closed
- **Files**: `src/lib/components/VoiceControls.svelte`
- **Dependencies**: Issue 3.1.1 (media upload infrastructure)
- **PRD Connection**: "Web Audio API placeholders" from Multimodal stubs

**Implementation Details**:

```svelte
<!-- Enhance VoiceControls.svelte -->
<script>
  import { onMount } from 'svelte';

  // Existing voice variables...
  let audioPlaybackEnabled = false;
  let voiceSelection = 'default';
  let audioQueue = [];
  let isPlaying = false;

  // Audio output stub functionality
  async function playAudioResponse(text, options = {}) {
    if (!audioPlaybackEnabled) return;

    // Check if Web Audio API available
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.log('🚧 Web Audio API not supported - using fallback TTS');
      playTextToSpeech(text);
      return;
    }

    // Stub: Simulate audio generation
    audioQueue.push({
      text,
      voice: options.voice || voiceSelection,
      timestamp: Date.now(),
      isStub: true
    });

    processAudioQueue();
  }

  async function processAudioQueue() {
    if (isPlaying || audioQueue.length === 0) return;

    isPlaying = true;
    const audioItem = audioQueue.shift();

    if (audioItem.isStub) {
      // Simulate audio playback with visual feedback
      console.log(`🎵 Playing audio: "${audioItem.text}" (${audioItem.voice})`);

      // Show visual indicator
      const indicator = document.createElement('div');
      indicator.innerHTML = `🔊 Playing: ${audioItem.voice} voice`;
      indicator.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #4ade80; color: white;
        padding: 8px 12px; border-radius: 6px;
        z-index: 1000; font-size: 14px;
      `;
      document.body.appendChild(indicator);

      // Simulate playback duration (100ms per character)
      const duration = Math.max(1000, audioItem.text.length * 100);

      setTimeout(() => {
        document.body.removeChild(indicator);
        isPlaying = false;
        processAudioQueue(); // Process next in queue
      }, duration);
    } else {
      // Use existing TTS for now
      playTextToSpeech(audioItem.text);
      isPlaying = false;
    }
  }

  // Audio input stub (for future voice cloning)
  async function processAudioInput(audioBlob) {
    // Stub: Simulate audio-to-text conversion
    const placeholderTranscription = "Audio input received - advanced transcription coming soon";

    // Show processing feedback
    addMessage({
      role: 'user',
      content: `🎙️ [Audio message: ${audioBlob.size} bytes]`,
      audioData: audioBlob,
      isStub: true
    });

    // Simulate processing delay
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `🚧 Audio processing stub activated!\n\nI received your audio input (${Math.round(audioBlob.size / 1024)}KB). In the future, this will:\n\n• Transcribe speech with high accuracy\n• Support multiple languages\n• Handle background noise\n• Enable voice cloning\n\nFor now, please use text or the voice button for basic speech-to-text.`,
        isStub: true
      });
    }, 1500);
  }

  // Enhanced voice settings
  const voiceOptions = [
    { id: 'default', name: 'Default TTS', available: true },
    { id: 'neural-casual', name: 'Neural Casual (Coming Soon)', available: false },
    { id: 'neural-professional', name: 'Neural Professional (Coming Soon)', available: false },
    { id: 'cloned-voice', name: 'Custom Voice Clone (Coming Soon)', available: false }
  ];
</script>

<!-- Enhanced voice controls -->
<div class="voice-controls bg-blue-50 p-4 rounded-lg">
  <div class="flex items-center justify-between mb-3">
    <h4 class="font-medium">🎵 Voice & Audio</h4>
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        bind:checked={audioPlaybackEnabled}
        class="rounded"
      />
      <span class="text-sm">Audio responses</span>
    </label>
  </div>

  <!-- Voice selection -->
  <div class="mb-3">
    <label class="block text-sm font-medium mb-1">Voice Style:</label>
    <select bind:value={voiceSelection} class="w-full p-2 border rounded">
      {#each voiceOptions as voice}
        <option value={voice.id} disabled={!voice.available}>
          {voice.name} {voice.available ? '' : '(Preview)'}
        </option>
      {/each}
    </select>
  </div>

  <!-- Audio input (future) -->
  <div class="flex gap-2">
    <!-- Existing voice button -->
    <button
      on:click={toggleListening}
      class="btn-secondary text-sm {isListening ? 'bg-red-100 border-red-300' : ''}"
      title="Speech to text"
    >
      {isListening ? '🛑 Stop' : '🎤 Speak'}
    </button>

    <!-- Future audio input -->
    <input
      type="file"
      accept="audio/*"
      on:change={handleAudioFile}
      class="hidden"
      id="audio-upload"
    />
    <label
      for="audio-upload"
      class="btn-secondary text-sm cursor-pointer"
      title="Upload audio file (preview)"
    >
      📁 Audio File
    </label>
  </div>

  {#if audioQueue.length > 0}
    <div class="mt-2 text-xs text-gray-600">
      Audio queue: {audioQueue.length} items
    </div>
  {/if}
</div>

<script>
  function handleAudioFile(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      processAudioInput(file);
    }
  }

  // Export for use by ChatInterface
  export { playAudioResponse };
</script>
```

**Testing Requirements**:

- Component test: Verify enhanced voice controls render
- Test audio queue management
- Test visual feedback for stub audio

**Validation Criteria**:

- [ ] Enhanced voice controls display with future options
- [ ] Audio playback simulation works with visual feedback
- [ ] Audio file upload triggers stub processing
- [ ] Queue system manages multiple audio items
- [ ] Clear indicators for stub/preview features

**Success Definition**: Audio infrastructure ready for advanced voice features with clear user expectations

---

### Issue 3.1.4: Update architecture docs with stubs

- **Status**: ☐ Open
- **Files**: `docs/ARCHITECTURE.md`
- **Dependencies**: Issues 3.1.1-3.1.3 complete
- **PRD Connection**: Documentation of multimodal/offline architecture

**Implementation Details**:
Add new sections to ARCHITECTURE.md:

````markdown
## Future-Ready Architecture

### Multimodal Support (Stubs)

Current implementation includes infrastructure for:

- Image upload and preview (ChatInterface)
- Audio file handling (VoiceControls)
- Media type validation and storage
- Placeholder responses for unsupported formats

Future integration points:

- OpenAI Vision API for image analysis
- Whisper API for audio transcription
- Custom voice synthesis models
- File storage in edge storage (R2)

### Offline Capabilities

- Service Worker with Workbox for page caching
- IndexedDB for chat session persistence
- Network status detection and sync
- Graceful degradation for network failures

Architecture supports:

```javascript
// Future offline-first flow
if (isOnline) {
  response = await callOpenAI(message);
} else {
  response = await localLLMFallback(message);
}
```
````

### Vendor Abstraction Layer

Prepared for multiple LLM providers:

```javascript
// Current: Direct OpenAI
const response = await openai.chat.completions.create({...});

// Future: Abstracted
const llmClient = createLLMClient(config.provider);
const response = await llmClient.chat({...});
```

Supported providers (planned):

- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude)
- Local models (Ollama, LM Studio)
- Custom API endpoints

````

**Testing Requirements**: Manual documentation review

**Validation Criteria**:
- [ ] Multimodal architecture clearly documented
- [ ] Offline capabilities explained with code examples
- [ ] Vendor abstraction strategy outlined
- [ ] Future integration points specified

**Success Definition**: Architecture documentation shows clear path for multimodal and vendor-agnostic features

---

## Step 3.2 – Vendor Agnostic & Scaling (Minor 4.2.0)
**Why This Matters**: PRD requires modularity to prevent vendor lock-in and ensure sustainable scaling within cost constraints.

### Issue 3.2.1: Refactor openai.js to adapter pattern
- **Status**: ☑ Closed
- **Files**: `src/lib/utils/openai.js`
- **Dependencies**: None
- **PRD Connection**: "Modular for swaps" from LLM Layer requirements

**Implementation Details**:
```javascript
// Refactor src/lib/utils/openai.js to src/lib/utils/llm-client.js

// Base LLM Client interface
export class BaseLLMClient {
  constructor(config) {
    this.config = config;
  }

  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by provider');
  }

  async generateSummary(text) {
    throw new Error('generateSummary() must be implemented by provider');
  }

  calculateCost(promptTokens, responseTokens) {
    throw new Error('calculateCost() must be implemented by provider');
  }
}

// OpenAI implementation
export class OpenAIClient extends BaseLLMClient {
  constructor(config) {
    super(config);
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: false
    });
  }

  async chat(messages, options = {}) {
    const response = await this.openai.chat.completions.create({
      model: options.model || this.config.defaultModel || 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: options.stream || false
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
      provider: 'openai'
    };
  }

  async generateSummary(text) {
    const response = await this.chat([
      {
        role: 'system',
        content: 'Summarize this conversation in 2-3 sentences, focusing on key topics and outcomes.'
      },
      {
        role: 'user',
        content: text
      }
    ], {
      model: 'gpt-4o-mini',
      maxTokens: 150
    });

    return response.content;
  }

  calculateCost(promptTokens, responseTokens, model = 'gpt-4o-mini') {
    const pricing = {
      'gpt-4o': { prompt: 0.03, response: 0.06 },
      'gpt-4o-mini': { prompt: 0.00015, response: 0.0006 }
    };

    const rates = pricing[model] || pricing['gpt-4o-mini'];
    return ((promptTokens * rates.prompt) + (responseTokens * rates.response)) / 1000;
  }
}

// Mock/Testing client
export class MockLLMClient extends BaseLLMClient {
  async chat(messages, options = {}) {
    // Return predictable responses for testing
    const lastMessage = messages[messages.length - 1].content;
    return {
      content: `Mock response to: "${lastMessage}"`,
      usage: { prompt_tokens: 50, completion_tokens: 30 },
      model: 'mock-model',
      provider: 'mock'
    };
  }

  async generateSummary(text) {
    return `Mock summary of: ${text.substring(0, 50)}...`;
  }

  calculateCost(promptTokens, responseTokens) {
    return 0; // Free for testing
  }
}

// Claude client (stub for future)
export class ClaudeClient extends BaseLLMClient {
  async chat(messages, options = {}) {
    throw new Error('Claude integration coming soon');
  }

  calculateCost(promptTokens, responseTokens) {
    // Claude pricing structure
    return promptTokens * 0.0008 / 1000 + responseTokens * 0.0024 / 1000;
  }
}

// Factory function
export function createLLMClient(provider, config) {
  switch (provider) {
    case 'openai':
      return new OpenAIClient(config);
    case 'mock':
      return new MockLLMClient(config);
    case 'claude':
      return new ClaudeClient(config);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// Configuration-based client
export function getLLMClient() {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const config = {
    provider,
    apiKey: process.env.OPENAI_API_KEY, // Will be provider-specific
    defaultModel: process.env.LLM_DEFAULT_MODEL || 'gpt-4o-mini'
  };

  return createLLMClient(provider, config);
}
````

```javascript
// Update netlify/functions/chat.js to use new adapter
import { getLLMClient } from "../../src/lib/utils/llm-client.js";

export default async function handler(req, context) {
  const { message, toolId, sessionId } = JSON.parse(req.body);

  // Get tool configuration
  const tool = await getTool(toolId);

  // Create messages array
  const messages = [
    { role: "system", content: tool.systemPrompt },
    { role: "user", content: message },
  ];

  // Use abstracted LLM client
  const llmClient = getLLMClient();

  try {
    const response = await llmClient.chat(messages, {
      model: tool.model,
      temperature: tool.temperature,
      maxTokens: tool.maxTokens,
    });

    // Log usage with provider info
    await logAIUsage(toolId, response.model, message, response.content, {
      provider: response.provider,
      tokens: response.usage,
    });

    return new Response(
      JSON.stringify({
        response: response.content,
        usage: response.usage,
        provider: response.provider,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("LLM Error:", error);
    return new Response(
      JSON.stringify({
        error: "AI service unavailable",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

**Testing Requirements**:

- Unit test: Verify adapter pattern works with mock client
- Test: OpenAI client maintains existing functionality
- Test: Factory creates correct client types

**Validation Criteria**:

- [ ] Mock LLM client returns predictable responses
- [ ] OpenAI client works identically to original
- [ ] Factory function creates appropriate clients
- [ ] Configuration switches providers correctly
- [ ] Error handling preserved across adapters

**Success Definition**: LLM provider can be switched via configuration without code changes

---

### Issue 3.2.2: Add rate-limiting middleware

- **Status**: ☐ Open
- **Files**: `netlify.toml`, `src/lib/utils/rate-limiter.js`
- **Dependencies**: None
- **PRD Connection**: "Cap at 100 concurrent via functions" from Scaling Guidelines

**Implementation Details**:

```toml
# Add to netlify.toml
[functions]
  max_execution_time = "30s"

[functions."chat"]
  max_execution_time = "25s"
  memory = 512

[functions."whatsapp"]
  max_execution_time = "20s"
  memory = 256

# Rate limiting via edge functions (future Cloudflare migration)
[[edge_functions]]
  function = "rate-limiter"
  path = "/.netlify/functions/*"
```

```javascript
// Create src/lib/utils/rate-limiter.js
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 30; // per window
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old entries
    for (const [key, timestamps] of this.requests) {
      const validTimestamps = timestamps.filter((t) => t > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }

    // Check current identifier
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter((t) => t > windowStart);

    if (validRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + this.windowMs,
      };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetTime: now + this.windowMs,
    };
  }
}

// Per-function rate limiters
export const chatLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 20, // 20 chats per minute
});

export const whatsappLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 WhatsApp messages per minute
});

export const adminLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 50, // 50 admin actions per 5 minutes
});

// Helper to apply rate limiting
export function withRateLimit(limiter, identifier) {
  const result = limiter.isAllowed(identifier);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
        },
      }
    );
  }

  return {
    allowed: true,
    headers: {
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    },
  };
}
```

```javascript
// Update netlify/functions/chat.js with rate limiting
import { chatLimiter, withRateLimit } from "../../src/lib/utils/rate-limiter.js";

export default async function handler(req, context) {
  // Extract identifier (IP or session)
  const identifier = req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"] || "unknown";

  // Apply rate limiting
  const rateCheck = withRateLimit(chatLimiter, identifier);
  if (!rateCheck.allowed) {
    return rateCheck; // Returns 429 response
  }

  // Continue with normal chat logic...
  const response = await processChatRequest(req);

  // Add rate limit headers to successful response
  const originalHeaders = response.headers || {};
  return new Response(response.body, {
    status: response.status,
    headers: {
      ...originalHeaders,
      ...rateCheck.headers,
    },
  });
}
```

**Testing Requirements**:

- Load test: Verify rate limits enforce correctly
- Test: Rate limit headers included in responses
- Test: Different limits for different functions

**Validation Criteria**:

- [ ] Requests exceeding limit return 429 status
- [ ] Rate limit headers show remaining requests
- [ ] Different functions have appropriate limits
- [ ] Rate limits reset after time window
- [ ] Admin functions have higher limits than public

**Success Definition**: System prevents abuse while allowing normal usage patterns

---

### Issue 3.2.3: Add real-time cost UI in chat

- **Status**: ☐ Open
- **Files**: `src/lib/components/ChatInterface.svelte`
- **Dependencies**: Enhanced ai-usage.js from Phase 1
- **PRD Connection**: "Real-time cost UI for users" from Future Enhancements

**Implementation Details**:

```svelte
<!-- Add to ChatInterface.svelte -->
<script>
  import { onMount } from 'svelte';

  let sessionCost = 0;
  let totalCost = 0;
  let costVisible = true;
  let costBreakdown = {
    messages: 0,
    tokens: 0,
    avgCostPerMessage: 0
  };

  // Update cost after each message
  async function updateCostDisplay(usage) {
    if (usage && usage.cost) {
      sessionCost += usage.cost;
      costBreakdown.messages += 1;
      costBreakdown.tokens += (usage.promptTokens || 0) + (usage.responseTokens || 0);
      costBreakdown.avgCostPerMessage = sessionCost / costBreakdown.messages;

      // Fetch total cost for this tool today
      try {
        const response = await fetch(`/.netlify/functions/cost-summary?toolId=${$page.params.toolId}`);
        const data = await response.json();
        totalCost = data.todayCost || 0;
      } catch (error) {
        console.log('Could not fetch total cost');
      }
    }
  }

  // Format cost for display
  function formatCost(cost) {
    if (cost < 0.01) {
      return `$${(cost * 1000).toFixed(2)}m`; // Show in millicents
    }
    return `$${cost.toFixed(4)}`;
  }

  function getCostColor(cost) {
    if (cost < 0.01) return 'text-green-600';
    if (cost < 0.05) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<!-- Cost display widget -->
{#if costVisible}
  <div class="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 border text-xs z-10">
    <div class="flex items-center justify-between mb-2">
      <span class="font-medium">💰 Session Cost</span>
      <button
        on:click={() => costVisible = false}
        class="text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>

    <div class="space-y-1">
      <div class="flex justify-between">
        <span>This chat:</span>
        <span class={getCostColor(sessionCost)}>
          {formatCost(sessionCost)}
        </span>
      </div>

      <div class="flex justify-between">
        <span>Today total:</span>
        <span class={getCostColor(totalCost)}>
          {formatCost(totalCost)}
        </span>
      </div>

      <div class="border-t pt-1 text-gray-500">
        <div>{costBreakdown.messages} msgs • {costBreakdown.tokens} tokens</div>
        <div>Avg: {formatCost(costBreakdown.avgCostPerMessage)}/msg</div>
      </div>
    </div>
  </div>
{:else}
  <!-- Minimized cost indicator -->
  <button
    on:click={() => costVisible = true}
    class="fixed top-4 right-4 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center border z-10"
    title="Show cost breakdown"
  >
    <span class="text-xs {getCostColor(sessionCost)}">
      💰
    </span>
  </button>
{/if}

<!-- Add cost alert for high usage -->
{#if sessionCost > 0.10}
  <div class="fixed bottom-20 right-4 bg-orange-100 border border-orange-300 rounded-lg p-3 text-sm">
    <div class="flex items-center gap-2">
      <span>⚠️</span>
      <div>
        <div class="font-medium">High usage alert</div>
        <div class="text-orange-700">
          Session cost: {formatCost(sessionCost)}
        </div>
      </div>
    </div>
  </div>
{/if}
```

```javascript
// Create netlify/functions/cost-summary.js
export default async function handler(req, context) {
  const url = new URL(req.url);
  const toolId = url.searchParams.get("toolId");

  if (!toolId) {
    return new Response("Missing toolId", { status: 400 });
  }

  try {
    // Get today's usage for this tool
    const today = new Date().toISOString().split("T")[0];
    const usageData = await getUsageForTool(toolId, today);

    const todayCost = usageData.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const messageCount = usageData.length;
    const tokenCount = usageData.reduce(
      (sum, entry) => sum + (entry.promptTokens || 0) + (entry.responseTokens || 0),
      0
    );

    return new Response(
      JSON.stringify({
        toolId,
        date: today,
        todayCost,
        messageCount,
        tokenCount,
        avgCostPerMessage: messageCount > 0 ? todayCost / messageCount : 0,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch cost summary",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

**Testing Requirements**:

- Component test: Verify cost display updates correctly
- Test: Cost formatting for different ranges
- Test: Alert triggers at appropriate thresholds

**Validation Criteria**:

- [ ] Real-time cost updates after each message
- [ ] Cost display shows session and daily totals
- [ ] Formatting appropriate for small amounts (millicents)
- [ ] High usage alert appears at threshold
- [ ] Cost widget can be minimized/expanded

**Success Definition**: Users have clear visibility into AI usage costs in real-time

---

### Issue 3.2.4: Stub A/B testing toggle in admin

- **Status**: ☐ Open
- **Files**: `src/routes/admin/tools/[id]/+page.svelte`
- **Dependencies**: None (stub only)
- **PRD Connection**: "A/B testing stubs" from Future Enhancements

**Implementation Details**:

```svelte
<!-- Add to admin tool editor -->
<div class="mt-8 border-t pt-6">
  <h3 class="text-lg font-semibold mb-4">🧪 Experimental Features</h3>

  <div class="bg-blue-50 p-4 rounded-lg">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h4 class="font-medium">A/B Testing (Preview)</h4>
        <p class="text-sm text-gray-600">Test different prompts with user groups</p>
      </div>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          bind:checked={tool.abTestingEnabled}
          class="rounded"
        />
        <span class="text-sm">Enable</span>
      </label>
    </div>

    {#if tool.abTestingEnabled}
      <div class="space-y-4">
        <!-- Variant A (Control) -->
        <div class="bg-white p-3 rounded border">
          <div class="flex items-center justify-between mb-2">
            <h5 class="font-medium">Variant A (Control)</h5>
            <span class="text-xs bg-blue-100 px-2 py-1 rounded">50% traffic</span>
          </div>
          <textarea
            bind:value={tool.systemPrompt}
            placeholder="Current system prompt (control group)"
            class="w-full p-2 border rounded h-20 text-sm"
            readonly
          ></textarea>
        </div>

        <!-- Variant B (Test) -->
        <div class="bg-white p-3 rounded border">
          <div class="flex items-center justify-between mb-2">
            <h5 class="font-medium">Variant B (Test)</h5>
            <span class="text-xs bg-green-100 px-2 py-1 rounded">50% traffic</span>
          </div>
          <textarea
            bind:value={tool.abTestPrompt}
            placeholder="Alternative system prompt for testing..."
            class="w-full p-2 border rounded h-20 text-sm"
          ></textarea>
        </div>

        <!-- Test Configuration -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Traffic Split:</label>
            <select bind:value={tool.abTestSplit} class="w-full p-2 border rounded">
              <option value="50-50">50% / 50%</option>
              <option value="70-30">70% / 30%</option>
              <option value="90-10">90% / 10%</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Duration:</label>
            <select bind:value={tool.abTestDuration} class="w-full p-2 border rounded">
              <option value="1-week">1 Week</option>
              <option value="2-weeks">2 Weeks</option>
              <option value="1-month">1 Month</option>
            </select>
          </div>
        </div>

        <!-- Metrics Preview -->
        <div class="bg-gray-50 p-3 rounded">
          <h6 class="font-medium mb-2">Tracking Metrics (Preview)</h6>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-lg font-bold">127</div>
              <div class="text-xs text-gray-600">Variant A Sessions</div>
            </div>
            <div>
              <div class="text-lg font-bold">133</div>
              <div class="text-xs text-gray-600">Variant B Sessions</div>
            </div>
            <div>
              <div class="text-lg font-bold">+12%</div>
              <div class="text-xs text-gray-600">B Engagement (Simulated)</div>
            </div>
          </div>

          <div class="mt-3 text-center">
            <button class="btn-secondary text-sm" disabled>
              📊 View Detailed Results (Coming Soon)
            </button>
          </div>
        </div>

        <!-- Warning -->
        <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
          <div class="flex items-start gap-2">
            <span>⚠️</span>
            <div class="text-sm">
              <strong>Preview Feature:</strong> A/B testing is in development.
              Current implementation will save variant prompts but not split traffic.
              Full testing capabilities coming in future release.
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<script>
  // Initialize A/B testing fields if not present
  if (!tool.abTestingEnabled) {
    tool.abTestingEnabled = false;
    tool.abTestPrompt = '';
    tool.abTestSplit = '50-50';
    tool.abTestDuration = '1-week';
  }

  // Save with A/B test data
  async function saveToolWithABTest() {
    const saveData = {
      ...tool,
      // Mark A/B fields as preview
      abTestingEnabled: tool.abTestingEnabled,
      abTestPrompt: tool.abTestPrompt || '',
      abTestSplit: tool.abTestSplit || '50-50',
      abTestDuration: tool.abTestDuration || '1-week',
      abTestPreview: true // Flag for future implementation
    };

    await saveTool(saveData);

    if (tool.abTestingEnabled) {
      showNotification('A/B testing enabled (preview mode)');
    }
  }
</script>
```

**Testing Requirements**:

- Component test: Verify A/B testing UI renders
- Test: Form saves A/B test configuration
- Test: Warning displays for preview mode

**Validation Criteria**:

- [ ] A/B testing toggle enables additional fields
- [ ] Variant prompts can be configured independently
- [ ] Traffic split and duration options available
- [ ] Preview metrics display simulated data
- [ ] Clear indication this is preview/coming soon
- [ ] Configuration saves with tool data

**Success Definition**: A/B testing infrastructure ready for future statistical implementation

---

### Issue 3.2.5: Final production deployment docs update

- **Status**: ☐ Open
- **Files**: `docs/PRODUCTION_DEPLOYMENT.md`
- **Dependencies**: All previous issues
- **PRD Connection**: Complete deployment documentation

**Implementation Details**:

````markdown
# Production Deployment Guide

## Overview

This guide covers deploying OBT Helper GPT to production with full feature support including WhatsApp, analytics, multimodal stubs, and vendor-agnostic architecture.

## Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] Node.js 18+ installed
- [ ] OpenAI API key obtained
- [ ] Twilio account set up (for WhatsApp)
- [ ] Domain configured (if custom domain)
- [ ] SSL certificate ready (handled by hosting)

### 2. Feature Configuration

- [ ] AI tools configured and tested
- [ ] WhatsApp webhook endpoint configured
- [ ] Rate limiting thresholds set appropriately
- [ ] Cost ceilings configured per tool
- [ ] Admin authentication configured

### 3. Monitoring Setup

- [ ] Error tracking configured
- [ ] Cost alerts set up
- [ ] Performance monitoring enabled
- [ ] Backup strategy in place

## Deployment Options

### Option 1: Netlify (Recommended)

**Advantages:**

- Integrated serverless functions
- Built-in Blobs storage
- Automatic HTTPS
- Easy environment variable management

```bash
# Deploy to Netlify
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```
````

**Environment Variables:**

```
OPENAI_API_KEY=sk-proj-...
VITE_ADMIN_PASSWORD=secure-password-here
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+14155238886
LLM_PROVIDER=openai
LLM_DEFAULT_MODEL=gpt-4o-mini
```

### Option 2: Cloudflare Pages + Workers

**Advantages:**

- Edge computing worldwide
- KV storage included
- Excellent performance
- Generous free tier

```bash
# Deploy to Cloudflare
npm install -g wrangler
wrangler login
wrangler pages project create obt-helper
wrangler pages deploy build
```

**Migration from Netlify:**

1. Export tool configurations
2. Migrate Blobs to KV storage
3. Update function syntax for Workers
4. Configure Pages environment

### Option 3: Vercel

**Considerations:**

- Requires database for tool storage
- Function timeout limits
- More complex setup

## Post-Deployment Configuration

### 1. WhatsApp Setup

```bash
# Configure Twilio webhook
curl -X POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/IncomingPhoneNumbers/{PhoneNumberSid}.json \
  --data-urlencode "VoiceUrl=https://your-domain.com/.netlify/functions/whatsapp" \
  -u {AccountSid}:{AuthToken}
```

### 2. Admin Access

1. Visit `https://your-domain.com/admin`
2. Log in with configured password
3. Verify all tools load correctly
4. Test chat functionality
5. Check cost tracking displays

### 3. Performance Optimization

**Frontend Optimization:**

- Enable gzip compression
- Configure CDN caching
- Optimize images and assets
- Enable service worker for offline

**Backend Optimization:**

- Set appropriate function timeouts
- Configure rate limiting
- Enable function caching where possible
- Monitor cold start times

### 4. Security Configuration

**Content Security Policy:**

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' api.openai.com
```

**Additional Headers:**

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Monitoring & Maintenance

### 1. Health Checks

Create monitoring for:

- Function response times
- Error rates
- OpenAI API status
- Cost tracking accuracy

### 2. Automated Alerts

Configure alerts for:

- High error rates (>5%)
- Unusual cost spikes (>daily limit)
- Function timeouts
- Rate limit hits

### 3. Backup Strategy

- Export tool configurations weekly
- Monitor usage data retention
- Backup environment configuration
- Document admin credentials securely

### 4. Update Process

```bash
# Update deployment
git pull origin main
npm install
npm run build
netlify deploy --prod
```

## Scaling Considerations

### Current Limits

- **Netlify Functions:** 125,000 requests/month (Starter)
- **Netlify Blobs:** 100GB storage (Pro)
- **OpenAI API:** Rate limits per tier

### Scaling Triggers

- Function invocations > 80% of limit
- Storage usage > 80% of limit
- Response times > 5 seconds
- Error rates > 2%

### Scaling Actions

1. **Horizontal:** Multiple deployments by region
2. **Caching:** Implement Redis for sessions
3. **CDN:** Use Cloudflare for global distribution
4. **Database:** Migrate to dedicated database if needed

## Troubleshooting

### Common Issues

**Functions Not Working:**

- Check environment variables
- Verify API keys
- Review function logs
- Test locally with `netlify dev`

**WhatsApp Not Responding:**

- Verify webhook URL
- Check Twilio configuration
- Test with Twilio console
- Review function logs

**High Costs:**

- Check cost ceiling configuration
- Review model downgrade logic
- Monitor token usage patterns
- Verify rate limiting

**Performance Issues:**

- Check function cold starts
- Review large file imports
- Optimize database queries
- Enable caching headers

## Cost Management

### Expected Costs (Monthly)

- **Hosting:** $0-$45 (depending on usage)
- **OpenAI API:** $5-$50 (depending on chat volume)
- **Twilio:** $1-$10 (WhatsApp messaging)
- **Total:** $6-$105/month

### Cost Optimization

1. Use gpt-4o-mini for most interactions
2. Implement cost ceilings per tool
3. Monitor and alert on unusual usage
4. Regular usage pattern analysis

## Support & Maintenance

### Documentation Updates

Keep these docs current with:

- Environment variable changes
- New feature configurations
- Scaling modifications
- Security updates

### Community Support

- GitHub Issues for bugs
- Discussions for usage questions
- Wiki for community tips
- Discord for real-time help

---

**Deployment Complete!** 🚀

Your OBT Helper GPT instance is now running in production with full feature support, monitoring, and scaling capabilities.

```

**Testing Requirements**: Manual verification of deployment steps

**Validation Criteria**:
- [ ] All deployment options documented clearly
- [ ] Environment variables specified for each platform
- [ ] Post-deployment checklist comprehensive
- [ ] Monitoring and maintenance procedures outlined
- [ ] Troubleshooting covers common issues

**Success Definition**: Complete production deployment guide enables reliable hosting with proper monitoring and maintenance

---

## Closing Criteria for Epic 3
- [ ] All nine issues marked ☑ Closed
- [ ] Version bumped to 4.1.0 after Step 3.1 completion
- [ ] Version bumped to 4.2.0 after Step 3.2 completion
- [ ] All stubs implemented and documented
- [ ] LLM adapter pattern working with mock providers
- [ ] Rate limiting enforced across functions
- [ ] Real-time cost tracking functional
- [ ] Production deployment documentation complete

**Epic Success Definition**: Platform is future-ready with multimodal infrastructure, vendor-agnostic architecture, comprehensive scaling controls, and production-grade monitoring—capable of sustainable operation and easy migration between providers while maintaining antifragile principles.
```
