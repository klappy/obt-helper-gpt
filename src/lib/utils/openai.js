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
 * @property {string} systemPrompt
 * @property {string} model
 * @property {number} temperature
 * @property {number} maxTokens
 * @property {number} costCeiling
 * @property {string} fallbackModel
 */

// Store instance for summaries
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

// Issue 1.2.3: Get tool configuration from storage
async function getTool(toolId) {
  try {
    // This would typically fetch from the same store as tools.js
    // For now, we'll need to implement a way to access tool configs
    const { getAllTools } = await import('../stores/tools.js');
    const tools = getAllTools();
    return tools.find(t => t.id === toolId);
  } catch (error) {
    console.error(`Error getting tool ${toolId}:`, error);
    return null;
  }
}

// Issue 1.2.3: Select appropriate model based on cost ceiling
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
    // Fail gracefully - return original model
    return originalModel;
  }
}

/**
 * Send a chat message to OpenAI API
 * @param {Message[]} messages
 * @param {Tool} tool
 * @param {string} apiKey
 * @returns {Promise<Response>}
 */
export async function sendChatMessage(messages, tool, apiKey) {
  try {
    // Issue 1.2.3: Apply cost ceiling check and model selection
    const selectedModel = await selectModelForTool(tool.id, tool.model);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel, // Use selected model instead of tool.model
        messages: [
          {
            role: "system",
            content: tool.systemPrompt,
          },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: tool.temperature || 0.7,
        max_tokens: Math.min(tool.maxTokens || 1000, 1000), // Limit to 1000 tokens for WhatsApp
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    throw error;
  }
}

// Issue 1.1.2: Generate summary using OpenAI
export async function generateSummary(chatHistory) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper for summaries
        messages: [{
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences, focusing on key topics and outcomes.'
        }, {
          role: 'user',
          content: chatHistory
        }],
        max_tokens: 150,
        temperature: 0.3 // Lower temperature for more consistent summaries
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Summary generation failed:", error);
    throw error;
  }
}

// Issue 1.1.2: Store summary in Netlify Blobs
export async function summarizeAndStore(sessionId, messages) {
  try {
    const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const summary = await generateSummary(chatHistory);
    
    // Store in Netlify Blobs with key: summary-{sessionId}
    const store = getSummaryStore();
    const summaryData = {
      sessionId,
      summary,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    };
    
    await store.setJSON(`summary-${sessionId}`, summaryData);
    console.log(`Summary stored for session ${sessionId}:`, summary.substring(0, 100) + '...');
    
    return summaryData;
  } catch (error) {
    console.error(`Failed to summarize and store session ${sessionId}:`, error);
    throw error;
  }
}

// Issue 1.1.2: Retrieve stored summaries for a user/tool
export async function fetchUserSummaries(userId = 'anonymous', toolId = null, limit = 10) {
  try {
    const store = getSummaryStore();
    
    // List all summary keys
    const { blobs } = await store.list({ prefix: 'summary-' });
    
    // Get summaries and filter if needed
    const summaries = [];
    for (const blob of blobs.slice(0, limit * 2)) { // Get more than needed for filtering
      try {
        const summaryData = await store.get(blob.key, { type: 'json' });
        if (summaryData) {
          // Add filtering logic here if userId/toolId matching is needed
          summaries.push(summaryData);
        }
      } catch (error) {
        console.log(`Could not load summary ${blob.key}:`, error.message);
      }
    }
    
    // Sort by timestamp (newest first) and limit
    return summaries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch user summaries:", error);
    return [];
  }
}

/**
 * Parse streaming response from OpenAI
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

// Issue 2.1.1: Intelligent tool inference using LLM
export async function inferToolFromMessage(message, currentTool, apiKey) {
  try {
    // Get available tools (import from functions since we're in utility)
    const { getAllTools } = await import('../../netlify/functions/tools.js');
    const tools = await getAllTools();
    
    // Create tool descriptions for the LLM
    const toolDescriptions = tools.map(t => 
      `${t.id}: ${t.name} - ${t.description}`
    ).join('\n');
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper model for classification
        messages: [{
          role: 'system',
          content: `You are a tool classifier for an AI assistant platform. Given a user message and available tools, suggest the BEST tool ID or return "none" if the current tool is fine.

Available tools:
${toolDescriptions}

Current tool: ${currentTool}

Rules:
- Only suggest a switch if the new tool is CLEARLY better for this specific message
- Return ONLY the tool ID (e.g. "creative-writing") or "none"
- Be conservative - don't switch unless the message obviously needs a different tool
- Consider the context: if someone is mid-conversation, prefer keeping the current tool unless very obvious switch needed`
        }, {
          role: 'user',
          content: `Message: "${message}"`
        }],
        max_tokens: 50,
        temperature: 0.1 // Low temperature for consistent classification
      }),
    });

    if (!response.ok) {
      console.error("Intent inference API error:", response.status);
      return null;
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    
    console.log(`Intent inference: "${message}" -> suggested tool: ${suggestion || 'none'}`);
    
    return suggestion === 'none' ? null : suggestion;
  } catch (error) {
    console.error("Intent inference failed:", error);
    return null; // Graceful fallback - no tool switch
  }
}
