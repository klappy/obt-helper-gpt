import { sendChatMessage } from "../../src/lib/utils/llm-client.js";
import { getStore } from "@netlify/blobs";
import { getAllTools } from "./tools.js";
import {
  chatLimiter,
  withRateLimit,
  getClientIdentifier,
} from "../../src/lib/utils/rate-limiter.js";
import {
  getConversationBlob,
  saveConversationBlob,
} from "../../src/lib/utils/blob-storage.js";
import {
  verifyToken,
  generateConversationId,
} from "../../src/lib/utils/auth.js";

// Storage instances
function getSessionStore() {
  return getStore({
    name: "obt-helper-sessions",
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || "local",
  });
}

function getSyncStore() {
  return getStore({
    name: "obt-helper-sync",
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || "local",
  });
}

// Get linked session data
async function getLinkedSession(webSessionId) {
  try {
    const sessionStore = getSessionStore();
    const linkDataStr = await sessionStore.get(`web-to-whatsapp-${webSessionId}`);
    return linkDataStr ? JSON.parse(linkDataStr) : null;
  } catch (error) {
    console.error("Error getting linked session:", error);
    return null;
  }
}

// Mirror message to WhatsApp - FIXED TO ACTUALLY SEND
async function mirrorToWhatsApp(linkedSession, userMessage, aiResponse) {
  try {
    const twilioClient = (await import("../../src/lib/utils/twilio.js")).default;

    console.log(`Mirroring to WhatsApp ${linkedSession.phoneNumber}:`, {
      user: userMessage.substring(0, 50) + "...",
      ai: aiResponse.substring(0, 50) + "...",
    });

    // Send 2 messages: user echo + AI response
    const userEcho = `[From Web] ${userMessage}`;
    await twilioClient.sendMessage(linkedSession.phoneNumber, userEcho);

    // Small delay between messages
    await new Promise((resolve) => setTimeout(resolve, 500));

    await twilioClient.sendMessage(linkedSession.phoneNumber, aiResponse);

    // Also store in sync queue for backup/logging
    const syncStore = getSyncStore();
    const syncData = {
      direction: "web-to-whatsapp",
      phoneNumber: linkedSession.phoneNumber,
      userMessage,
      aiResponse,
      tool: linkedSession.toolId,
      timestamp: Date.now(),
      webSessionId: linkedSession.webSessionId,
    };

    await syncStore.set(`web-mirror-${Date.now()}`, JSON.stringify(syncData));
  } catch (error) {
    console.error("Error mirroring to WhatsApp:", error);
    // Continue execution even if WhatsApp sending fails
  }
}

export default async (req, context) => {
  // Helper function for CORS-enabled responses
  const createResponse = (data, statusCode = 200, contentType = "application/json") => {
    const body = typeof data === "string" ? data : JSON.stringify(data);
    return new Response(body, {
      status: statusCode,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  };

  if (req.method !== "POST") {
    return createResponse("Method not allowed", 405, "text/plain");
  }

  try {
    // Handle both string and stream body
    const bodyText = typeof req.body === "string" ? req.body : await req.text();
    const { messages, tool, sessionId, userId, conversationId, helperId } = JSON.parse(bodyText);

    // Apply rate limiting
    const clientId = getClientIdentifier(req, sessionId);
    const rateCheck = withRateLimit(chatLimiter, clientId);
    if (!rateCheck.allowed) {
      return rateCheck; // Returns 429 response
    }

    // Validate required fields
    if (!messages || !tool) {
      return createResponse(
        {
          error: "Missing required fields (messages, tool)",
        },
        400
      );
    }

    // Use server-side API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return createResponse(
        {
          error: "OpenAI API key not configured on server",
        },
        500
      );
    }

    // Get the tool configuration
    const tools = await getAllTools();
    const toolConfig = tools.find((t) => t.id === tool.id);

    if (!toolConfig) {
      return createResponse(
        {
          error: "Tool not found",
        },
        404
      );
    }

    // Send to OpenAI
    const response = await sendChatMessage(messages, toolConfig, apiKey);
    const aiData = await response.json();

    if (!response.ok) {
      return createResponse(aiData, response.status);
    }

    const aiResponse = aiData.choices[0].message.content;
    const userMessage = messages[messages.length - 1].content;

    // Save conversation if userId and helperId provided
    let savedConversationId = conversationId;
    if (userId && helperId) {
      try {
        // Verify auth token if provided
        const authHeader = req.headers.get?.("Authorization") || req.headers?.authorization;
        let authenticated = false;
        
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const payload = verifyToken(token);
          if (payload && payload.userId === userId) {
            authenticated = true;
          }
        }

        if (authenticated) {
          // Get or create conversation
          let conversation;
          let convId = conversationId;

          if (convId) {
            conversation = await getConversationBlob(userId, convId);
            if (!conversation || conversation.userId !== userId) {
              conversation = null; // Create new if invalid
              convId = null;
            }
          }

          if (!conversation) {
            // Create new conversation
            convId = convId || generateConversationId();
            const now = new Date().toISOString();
            conversation = {
              id: convId,
              userId,
              helperId,
              messages: [],
              createdAt: now,
              updatedAt: now,
              messageCount: 0,
              title: "New Conversation",
            };
          }

          // Add new messages
          const userMsg = {
            role: "user",
            content: userMessage,
            timestamp: new Date().toISOString(),
          };

          const assistantMsg = {
            role: "assistant",
            content: aiResponse,
            timestamp: new Date().toISOString(),
          };

          conversation.messages.push(userMsg, assistantMsg);
          conversation.messageCount = conversation.messages.length;
          conversation.updatedAt = new Date().toISOString();

          // Auto-generate title from first user message if still "New Conversation"
          if (conversation.title === "New Conversation" && conversation.messages.length === 2) {
            conversation.title = userMessage.substring(0, 50).trim() || "New Conversation";
          }

          // Save conversation
          await saveConversationBlob(userId, convId, conversation);
          savedConversationId = convId;
        }
      } catch (error) {
        // Log error but don't fail the chat request
        console.error("Error saving conversation:", error);
      }
    }

    // Check for linked WhatsApp session and mirror if found
    if (sessionId) {
      const linkedSession = await getLinkedSession(sessionId);
      if (linkedSession) {
        console.log(`Session ${sessionId} is linked to WhatsApp ${linkedSession.phoneNumber}`);
        await mirrorToWhatsApp(linkedSession, userMessage, aiResponse);
      }
    }

    // Return the AI response with rate limit headers and conversation ID
    const responseData = {
      ...aiData,
      conversationId: savedConversationId, // Include conversation ID in response
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        ...rateCheck.headers,
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return createResponse(
      {
        error: "Internal server error",
        details: error.message,
      },
      500
    );
  }
};
