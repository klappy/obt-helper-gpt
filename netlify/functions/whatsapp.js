import twilioClient from "../../src/lib/utils/twilio.js";
// Using direct Netlify Blobs storage instead of utility
import { getStore } from "@netlify/blobs";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";
import { sendChatMessage } from "../../src/lib/utils/llm-client.js";
import { getAllTools } from "./tools.js";
import {
  whatsappLimiter,
  withRateLimit,
  getClientIdentifier,
} from "../../src/lib/utils/rate-limiter.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Storage instances for mirroring
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

// Check if WhatsApp session is linked to web
async function getLinkedWebSession(whatsappSessionId) {
  try {
    const sessionStore = getSessionStore();
    const linkDataStr = await sessionStore.get(`whatsapp-to-web-${whatsappSessionId}`);
    return linkDataStr ? JSON.parse(linkDataStr) : null;
  } catch (error) {
    console.error("Error getting linked web session:", error);
    return null;
  }
}

// Mirror message to web session - ENHANCED WITH 2-MESSAGE PATTERN
async function mirrorToWeb(linkedSession, userMessage, aiResponse) {
  try {
    const syncStore = getSyncStore();

    console.log(`Mirroring to Web ${linkedSession.webSessionId}:`, {
      user: userMessage.substring(0, 50) + "...",
      ai: aiResponse.substring(0, 50) + "...",
    });

    // Store 2 separate messages: user echo + AI response
    const timestamp = Date.now();

    // 1. User message echo
    const userSyncData = {
      direction: "whatsapp-to-web",
      webSessionId: linkedSession.webSessionId,
      userMessage,
      aiResponse: null, // Mark as user message only
      tool: linkedSession.toolId,
      timestamp: timestamp,
      phoneNumber: linkedSession.phoneNumber,
      messageType: "user",
    };

    // 2. AI response
    const aiSyncData = {
      direction: "whatsapp-to-web",
      webSessionId: linkedSession.webSessionId,
      userMessage: null, // Mark as AI response only
      aiResponse,
      tool: linkedSession.toolId,
      timestamp: timestamp + 1, // Slightly later timestamp
      phoneNumber: linkedSession.phoneNumber,
      messageType: "ai",
    };

    // Store both for web client to poll
    await syncStore.set(`whatsapp-mirror-user-${timestamp}`, JSON.stringify(userSyncData));
    await syncStore.set(`whatsapp-mirror-ai-${timestamp}`, JSON.stringify(aiSyncData));
  } catch (error) {
    console.error("Error mirroring to web:", error);
  }
}

// Issue 2.1.1: Intelligent tool inference using LLM (server-side function)
async function inferToolFromMessage(message, currentTool) {
  try {
    const tools = await getAllTools();

    // Create tool descriptions for the LLM
    const toolDescriptions = tools.map((t) => `${t.id}: ${t.name} - ${t.description}`).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cheaper model for classification
        messages: [
          {
            role: "system",
            content: `You are a tool classifier for an AI assistant platform. Given a user message and available tools, suggest the BEST tool ID or return "none" if the current tool is fine.

Available tools:
${toolDescriptions}

Current tool: ${currentTool}

Rules:
- Only suggest a switch if the new tool is CLEARLY better for this specific message
- Return ONLY the tool ID (e.g. "creative-writing") or "none"
- Be conservative - don't switch unless the message obviously needs a different tool
- Consider the context: if someone is mid-conversation, prefer keeping the current tool unless very obvious switch needed`,
          },
          {
            role: "user",
            content: `Message: "${message}"`,
          },
        ],
        max_tokens: 50,
        temperature: 0.1, // Low temperature for consistent classification
      }),
    });

    if (!response.ok) {
      console.error("Intent inference API error:", response.status);
      return null;
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();

    console.log(`Intent inference: "${message}" -> suggested tool: ${suggestion || "none"}`);

    return suggestion === "none" ? null : suggestion;
  } catch (error) {
    console.error("Intent inference failed:", error);
    return null; // Graceful fallback - no tool switch
  }
}

