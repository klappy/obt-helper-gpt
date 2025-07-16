import twilioClient from "../../src/lib/utils/twilio.js";
import { getSession, saveSession } from "../../src/lib/utils/whatsapp-session.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";
import { sendChatMessage } from "../../src/lib/utils/openai.js";
import { getAllTools } from "./tools.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async (req, context) => {
  console.log("WhatsApp webhook called");

  // Always try to respond to Twilio to avoid retries
  const respondToTwilio = (statusCode = 200, message = "") => {
    return new Response(message, {
      status: statusCode,
      headers: { "Content-Type": "text/plain" },
    });
  };

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
    const from = params.get("From");
    const messageBody = params.get("Body");

    if (!from || !messageBody) {
      return respondToTwilio(400, "Missing required parameters");
    }

    console.log("WhatsApp message received:", { from, body: messageBody });

    // Get or create session with fallback
    let session;
    try {
      session = await getSession(from);
    } catch (error) {
      console.error("Session error (using temp session):", error);
      // Create a temporary in-memory session
      session = {
        phoneNumber: from,
        currentTool: null,
        conversationHistory: [],
        createdAt: new Date().toISOString(),
        usage: { totalTokens: 0, totalCost: 0, messageCount: 0 },
        metadata: {},
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

    // Update metadata
    if (!session.metadata) {
      session.metadata = {
        startTime: session.createdAt || new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
      };
    }
    session.metadata.lastActivity = new Date().toISOString();
    session.metadata.messageCount = (session.metadata.messageCount || 0) + 1;

    // Ensure usage tracking
    if (!session.usage) {
      session.usage = {
        totalTokens: 0,
        totalCost: 0,
        cost: 0,
        tokens: 0,
      };
    }

    // Get AI response based on current tool
    let responseText;
    try {
      // Default tool if none selected
      if (!session.currentTool) {
        session.currentTool = "creative-writing";
      }

      // Get tool configuration
      const tools = await getAllTools();
      const currentTool = tools.find((t) => t.id === session.currentTool) || tools[0];

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
      const aiResponse = await sendChatMessage(messages, currentTool, OPENAI_API_KEY);
      const aiData = await aiResponse.json();

      if (aiData.choices && aiData.choices[0]) {
        responseText = aiData.choices[0].message.content;
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      responseText = "I'm having trouble thinking right now. Could you try again?";
    }

    // Check if user wants help or to change tools
    const lowerMessage = messageBody.toLowerCase();
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
    }

    // Add assistant response to conversation history
    session.conversationHistory.push({
      role: "assistant",
      content: responseText,
    });

    // Try to save session but don't fail if it doesn't work
    try {
      await saveSession(session);
    } catch (error) {
      console.error("Failed to save session (will continue):", error);
    }

    // Send response with multiple fallbacks
    try {
      await twilioClient.sendMessage(from.replace("whatsapp:", ""), responseText);
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      // Could implement email notification or other fallback here
    }

    // Try to save session but don't fail if it doesn't work
    try {
      await saveSession(session);
    } catch (error) {
      console.error("Failed to save session (will continue):", error);
    }

    // Update session usage and log AI usage
    const estimatedTokens = Math.ceil(responseText.length * 0.25);
    const estimatedCost = estimatedTokens * 0.000002; // Rough GPT-4o-mini pricing

    session.usage.tokens += estimatedTokens;
    session.usage.cost += estimatedCost;
    session.usage.totalTokens = session.usage.tokens;
    session.usage.totalCost = session.usage.cost;

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
