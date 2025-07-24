import { getStore } from "@netlify/blobs";
import {
  linkingLimiter,
  withRateLimit,
  getClientIdentifier,
} from "../../src/lib/utils/rate-limiter.js";

// Storage for verification codes
function getCodeStore() {
  return getStore({
    name: "obt-helper-link-codes",
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || "local",
  });
}

// Storage for session links
function getSessionStore() {
  return getStore({
    name: "obt-helper-sessions",
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || "local",
  });
}

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Apply rate limiting for verification attempts
  const clientId = getClientIdentifier(req, null);
  const rateCheck = withRateLimit(linkingLimiter, clientId);
  if (!rateCheck.allowed) {
    console.log(`Rate limit exceeded for verification attempt from ${clientId}`);
    return new Response(
      JSON.stringify({
        error: "Too many verification attempts. Please wait before trying again.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...rateCheck.headers,
        },
      }
    );
  }

  try {
    // Handle both string and already-parsed body - FIXED VERSION
    let bodyData;
    const bodyText = typeof req.body === "string" ? req.body : await req.text();
    bodyData = JSON.parse(bodyText);

    const { phoneNumber, code, sessionId } = bodyData;

    // Validate inputs
    if (!phoneNumber || !code || !sessionId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Clean phone number to match send-link-code storage key format
    const cleanPhoneNumber = phoneNumber ? phoneNumber.trim() : "";

    console.log("=== VERIFY CODE DEBUG ===");
    console.log("Original phoneNumber:", JSON.stringify(phoneNumber));
    console.log("Cleaned phoneNumber:", JSON.stringify(cleanPhoneNumber));
    console.log("Looking for key:", `link-code-${cleanPhoneNumber}`);

    // Get stored code data using cleaned phone number
    const codeStore = getCodeStore();
    const lookupKey = `link-code-${cleanPhoneNumber}`;
    const storedDataStr = await codeStore.get(lookupKey);

    console.log("=== STORAGE LOOKUP DEBUG ===");
    console.log("Lookup key used:", lookupKey);
    console.log("Found stored data:", storedDataStr ? "YES" : "NO");

    // If not found with cleaned number, try original number for backward compatibility
    let fallbackDataStr = null;
    if (!storedDataStr && phoneNumber !== cleanPhoneNumber) {
      const fallbackKey = `link-code-${phoneNumber}`;
      fallbackDataStr = await codeStore.get(fallbackKey);
      console.log("Tried fallback key:", fallbackKey);
      console.log("Found with fallback:", fallbackDataStr ? "YES" : "NO");
    }

    const finalDataStr = storedDataStr || fallbackDataStr;

    if (!finalDataStr) {
      console.log("ERROR: No verification code found with either key format");
      return new Response(
        JSON.stringify({
          error: "No verification code found. Please request a new code.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("=== STORED DATA DEBUG ===");
    console.log("Raw stored data string:", finalDataStr);
    console.log("Type of finalDataStr:", typeof finalDataStr);
    console.log("Length of finalDataStr:", finalDataStr ? finalDataStr.length : "null");

    const storedData = JSON.parse(finalDataStr);

    console.log("Parsed stored data:", storedData);
    console.log("Stored code:", storedData.code);
    console.log("Provided code:", code);
    console.log("Codes match:", storedData.code === code);
    console.log("Code expired?", Date.now() > storedData.expires);

    // Check if code expired
    if (Date.now() > storedData.expires) {
      // Clean up expired code
      await codeStore.delete(`link-code-${phoneNumber}`);
      return new Response(
        JSON.stringify({
          error: "Verification code expired. Please request a new code.",
        }),
        {
          status: 410,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify code
    if (storedData.code !== code) {
      return new Response(
        JSON.stringify({
          error: "Invalid verification code. Please try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success! Create session link
    const sessionStore = getSessionStore();
    const whatsappSessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, "")}`;

    // Create bidirectional link
    const linkData = {
      webSessionId: sessionId,
      whatsappSessionId: whatsappSessionId,
      phoneNumber: phoneNumber,
      toolId: storedData.toolId,
      linkedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    };

    // Store both directions for fast lookup
    await Promise.all([
      sessionStore.set(`web-to-whatsapp-${sessionId}`, JSON.stringify(linkData)),
      sessionStore.set(`whatsapp-to-web-${whatsappSessionId}`, JSON.stringify(linkData)),
    ]);

    // Clean up verification code
    await codeStore.delete(`link-code-${phoneNumber}`);

    console.log(`Sessions linked: Web ${sessionId} <-> WhatsApp ${whatsappSessionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        linkedSessionId: whatsappSessionId,
        phoneNumber: phoneNumber,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Verify link code error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
