import twilioClient from "../../src/lib/utils/twilio.js";
// Using direct Netlify Blobs storage instead of utility
import { getStore } from "@netlify/blobs";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";
import { sendChatMessage } from "../../src/lib/utils/openai.js";
import { getAllTools } from "./tools.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      responseText = "I'm having trouble thinking right now. Could you try again?";
    }

    // Intelligent tool detection based on user intent
    const lowerMessage = messageBody.toLowerCase();

    // Check for explicit commands first
    if (lowerMessage === "help" || lowerMessage === "menu" || lowerMessage === "tools") {
      const tools = await getAllTools();
      responseText = "🤖 *OBT Helper GPT* 🤖\n\n";
      responseText += "I can help you with:\n\n";
      tools.forEach((tool, index) => {
        responseText += `${index + 1}. *${tool.name}* - ${tool.description}\n`;
      });
      responseText += "\nReply with a number to switch tools, or just start chatting!";
    } else if (/^[1-9]$/.test(lowerMessage.trim())) {
      // User sent a single digit
      const tools = await getAllTools();
      const toolIndex = parseInt(lowerMessage.trim()) - 1;
      if (toolIndex >= 0 && toolIndex < tools.length) {
        session.currentTool = tools[toolIndex].id;
        responseText = `Switched to *${tools[toolIndex].name}*! ${tools[toolIndex].description}\n\nHow can I help you?`;
      }
    } else {
      // Auto-detect best tool based on user intent
      const detectedTool = detectBestTool(messageBody);
      if (detectedTool && detectedTool !== session.currentTool) {
        console.log(
          `Auto-switching from ${session.currentTool} to ${detectedTool} based on user intent`
        );
        session.currentTool = detectedTool;

        // Find tool name for user feedback
        const tools = await getAllTools();
        const toolInfo = tools.find((t) => t.id === detectedTool);
        const toolName = toolInfo ? toolInfo.name : detectedTool;

        // Add a subtle notification about the switch
        responseText = `*[Switched to ${toolName}]*\n\n`;
      }
    }

    // Function to detect the best tool based on user message
    function detectBestTool(message) {
      const msg = message.toLowerCase();

      // Recipe/Food keywords
      if (
        msg.includes("hungry") ||
        msg.includes("recipe") ||
        msg.includes("cook") ||
        msg.includes("food") ||
        msg.includes("eat") ||
        msg.includes("meal") ||
        msg.includes("dinner") ||
        msg.includes("lunch") ||
        msg.includes("breakfast") ||
        msg.includes("ingredient") ||
        msg.includes("bake") ||
        msg.includes("kitchen")
      ) {
        return "recipe-helper";
      }

      // Math keywords
      if (
        msg.includes("calculate") ||
        msg.includes("math") ||
        msg.includes("solve") ||
        msg.includes("equation") ||
        msg.includes("algebra") ||
        msg.includes("geometry") ||
        /\d+\s*[\+\-\*\/]\s*\d+/.test(msg) ||
        msg.includes("percent") ||
        msg.includes("formula") ||
        msg.includes("statistics")
      ) {
        return "math-tutor";
      }

      // Code keywords
      if (
        msg.includes("code") ||
        msg.includes("program") ||
        msg.includes("debug") ||
        msg.includes("javascript") ||
        msg.includes("python") ||
        msg.includes("html") ||
        msg.includes("css") ||
        msg.includes("function") ||
        msg.includes("variable") ||
        msg.includes("api") ||
        msg.includes("database") ||
        msg.includes("git")
      ) {
        return "code-helper";
      }

      // Writing keywords
      if (
        msg.includes("story") ||
        msg.includes("write") ||
        msg.includes("essay") ||
        msg.includes("poem") ||
        msg.includes("script") ||
        msg.includes("novel") ||
        msg.includes("character") ||
        msg.includes("plot") ||
        msg.includes("creative")
      ) {
        return "creative-writing";
      }

      // Business keywords
      if (
        msg.includes("business") ||
        msg.includes("strategy") ||
        msg.includes("marketing") ||
        msg.includes("startup") ||
        msg.includes("revenue") ||
        msg.includes("profit") ||
        msg.includes("investment") ||
        msg.includes("competitor") ||
        msg.includes("plan")
      ) {
        return "business-strategy";
      }

      // Travel keywords
      if (
        msg.includes("travel") ||
        msg.includes("trip") ||
        msg.includes("vacation") ||
        msg.includes("visit") ||
        msg.includes("flight") ||
        msg.includes("hotel") ||
        msg.includes("destination") ||
        msg.includes("itinerary") ||
        msg.includes("country")
      ) {
        return "travel-planner";
      }

      // Email keywords
      if (
        msg.includes("email") ||
        msg.includes("letter") ||
        msg.includes("formal") ||
        msg.includes("professional") ||
        msg.includes("communication") ||
        msg.includes("reply")
      ) {
        return "email-assistant";
      }

      // Social media keywords
      if (
        msg.includes("social") ||
        msg.includes("post") ||
        msg.includes("instagram") ||
        msg.includes("twitter") ||
        msg.includes("linkedin") ||
        msg.includes("caption") ||
        msg.includes("hashtag") ||
        msg.includes("viral")
      ) {
        return "social-media";
      }

      // Language learning keywords
      if (
        msg.includes("translate") ||
        msg.includes("language") ||
        msg.includes("spanish") ||
        msg.includes("french") ||
        msg.includes("german") ||
        msg.includes("practice") ||
        msg.includes("pronunciation") ||
        msg.includes("grammar")
      ) {
        return "language-buddy";
      }

      // Data analysis keywords
      if (
        msg.includes("data") ||
        msg.includes("analyze") ||
        msg.includes("chart") ||
        msg.includes("graph") ||
        msg.includes("excel") ||
        msg.includes("spreadsheet") ||
        msg.includes("report") ||
        msg.includes("insights") ||
        msg.includes("trends")
      ) {
        return "data-analyst";
      }

      // Default: keep current tool
      return null;
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
