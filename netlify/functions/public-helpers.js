/**
 * Public Helpers Endpoint
 * 
 * Lists all published helpers for public gallery
 * 
 * Routes:
 * - GET /api/helpers - List all published helpers
 * - GET /api/helpers/{shareId} - Get published helper by share ID
 */

import { listUserHelpers } from "../../src/lib/utils/blob-storage.js";

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
    // GET /api/helpers/{shareId} - Get published helper by share ID
    if (httpMethod === "GET" && pathParameters?.shareId) {
      const shareId = pathParameters.shareId;

      // Note: This requires iterating through all users to find the helper
      // In production, you'd want an index or search capability
      // For now, return error suggesting we need a different approach
      return createResponse(
        {
          error: "Share ID lookup not yet implemented. This requires helper indexing.",
        },
        501
      );
    }

    // GET /api/helpers - List all published helpers
    if (httpMethod === "GET" && !pathParameters?.shareId) {
      // Note: This requires listing all users and their helpers
      // This is not efficient for production - you'd want a search index
      // For now, return empty list with note about implementation needed
      
      // In a real implementation, you'd:
      // 1. Maintain a published-helpers index blob
      // 2. Query that index instead of iterating through all users
      // 3. Return paginated results

      return createResponse({
        success: true,
        helpers: [],
        note: "Public helpers listing requires a published-helpers index to be implemented. For now, returning empty list.",
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
