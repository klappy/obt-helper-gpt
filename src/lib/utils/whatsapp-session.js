import { getStore } from "@netlify/blobs";
import { promises as fs } from "fs";
import { join } from "path";

// Local file storage path for development
const LOCAL_STORAGE_PATH = join(process.cwd(), ".netlify", "blobs-local", "whatsapp-sessions.json");

// Store will be initialized only when needed in production
let store = null;

function getStoreInstance() {
  if (!store && !isLocalDevelopment()) {
    store = getStore({
      name: "obt-helper-whatsapp",
      consistency: "strong",
    });
  }
  return store;
}

// Check if we're in local development
function isLocalDevelopment() {
  return !process.env.DEPLOY_CONTEXT || process.env.DEPLOY_CONTEXT === "dev";
}

// Session structure
function createEmptySession(phoneNumber, language = "en") {
  return {
    phoneNumber,
    language,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    currentTool: null,
    conversationHistory: [],
    usage: {
      totalTokens: 0,
      totalCost: 0,
      messageCount: 0,
    },
    metadata: {},
  };
}

// Load all sessions from storage
async function loadAllSessions() {
  try {
    if (isLocalDevelopment()) {
      // Local file storage for development
      try {
        const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf8");
        return JSON.parse(data);
      } catch (error) {
        if (error.code === "ENOENT") {
          return {};
        }
        throw error;
      }
    } else {
      // Netlify Blobs for production
      const storeInstance = getStoreInstance();
      const sessions = await storeInstance.get("sessions");
      return sessions ? JSON.parse(sessions) : {};
    }
  } catch (error) {
    console.error("Error loading sessions:", error);
    return {};
  }
}

// Save all sessions to storage
async function saveAllSessions(sessions) {
  try {
    const data = JSON.stringify(sessions, null, 2);

    if (isLocalDevelopment()) {
      // Ensure directory exists
      const dir = join(process.cwd(), ".netlify", "blobs-local");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(LOCAL_STORAGE_PATH, data, "utf8");
    } else {
      // Netlify Blobs for production
      const storeInstance = getStoreInstance();
      await storeInstance.set("sessions", data);
    }
  } catch (error) {
    console.error("Error saving sessions:", error);
    throw error;
  }
}

// Get or create a session for a phone number
export async function getSession(phoneNumber, language = "en") {
  const sessions = await loadAllSessions();

  if (!sessions[phoneNumber]) {
    sessions[phoneNumber] = createEmptySession(phoneNumber, language);
  } else {
    // Update last active time
    sessions[phoneNumber].lastActiveAt = new Date().toISOString();
  }

  return sessions[phoneNumber];
}

// Save a session
export async function saveSession(session) {
  const sessions = await loadAllSessions();
  sessions[session.phoneNumber] = session;
  await saveAllSessions(sessions);
}

// Set the current tool for a session
export function setCurrentTool(session, toolId) {
  session.currentTool = toolId;
  session.lastActiveAt = new Date().toISOString();
}

// Add usage tracking to a session
export function addUsage(session, tokens, cost) {
  session.usage.totalTokens += tokens;
  session.usage.totalCost += cost;
  session.usage.messageCount += 1;
  session.lastActiveAt = new Date().toISOString();
}

// Add a message to conversation history
export function addToHistory(session, role, content, toolId = null) {
  session.conversationHistory.push({
    role,
    content,
    toolId,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 20 messages to manage size
  if (session.conversationHistory.length > 20) {
    session.conversationHistory = session.conversationHistory.slice(-20);
  }

  session.lastActiveAt = new Date().toISOString();
}

// Get recent conversation history for context
export function getRecentHistory(session, maxMessages = 10) {
  return session.conversationHistory.slice(-maxMessages);
}

// Clear session data (for privacy/cleanup)
export async function clearSession(phoneNumber) {
  const sessions = await loadAllSessions();
  if (sessions[phoneNumber]) {
    delete sessions[phoneNumber];
    await saveAllSessions(sessions);
  }
}

// Get all active sessions (for admin/monitoring)
export async function getAllSessions() {
  return await loadAllSessions();
}

// Clean up old inactive sessions (older than 30 days)
export async function cleanupInactiveSessions(daysThreshold = 30) {
  const sessions = await loadAllSessions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

  let cleaned = 0;
  for (const [phoneNumber, session] of Object.entries(sessions)) {
    const lastActive = new Date(session.lastActiveAt);
    if (lastActive < cutoffDate) {
      delete sessions[phoneNumber];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    await saveAllSessions(sessions);
    console.log(`Cleaned up ${cleaned} inactive sessions`);
  }

  return cleaned;
}
