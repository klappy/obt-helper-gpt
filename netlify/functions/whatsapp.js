import twilioClient from "../../src/lib/utils/twilio.js";
import { getSession, saveSession, addUsage } from "../../src/lib/utils/whatsapp-session.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async (request, context) => {
  // Only handle POST requests
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
    });
  }

  try {
    // Parse the request body
    const body = await request.text();
    const params = new URLSearchParams(body);
    const from = params.get("From");
    const messageBody = params.get("Body");

    console.log("WhatsApp message received:", { from, body: messageBody });

    // Verify this is a WhatsApp message
    if (!from || !from.startsWith("whatsapp:")) {
      return new Response("Invalid WhatsApp message", {
        status: 400,
      });
    }

    // Extract phone number from the 'from' field
    const phoneNumber = from;
    const sessionId = `whatsapp_${phoneNumber.replace(/[^0-9]/g, "")}`;

    // Get or create session
    let session = await getSession(sessionId);
    if (!session) {
      session = {
        sessionId,
        phoneNumber,
        currentTool: "creative-writing", // Default tool
        language: "en",
        conversationHistory: [],
        metadata: {
          startTime: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
        },
        usage: {
          cost: 0,
          tokens: 0,
        },
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

    // Send response via Twilio
    try {
      await twilioClient.messages.create({
        body: responseText,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`, // Your Twilio WhatsApp number
        to: from,
      });
    } catch (twilioError) {
      console.error("Error sending Twilio message:", twilioError);
      // Continue even if Twilio fails in development
    }

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseText}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
};
