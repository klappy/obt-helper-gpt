# Multimodal Feature Implementation Guide 🎯

> Technical specifications for implementing GPT-4 Vision, DALL-E, and Whisper integrations

## 📋 Overview

This guide provides step-by-step implementation details for adding multimodal AI capabilities to OBT Helper GPT.

## 🎯 Current State

We have **stubs** in place for multimodal features:

- `ChatInterface.svelte` - File upload UI and placeholder handlers
- `VoiceControls.svelte` - Audio processing stubs
- Service worker ready for offline media caching

## 🔧 Implementation Plan

### 1. GPT-4 Vision Integration

#### Backend Changes

**File: `netlify/functions/vision-analyze.js`** (NEW)

```javascript
import { getLLMClient } from "../../src/lib/utils/llm-client.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const prompt = formData.get("prompt") || "What's in this image?";
    const toolId = formData.get("toolId");

    // Convert image to base64 if needed
    const base64Image = await convertToBase64(image);

    // Call GPT-4 Vision
    const client = getLLMClient("openai");
    const response = await client.chat(
      [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      {
        model: "gpt-4-vision-preview",
        maxTokens: 500,
      }
    );

    // Log usage
    await logAIUsage({
      toolId,
      model: "gpt-4-vision-preview",
      usage: response.usage,
      cost: calculateVisionCost(response.usage),
      type: "vision",
    });

    return new Response(
      JSON.stringify({
        analysis: response.content,
        usage: response.usage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Vision analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

#### Frontend Changes

**Update: `src/lib/components/ChatInterface.svelte`**

```svelte
// Replace the stub sendMessageWithMedia function with:
async function sendMessageWithMedia() {
  if (!currentMessage.trim() && uploadedFiles.length === 0) return;

  messages.update(m => [...m, {
    id: Date.now(),
    role: 'user',
    content: currentMessage,
    attachments: uploadedFiles
  }]);

  // Handle image analysis
  for (const file of uploadedFiles) {
    if (file.type.startsWith('image/')) {
      isProcessing = true;

      try {
        const formData = new FormData();
        formData.append('image', file.data);
        formData.append('prompt', currentMessage || 'Analyze this image');
        formData.append('toolId', tool.id);

        const response = await fetch('/.netlify/functions/vision-analyze', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        messages.update(m => [...m, {
          id: Date.now(),
          role: 'assistant',
          content: data.analysis,
          metadata: { type: 'vision', usage: data.usage }
        }]);

        // Update cost tracking
        await updateCostDisplay(data.usage);
      } catch (error) {
        console.error('Vision analysis failed:', error);
        messages.update(m => [...m, {
          id: Date.now(),
          role: 'assistant',
          content: 'Sorry, I couldn\'t analyze that image. Please try again.'
        }]);
      } finally {
        isProcessing = false;
      }
    }
  }

  // Clear after sending
  currentMessage = '';
  uploadedFiles = [];
}
```

### 2. DALL-E Integration

#### Backend Changes

**File: `netlify/functions/generate-image.js`** (NEW)

```javascript
import { getLLMClient } from "../../src/lib/utils/llm-client.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { prompt, size = "1024x1024", style = "vivid", toolId } = await req.json();

    // Generate image with DALL-E 3
    const client = getLLMClient("openai");
    const response = await client.generateImage({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      style,
      quality: "hd",
    });

    // Store generated image metadata
    const imageStore = getStore({ name: "generated-images" });
    const imageId = Date.now().toString();
    await imageStore.set(
      imageId,
      JSON.stringify({
        prompt,
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt,
        created: new Date().toISOString(),
        toolId,
      })
    );

    // Log usage (DALL-E has fixed costs)
    const cost = size === "1024x1024" ? 0.04 : 0.08; // HD quality pricing
    await logAIUsage({
      toolId,
      model: "dall-e-3",
      cost,
      type: "image-generation",
    });

    return new Response(
      JSON.stringify({
        imageId,
        url: response.data[0].url,
        revised_prompt: response.data[0].revised_prompt,
        cost,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

#### Frontend Component

**File: `src/lib/components/ImageGenerator.svelte`** (NEW)

```svelte
<script lang="ts">
  import { tool } from '$lib/stores/tools.js';

  let prompt = '';
  let isGenerating = false;
  let generatedImages = [];
  let selectedStyle = 'vivid';
  let selectedSize = '1024x1024';

  const styles = [
    { value: 'vivid', label: 'Vivid', description: 'Hyper-realistic and dramatic' },
    { value: 'natural', label: 'Natural', description: 'More natural, less hyper-real' }
  ];

  const sizes = [
    { value: '1024x1024', label: 'Square (1:1)', cost: '$0.04' },
    { value: '1792x1024', label: 'Landscape (16:9)', cost: '$0.08' },
    { value: '1024x1792', label: 'Portrait (9:16)', cost: '$0.08' }
  ];

  async function generateImage() {
    if (!prompt.trim() || isGenerating) return;

    isGenerating = true;

    try {
      const response = await fetch('/.netlify/functions/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          size: selectedSize,
          toolId: $tool.id
        })
      });

      const data = await response.json();

      generatedImages = [{
        id: data.imageId,
        url: data.url,
        prompt: prompt,
        revised_prompt: data.revised_prompt,
        timestamp: new Date()
      }, ...generatedImages];

      // Clear prompt after success
      prompt = '';
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      isGenerating = false;
    }
  }
</script>

<div class="image-generator">
  <div class="generator-header">
    <h3>🎨 AI Image Generation</h3>
    <p class="text-gray-600">Powered by DALL-E 3</p>
  </div>

  <div class="prompt-section">
    <textarea
      bind:value={prompt}
      placeholder="Describe what you want to create..."
      class="w-full p-4 border rounded-lg resize-none"
      rows="3"
      disabled={isGenerating}
    />

    <div class="generation-options">
      <div class="style-selector">
        <label>Style:</label>
        {#each styles as style}
          <label class="style-option">
            <input
              type="radio"
              bind:group={selectedStyle}
              value={style.value}
              disabled={isGenerating}
            />
            <span>{style.label}</span>
          </label>
        {/each}
      </div>

      <div class="size-selector">
        <label>Size:</label>
        <select bind:value={selectedSize} disabled={isGenerating}>
          {#each sizes as size}
            <option value={size.value}>{size.label} - {size.cost}</option>
          {/each}
        </select>
      </div>
    </div>

    <button
      on:click={generateImage}
      disabled={!prompt.trim() || isGenerating}
      class="generate-button"
    >
      {isGenerating ? 'Generating...' : 'Generate Image'}
    </button>
  </div>

  {#if generatedImages.length > 0}
    <div class="gallery">
      {#each generatedImages as image}
        <div class="generated-image-card">
          <img src={image.url} alt={image.prompt} />
          <div class="image-details">
            <p class="prompt">{image.prompt}</p>
            {#if image.revised_prompt !== image.prompt}
              <p class="revised-prompt">Enhanced: {image.revised_prompt}</p>
            {/if}
            <div class="image-actions">
              <a href={image.url} download class="download-btn">Download</a>
              <button on:click={() => prompt = image.prompt}>Remix</button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

### 3. Whisper Integration

#### Backend Changes

**File: `netlify/functions/transcribe-audio.js`** (NEW)

```javascript
import { getLLMClient } from "../../src/lib/utils/llm-client.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const language = formData.get("language") || "auto";
    const toolId = formData.get("toolId");

    // Transcribe with Whisper
    const client = getLLMClient("openai");
    const response = await client.transcribeAudio({
      file: audio,
      model: "whisper-1",
      language: language === "auto" ? undefined : language,
      response_format: "json",
      temperature: 0.2,
    });

    // Calculate cost (Whisper: $0.006 per minute)
    const durationMinutes = response.duration / 60;
    const cost = durationMinutes * 0.006;

    // Log usage
    await logAIUsage({
      toolId,
      model: "whisper-1",
      cost,
      metadata: { duration: response.duration },
      type: "transcription",
    });

    return new Response(
      JSON.stringify({
        text: response.text,
        language: response.language,
        duration: response.duration,
        cost,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

#### Update VoiceControls

**Update: `src/lib/components/VoiceControls.svelte`**

```svelte
// Add to the existing component:

let audioBlob: Blob | null = null;
let isTranscribing = false;

// Replace stub processAudioInput with:
async function processAudioInput(file: File) {
  isTranscribing = true;
  dispatch('audioProcessing', { status: 'transcribing' });

  try {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('toolId', tool.id);

    const response = await fetch('/.netlify/functions/transcribe-audio', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    dispatch('audioProcessed', {
      text: data.text,
      language: data.language,
      duration: data.duration,
      cost: data.cost
    });

    // Automatically send as message
    if (data.text) {
      dispatch('message', { content: data.text });
    }
  } catch (error) {
    console.error('Transcription failed:', error);
    dispatch('audioProcessed', { error: error.message });
  } finally {
    isTranscribing = false;
  }
}

// Add real-time transcription for recordings
async function stopRecording() {
  if (!recognition || !isListening) return;

  recognition.stop();
  isListening = false;

  // If we have recorded audio, transcribe it with Whisper
  if (audioBlob) {
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    await processAudioInput(file);
    audioBlob = null;
  }
}
```

## 🔌 OpenAI Client Updates

**Update: `src/lib/utils/llm-client.js`**

Add these methods to the `OpenAIClient` class:

```javascript
async generateImage(options) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async transcribeAudio(options) {
  const formData = new FormData();
  formData.append("file", options.file);
  formData.append("model", options.model);
  if (options.language) formData.append("language", options.language);
  formData.append("response_format", options.response_format || "json");
  if (options.temperature) formData.append("temperature", options.temperature.toString());

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
```

## 🎯 Cost Tracking Updates

**Update: `src/lib/utils/ai-usage.js`**

Add multimodal cost calculation:

```javascript
export function calculateMultimodalCost(type, metadata) {
  switch (type) {
    case "vision":
      // GPT-4 Vision pricing
      const imageTokens = metadata.imageTokens || 765; // Base cost per image
      const textTokens = metadata.promptTokens + metadata.completionTokens;
      return (imageTokens * 0.01 + textTokens * 0.03) / 1000;

    case "image-generation":
      // DALL-E 3 HD pricing
      return metadata.size === "1024x1024" ? 0.04 : 0.08;

    case "transcription":
      // Whisper pricing
      return (metadata.duration / 60) * 0.006;

    default:
      return 0;
  }
}
```

## 🚀 Testing Plan

### Unit Tests

1. Test image upload and base64 conversion
2. Test cost calculations for each service
3. Test error handling for API failures

### Integration Tests

```javascript
// tests/multimodal.test.ts
import { test, expect } from "@playwright/test";

test.describe("Multimodal Features", () => {
  test("should analyze uploaded image", async ({ page }) => {
    await page.goto("/demo");

    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/test-image.jpg");

    // Wait for analysis
    await expect(page.locator(".analysis-result")).toBeVisible();
    await expect(page.locator(".analysis-result")).toContainText("I can see");
  });

  test("should generate image from prompt", async ({ page }) => {
    await page.goto("/demo");

    // Open image generator
    await page.click('button:has-text("Generate Image")');

    // Enter prompt
    await page.fill('textarea[placeholder*="Describe"]', "A futuristic city at sunset");

    // Generate
    await page.click('button:has-text("Generate")');

    // Wait for result
    await expect(page.locator(".generated-image img")).toBeVisible({ timeout: 30000 });
  });

  test("should transcribe audio file", async ({ page }) => {
    await page.goto("/demo");

    // Upload audio
    const fileInput = page.locator('input[accept*="audio"]');
    await fileInput.setInputFiles("tests/fixtures/test-audio.mp3");

    // Wait for transcription
    await expect(page.locator(".transcription-result")).toBeVisible();
    await expect(page.locator(".transcription-result")).toContainText("Hello");
  });
});
```

## 📝 Environment Variables

Add to `.env`:

```bash
# Existing
OPENAI_API_KEY=sk-...

# Optional: Separate keys for better tracking
OPENAI_VISION_API_KEY=sk-...
OPENAI_DALLE_API_KEY=sk-...
OPENAI_WHISPER_API_KEY=sk-...

# Feature flags
ENABLE_VISION=true
ENABLE_IMAGE_GENERATION=true
ENABLE_TRANSCRIPTION=true
```

## ✅ Deployment Checklist

1. [ ] Update OpenAI API key with proper permissions
2. [ ] Test file upload limits (10MB recommended)
3. [ ] Configure CORS for media uploads
4. [ ] Set up CDN for generated images
5. [ ] Monitor API costs closely
6. [ ] Add rate limiting for expensive operations
7. [ ] Test on mobile devices
8. [ ] Update documentation

## 🎯 Success Metrics

- Vision analysis < 3s response time
- Image generation < 15s
- Audio transcription < 5s for 1-minute clips
- Cost per multimodal interaction < $0.10
- User satisfaction > 90%

---

Ready to bring these features to life! 🚀
