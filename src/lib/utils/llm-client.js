// @ts-check

import { getStore } from "@netlify/blobs";
import { getTodayCostForTool } from "./ai-usage.js";

/**
 * @typedef {Object} Message
 * @property {string} role
 * @property {string} content
 */

/**
 * @typedef {Object} Tool
 * @property {string} id
 * @property {string} systemPrompt
 * @property {string} model
 * @property {number} temperature
 * @property {number} maxTokens
 * @property {number} costCeiling
 * @property {string} fallbackModel
 */

/**
 * @typedef {Object} LLMResponse
 * @property {string} content
 * @property {Object} usage
 * @property {string} model
 * @property {string} provider
 */

// Store instance for summaries
/** @type {any} */
let summaryStore = null;

function getSummaryStore() {
  if (!summaryStore) {
    summaryStore = getStore({
      name: "obt-helper-summaries",
      consistency: "strong",
    });
  }
  return summaryStore;
}

// Base LLM Client interface
export class BaseLLMClient {
  constructor(config) {
    this.config = config;
  }

  async chat(messages, options = {}) {
    throw new Error("chat() must be implemented by provider");
  }

  async generateSummary(text) {
    throw new Error("generateSummary() must be implemented by provider");
  }

  calculateCost(promptTokens, responseTokens, model) {
    throw new Error("calculateCost() must be implemented by provider");
  }
}

// OpenAI implementation
export class OpenAIClient extends BaseLLMClient {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error("OpenAI API key not configured");
    }
  }

  async chat(messages, options = {}) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.config.defaultModel || "gpt-4o-mini",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: options.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    if (options.stream) {
      return response; // Return raw response for streaming
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      provider: "openai",
      rawResponse: response,
    };
  }

  async generateSummary(text) {
    const messages = [
      {
        role: "system",
        content:
          "Summarize this conversation in 2-3 sentences, focusing on key topics and outcomes.",
      },
      {
        role: "user",
        content: text,
      },
    ];

    const response = await this.chat(messages, {
      model: "gpt-4o-mini",
      maxTokens: 150,
      temperature: 0.3,
    });

    return response.content;
  }

  calculateCost(promptTokens, responseTokens, model = "gpt-4o-mini") {
    const pricing = {
      "gpt-4o": { prompt: 0.03, response: 0.06 },
      "gpt-4o-mini": { prompt: 0.00015, response: 0.0006 },
    };

    const rates = pricing[model] || pricing["gpt-4o-mini"];
    return (promptTokens * rates.prompt + responseTokens * rates.response) / 1000;
  }
}

// Mock/Testing client
export class MockLLMClient extends BaseLLMClient {
  async chat(messages, options = {}) {
    const lastMessage = messages[messages.length - 1].content;
    return {
      content: `Mock response to: "${lastMessage}"`,
      usage: { prompt_tokens: 50, completion_tokens: 30 },
      model: "mock-model",
      provider: "mock",
    };
  }

  async generateSummary(text) {
    return `Mock summary of: ${text.substring(0, 50)}...`;
  }

  calculateCost(promptTokens, responseTokens, model) {
    return 0.001; // Mock cost
  }
}

// Global client instance
let globalClient = null;

