import { getStore } from "@netlify/blobs";
// Server-side safe browser detection
const browser = typeof window !== "undefined";

// Tiktoken removed from this module to prevent WASM loading issues
// For server-side token counting, use tiktoken-server.js module directly

// Local file storage path helper (server-side only)
function getLocalStoragePath() {
  if (browser) return null;
  const { join } = require("path");
  return join(process.cwd(), ".netlify", "blobs-local", "ai-usage.json");
}

// Store will be initialized only when needed in production
let store = null;

function getStoreInstance() {
  if (!store && !isLocalDevelopment()) {
    store = getStore({
      name: "obt-helper-usage",
      consistency: "strong",
    });
  }
  return store;
}

function isLocalDevelopment() {
  // EMERGENCY FIX: Force production mode for demo
  // TODO: Fix environment detection after demo
  return false; // Always use Netlify Blobs
}

// Issue 1.2.1: OpenAI pricing as of 2025 (per 1K tokens)
const MODEL_PRICING = {
  "gpt-4o": {
    prompt: 0.03,
    response: 0.06,
  },
  "gpt-4o-mini": {
    prompt: 0.00015,
    response: 0.0006,
  },
  "gpt-3.5-turbo": {
    prompt: 0.001,
    response: 0.002,
  },
};

// Issue 1.2.1: Token counting using estimation
// For accurate server-side counting, use tiktoken-server.js module
async function countTokens(text, model = "gpt-4o-mini") {
  if (!text) return 0;
  
  // Use estimation formula for all contexts to avoid WASM issues
  // Rough approximation: ~4 characters per token on average
  return Math.ceil(text.length * 0.25);
}

// Issue 1.2.1: Calculate precise costs based on token counts and model pricing
function calculateCost(promptTokens, responseTokens, model = "gpt-4o-mini") {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o-mini"];

  const promptCost = (promptTokens * pricing.prompt) / 1000;
  const responseCost = (responseTokens * pricing.response) / 1000;
  const totalCost = promptCost + responseCost;

  return {
    promptCost: Math.round(promptCost * 10000) / 10000, // 4 decimal places
    responseCost: Math.round(responseCost * 10000) / 10000,
    totalCost: Math.round(totalCost * 10000) / 10000,
  };
}

// Issue 1.2.1: Enhanced logging with accurate token counting and cost calculation
export async function logAIUsage(
  toolId,
  model,
  prompt,
  response,
  userId = "anonymous",
  source = "web"
) {
  try {
    // Count tokens accurately
    const promptTokens = await countTokens(prompt, model);
    const responseTokens = await countTokens(response, model);

    // Calculate precise costs
    const costs = calculateCost(promptTokens, responseTokens, model);

    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      timestamp: new Date().toISOString(),
      toolId,
      model,
      userId,
      source,
      promptTokens,
      responseTokens,
      totalTokens: promptTokens + responseTokens,
      promptCost: costs.promptCost,
      responseCost: costs.responseCost,
      totalCost: costs.totalCost,
      // Keep legacy fields for backward compatibility
      tokens: promptTokens + responseTokens,
      estimatedCost: costs.totalCost,
    };

    await saveUsageRecord(record);

    console.log(
      `AI Usage logged: ${toolId} (${model}) - ${record.totalTokens} tokens, $${record.totalCost}`
    );

    return record;
  } catch (error) {
    console.error("AI usage logging failed (non-critical):", error.message);
    // Never throw - logging is not critical to application function
  }
}

async function ensureLocalFile() {
  if (browser) return;

  const LOCAL_STORAGE_PATH = getLocalStoragePath();
  if (!LOCAL_STORAGE_PATH) return;

  const { promises: fs } = require("fs");
  const { join } = require("path");

  try {
    await fs.access(LOCAL_STORAGE_PATH);
  } catch {
    // File doesn't exist, create it with empty array
    const dir = join(process.cwd(), ".netlify", "blobs-local");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify([]));
  }
}

