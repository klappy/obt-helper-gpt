import twilio from 'twilio';
import { getStore } from "@netlify/blobs";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Storage for verification codes
function getStoreInstance() {
  return getStore({
    name: "obt-helper-link-codes", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { phoneNumber, sessionId, toolId } = JSON.parse(req.body);
    
    // Validate phone number format (basic validation)
    if (!phoneNumber || !phoneNumber.match(/^\+\d{10,15}$/)) {
      return new Response('Invalid phone number format. Use +1234567890', { status: 400 });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store with 10-minute expiry
    const store = getStoreInstance();
    const codeData = {
      code,
      sessionId,
      toolId,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    
    await store.set(`link-code-${phoneNumber}`, JSON.stringify(codeData));
    
    try {
      // Send via WhatsApp
      await client.messages.create({
        from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
        to: 'whatsapp:' + phoneNumber,
        body: `🔗 *OBT Helper Link Code*

Your verification code: *${code}*

This code expires in 10 minutes.

Use this code on the website to sync your web chat with WhatsApp! 🚀`
      });
      
      console.log(`Link code sent to ${phoneNumber}: ${code}`);
      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      return new Response(JSON.stringify({ 
        error: 'Failed to send code. Please check your phone number.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Send link code error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}