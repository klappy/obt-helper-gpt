import { getStore } from "@netlify/blobs";

function isLocalDevelopment() {
  // More robust environment detection for Netlify
  const isNetlifyDev = process.env.NETLIFY_DEV === "true";
  const isNodeDev = process.env.NODE_ENV === "development";
  const hasNetlifyContext = process.env.CONTEXT; // Netlify sets this in production
  const hasNetlifyUrl = process.env.URL; // Netlify also sets this

  // If we're explicitly in Netlify dev mode, it's local
  if (isNetlifyDev) return true;

  // If we're in Node development mode, it's local
  if (isNodeDev) return true;

  // If we have Netlify production indicators, it's NOT local
  if (hasNetlifyContext || hasNetlifyUrl) return false;

  // Fallback: if no Netlify indicators at all, assume local
  return true;
}

function getStoreInstance() {
  if (!isLocalDevelopment()) {
    return getStore({
      name: "obt-helper-tools",
      consistency: "strong",
    });
  }
  return null;
}

export default async (request, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  try {
    const debug = {
      environment: {
        NETLIFY_DEV: process.env.NETLIFY_DEV,
        NODE_ENV: process.env.NODE_ENV,
        DEPLOY_URL: process.env.DEPLOY_URL ? "SET" : "UNSET",
        CONTEXT: process.env.CONTEXT ? "SET" : "UNSET",
        URL: process.env.URL ? "SET" : "UNSET",
        NETLIFY: process.env.NETLIFY ? "SET" : "UNSET",
        isLocalDevelopment: isLocalDevelopment(),
      },
      storage: {
        type: isLocalDevelopment() ? "local-file" : "netlify-blobs",
        timestamp: new Date().toISOString(),
      },
    };

    // Try to test Netlify Blobs if in production
    if (!isLocalDevelopment()) {
      try {
        const store = getStoreInstance();
        // Try to read existing data
        const existingData = await store.get("tools-data", { type: "json" });
        debug.storage.canRead = true;
        debug.storage.dataExists = !!existingData;
        debug.storage.toolCount = existingData ? existingData.length : 0;

        // Try to write a test
        const testKey = `test-${Date.now()}`;
        await store.setJSON(testKey, { test: true, timestamp: Date.now() });
        debug.storage.canWrite = true;

        // Clean up test
        await store.delete(testKey);
      } catch (blobError) {
        debug.storage.error = blobError.message;
        debug.storage.canRead = false;
        debug.storage.canWrite = false;
      }
    }

    return new Response(JSON.stringify(debug, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
        },
        null,
        2
      ),
      {
        status: 500,
        headers,
      }
    );
  }
};