// Storage functions that match the admin dashboard
function getStoreInstance() {
  return getStore({
    name: "obt-helper-whatsapp",
    consistency: "strong",
  });
}

async function getSessionFromStore(phoneNumber) {
  try {
    const sessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, "")}`;
    const store = getStoreInstance();
    const session = await store.get(sessionId, { type: "json" });
    return session;
  } catch (error) {
    console.error("Error getting session from store:", error);
    return null;
  }
}

async function saveSessionToStore(session) {
  try {
    const store = getStoreInstance();
    await store.setJSON(session.sessionId, session);
    console.log("Session saved to store:", session.sessionId);
  } catch (error) {
    console.error("Error saving session to store:", error);
    throw error;
  }
}

export default async (req, context) => {
  console.log("WhatsApp webhook called");

  // Always try to respond to Twilio to avoid retries
  const respondToTwilio = (statusCode = 200, message = "") => {
    return new Response(message, {
      status: statusCode,
      headers: { "Content-Type": "text/plain" },
    });
  };

  // Apply rate limiting for WhatsApp webhooks
  const clientId = getClientIdentifier(req, null);
  const rateCheck = withRateLimit(whatsappLimiter, clientId);
  if (!rateCheck.allowed) {
    console.log(`Rate limit exceeded for WhatsApp webhook from ${clientId}`);
    return respondToTwilio(429, "Rate limit exceeded");
  }

  // Declare variables in outer scope for error handler access
  let from = null;
  let messageBody = null;

  try {
    // Check Twilio config
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.error("Missing Twilio environment variables");
      return respondToTwilio(200, "Configuration error - missing Twilio credentials");
    }

    // Parse the request
    const body = await req.text();
    const params = new URLSearchParams(body);
    from = params.get("From");
    messageBody = params.get("Body");

    if (!from || !messageBody) {
      return respondToTwilio(400, "Missing required parameters");
    }

    console.log("WhatsApp message received:", { from, body: messageBody });

    // Get or create session with fallback
    let session;
    try {
      session = await getSessionFromStore(from);

      // If session is null, create a new one
      if (!session) {
        console.log("No existing session found, creating new session");
        const now = new Date().toISOString();
        const sessionId = `whatsapp_${from.replace(/[^\d]/g, "")}`;
        session = {
          sessionId,
          phoneNumber: from,
          currentTool: "creative-writing",
          language: "en",
          conversationHistory: [],
          metadata: {
            startTime: now,
            lastActivity: now,
            messageCount: 0,
          },
          usage: {
            cost: 0,
            tokens: 0,
          },
        };
      } else {
        console.log("Existing session found:", session.sessionId);
      }
    } catch (error) {
      console.error("Session error (using temp session):", error);
      // Create a temporary in-memory session matching admin dashboard format
      const now = new Date().toISOString();
      const sessionId = `whatsapp_${from.replace(/[^\d]/g, "")}`;
      session = {
        sessionId,
        phoneNumber: from,
        currentTool: "creative-writing",
        language: "en",
        conversationHistory: [],
        metadata: {
          startTime: now,
          lastActivity: now,
          messageCount: 0,
        },
        usage: {
          cost: 0,
          tokens: 0,
        },
      };
    }

    // Add user message to conversation history
    if (!session.conversationHistory) {
      session.conversationHistory = [];
    }
    session.conversationHistory.push({
      role: "user",
      content: messageBody,
    });

    // Update metadata to match admin dashboard format
    if (!session.metadata) {
      session.metadata = {
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
      };
    }
    session.metadata.lastActivity = new Date().toISOString();
    session.metadata.messageCount = (session.metadata.messageCount || 0) + 1;

    // Ensure usage tracking matches admin dashboard format
    if (!session.usage) {
      session.usage = {
        cost: 0,
        tokens: 0,
      };
    }

    // Get AI response based on current tool
    let responseText;
    try {
      console.log("Starting AI generation...");

      // Default tool if none selected
      if (!session.currentTool) {
        session.currentTool = "creative-writing";
        console.log("Set default tool: creative-writing");
      }

      // Get tool configuration
      console.log("Getting tools...");
      const tools = await getAllTools();
      console.log("Tools loaded:", tools.length);

      const currentTool = tools.find((t) => t.id === session.currentTool) || tools[0];
      console.log("Current tool:", currentTool ? currentTool.name : "NONE");

      // Prepare messages for OpenAI
      const messages = [
        { role: "system", content: currentTool.systemPrompt },
        ...session.conversationHistory.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: messageBody },
      ];

      // Get AI response
      console.log("Calling OpenAI...");
      const aiResponse = await sendChatMessage(messages, currentTool, OPENAI_API_KEY);
      console.log("OpenAI response status:", aiResponse.status);

      const aiData = await aiResponse.json();
      console.log("AI data received, has choices:", !!aiData.choices);

      if (aiData.choices && aiData.choices[0]) {
        responseText = aiData.choices[0].message.content;
        console.log("AI response length:", responseText.length);

        // Issue 2.1.3: Mirror to linked web session if exists
        const whatsappSessionId = `whatsapp_${from.replace(/[^\d]/g, "")}`;
        const linkedSession = await getLinkedWebSession(whatsappSessionId);
        if (linkedSession) {
          console.log(`Mirroring WhatsApp message to web session ${linkedSession.webSessionId}`);
          await mirrorToWeb(linkedSession, messageBody, responseText);
        }
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      responseText = "I'm having trouble thinking right now. Could you try again?";
    }

    // Issue 2.1.1: Intelligent tool switching with LLM inference and user confirmation
    const lowerMessage = messageBody.toLowerCase();

    // Handle pending tool switch confirmations first
    if (session.pendingSwitch) {
      if (lowerMessage.includes("yes") || lowerMessage.includes("y")) {
        // User confirmed switch
        const tools = await getAllTools();
        const toolInfo = tools.find((t) => t.id === session.pendingSwitch.to);
        session.currentTool = session.pendingSwitch.to;

        // Process original message with new tool
        const originalMessage = session.pendingSwitch.originalMessage;
        session.pendingSwitch = null;

        // Regenerate AI response with new tool
        const messages = [
          { role: "system", content: toolInfo.systemPrompt },
          ...session.conversationHistory.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: originalMessage },
        ];

        try {
          const aiResponse = await sendChatMessage(messages, toolInfo, OPENAI_API_KEY);
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices[0].message.content;
          responseText = `✅ *Switched to ${toolInfo.name}*\n\n${aiContent}`;

          // Issue 2.1.3: Mirror tool switch to linked web session
          const whatsappSessionId = `whatsapp_${from.replace(/[^\d]/g, "")}`;
          const linkedSession = await getLinkedWebSession(whatsappSessionId);
          if (linkedSession) {
            console.log(`Mirroring tool switch to web session ${linkedSession.webSessionId}`);
            await mirrorToWeb(linkedSession, originalMessage, responseText);
          }
        } catch (error) {
          console.error("AI generation after switch failed:", error);
          responseText = `✅ *Switched to ${toolInfo.name}*\n\nHow can I help you?`;
        }
      } else if (lowerMessage.includes("no") || lowerMessage.includes("n")) {
        // User declined switch
        const currentToolName = session.currentTool;
        session.pendingSwitch = null;
        responseText = `👍 Staying with ${currentToolName}. How can I help?`;
      } else {
        // Unclear response, ask again
        responseText =
          "Please reply *YES* to switch tools or *NO* to continue with the current tool.";
      }
    } else {
      // Check for help requests and capability questions
      if (
        lowerMessage === "help" ||
        lowerMessage === "menu" ||
        lowerMessage === "tools" ||
        lowerMessage.includes("what can you do") ||
        lowerMessage.includes("what do you do") ||
        lowerMessage.includes("capabilities") ||
        lowerMessage.includes("features") ||
        lowerMessage.includes("options") ||
        lowerMessage === "hello" ||
        lowerMessage === "hi"
      ) {
        const tools = await getAllTools();
        responseText = "🤖 *OBT Helper GPT* 🤖\n\n";
        responseText += "I'm your intelligent AI assistant! I can help you with:\n\n";

        // Add emojis for each tool
        const toolEmojis = ["✍️", "📱", "📧", "📊", "🧮", "🍳", "💻", "🌍", "🏢", "✈️"];
        tools.forEach((tool, index) => {
          const emoji = toolEmojis[index] || "🔧";
          responseText += `${emoji} *${index + 1}. ${tool.name}*\n   ${tool.description}\n\n`;
        });
        responseText +=
          "💬 *Just start chatting!* I'll automatically suggest the best tool for your needs.\n\n";
        responseText += "🔢 Or reply with a number (1-10) to manually select a tool.";
      } else if (/^[1-9]$/.test(lowerMessage.trim())) {
        // User sent a single digit for manual tool selection
        const tools = await getAllTools();
        const toolIndex = parseInt(lowerMessage.trim()) - 1;
        if (toolIndex >= 0 && toolIndex < tools.length) {
          session.currentTool = tools[toolIndex].id;
          responseText = `✅ *Switched to ${tools[toolIndex].name}*! ${tools[toolIndex].description}\n\nHow can I help you?`;
        }
      } else {
        // Issue 2.1.1: Use LLM to intelligently infer best tool for message
        try {
          const suggestedTool = await inferToolFromMessage(messageBody, session.currentTool);

          if (suggestedTool && suggestedTool !== session.currentTool) {
            // LLM suggests a different tool - ask for confirmation
            const tools = await getAllTools();
            const toolInfo = tools.find((t) => t.id === suggestedTool);

            if (toolInfo) {
              console.log(`LLM suggests switching from ${session.currentTool} to ${suggestedTool}`);

              // Store pending switch with original message
              session.pendingSwitch = {
                to: suggestedTool,
                originalMessage: messageBody,
                timestamp: Date.now(),
              };

              responseText = `🤔 I think *${toolInfo.name}* would be better for this request.\n\n*Switch tools?*\n\n✅ Reply *YES* to switch\n❌ Reply *NO* to continue with ${session.currentTool}`;
            }
          }
          // If no tool switch suggested, responseText will be the normal AI response from earlier
        } catch (error) {
          console.error("Intent inference error:", error);
          // Continue with normal processing if inference fails
        }
      }
    }

    // Add assistant response to conversation history
    session.conversationHistory.push({
      role: "assistant",
      content: responseText,
    });

    // Try to save session but don't fail if it doesn't work
    try {
      await saveSessionToStore(session);
    } catch (error) {
      console.error("Failed to save session (will continue):", error);
    }

    // Send response with multiple fallbacks
    try {
      console.log("Sending WhatsApp message...");
      await twilioClient.sendMessage(from.replace("whatsapp:", ""), responseText);
      console.log("WhatsApp message sent successfully");
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      // Could implement email notification or other fallback here
    }

    // Try to save session but don't fail if it doesn't work
    try {
      await saveSessionToStore(session);
    } catch (error) {
      console.error("Failed to save session (will continue):", error);
    }

    // Update session usage and log AI usage
    const estimatedTokens = Math.ceil(responseText.length * 0.25);
    const estimatedCost = estimatedTokens * 0.000002; // Rough GPT-4o-mini pricing

    session.usage.tokens += estimatedTokens;
    session.usage.cost += estimatedCost;

    try {
      await logAIUsage({
        toolId: session.currentTool || "unknown",
        model: "gpt-4o-mini",
        tokensUsed: estimatedTokens,
        feature: "whatsapp",
      });
    } catch (error) {
      console.error("Failed to log usage (will continue):", error);
    }

    return respondToTwilio(200);
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);

    // Try to send error message to user
    try {
      // We already have the 'from' variable from earlier, no need to re-read body
      if (from && twilioClient) {
        await twilioClient.sendMessage(
          from.replace("whatsapp:", ""),
          "Sorry, I'm having technical difficulties right now. Please try again later."
        );
      }
    } catch (innerError) {
      console.error("Failed to send error message:", innerError);
    }

    // Always return 200 to prevent Twilio retries
    return respondToTwilio(200, "Error handled");
  }
};
