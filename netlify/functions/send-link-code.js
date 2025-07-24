import { getStore } from "@netlify/blobs";
import twilioClient from "../../src/lib/utils/twilio.js";

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
    // Debug EVERYTHING about the request
    console.log("=== COMPLETE REQUEST DEBUG ===");
    console.log("req.method:", req.method);
    console.log("req.url:", req.url);
    console.log(
      "req.headers:",
      JSON.stringify(Object.fromEntries(req.headers.entries ? req.headers.entries() : []))
    );
    console.log("req.query:", req.query);
    console.log("req.params:", req.params);

    // Check if it's in the URL as query parameters
    const url = new URL(req.url);
    console.log("URL search params:", Object.fromEntries(url.searchParams.entries()));

    // Handle both string and already-parsed body - FIXED VERSION
    let bodyData;
    const bodyText = typeof req.body === "string" ? req.body : await req.text();
    bodyData = JSON.parse(bodyText);

    // Debug the request body parsing
    console.log("=== BODY PARSING DEBUG ===");
    console.log("req.body type:", typeof req.body);
    console.log("req.body raw:", JSON.stringify(req.body));
    console.log("bodyData type:", typeof bodyData);
    console.log("bodyData raw:", JSON.stringify(bodyData));
    console.log("bodyData keys:", Object.keys(bodyData || {}));
    console.log("bodyData.phoneNumber specifically:", bodyData.phoneNumber);

    const { phoneNumber, sessionId, toolId } = bodyData;

    // Super detailed debugging
    console.log("=== BACKEND VALIDATION DEBUG ===");
    console.log("Raw phoneNumber:", JSON.stringify(phoneNumber));
    console.log("phoneNumber type:", typeof phoneNumber);
    console.log("phoneNumber length:", phoneNumber ? phoneNumber.length : "no length");
    console.log(
      "phoneNumber charCodes:",
      phoneNumber ? Array.from(phoneNumber).map((c) => c.charCodeAt(0)) : "none"
    );
    console.log("Regex pattern: /^\\+\\d{10,15}$/");
    console.log(
      "Regex test result:",
      phoneNumber ? phoneNumber.match(/^\+\d{10,15}$/) : "no phone number"
    );
    console.log("Validation result:", !!(phoneNumber && phoneNumber.match(/^\+\d{10,15}$/)));

    // Clean and validate phone number format
    const cleanPhoneNumber = phoneNumber ? phoneNumber.trim() : "";

    // More lenient validation - allow 10-15 digits after +
    const phoneRegex = /^\+\d{10,15}$/;
    const isValidPhone = cleanPhoneNumber && phoneRegex.test(cleanPhoneNumber);

    console.log("=== PHONE VALIDATION ===");
    console.log("Original phoneNumber:", JSON.stringify(phoneNumber));
    console.log("Cleaned phoneNumber:", JSON.stringify(cleanPhoneNumber));
    console.log("Regex test result:", isValidPhone);
    console.log("Phone length:", cleanPhoneNumber.length);

    if (!isValidPhone) {
      console.log("VALIDATION FAILED - Final decision");
      return new Response(
        JSON.stringify({
          error: `Invalid phone number format. Received: "${cleanPhoneNumber}". Use format: +1234567890 (10-15 digits after +)`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use cleaned phone number from here on
    const validatedPhoneNumber = cleanPhoneNumber;

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

    // Send verification code via WhatsApp
    console.log(`Link code generated for ${phoneNumber}: ${code}`);

    try {
      const message = `Your OBT Helper verification code is: ${code}\n\nThis code will expire in 10 minutes.`;
      await twilioClient.sendMessage(phoneNumber, message);
      console.log(`Verification code sent via WhatsApp to ${phoneNumber}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Verification code sent to your WhatsApp!",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (twilioError) {
      console.error("Failed to send WhatsApp message:", twilioError);

      // Fallback: return test code if WhatsApp sending fails
      return new Response(
        JSON.stringify({
          success: true,
          message: "Code generated (WhatsApp delivery failed)",
          testCode: code,
          note: "WhatsApp sending failed. Use the testCode for verification.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
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
