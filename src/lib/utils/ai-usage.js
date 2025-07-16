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
  return !process.env.NETLIFY || process.env.NETLIFY === "false";
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

// Log AI usage
export async function logAIUsage(usage) {
  const timestamp = new Date().toISOString();
  const record = {
    timestamp,
    ...usage,
  };

  if (isLocalDevelopment()) {
    console.log("Development mode: logging to local file");
    const existingData = await loadFromLocalFile();
    existingData.push(record);
    await saveToLocalFile(existingData);
  } else {
    const storeInstance = getStoreInstance();
    const existing = await storeInstance.get("usage-data");
    const existingData = existing ? JSON.parse(existing) : [];
    existingData.push(record);
    await storeInstance.set("usage-data", JSON.stringify(existingData));
  }
}

// Get usage statistics
export async function getUsageStats(days = 30, source = "all") {
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

  // Filter by source if specified
  const sourceFilteredData =
    source === "all" ? filteredData : filteredData.filter((record) => record.source === source);

  // Calculate statistics
  const totalRequests = sourceFilteredData.length;
  const totalTokens = sourceFilteredData.reduce((sum, record) => sum + (record.tokens || 0), 0);
  const totalCost = sourceFilteredData.reduce(
    (sum, record) => sum + (record.estimatedCost || 0),
    0
  );

  // Group by tool
  const toolStats = {};
  sourceFilteredData.forEach((record) => {
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
  sourceFilteredData.forEach((record) => {
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
  sourceFilteredData.forEach((record) => {
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
    recentActivity: sourceFilteredData.slice(-10).reverse(), // Last 10 records, newest first
  };
}
