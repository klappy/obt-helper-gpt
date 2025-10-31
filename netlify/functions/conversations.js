/**
 * Conversation Management Endpoints
 * 
 * Handles CRUD operations for user conversations
 * 
 * Routes:
 * - GET /api/users/{userId}/conversations - List user's conversations
 * - POST /api/users/{userId}/conversations - Start new conversation
 * - GET /api/users/{userId}/conversations/{conversationId} - Get conversation
 * - PUT /api/users/{userId}/conversations/{conversationId} - Update conversation (add messages)
 * - DELETE /api/users/{userId}/conversations/{conversationId} - Delete conversation
 * - POST /api/users/{userId}/conversations/{conversationId}/title - Set conversation title
 */

import {
  getConversationBlob,
  saveConversationBlob,
  deleteConversationBlob,
  listUserConversations,
} from "../../src/lib/utils/blob-storage.js";
import {
  verifyToken,
  generateConversationId,
} from "../../src/lib/utils/auth.js";

// Helper to create response
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
}

// Helper to get auth token from headers
function getAuthToken(request) {
  const authHeader = request.headers?.get?.("Authorization") || request.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper to verify auth and get user
async function verifyAuth(headers) {
  const token = getAuthToken({ headers });
  if (!token) {
    return { authenticated: false, error: "No token provided" };
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return { authenticated: false, error: "Invalid token" };
  }
  
  return { authenticated: true, userId: payload.userId, email: payload.email };
}

// Helper to extract userId and conversationId from path
function extractIdsFromPath(pathname) {
  // Match pattern: /api/users/{userId}/conversations/{conversationId} or /api/users/{userId}/conversations
  const match = pathname.match(/\/api\/users\/([^\/]+)\/conversations(?:\/([^\/]+))?/);
  if (!match) {
    return { userId: null, conversationId: null };
  }
  return {
    userId: match[1],
    conversationId: match[2] || null,
  };
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return createResponse({}, 200);
  }

  const { httpMethod, path, pathParameters, body } = event;
  const pathname = path || event.path || "";
  const { userId, conversationId } = extractIdsFromPath(pathname) || {
    userId: pathParameters?.userId,
    conversationId: pathParameters?.conversationId,
  };

  try {
    // Verify authentication
    const auth = await verifyAuth(event.headers);
    if (!auth.authenticated) {
      return createResponse(
        { error: "Unauthorized", details: auth.error },
        401
      );
    }

    // Verify userId matches authenticated user
    if (!userId || userId !== auth.userId) {
      return createResponse(
        { error: "Unauthorized - user ID mismatch" },
        403
      );
    }

    // GET /api/users/{userId}/conversations - List user's conversations
    if (httpMethod === "GET" && !conversationId && !pathname.includes("/title")) {
      const conversations = await listUserConversations(userId);
      return createResponse({
        success: true,
        conversations: conversations || [],
      });
    }

    // GET /api/users/{userId}/conversations/{conversationId} - Get conversation
    if (httpMethod === "GET" && conversationId) {
      const conversation = await getConversationBlob(userId, conversationId);
      
      if (!conversation) {
        return createResponse(
          { error: "Conversation not found" },
          404
        );
      }

      // Verify conversation belongs to user
      if (conversation.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      return createResponse({
        success: true,
        conversation,
      });
    }

    // POST /api/users/{userId}/conversations - Start new conversation
    if (httpMethod === "POST" && !conversationId && !pathname.includes("/title")) {
      const data = JSON.parse(body || "{}");
      const { helperId, title } = data;

      if (!helperId) {
        return createResponse(
          { error: "helperId is required" },
          400
        );
      }

      const newConversationId = generateConversationId();
      const now = new Date().toISOString();

      // Auto-generate title from first message if provided
      const conversationTitle = title || "New Conversation";

      const conversationData = {
        id: newConversationId,
        userId,
        helperId,
        messages: [],
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        title: conversationTitle,
      };

      await saveConversationBlob(userId, newConversationId, conversationData);

      return createResponse(
        {
          success: true,
          conversation: conversationData,
        },
        201
      );
    }

    // PUT /api/users/{userId}/conversations/{conversationId} - Update conversation (add messages)
    if (httpMethod === "PUT" && conversationId && !pathname.includes("/title")) {
      const conversation = await getConversationBlob(userId, conversationId);
      
      if (!conversation) {
        return createResponse(
          { error: "Conversation not found" },
          404
        );
      }

      // Verify conversation belongs to user
      if (conversation.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      const data = JSON.parse(body || "{}");
      const { messages, title } = data;

      const updatedConversation = {
        ...conversation,
        updatedAt: new Date().toISOString(),
      };

      // Add messages if provided
      if (messages && Array.isArray(messages)) {
        updatedConversation.messages = [
          ...(conversation.messages || []),
          ...messages,
        ];
        updatedConversation.messageCount = updatedConversation.messages.length;
      }

      // Update title if provided
      if (title) {
        updatedConversation.title = title;
      }

      // Auto-generate title from first user message if no title set
      if (!updatedConversation.title || updatedConversation.title === "New Conversation") {
        const firstUserMessage = updatedConversation.messages?.find(m => m.role === "user");
        if (firstUserMessage) {
          updatedConversation.title = firstUserMessage.content.substring(0, 50).trim() || "New Conversation";
        }
      }

      await saveConversationBlob(userId, conversationId, updatedConversation);

      return createResponse({
        success: true,
        conversation: updatedConversation,
      });
    }

    // DELETE /api/users/{userId}/conversations/{conversationId} - Delete conversation
    if (httpMethod === "DELETE" && conversationId) {
      const conversation = await getConversationBlob(userId, conversationId);
      
      if (!conversation) {
        return createResponse(
          { error: "Conversation not found" },
          404
        );
      }

      // Verify conversation belongs to user
      if (conversation.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      await deleteConversationBlob(userId, conversationId);

      return createResponse({
        success: true,
        message: "Conversation deleted successfully",
      });
    }

    // POST /api/users/{userId}/conversations/{conversationId}/title - Set conversation title
    if (httpMethod === "POST" && conversationId && pathname.includes("/title")) {
      const conversation = await getConversationBlob(userId, conversationId);
      
      if (!conversation) {
        return createResponse(
          { error: "Conversation not found" },
          404
        );
      }

      // Verify conversation belongs to user
      if (conversation.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      const data = JSON.parse(body || "{}");
      const { title } = data;

      if (!title) {
        return createResponse(
          { error: "title is required" },
          400
        );
      }

      const updatedConversation = {
        ...conversation,
        title,
        updatedAt: new Date().toISOString(),
      };

      await saveConversationBlob(userId, conversationId, updatedConversation);

      return createResponse({
        success: true,
        conversation: updatedConversation,
      });
    }

    return createResponse(
      { error: "Method not allowed" },
      405
    );
  } catch (error) {
    console.error("Conversations endpoint error:", error);
    return createResponse(
      {
        error: "Internal server error",
        details: error.message,
      },
      500
    );
  }
};
