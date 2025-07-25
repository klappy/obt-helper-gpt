import { getStore } from "@netlify/blobs";
import { promises as fs } from "fs";
import { join } from "path";

// Local file storage path for development
const LOCAL_STORAGE_PATH = join(process.cwd(), ".netlify", "blobs-local", "whatsapp-sessions.json");

// Store will be initialized only when needed in production
let store = null;

// Session timeout tracking - Issue 1.1.1
let sessionTimeouts = new Map();

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
  // EMERGENCY FIX: Force production mode for demo
  // TODO: Fix environment detection after demo
  return false; // Always use Netlify Blobs
}

// Issue 1.1.1: Start session timeout with callback
function startSessionTimeout(sessionId, callback) {
  clearTimeout(sessionTimeouts.get(sessionId));
  const timeoutId = setTimeout(() => {
    callback(sessionId);
    sessionTimeouts.delete(sessionId);
  }, 30 * 60 * 1000); // 30 minutes
  sessionTimeouts.set(sessionId, timeoutId);
}

// Issue 1.1.1: Reset session timeout
function resetSessionTimeout(sessionId, callback) {
  startSessionTimeout(sessionId, callback);
}

// Issue 1.1.1: Clear session timeout
function clearSessionTimeout(sessionId) {
  clearTimeout(sessionTimeouts.get(sessionId));
  sessionTimeouts.delete(sessionId);
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

// Issue 1.1.1: Default timeout callback - triggers summary generation
async function defaultTimeoutCallback(sessionId) {
  console.log(`Session timeout triggered for ${sessionId} - will generate summary`);
  try {
    const sessions = await loadAllSessions();
    const session = sessions[sessionId.replace('whatsapp_', '')];
    
    if (session && session.conversationHistory.length > 0) {
      // Import summary generation function (will be implemented in Issue 1.1.2)
      try {
        const { summarizeAndStore } = await import('./openai.js');
        await summarizeAndStore(sessionId, session.conversationHistory);
        console.log(`Summary generated for session ${sessionId}`);
      } catch (error) {
        console.log(`Summary generation not yet available: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error in timeout callback for ${sessionId}:`, error);
  }
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

// Wrapper for safe session operations
async function safeSessionOperation(operation, fallbackValue) {
  try {
    return await operation();
  } catch (error) {
    console.error("Session operation failed, using fallback:", error.message);
    return fallbackValue;
  }
}

// Get or create a session for a phone number
export async function getSession(phoneNumber, language = "en") {
  const sessions = await loadAllSessions();
  const sessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, '')}`;

  if (!sessions[phoneNumber]) {
    sessions[phoneNumber] = createEmptySession(phoneNumber, language);
    // Issue 1.1.1: Start timeout for new session
    startSessionTimeout(sessionId, defaultTimeoutCallback);
  } else {
    // Update last active time
    sessions[phoneNumber].lastActiveAt = new Date().toISOString();
    // Issue 1.1.1: Reset timeout on activity
    resetSessionTimeout(sessionId, defaultTimeoutCallback);
  }

  return sessions[phoneNumber];
}

// Save a session
export async function saveSession(session) {
  const sessions = await loadAllSessions();
  sessions[session.phoneNumber] = session;
  await saveAllSessions(sessions);
  
  // Issue 1.1.1: Reset timeout when session is saved
  const sessionId = `whatsapp_${session.phoneNumber.replace(/[^\d]/g, '')}`;
  resetSessionTimeout(sessionId, defaultTimeoutCallback);
}

// Set the current tool for a session
export function setCurrentTool(session, toolId) {
  session.currentTool = toolId;
  session.lastActiveAt = new Date().toISOString();
  
  // Issue 1.1.1: Reset timeout on tool change
  const sessionId = `whatsapp_${session.phoneNumber.replace(/[^\d]/g, '')}`;
  resetSessionTimeout(sessionId, defaultTimeoutCallback);
}

// Add usage tracking to a session
export function addUsage(session, tokens, cost) {
  session.usage.totalTokens += tokens;
  session.usage.totalCost += cost;
  session.usage.messageCount += 1;
  session.lastActiveAt = new Date().toISOString();
  
  // Issue 1.1.1: Reset timeout on usage update
  const sessionId = `whatsapp_${session.phoneNumber.replace(/[^\d]/g, '')}`;
  resetSessionTimeout(sessionId, defaultTimeoutCallback);
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
  
  // Issue 1.1.1: Reset timeout on new message
  const sessionId = `whatsapp_${session.phoneNumber.replace(/[^\d]/g, '')}`;
  resetSessionTimeout(sessionId, defaultTimeoutCallback);
}

// Get recent conversation history for context
export function getRecentHistory(session, maxMessages = 10) {
  return session.conversationHistory.slice(-maxMessages);
}

// Clear session data (for privacy/cleanup)
export async function clearSession(phoneNumber) {
  const sessions = await loadAllSessions();
  if (sessions[phoneNumber]) {
    // Issue 1.1.1: Clear timeout when session is manually cleared
    const sessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, '')}`;
    clearSessionTimeout(sessionId);
    
    delete sessions[phoneNumber];
    await saveAllSessions(sessions);
  }
}

// Get all active sessions (for admin/monitoring)
export async function getAllSessions() {
  return safeSessionOperation(async () => {
    if (isLocalDevelopment()) {
      try {
        await ensureLocalFile();
        const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
        return JSON.parse(data);
      } catch (error) {
        console.error("Local file read failed:", error);
        return {};
      }
    } else {
      const store = getStoreInstance();
      if (!store) return {};

      try {
        const sessions = await store.get("sessions", { type: "json" });
        return sessions || {};
      } catch (error) {
        console.error("Netlify Blobs read failed:", error);
        return {};
      }
    }
  }, {});
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
      // Issue 1.1.1: Clear timeout for cleaned sessions
      const sessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, '')}`;
      clearSessionTimeout(sessionId);
      
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

// Issue 1.1.1: Export timeout functions for testing
export { startSessionTimeout, resetSessionTimeout, clearSessionTimeout };
