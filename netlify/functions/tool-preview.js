import { sendChatMessage } from "../../src/lib/utils/openai.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async (request, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers,
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers,
      });
    }

    const { tool, message } = await request.json();

    if (!tool || !message) {
      return new Response(JSON.stringify({ error: "Missing tool or message" }), {
        status: 400,
        headers,
      });
    }

    // Create test messages array
    const testMessages = [
      {
        role: "user",
        content: message,
      },
    ];

    // Call OpenAI API using the existing utility
    const response = await sendChatMessage(testMessages, tool, OPENAI_API_KEY);

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: errorData.error?.message || "OpenAI API error" }),
        {
          status: response.status,
          headers,
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        response: data.choices[0]?.message?.content || "No response generated",
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Tool preview error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }
};
