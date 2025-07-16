import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error("Missing required Twilio environment variables");
}

const client = twilio(accountSid, authToken);

// WhatsApp message chunking (1600 char limit for WhatsApp)
function chunkMessage(message, maxLength = 1500) {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks = [];
  let start = 0;

  while (start < message.length) {
    let end = start + maxLength;

    // If we're not at the end, try to break at a word boundary
    if (end < message.length) {
      const lastSpace = message.lastIndexOf(" ", end);
      const lastNewline = message.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastSpace, lastNewline);

      if (breakPoint > start) {
        end = breakPoint;
      }
    }

    chunks.push(message.slice(start, end).trim());
    start = end;
  }

  return chunks;
}

// Convert basic formatting for WhatsApp
function formatForWhatsApp(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "*$1*") // Bold: **text** -> *text*
    .replace(/__(.*?)__/g, "_$1_") // Italic: __text__ -> _text_
    .replace(/`(.*?)`/g, "```$1```"); // Code: `text` -> ```text```
}

const twilioClient = {
  // Validate Twilio webhook signature
  validateSignature: (signature, url, params) => {
    try {
      if (!authToken) {
        console.error("Auth token not available for signature validation");
        return false;
      }
      return twilio.validateRequest(authToken, signature, url, params);
    } catch (error) {
      console.error("Signature validation error:", error);
      return false;
    }
  },

  // Send WhatsApp message with chunking and formatting
  sendMessage: async (to, body) => {
    try {
      const formattedBody = formatForWhatsApp(body);
      const chunks = chunkMessage(formattedBody);

      const results = [];
      for (let i = 0; i < chunks.length; i++) {
        const message = chunks.length > 1 ? `(${i + 1}/${chunks.length}) ${chunks[i]}` : chunks[i];

        const result = await client.messages.create({
          from: `whatsapp:${twilioPhoneNumber}`,
          to: `whatsapp:${to}`,
          body: message,
        });

        results.push(result);
      }

      return results;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  },
};

export default twilioClient;
