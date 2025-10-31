/**
 * User Helper Management Endpoints
 * 
 * Handles CRUD operations for user-scoped helpers
 * 
 * Routes:
 * - GET /api/users/{userId}/helpers - List user's helpers
 * - POST /api/users/{userId}/helpers - Create new helper
 * - GET /api/users/{userId}/helpers/{helperId} - Get helper details
 * - PUT /api/users/{userId}/helpers/{helperId} - Update helper
 * - DELETE /api/users/{userId}/helpers/{helperId} - Delete helper
 * - POST /api/users/{userId}/helpers/{helperId}/publish - Publish helper
 * - POST /api/users/{userId}/helpers/{helperId}/unpublish - Unpublish helper
 */

import {
  getHelperBlob,
  saveHelperBlob,
  deleteHelperBlob,
  listUserHelpers,
} from "../../src/lib/utils/blob-storage.js";
import {
  verifyToken,
  generateHelperId,
  generateShareId,
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

// Helper to extract userId and helperId from path
function extractIdsFromPath(pathname) {
  // Match pattern: /api/users/{userId}/helpers/{helperId} or /api/users/{userId}/helpers
  const match = pathname.match(/\/api\/users\/([^\/]+)\/helpers(?:\/([^\/]+))?/);
  if (!match) {
    return { userId: null, helperId: null };
  }
  return {
    userId: match[1],
    helperId: match[2] || null,
  };
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return createResponse({}, 200);
  }

  const { httpMethod, path, pathParameters, body } = event;
  const pathname = path || event.path || "";
  const { userId, helperId } = extractIdsFromPath(pathname) || {
    userId: pathParameters?.userId,
    helperId: pathParameters?.helperId,
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

    // GET /api/users/{userId}/helpers - List user's helpers
    if (httpMethod === "GET" && !helperId) {
      const helpers = await listUserHelpers(userId);
      return createResponse({
        success: true,
        helpers: helpers || [],
      });
    }

    // GET /api/users/{userId}/helpers/{helperId} - Get helper details
    if (httpMethod === "GET" && helperId) {
      const helper = await getHelperBlob(userId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user
      if (helper.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      return createResponse({
        success: true,
        helper,
      });
    }

    // POST /api/users/{userId}/helpers - Create new helper
    if (httpMethod === "POST" && !helperId) {
      const data = JSON.parse(body || "{}");
      const {
        name,
        description,
        icon,
        image,
        systemPrompt,
        model = "gpt-4o-mini",
        temperature = 0.7,
        maxTokens = 2000,
      } = data;

      if (!name || !systemPrompt) {
        return createResponse(
          { error: "Name and systemPrompt are required" },
          400
        );
      }

      const newHelperId = generateHelperId();
      const now = new Date().toISOString();

      const helperData = {
        id: newHelperId,
        userId,
        name,
        description: description || "",
        icon: icon || "??",
        image: image || "",
        systemPrompt,
        model,
        temperature,
        maxTokens,
        published: false,
        publishedAt: null,
        shareId: null,
        createdAt: now,
        updatedAt: now,
      };

      await saveHelperBlob(userId, newHelperId, helperData);

      return createResponse(
        {
          success: true,
          helper: helperData,
        },
        201
      );
    }

    // PUT /api/users/{userId}/helpers/{helperId} - Update helper
    if (httpMethod === "PUT" && helperId) {
      const helper = await getHelperBlob(userId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user
      if (helper.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      const data = JSON.parse(body || "{}");
      const updates = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        image: data.image,
        systemPrompt: data.systemPrompt,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      };

      // Remove undefined fields
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      const updatedHelper = {
        ...helper,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await saveHelperBlob(userId, helperId, updatedHelper);

      return createResponse({
        success: true,
        helper: updatedHelper,
      });
    }

    // DELETE /api/users/{userId}/helpers/{helperId} - Delete helper
    if (httpMethod === "DELETE" && helperId) {
      const helper = await getHelperBlob(userId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user
      if (helper.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      await deleteHelperBlob(userId, helperId);

      return createResponse({
        success: true,
        message: "Helper deleted successfully",
      });
    }

    // POST /api/users/{userId}/helpers/{helperId}/publish - Publish helper
    if (httpMethod === "POST" && helperId && pathname.includes("/publish")) {
      const helper = await getHelperBlob(userId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user
      if (helper.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      const shareId = helper.shareId || generateShareId();
      const now = new Date().toISOString();

      const updatedHelper = {
        ...helper,
        published: true,
        publishedAt: now,
        shareId,
        updatedAt: now,
      };

      await saveHelperBlob(userId, helperId, updatedHelper);

      return createResponse({
        success: true,
        helper: updatedHelper,
        shareUrl: `/chat/public/${shareId}`,
      });
    }

    // POST /api/users/{userId}/helpers/{helperId}/unpublish - Unpublish helper
    if (httpMethod === "POST" && helperId && pathname.includes("/unpublish")) {
      const helper = await getHelperBlob(userId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user
      if (helper.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      const updatedHelper = {
        ...helper,
        published: false,
        updatedAt: new Date().toISOString(),
      };

      await saveHelperBlob(userId, helperId, updatedHelper);

      return createResponse({
        success: true,
        helper: updatedHelper,
      });
    }

    return createResponse(
      { error: "Method not allowed" },
      405
    );
  } catch (error) {
    console.error("User helpers endpoint error:", error);
    return createResponse(
      {
        error: "Internal server error",
        details: error.message,
      },
      500
    );
  }
};
