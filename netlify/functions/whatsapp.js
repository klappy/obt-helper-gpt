import twilioClient from "../../src/lib/utils/twilio.js";
import { getSession, saveSession, addUsage } from "../../src/lib/utils/whatsapp-session.js";
import { logAIUsage } from "../../src/lib/utils/ai-usage.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async (event) => {
  // Only handle POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // Parse the request body
    const params = new URLSearchParams(event.body);
    const from = params.get("From");
    const body = params.get("Body");

    console.log("WhatsApp message received:", { from, body });

    // Verify this is a WhatsApp message
    if (!from || !from.startsWith("whatsapp:")) {
      return {
        statusCode: 400,
        body: "Invalid WhatsApp message",
      };
    }

    // Extract phone number
    const phoneNumber = from.replace("whatsapp:", "");

    // Get or create session for this user
    const session = await getSession(phoneNumber, "en");

    // Prepare OpenAI messages
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant accessible via WhatsApp. Provide helpful, concise responses. Keep messages brief since this is WhatsApp.",
      },
      {
        role: "user",
        content: body,
      },
    ];

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiData.error?.message || "Unknown error"}`);
    }

    const aiResponse = openaiData.choices[0].message.content;
    const usage = openaiData.usage;

    // Calculate cost
    const cost = (usage.prompt_tokens * 0.00015 + usage.completion_tokens * 0.0006) / 1000;

    // Log AI usage
    try {
      await logAIUsage({
        source: "whatsapp",
        model: "gpt-4o-mini",
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost: cost,
        tool_id: "whatsapp-assistant",
        tool_name: "WhatsApp Assistant",
        session: phoneNumber,
      });
    } catch (logError) {
      console.error("Failed to log AI usage:", logError);
    }

    // Update session
    addUsage(session, usage.total_tokens, cost);
    await saveSession(session);

    // Send response via Twilio
    await twilioClient.sendMessage(from, aiResponse);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/xml",
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Message processed successfully</Message>
</Response>`,
    };
  } catch (error) {
    console.error("WhatsApp function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/xml",
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, I'm experiencing technical difficulties.</Message>
</Response>`,
    };
  }
};
