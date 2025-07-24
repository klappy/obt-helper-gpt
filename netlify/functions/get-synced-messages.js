import { getStore } from "@netlify/blobs";

// Storage for sync messages
function getSyncStore() {
  return getStore({
    name: "obt-helper-sync", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

export default async (req, context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: 'Missing sessionId parameter' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const syncStore = getSyncStore();
    const messages = [];
    
    // Get all sync entries and filter for this web session
    // Note: In a real implementation, this would be more efficient with proper indexing
    try {
      const allKeys = await syncStore.list();
      
      for (const key of allKeys.blobs) {
        if (key.key.startsWith('whatsapp-mirror-')) {
          try {
            const syncDataStr = await syncStore.get(key.key);
            if (syncDataStr) {
              const syncData = JSON.parse(syncDataStr);
              
              // Check if this message is for our web session
              if (syncData.webSessionId === sessionId) {
                // Check if message is recent (last 10 minutes)
                const messageAge = Date.now() - syncData.timestamp;
                if (messageAge < 10 * 60 * 1000) {
                  messages.push({
                    userMessage: syncData.userMessage,
                    aiResponse: syncData.aiResponse,
                    tool: syncData.tool,
                    timestamp: syncData.timestamp,
                    source: 'whatsapp'
                  });
                  
                  // Clean up processed message
                  await syncStore.delete(key.key);
                }
              }
            }
          } catch (parseError) {
            console.error('Error parsing sync data:', parseError);
          }
        }
      }
    } catch (listError) {
      console.error('Error listing sync messages:', listError);
    }

    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);

    return new Response(JSON.stringify({ 
      messages,
      count: messages.length
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get synced messages error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}