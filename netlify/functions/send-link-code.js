import { getStore } from "@netlify/blobs";

// Storage for verification codes
function getStoreInstance() {
  return getStore({
    name: "obt-helper-link-codes",
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || "local",
  });
}

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Handle both string and already-parsed body
    let bodyData;
    if (typeof req.body === "string") {
      bodyData = JSON.parse(req.body);
    } else {
      bodyData = req.body;
    }

    const { phoneNumber, sessionId, toolId } = bodyData;

    // Debug logging to see what we're actually receiving
    console.log("Received phoneNumber:", JSON.stringify(phoneNumber));
    console.log("phoneNumber type:", typeof phoneNumber);
    console.log("phoneNumber length:", phoneNumber ? phoneNumber.length : "undefined");

    // Validate phone number format (basic validation)
    if (!phoneNumber || !phoneNumber.match(/^\+\d{10,15}$/)) {
      console.log("Phone validation failed for:", phoneNumber);
      return new Response(
        JSON.stringify({
          error: "Invalid phone number format. Use +1234567890",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 10-minute expiry
    const store = getStoreInstance();
    const codeData = {
      code,
      sessionId,
      toolId,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    await store.set(`link-code-${phoneNumber}`, JSON.stringify(codeData));

    // For now, return the code in the response instead of sending via SMS
    // TODO: Implement actual Twilio SMS sending once environment is configured
    console.log(`Link code generated for ${phoneNumber}: ${code}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Code generated successfully",
        // Remove this in production - only for testing
        testCode: code,
        note: "SMS sending temporarily disabled. Use the testCode for verification.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send link code error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
