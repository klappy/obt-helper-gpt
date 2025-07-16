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
    const days = parseInt(url.searchParams.get("days") || "30");
    const source = url.searchParams.get("source") || "all";

    // Get usage statistics
    const stats = await getUsageStats(days, source);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get usage statistics",
        details: error.message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
