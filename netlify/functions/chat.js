import { sendChatMessage } from "../../src/lib/utils/openai.js";
import { getStore } from "@netlify/blobs";
import { getAllTools } from "./tools.js";

// Storage instances
function getSessionStore() {
  return getStore({
    name: "obt-helper-sessions", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

function getSyncStore() {
  return getStore({
    name: "obt-helper-sync", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

// Get linked session data
async function getLinkedSession(webSessionId) {
  try {
    const sessionStore = getSessionStore();
    const linkDataStr = await sessionStore.get(`web-to-whatsapp-${webSessionId}`);
    return linkDataStr ? JSON.parse(linkDataStr) : null;
  } catch (error) {
    console.error('Error getting linked session:', error);
    return null;
  }
}

// Mirror message to WhatsApp
async function mirrorToWhatsApp(linkedSession, userMessage, aiResponse) {
  try {
    // For now, store in sync queue instead of sending SMS directly
    // TODO: Implement actual Twilio SMS when environment is configured
    const syncStore = getSyncStore();
    const syncData = {
      direction: 'web-to-whatsapp',
      phoneNumber: linkedSession.phoneNumber,
      userMessage,
      aiResponse,
      tool: linkedSession.toolId,
      timestamp: Date.now(),
      webSessionId: linkedSession.webSessionId
    };
    
    console.log(`Would mirror to WhatsApp ${linkedSession.phoneNumber}:`, {
      user: userMessage.substring(0, 50) + '...',
      ai: aiResponse.substring(0, 50) + '...'
    });
    
    // Store for potential future processing
    await syncStore.set(`web-mirror-${Date.now()}`, JSON.stringify(syncData));
    
  } catch (error) {
    console.error('Error mirroring to WhatsApp:', error);
  }
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages, tool, sessionId } = JSON.parse(req.body);
    
    // Validate required fields
    if (!messages || !tool) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields (messages, tool)' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use server-side API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured on server' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the tool configuration
    const tools = await getAllTools();
    const toolConfig = tools.find(t => t.id === tool.id);
    
    if (!toolConfig) {
      return new Response(JSON.stringify({ 
        error: 'Tool not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send to OpenAI
    const response = await sendChatMessage(messages, toolConfig, apiKey);
    const aiData = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify(aiData), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = aiData.choices[0].message.content;
    const userMessage = messages[messages.length - 1].content;

    // Check for linked WhatsApp session and mirror if found
    if (sessionId) {
      const linkedSession = await getLinkedSession(sessionId);
      if (linkedSession) {
        console.log(`Session ${sessionId} is linked to WhatsApp ${linkedSession.phoneNumber}`);
        await mirrorToWhatsApp(linkedSession, userMessage, aiResponse);
      }
    }

    // Return the AI response
    return new Response(JSON.stringify(aiData), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}