import { getStore } from "@netlify/blobs";
import { promises as fs } from "fs";
import { join } from "path";

// Local file storage path
const LOCAL_STORAGE_PATH = join(process.cwd(), ".netlify", "blobs-local", "ai-usage.json");

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

async function ensureLocalFile() {
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
  await ensureLocalFile();
  const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
  return JSON.parse(data);
}

async function saveToLocalFile(data) {
  const dir = join(process.cwd(), ".netlify", "blobs-local");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2));
}

// Log AI usage (best effort - never throws)
export async function logAIUsage(usage) {
  try {
    const record = {
      ...usage,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    };

    if (isLocalDevelopment()) {
      try {
        await saveToLocalFile(record);
      } catch (error) {
        console.error("Failed to save to local file:", error.message);
        // Continue without logging
      }
    } else {
      const store = getStoreInstance();
      if (store) {
        try {
          const key = `usage_${record.id}`;
          await store.setJSON(key, record, {
            metadata: {
              toolId: usage.toolId,
              timestamp: record.timestamp,
            },
          });
        } catch (error) {
          console.error("Failed to save to Netlify Blobs:", error.message);
          // Continue without logging
        }
      }
    }
  } catch (error) {
    console.error("AI usage logging failed (non-critical):", error.message);
    // Never throw - logging is not critical to application function
  }
}

// Get usage statistics (with fallback to empty data)
export async function getUsageStats(toolId = null, days = 7) {
  try {
    let data;

    if (isLocalDevelopment()) {
      console.log("Development mode: reading from local file");
      data = await loadFromLocalFile();
    } else {
      const storeInstance = getStoreInstance();
      const stored = await storeInstance.get("usage-data");
      data = stored ? JSON.parse(stored) : [];
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

    // Calculate statistics
    const totalRequests = toolFilteredData.length;
    const totalTokens = toolFilteredData.reduce((sum, record) => sum + (record.tokens || 0), 0);
    const totalCost = toolFilteredData.reduce(
      (sum, record) => sum + (record.estimatedCost || 0),
      0
    );

    // Group by tool
    const toolStats = {};
    toolFilteredData.forEach((record) => {
      const toolId = record.toolId || "unknown";
      if (!toolStats[toolId]) {
        toolStats[toolId] = { requests: 0, tokens: 0, cost: 0 };
      }
      toolStats[toolId].requests++;
      toolStats[toolId].tokens += record.tokens || 0;
      toolStats[toolId].cost += record.estimatedCost || 0;
    });

    // Group by model
    const modelStats = {};
    toolFilteredData.forEach((record) => {
      const model = record.model || "unknown";
      if (!modelStats[model]) {
        modelStats[model] = { requests: 0, tokens: 0, cost: 0 };
      }
      modelStats[model].requests++;
      modelStats[model].tokens += record.tokens || 0;
      modelStats[model].cost += record.estimatedCost || 0;
    });

    // Group by source
    const sourceStats = {};
    toolFilteredData.forEach((record) => {
      const src = record.source || "unknown";
      if (!sourceStats[src]) {
        sourceStats[src] = { requests: 0, tokens: 0, cost: 0 };
      }
      sourceStats[src].requests++;
      sourceStats[src].tokens += record.tokens || 0;
      sourceStats[src].cost += record.estimatedCost || 0;
    });

    return {
      period: `${days} days`,
      total: {
        requests: totalRequests,
        tokens: totalTokens,
        cost: totalCost,
      },
      byTool: toolStats,
      byModel: modelStats,
      bySource: sourceStats,
      recentActivity: toolFilteredData.slice(-10).reverse(), // Last 10 records, newest first
    };
  } catch (error) {
    console.error("Failed to get usage stats:", error.message);
    // Return empty stats rather than crashing
    return {
      totalTokens: 0,
      totalCost: 0,
      callCount: 0,
      averageTokensPerCall: 0,
      tokensByModel: {},
      dailyUsage: [],
    };
  }
}
