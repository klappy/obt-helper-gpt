import { getUsageForDateRange } from "../../src/lib/utils/ai-usage.js";

export default async function handler(req, context) {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const toolId = url.searchParams.get("toolId");

  if (!toolId) {
    return new Response(JSON.stringify({ error: "Missing toolId parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get usage data for this tool today
    const usageData = await getUsageForDateRange(toolId, today, today);

    // Calculate totals
    const todayCost = usageData.reduce((sum, entry) => sum + (entry.cost || 0), 0);
    const messageCount = usageData.length;
    const tokenCount = usageData.reduce(
      (sum, entry) => sum + (entry.promptTokens || 0) + (entry.responseTokens || 0),
      0
    );

    const avgCostPerMessage = messageCount > 0 ? todayCost / messageCount : 0;

    // Get recent usage pattern (last 7 days for trend)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const weeklyData = await getUsageForDateRange(toolId, weekAgo, today);
    const weeklyCost = weeklyData.reduce((sum, entry) => sum + (entry.cost || 0), 0);

    return new Response(
      JSON.stringify({
        toolId,
        date: today,
        todayCost,
        messageCount,
        tokenCount,
        avgCostPerMessage,
        weeklyCost,
        trend: messageCount > 0 ? "active" : "quiet", // Simple trend indicator
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache", // Always get fresh data
        },
      }
    );
  } catch (error) {
    console.error("Cost summary error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch cost summary",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
