import twilioClient from "../../src/lib/utils/twilio.js";
import {
  getSession,
  saveSession,
  getOrCreateSession,
} from "../../src/lib/utils/whatsapp-session.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";
import { sendChatMessage } from "../../src/lib/utils/openai.js";
import { getToolsData } from "./tools.js";

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
      session = await getOrCreateSession(from);
    } catch (error) {
      console.error("Session error (using temp session):", error);
      // Create a temporary in-memory session
      session = {
        phoneNumber: from,
        currentToolId: null,
        history: [],
        createdAt: new Date().toISOString(),
      };
    }

    // Add user message to history
    session.history.push({
      role: "user",
      content: messageBody,
    });

    // Update last active time
    session.lastActive = new Date().toISOString();

    // Get AI response based on current tool
    let responseText;
    try {
      // Default tool if none selected
      if (!session.currentToolId) {
        session.currentToolId = "creative-writing";
      }

      // Get tool configuration
      const tools = await getToolsData();
      const currentTool = tools.find((t) => t.id === session.currentToolId) || tools[0];

      // Prepare messages for OpenAI
      const messages = [
        { role: "system", content: currentTool.systemPrompt },
        ...session.history.slice(-10).map((msg) => ({
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
      const tools = await getToolsData();
      responseText = "🤖 *OBT Helper GPT* 🤖\n\n";
      responseText += "I can help you with:\n\n";
      tools.forEach((tool, index) => {
        responseText += `${index + 1}. *${tool.name}* - ${tool.description}\n`;
      });
      responseText += "\nReply with a number to switch tools, or just start chatting!";
    } else if (/^[1-9]$/.test(lowerMessage.trim())) {
      // User sent a single digit
      const tools = await getToolsData();
      const toolIndex = parseInt(lowerMessage.trim()) - 1;
      if (toolIndex >= 0 && toolIndex < tools.length) {
        session.currentToolId = tools[toolIndex].id;
        responseText = `Switched to *${tools[toolIndex].name}*! ${tools[toolIndex].description}\n\nHow can I help you?`;
      }
    }

    // Add assistant response to history
    session.history.push({
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
      await twilioClient.messages.create({
        body: responseText,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: from,
      });
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

    // Try to log usage but don't fail if it doesn't work
    try {
      await logAIUsage({
        toolId: session.currentToolId || "unknown",
        model: "gpt-4o-mini",
        tokensUsed: responseText.length * 0.25, // Rough estimate
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
      const from = new URLSearchParams(await req.text()).get("From");
      if (from && twilioClient) {
        await twilioClient.messages.create({
          body: "Sorry, I'm having technical difficulties right now. Please try again later.",
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          to: from,
        });
      }
    } catch (innerError) {
      console.error("Failed to send error message:", innerError);
    }

    // Always return 200 to prevent Twilio retries
    return respondToTwilio(200, "Error handled");
  }
};
