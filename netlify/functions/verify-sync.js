import { getAllTools } from "./tools.js";
import { getStore } from "@netlify/blobs";

// Check if we're in local development
function isLocalDevelopment() {
  return (
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV === "development" ||
    !process.env.DEPLOY_URL
  );
}

export default async (request, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers,
    });
  }

  try {
    // Get tools from the main tools function
    const tools = await getAllTools();

    // Get storage backend info
    const storageBackend = isLocalDevelopment() ? "local-file" : "netlify-blobs";

    // Calculate a simple hash of tools to detect changes
    const toolsHash = tools.map((t) => `${t.id}:${t.systemPrompt.length}`).join("|");

    // Get additional debugging info
    const debugInfo = {
      environment: process.env.NETLIFY_DEV ? "development" : "production",
      hasDeployUrl: !!process.env.DEPLOY_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    // Try to check both stores if in production
    let storageInfo = {};
    if (!isLocalDevelopment()) {
      try {
        const toolsStore = getStore({
          name: "obt-helper-tools",
          consistency: "strong",
        });
        const whatsappStore = getStore({
          name: "obt-helper-whatsapp",
          consistency: "strong",
        });

        // Check if tools data exists
        const toolsData = await toolsStore.get("tools-data");
        storageInfo.toolsStoreExists = !!toolsData;

        // Count WhatsApp sessions
        const sessions = await whatsappStore.list();
        storageInfo.whatsappSessionCount = sessions.blobs.length;
      } catch (error) {
        storageInfo.error = error.message;
      }
    }

    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      toolCount: tools.length,
      toolsHash,
      storage: {
        backend: storageBackend,
        ...storageInfo,
      },
      debug: debugInfo,
      tools: tools.map((t) => ({
        id: t.id,
        name: t.name,
        promptLength: t.systemPrompt.length,
        isActive: t.isActive,
      })),
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Sync verification error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
