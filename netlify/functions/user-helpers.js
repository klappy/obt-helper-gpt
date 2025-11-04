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
  addToPublishedHelpersIndex,
  removeFromPublishedHelpersIndex,
} from "../../src/lib/utils/blob-storage.js";
import {
  verifyToken,
  generateHelperId,
  generateShareId,
} from "../../src/lib/utils/auth.js";

// Helper to create response (using new Response API)
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
    console.log("No token provided in request");
    return { authenticated: false, error: "No token provided" };
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    console.log("Token validation failed");
    return { authenticated: false, error: "Invalid token" };
  }
  
  console.log("Token payload:", payload);
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

export default async (req, context) => {
  // Convert new format to old format for compatibility
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    path: new URL(req.url).pathname,
    queryStringParameters: Object.fromEntries(new URL(req.url).searchParams),
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : null,
    pathParameters: {},
  };
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return createResponse({}, 200);
  }

  const { httpMethod, path, pathParameters, body } = event;
  const pathname = path || event.path || "";
  
  // Get userId from query parameters if not in path
  const queryUserId = event.queryStringParameters?.userId;
  
  const { userId: pathUserId, helperId } = extractIdsFromPath(pathname) || {
    userId: pathParameters?.userId,
    helperId: pathParameters?.helperId,
  };
  
  // Prefer query parameter userId over path userId for backward compatibility
  const userId = queryUserId || pathUserId;
  
  console.log("Request details:");
  console.log("- Method:", httpMethod);
  console.log("- Path:", pathname);
  console.log("- Query userId:", queryUserId);
  console.log("- Path userId:", pathUserId);
  console.log("- Final userId:", userId);

  try {
    // Verify authentication
    const auth = await verifyAuth(req.headers);
    if (!auth.authenticated) {
      return createResponse(
        { error: "Unauthorized", details: auth.error },
        401
      );
    }

    // Verify userId matches authenticated user (case-insensitive for emails)
    console.log("Checking user ID - URL userId:", userId, "Auth userId:", auth.userId);
    if (!userId || userId.toLowerCase() !== auth.userId?.toLowerCase()) {
      console.error("User ID mismatch!");
      console.error("URL userId:", userId, "lowercase:", userId?.toLowerCase());
      console.error("Auth userId:", auth.userId, "lowercase:", auth.userId?.toLowerCase());
      return createResponse(
        { error: "Unauthorized - user ID mismatch", 
          details: `URL: ${userId}, Auth: ${auth.userId}` },
        403
      );
    }
    console.log("User ID match successful!");

    // GET /api/users/{userId}/helpers - List user's helpers
    if (httpMethod === "GET" && !helperId) {
      // Always use lowercase userId for consistency
      const normalizedUserId = userId.toLowerCase();
      let helpers = await listUserHelpers(normalizedUserId);
      
      // Filter by draft status if requested
      const queryStringParameters = event.queryStringParameters || {};
      const draftParam = queryStringParameters.draft;
      
      if (draftParam !== null && draftParam !== undefined) {
        const isDraft = draftParam === "true";
        helpers = helpers?.filter(helper => helper.isDraft === isDraft) || [];
      }
      
      // Sort by most recent first (only if helpers exist)
      if (helpers && helpers.length > 0) {
        helpers.sort((a, b) => {
          const aTime = a.metadata?.lastUpdated || a.createdAt || 0;
          const bTime = b.metadata?.lastUpdated || b.createdAt || 0;
          return new Date(bTime) - new Date(aTime);
        });
      }
      
      return createResponse({
        success: true,
        helpers: helpers || [],
      });
    }

    // GET /api/users/{userId}/helpers/{helperId} - Get helper details
    if (httpMethod === "GET" && helperId) {
      const normalizedUserId = userId.toLowerCase();
      const helper = await getHelperBlob(normalizedUserId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user (case-insensitive)
      if (helper.userId?.toLowerCase() !== userId.toLowerCase()) {
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
      const normalizedUserId = userId.toLowerCase();
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
        isDraft = false,
        metadata = {},
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
        userId: normalizedUserId,
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
        isDraft,
        metadata,
        createdAt: now,
        updatedAt: now,
      };

      await saveHelperBlob(normalizedUserId, newHelperId, helperData);

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
      const normalizedUserId = userId.toLowerCase();
      const helper = await getHelperBlob(normalizedUserId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user (case-insensitive)
      if (helper.userId?.toLowerCase() !== userId.toLowerCase()) {
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
        isDraft: data.isDraft,
        metadata: data.metadata,
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

      await saveHelperBlob(normalizedUserId, helperId, updatedHelper);

      return createResponse({
        success: true,
        helper: updatedHelper,
      });
    }

    // DELETE /api/users/{userId}/helpers/{helperId} - Delete helper
    if (httpMethod === "DELETE" && helperId) {
      const normalizedUserId = userId.toLowerCase();
      const helper = await getHelperBlob(normalizedUserId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user (case-insensitive)
      if (helper.userId?.toLowerCase() !== userId.toLowerCase()) {
        return createResponse(
          { error: "Unauthorized" },
          403
        );
      }

      await deleteHelperBlob(normalizedUserId, helperId);

      return createResponse({
        success: true,
        message: "Helper deleted successfully",
      });
    }

    // POST /api/users/{userId}/helpers/{helperId}/publish - Publish helper
    if (httpMethod === "POST" && helperId && pathname.includes("/publish")) {
      const normalizedUserId = userId.toLowerCase();
      const helper = await getHelperBlob(normalizedUserId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user (case-insensitive)
      if (helper.userId?.toLowerCase() !== userId.toLowerCase()) {
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

      await saveHelperBlob(normalizedUserId, helperId, updatedHelper);

      // Update published helpers index
      await addToPublishedHelpersIndex(updatedHelper);

      return createResponse({
        success: true,
        helper: updatedHelper,
        shareUrl: `/chat/public/${shareId}`,
      });
    }

    // POST /api/users/{userId}/helpers/{helperId}/unpublish - Unpublish helper
    if (httpMethod === "POST" && helperId && pathname.includes("/unpublish")) {
      const normalizedUserId = userId.toLowerCase();
      const helper = await getHelperBlob(normalizedUserId, helperId);
      
      if (!helper) {
        return createResponse(
          { error: "Helper not found" },
          404
        );
      }

      // Verify helper belongs to user (case-insensitive)
      if (helper.userId?.toLowerCase() !== userId.toLowerCase()) {
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

      await saveHelperBlob(normalizedUserId, helperId, updatedHelper);

      // Remove from published helpers index
      await removeFromPublishedHelpersIndex(helperId);

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
