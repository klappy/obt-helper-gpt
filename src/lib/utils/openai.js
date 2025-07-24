// @ts-check

import { getStore } from "@netlify/blobs";

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

/**
 * Send a chat message to OpenAI API
 * @param {Message[]} messages
 * @param {Tool} tool
 * @param {string} apiKey
 * @returns {Promise<Response>}
 */
export async function sendChatMessage(messages, tool, apiKey) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: tool.model || "gpt-4o-mini",
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