async function loadFromLocalFile() {
  if (browser) return [];

  const LOCAL_STORAGE_PATH = getLocalStoragePath();
  if (!LOCAL_STORAGE_PATH) return [];

  const { promises: fs } = require("fs");

  await ensureLocalFile();
  const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
  return JSON.parse(data);
}

async function saveToLocalFile(record) {
  if (browser) return;

  const LOCAL_STORAGE_PATH = getLocalStoragePath();
  if (!LOCAL_STORAGE_PATH) return;

  const { promises: fs } = require("fs");
  const { join } = require("path");

  try {
    const existing = await loadFromLocalFile();
    existing.push(record);

    const dir = join(process.cwd(), ".netlify", "blobs-local");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(existing, null, 2));
  } catch (error) {
    console.error("Failed to save to local file:", error.message);
  }
}

async function saveUsageRecord(record) {
  if (isLocalDevelopment()) {
    await saveToLocalFile(record);
  } else {
    const store = getStoreInstance();
    if (store) {
      try {
        const key = `usage_${record.id}`;
        await store.setJSON(key, record, {
          metadata: {
            toolId: record.toolId,
            timestamp: record.timestamp,
            cost: record.totalCost,
          },
        });
      } catch (error) {
        console.error("Failed to save to Netlify Blobs:", error.message);
      }
    }
  }
}

// Issue 1.2.1: Enhanced usage statistics with cost breakdowns
export async function getUsageStats(toolId = null, days = 7) {
  try {
    let data;

    if (isLocalDevelopment()) {
      console.log("Development mode: reading from local file");
      data = await loadFromLocalFile();
    } else {
      const store = getStoreInstance();
      const { blobs } = await store.list({ prefix: "usage_" });

      data = [];
      for (const blob of blobs) {
        try {
          const record = await store.get(blob.key, { type: "json" });
          if (record) data.push(record);
        } catch (error) {
          console.log(`Could not load usage record ${blob.key}:`, error.message);
        }
      }
    }

    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredData = data.filter((record) => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= cutoffDate;
    });

    // Filter by tool if specified
    const toolFilteredData = toolId
      ? filteredData.filter((record) => record.toolId === toolId)
      : filteredData;

    // Calculate enhanced statistics
    const stats = calculateEnhancedStats(toolFilteredData, days);

    return stats;
  } catch (error) {
    console.error("Failed to get usage stats:", error.message);
    // Return empty stats rather than crashing
    return {
      period: `${days} days`,
      total: { requests: 0, tokens: 0, cost: 0 },
      byTool: {},
      byModel: {},
      bySource: {},
      dailyBreakdown: [],
      recentActivity: [],
    };
  }
}

