import { getStore } from "@netlify/blobs";

// Storage for action logs
function getActionStore() {
  return getStore({
    name: "obt-helper-actions", 
    consistency: "strong",
    siteID: process.env.NETLIFY_SITE_ID || 'local'
  });
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { action, toolId, toolName, ...metadata } = JSON.parse(req.body);
    
    // Validate required fields
    if (!action) {
      return new Response(JSON.stringify({ 
        error: 'Missing action field' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create log entry
    const logEntry = {
      action,
      toolId,
      toolName,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || 'unknown'
    };
    
    // Store action log
    const store = getActionStore();
    const logKey = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await store.set(logKey, JSON.stringify(logEntry));
    
    console.log('Action logged:', { action, toolId, toolName, timestamp: logEntry.timestamp });

    return new Response(JSON.stringify({ 
      success: true,
      logged: logEntry.timestamp
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Log action error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}