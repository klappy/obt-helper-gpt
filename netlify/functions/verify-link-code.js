import { getStore } from "@netlify/blobs";

// Storage for verification codes
function getCodeStore() {
  return getStore({
    name: "obt-helper-link-codes", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

// Storage for session links
function getSessionStore() {
  return getStore({
    name: "obt-helper-sessions", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { phoneNumber, code, sessionId } = JSON.parse(req.body);
    
    // Validate inputs
    if (!phoneNumber || !code || !sessionId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get stored code data
    const codeStore = getCodeStore();
    const storedDataStr = await codeStore.get(`link-code-${phoneNumber}`);
    
    if (!storedDataStr) {
      return new Response(JSON.stringify({ 
        error: 'No verification code found. Please request a new code.' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const storedData = JSON.parse(storedDataStr);
    
    // Check if code expired
    if (Date.now() > storedData.expires) {
      // Clean up expired code
      await codeStore.delete(`link-code-${phoneNumber}`);
      return new Response(JSON.stringify({ 
        error: 'Verification code expired. Please request a new code.' 
      }), { 
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify code
    if (storedData.code !== code) {
      return new Response(JSON.stringify({ 
        error: 'Invalid verification code. Please try again.' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Success! Create session link
    const sessionStore = getSessionStore();
    const whatsappSessionId = `whatsapp_${phoneNumber.replace(/[^\d]/g, '')}`;
    
    // Create bidirectional link
    const linkData = {
      webSessionId: sessionId,
      whatsappSessionId: whatsappSessionId,
      phoneNumber: phoneNumber,
      toolId: storedData.toolId,
      linkedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString()
    };
    
    // Store both directions for fast lookup
    await Promise.all([
      sessionStore.set(`web-to-whatsapp-${sessionId}`, JSON.stringify(linkData)),
      sessionStore.set(`whatsapp-to-web-${whatsappSessionId}`, JSON.stringify(linkData))
    ]);
    
    // Clean up verification code
    await codeStore.delete(`link-code-${phoneNumber}`);
    
    console.log(`Sessions linked: Web ${sessionId} <-> WhatsApp ${whatsappSessionId}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      linkedSessionId: whatsappSessionId,
      phoneNumber: phoneNumber
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Verify link code error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}