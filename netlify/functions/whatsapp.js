import twilioClient from "../../src/lib/utils/twilio.js";
import { getSession, saveSession, addUsage } from "../../src/lib/utils/whatsapp-session.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";

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
    // Get Twilio config with fallback
    let twilioClient;
    try {
      twilioClient = getTwilioClient();
    } catch (error) {
      console.error("Twilio client initialization failed:", error);
      // Still acknowledge the webhook to prevent retries
      return respondToTwilio(200, "Configuration error");
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

    // Add user message to conversation history
    session.conversationHistory.push({
      role: "user",
      content: messageBody,
      timestamp: new Date().toISOString(),
      type: "text",
    });

    // Update metadata
    session.metadata.lastActivity = new Date().toISOString();
    session.metadata.messageCount++;

    // Simple response for now (you'd integrate with OpenAI here)
    let responseText = "I received your message! This is a test response from the WhatsApp bot.";

    // Check if user wants to change tools
    if (messageBody.toLowerCase().includes("help") || messageBody.toLowerCase().includes("tools")) {
      responseText = `Available tools: Creative Writing, Math Tutor, Code Helper, Recipe Helper, Language Buddy. Say something like "use math tutor" to switch tools.`;
    } else if (messageBody.toLowerCase().includes("use ")) {
      const toolMatch = messageBody.toLowerCase().match(/use (\w+)/);
      if (toolMatch) {
        const toolName = toolMatch[1];
        // Simple tool mapping
        const toolMap = {
          math: "math-tutor",
          code: "code-helper",
          recipe: "recipe-helper",
          writing: "creative-writing",
          language: "language-buddy",
        };

        if (toolMap[toolName]) {
          session.currentTool = toolMap[toolName];
          responseText = `Switched to ${toolName} tool! How can I help you with ${toolName}?`;
        }
      }
    }

    // Add assistant response to conversation history
    session.conversationHistory.push({
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
      type: "text",
    });

    // Mock usage tracking
    const usage = {
      tokens: 50,
      estimatedCost: 0.001,
    };

    session.usage.tokens += usage.tokens;
    session.usage.cost += usage.estimatedCost;

    // Save session
    await saveSession(session);

    // Log AI usage
    await logAIUsage({
      sessionId,
      toolId: session.currentTool,
      model: "gpt-4o-mini",
      tokens: usage.tokens,
      estimatedCost: usage.estimatedCost,
      source: "whatsapp",
      phoneNumber: phoneNumber,
    });

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
