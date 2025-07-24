import { getUsageStats } from "../../src/lib/utils/ai-usage.js";

export default async (request, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers,
    });
  }

  // Only handle GET requests
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    // Get query parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "7");
    const toolId = url.searchParams.get("toolId") || null;
    
    // Validate days parameter
    const validDays = Math.min(Math.max(days, 1), 90); // Limit between 1-90 days
    
    console.log(`Getting usage stats for ${validDays} days, toolId: ${toolId || 'all'}`);

    // Get enhanced usage statistics
    const stats = await getUsageStats(toolId, validDays);

    // Add metadata for the response
    const response = {
      ...stats,
      metadata: {
        requestedDays: validDays,
        requestedTool: toolId || 'all',
        generatedAt: new Date().toISOString(),
        timezone: 'UTC'
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get usage statistics",
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
