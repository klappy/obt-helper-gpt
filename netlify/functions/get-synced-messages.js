import { getStore } from "@netlify/blobs";

// Storage for sync messages
function getSyncStore() {
  return getStore({
    name: "obt-helper-sync",
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || "local",
  });
}

export default async (req, context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          error: "Missing sessionId parameter",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const syncStore = getSyncStore();
    const messages = [];

    // Get all sync entries and filter for this web session
    // Handle new 2-message pattern: user and AI messages stored separately
    try {
      const allKeys = await syncStore.list();
      const messageGroups = new Map(); // Group by timestamp

      for (const key of allKeys.blobs) {
        if (key.key.startsWith("whatsapp-mirror-")) {
          try {
            const syncDataStr = await syncStore.get(key.key);
            if (syncDataStr) {
              const syncData = JSON.parse(syncDataStr);

              // Check if this message is for our web session
              if (syncData.webSessionId === sessionId) {
                // Check if message is recent (last 10 minutes)
                const messageAge = Date.now() - syncData.timestamp;
                if (messageAge < 10 * 60 * 1000) {
                  // Group messages by timestamp (removing the +1 offset)
                  const baseTimestamp =
                    syncData.messageType === "ai" ? syncData.timestamp - 1 : syncData.timestamp;

                  if (!messageGroups.has(baseTimestamp)) {
                    messageGroups.set(baseTimestamp, {
                      userMessage: null,
                      aiResponse: null,
                      tool: syncData.tool,
                      timestamp: baseTimestamp,
                      source: "whatsapp",
                      keys: [],
                    });
                  }

                  const group = messageGroups.get(baseTimestamp);
                  group.keys.push(key.key);

                  if (syncData.messageType === "user") {
                    group.userMessage = syncData.userMessage;
                  } else if (syncData.messageType === "ai") {
                    group.aiResponse = syncData.aiResponse;
                  } else {
                    // Legacy format - has both in one message
                    group.userMessage = syncData.userMessage;
                    group.aiResponse = syncData.aiResponse;
                  }
                }
              }
            }
          } catch (parseError) {
            console.error("Error parsing sync data:", parseError);
          }
        }
      }

      // Convert grouped messages to final format and clean up
      for (const [timestamp, group] of messageGroups.entries()) {
        // Only add complete message pairs (or legacy single messages)
        if (
          (group.userMessage && group.aiResponse) ||
          (group.userMessage && !group.keys.some((k) => k.includes("ai"))) ||
          (group.aiResponse && !group.keys.some((k) => k.includes("user")))
        ) {
          messages.push({
            userMessage: group.userMessage,
            aiResponse: group.aiResponse,
            tool: group.tool,
            timestamp: group.timestamp,
            source: "whatsapp",
          });

          // Clean up all processed keys for this message
          for (const keyToDelete of group.keys) {
            try {
              await syncStore.delete(keyToDelete);
            } catch (deleteError) {
              console.error("Error deleting processed sync key:", deleteError);
            }
          }
        }
      }
    } catch (listError) {
      console.error("Error listing sync messages:", listError);
    }

    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);

    return new Response(
      JSON.stringify({
        messages,
        count: messages.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Get synced messages error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