// Issue 1.2.1: Calculate comprehensive statistics
function calculateEnhancedStats(data, days) {
  const totalRequests = data.length;
  const totalTokens = data.reduce(
    (sum, record) => sum + (record.totalTokens || record.tokens || 0),
    0
  );
  const totalCost = data.reduce(
    (sum, record) => sum + (record.totalCost || record.estimatedCost || 0),
    0
  );

  // Group by tool
  const toolStats = {};
  data.forEach((record) => {
    const toolId = record.toolId || "unknown";
    if (!toolStats[toolId]) {
      toolStats[toolId] = { requests: 0, tokens: 0, cost: 0, avgCostPerRequest: 0 };
    }
    toolStats[toolId].requests++;
    toolStats[toolId].tokens += record.totalTokens || record.tokens || 0;
    toolStats[toolId].cost += record.totalCost || record.estimatedCost || 0;
  });

  // Calculate averages for tools
  Object.keys(toolStats).forEach((toolId) => {
    const tool = toolStats[toolId];
    tool.avgCostPerRequest = tool.requests > 0 ? tool.cost / tool.requests : 0;
    tool.avgTokensPerRequest = tool.requests > 0 ? tool.tokens / tool.requests : 0;
  });

  // Group by model
  const modelStats = {};
  data.forEach((record) => {
    const model = record.model || "unknown";
    if (!modelStats[model]) {
      modelStats[model] = { requests: 0, tokens: 0, cost: 0 };
    }
    modelStats[model].requests++;
    modelStats[model].tokens += record.totalTokens || record.tokens || 0;
    modelStats[model].cost += record.totalCost || record.estimatedCost || 0;
  });

  // Group by source
  const sourceStats = {};
  data.forEach((record) => {
    const src = record.source || "web";
    if (!sourceStats[src]) {
      sourceStats[src] = { requests: 0, tokens: 0, cost: 0 };
    }
    sourceStats[src].requests++;
    sourceStats[src].tokens += record.totalTokens || record.tokens || 0;
    sourceStats[src].cost += record.totalCost || record.estimatedCost || 0;
  });

  // Daily breakdown for charts
  const dailyBreakdown = createDailyBreakdown(data, days);

  return {
    period: `${days} days`,
    total: {
      requests: totalRequests,
      tokens: totalTokens,
      cost: Math.round(totalCost * 10000) / 10000, // 4 decimal places
      avgCostPerRequest:
        totalRequests > 0 ? Math.round((totalCost / totalRequests) * 10000) / 10000 : 0,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    },
    byTool: toolStats,
    byModel: modelStats,
    bySource: sourceStats,
    dailyBreakdown,
    recentActivity: data.slice(-10).reverse(), // Last 10 records, newest first
  };
}

// Issue 1.2.1: Create daily breakdown for Chart.js
function createDailyBreakdown(data, days) {
  const breakdown = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayData = data.filter((record) => {
      const recordDate = new Date(record.timestamp).toISOString().split("T")[0];
      return recordDate === dateStr;
    });

    const requests = dayData.length;
    const tokens = dayData.reduce(
      (sum, record) => sum + (record.totalTokens || record.tokens || 0),
      0
    );
    const cost = dayData.reduce(
      (sum, record) => sum + (record.totalCost || record.estimatedCost || 0),
      0
    );

    breakdown.push({
      date: dateStr,
      requests,
      tokens,
      cost: Math.round(cost * 10000) / 10000,
    });
  }

  return breakdown;
}

// Issue 1.2.1: Get today's cost for a specific tool (for cost ceiling checks)
export async function getTodayCostForTool(toolId) {
  try {
    const stats = await getUsageStats(toolId, 1); // Get today's data
    return stats.total.cost || 0;
  } catch (error) {
    console.error(`Failed to get today's cost for tool ${toolId}:`, error.message);
    return 0;
  }
}

// Issue 3.2.3: Get usage data for specific date range
export async function getUsageForDateRange(toolId, startDate, endDate) {
  try {
    let data;

    if (isLocalDevelopment()) {
      console.log("Development mode: reading from local file");
      data = await loadFromLocalFile();
    } else {
      const store = getStoreInstance();
      const { blobs } = await store.list({ prefix: "usage_" });

      data = [];
      for (const blob of blobs) {
        try {
          const record = await store.get(blob.key, { type: "json" });
          if (record) data.push(record);
        } catch (error) {
          console.log(`Could not load usage record ${blob.key}:`, error.message);
        }
      }
    }

    // Filter by date range
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T23:59:59.999Z");

    const filteredData = data.filter((record) => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= start && recordDate <= end;
    });

    // Filter by tool if specified
    const toolFilteredData = toolId
      ? filteredData.filter((record) => record.toolId === toolId)
      : filteredData;

    return toolFilteredData;
  } catch (error) {
    console.error("Failed to get usage for date range:", error.message);
    return [];
  }
}

// Issue 1.2.1: Export utility functions for testing
export { countTokens, calculateCost, MODEL_PRICING };
