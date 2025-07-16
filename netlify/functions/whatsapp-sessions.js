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

export default async (request, context) => {
  const url = new URL(request.url);
  const method = request.method;
  const sessionId = url.searchParams.get("id");

  try {
    switch (method) {
      case "GET":
        if (sessionId) {
          return await getSession(sessionId);
        } else {
          return await getAllSessions();
        }

      case "DELETE":
        if (sessionId) {
          return await deleteSession(sessionId);
        } else {
          return new Response(JSON.stringify({ error: "Session ID required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

      case "POST":
        return await createTestSession(request);

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("WhatsApp sessions API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Get all WhatsApp sessions
 */
async function getAllSessions() {
  try {
    let sessions = {};

    // Try Netlify Blobs first
    if (!isLocalDevelopment()) {
      try {
        // Get all keys from the store (this is a simplified approach)
        // In practice, you'd want to list all keys with a prefix
        const storeInstance = getStoreInstance();
        const allSessions = await storeInstance.list();

        for (const key of allSessions.blobs) {
          if (key.key.startsWith("whatsapp_")) {
            const sessionData = await storeInstance.get(key.key, { type: "json" });
            if (sessionData) {
              sessions[key.key] = sessionData;
            }
          }
        }
      } catch (error) {
        console.log("Netlify Blobs error, falling back to local:", error.message);
      }
    }

    // Fallback to local file storage
    if (Object.keys(sessions).length === 0) {
      try {
        const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
        sessions = JSON.parse(data);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Error reading local sessions:", error);
        }
        // Return empty sessions if file doesn't exist
        sessions = {};
      }
    }

    // Convert to array and add stats
    const sessionArray = Object.values(sessions).map((session) => ({
      ...session,
      isExpired: isSessionExpired(session),
      duration: getSessionDuration(session),
    }));

    // Sort by last activity (most recent first)
    sessionArray.sort(
      (a, b) => new Date(b.metadata.lastActivity) - new Date(a.metadata.lastActivity)
    );

    const stats = {
      total: sessionArray.length,
      active: sessionArray.filter((s) => !s.isExpired).length,
      expired: sessionArray.filter((s) => s.isExpired).length,
      totalMessages: sessionArray.reduce((sum, s) => sum + s.metadata.messageCount, 0),
      totalCost: sessionArray.reduce((sum, s) => sum + s.usage.cost, 0),
      totalTokens: sessionArray.reduce((sum, s) => sum + s.usage.tokens, 0),
    };

    return new Response(JSON.stringify({ sessions: sessionArray, stats }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting all sessions:", error);
    throw error;
  }
}

/**
 * Get specific session by ID
 */
async function getSession(sessionId) {
  try {
    let sessionData = null;

    // Try Netlify Blobs first
    if (!isLocalDevelopment()) {
      try {
        const storeInstance = getStoreInstance();
        sessionData = await storeInstance.get(sessionId, { type: "json" });
      } catch (error) {
        console.log("Netlify Blobs error, falling back to local:", error.message);
      }
    }

    // Fallback to local file storage
    if (!sessionData) {
      try {
        const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
        const sessions = JSON.parse(data);
        sessionData = sessions[sessionId];
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Error reading local sessions:", error);
        }
      }
    }

    if (!sessionData) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add computed fields
    sessionData.isExpired = isSessionExpired(sessionData);
    sessionData.duration = getSessionDuration(sessionData);

    return new Response(JSON.stringify(sessionData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting session:", error);
    throw error;
  }
}

/**
 * Delete a session
 */
async function deleteSession(sessionId) {
  try {
    // Delete from Netlify Blobs
    if (!isLocalDevelopment()) {
      try {
        const storeInstance = getStoreInstance();
        await storeInstance.delete(sessionId);
      } catch (error) {
        console.log("Netlify Blobs delete error:", error.message);
      }
    }

    // Delete from local storage
    try {
      const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
      const sessions = JSON.parse(data);

      if (sessions[sessionId]) {
        delete sessions[sessionId];
        await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(sessions, null, 2));
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Error deleting from local storage:", error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}

/**
 * Create a test session for admin testing
 */
async function createTestSession(request) {
  try {
    const body = await request.json();
    const { phoneNumber, language = "en", toolId = null } = body;

    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, "")}`;
    const now = new Date().toISOString();

    const testSession = {
      sessionId,
      phoneNumber: `whatsapp:${phoneNumber}`,
      currentTool: toolId,
      language,
      conversationHistory: [
        {
          role: "user",
          content: "Test message from admin dashboard",
          timestamp: now,
          type: "text",
        },
        {
          role: "assistant",
          content: "This is a test session created from the admin dashboard.",
          timestamp: now,
          type: "text",
        },
      ],
      metadata: {
        startTime: now,
        lastActivity: now,
        messageCount: 2,
      },
      usage: {
        cost: 0.001,
        tokens: 50,
      },
    };

    // Save the test session
    if (!isLocalDevelopment()) {
      try {
        const storeInstance = getStoreInstance();
        await storeInstance.setJSON(sessionId, testSession);
      } catch (error) {
        console.log("Netlify Blobs error, saving to local:", error.message);
      }
    }

    // Always save to local as well for development
    try {
      const dir = join(process.cwd(), ".netlify", "blobs-local");
      await fs.mkdir(dir, { recursive: true });

      let sessions = {};
      try {
        const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf-8");
        sessions = JSON.parse(data);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Error reading existing sessions:", error);
        }
      }

      sessions[sessionId] = testSession;
      await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error("Error saving test session:", error);
    }

    return new Response(JSON.stringify({ success: true, session: testSession }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating test session:", error);
    throw error;
  }
}

/**
 * Check if session is expired (24 hours)
 */
function isSessionExpired(session) {
  const sessionAge = Date.now() - new Date(session.metadata.lastActivity).getTime();
  const timeoutMs = 24 * 60 * 60 * 1000; // 24 hours
  return sessionAge > timeoutMs;
}

/**
 * Get session duration in human readable format
 */
function getSessionDuration(session) {
  const start = new Date(session.metadata.startTime);
  const lastActivity = new Date(session.metadata.lastActivity);
  const duration = lastActivity - start;

  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
