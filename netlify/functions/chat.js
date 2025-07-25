import { sendChatMessage } from "../../src/lib/utils/llm-client.js";
import { getStore } from "@netlify/blobs";
import { getAllTools } from "./tools.js";
import {
  chatLimiter,
  withRateLimit,
  getClientIdentifier,
} from "../../src/lib/utils/rate-limiter.js";

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
    const { messages, tool, sessionId } = JSON.parse(bodyText);

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

    // Check for linked WhatsApp session and mirror if found
    if (sessionId) {
      const linkedSession = await getLinkedSession(sessionId);
      if (linkedSession) {
        console.log(`Session ${sessionId} is linked to WhatsApp ${linkedSession.phoneNumber}`);
        await mirrorToWhatsApp(linkedSession, userMessage, aiResponse);
      }
    }

    // Return the AI response with rate limit headers
    return new Response(JSON.stringify(aiData), {
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
