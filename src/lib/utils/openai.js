// @ts-check

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
        max_tokens: tool.maxTokens || 2048,
        stream: true,
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