// Get the configured LLM client
export function getLLMClient(provider = "openai") {
  if (!globalClient) {
    switch (provider) {
      case "openai":
        globalClient = new OpenAIClient({
          defaultModel: "gpt-4o-mini",
        });
        break;
      case "mock":
        globalClient = new MockLLMClient({});
        break;
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }
  return globalClient;
}

// BACKWARD COMPATIBILITY FUNCTIONS
// These maintain the existing API for current code

// Get tool configuration from storage
async function getTool(toolId) {
  try {
    const { getAllTools } = await import("../stores/tools.js");
    const tools = getAllTools();
    return tools.find((t) => t.id === toolId);
  } catch (error) {
    console.error(`Error getting tool ${toolId}:`, error);
    return null;
  }
}

// Select appropriate model based on cost ceiling
export async function selectModelForTool(toolId, originalModel) {
  try {
    const todayCost = await getTodayCostForTool(toolId);
    const tool = await getTool(toolId);

    if (!tool) {
      console.warn(`Tool ${toolId} not found, using original model ${originalModel}`);
      return originalModel;
    }

    // Check if cost ceiling is set and exceeded
    if (tool.costCeiling && tool.costCeiling > 0 && todayCost >= tool.costCeiling) {
      console.log(`Cost ceiling hit for ${toolId}: $${todayCost} >= $${tool.costCeiling}`);

      if (tool.fallbackModel) {
        console.log(`Downgrading from ${originalModel} to ${tool.fallbackModel}`);
        return tool.fallbackModel;
      } else {
        console.log(`No fallback model configured for ${toolId}, tool disabled`);
        throw new Error(`Tool ${toolId} has exceeded its daily cost limit of $${tool.costCeiling}`);
      }
    }

    return originalModel;
  } catch (error) {
    console.error(`Error selecting model for tool ${toolId}:`, error);
    if (error.message.includes("exceeded its daily cost limit")) {
      throw error;
    }
    return originalModel;
  }
}

/**
 * Send a chat message to OpenAI API (backward compatibility)
 * @param {Message[]} messages
 * @param {Tool} tool
 * @param {string} apiKey
 * @returns {Promise<Response>}
 */
export async function sendChatMessage(messages, tool, apiKey) {
  try {
    // Apply cost ceiling check and model selection
    const selectedModel = await selectModelForTool(tool.id, tool.model);

    const client = getLLMClient("openai");

    // Prepare messages with system prompt
    const fullMessages = [
      {
        role: "system",
        content: tool.systemPrompt,
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await client.chat(fullMessages, {
      model: selectedModel,
      temperature: tool.temperature || 0.7,
      maxTokens: Math.min(tool.maxTokens || 1000, 1000), // Limit for WhatsApp
      stream: false,
    });

    // Return raw response for backward compatibility
    return response.rawResponse;
  } catch (error) {
    console.error("LLM API call failed:", error);
    throw error;
  }
}

// Generate summary using LLM (backward compatibility)
export async function generateSummary(chatHistory) {
  try {
    const client = getLLMClient("openai");
    return await client.generateSummary(chatHistory);
  } catch (error) {
    console.error("Summary generation failed:", error);
    throw error;
  }
}

// Store summary in Netlify Blobs (backward compatibility)
export async function summarizeAndStore(sessionId, messages) {
  try {
    const chatHistory = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const summary = await generateSummary(chatHistory);

    const store = getSummaryStore();
    const summaryData = {
      sessionId,
      summary,
      messageCount: messages.length,
      timestamp: new Date().toISOString(),
    };

    await store.setJSON(`summary-${sessionId}`, summaryData);
    console.log(`Summary stored for session ${sessionId}:`, summary.substring(0, 100) + "...");

    return summaryData;
  } catch (error) {
    console.error(`Failed to summarize and store session ${sessionId}:`, error);
    throw error;
  }
}

// Retrieve stored summaries (backward compatibility)
export async function fetchUserSummaries(userId = "anonymous", toolId = null, limit = 10) {
  try {
    const store = getSummaryStore();

    const { blobs } = await store.list({ prefix: "summary-" });

    const summaries = [];
    for (const blob of blobs.slice(0, limit * 2)) {
      try {
        const summaryData = await store.get(blob.key, { type: "json" });
        if (summaryData) {
          summaries.push(summaryData);
        }
      } catch (error) {
        console.log(`Could not load summary ${blob.key}:`, error.message);
      }
    }

    return summaries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch user summaries:", error);
    return [];
  }
}

/**
 * Parse streaming response (backward compatibility)
 * @param {Response} response
 * @returns {AsyncGenerator<string, void, unknown>}
 */
export async function* parseStreamingResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parsing errors for incomplete chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
