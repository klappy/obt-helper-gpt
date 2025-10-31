/**
 * Public Helpers Endpoint
 * 
 * Lists all published helpers for public gallery
 * Anti-fragile: Uses index when available, falls back to dynamic scanning
 * 
 * Routes:
 * - GET /api/helpers - List all published helpers
 * - GET /api/helpers/{shareId} - Get published helper by share ID
 */

import {
  getAllPublishedHelpers,
  getPublishedHelperByShareId,
} from "../../src/lib/utils/blob-storage.js";

// Helper to create response
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return createResponse({}, 200);
  }

  const { httpMethod, path, pathParameters, queryStringParameters } = event;
  const pathname = path || event.path || "";

  try {
    // GET /api/public-helpers?shareId=xyz - Get published helper by share ID
    const shareId = pathParameters?.shareId || queryStringParameters?.shareId;
    
    if (httpMethod === "GET" && shareId) {
      // Share ID already extracted above

      const helper = await getPublishedHelperByShareId(shareId);

      if (!helper) {
        return createResponse(
          { error: "Published helper not found" },
          404
        );
      }

      // Return helper without sensitive info
      const publicHelper = {
        id: helper.id,
        name: helper.name,
        description: helper.description,
        icon: helper.icon,
        image: helper.image,
        systemPrompt: helper.systemPrompt,
        model: helper.model,
        temperature: helper.temperature,
        maxTokens: helper.maxTokens,
        published: helper.published,
        publishedAt: helper.publishedAt,
        shareId: helper.shareId,
        createdAt: helper.createdAt,
        updatedAt: helper.updatedAt,
      };

      return createResponse({
        success: true,
        helper: publicHelper,
      });
    }

    // GET /api/helpers - List all published helpers
    if (httpMethod === "GET" && !pathParameters?.shareId) {
      // Anti-fragile: Uses index if available, falls back to dynamic scanning
      const publishedHelpers = await getAllPublishedHelpers();

      return createResponse({
        success: true,
        helpers: publishedHelpers || [],
      });
    }

    return createResponse(
      { error: "Method not allowed" },
      405
    );
  } catch (error) {
    console.error("Public helpers endpoint error:", error);
    return createResponse(
      {
        error: "Internal server error",
        details: error.message,
      },
      500
    );
  }
};
