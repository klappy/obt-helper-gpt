/**
 * User Management Endpoints
 * 
 * Handles user registration, login, and profile management
 * 
 * Routes:
 * - POST /api/users - Register new user
 * - POST /api/users/login - Login
 * - GET /api/users/{userId} - Get user profile
 * - PUT /api/users/{userId} - Update user profile
 */

import {
  getUserBlob,
  saveUserBlob,
  deleteUserBlob,
} from "../../src/lib/utils/blob-storage.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateUserId,
} from "../../src/lib/utils/auth.js";

// Helper to create response - using Response API
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

// Helper to extract userId from path
function getUserIdFromPath(pathname) {
  const match = pathname.match(/\/api\/users\/([^\/]+)/);
  return match ? match[1] : null;
}

// Helper to get auth token from headers
function getAuthToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Helper to verify auth and get user
async function verifyAuth(request) {
  const token = getAuthToken(request);
  if (!token) {
    return { authenticated: false, error: "No token provided" };
  }
  
  const { verifyToken } = await import("../../src/lib/utils/auth.js");
  const payload = verifyToken(token);
  if (!payload) {
    return { authenticated: false, error: "Invalid token" };
  }
  
  return { authenticated: true, userId: payload.userId, email: payload.email };
}

export const handler = async (event, context) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return createResponse({}, 200);
    }

    const { httpMethod, path, pathParameters, queryStringParameters, body } = event;
    // Netlify Functions: path will be empty when accessing /.netlify/functions/users directly
    // Or it might be "/users" or "/api/users" depending on routing
    const pathname = path || event.path || "";
    
    // Log for debugging (remove in production)
    console.log("Users function called:", { httpMethod, pathname, hasAction: !!queryStringParameters?.action });
    
    // Check if this is the users endpoint (empty path means we're at the function root)
    // Accept any request to this function - Netlify routes /.netlify/functions/users to this handler
    const isUsersEndpoint = true; // Since this IS the users function handler, all requests here are for users

    try {
    // POST /api/users - Register new user
    if (httpMethod === "POST" && isUsersEndpoint && !queryStringParameters?.action) {
      // Handle both string and already-parsed body
      let data;
      if (typeof body === "string") {
        try {
          data = JSON.parse(body || "{}");
        } catch (e) {
          return createResponse(
            { error: "Invalid JSON in request body" },
            400
          );
        }
      } else {
        data = body || {};
      }
      const { email, password } = data;

      if (!email || !password) {
        return createResponse(
          { error: "Email and password are required" },
          400
        );
      }

      // Check if user already exists (simple check by email)
      // In production, you'd want to maintain an email index
      // For now, we'll use a simple lookup pattern
      // This is a limitation - we'll need to scan or use email as part of ID
      
      // For workshop, use email-based userId
      const userId = `user_${Buffer.from(email.toLowerCase()).toString("base64url").substring(0, 20)}`;
      
      // Check if user exists
      let existingUser;
      try {
        existingUser = await getUserBlob(userId);
      } catch (blobError) {
        console.error("Error checking existing user:", blobError);
        // Continue anyway - might be first time
        existingUser = null;
      }
      
      if (existingUser && existingUser.email && existingUser.email.toLowerCase() === email.toLowerCase()) {
        return createResponse(
          { error: "User already exists" },
          409
        );
      }

      // Create new user
      const userData = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        preferences: {
          theme: "light",
          defaultModel: "gpt-4o-mini",
        },
      };

      try {
        await saveUserBlob(userId, userData);
      } catch (saveError) {
        console.error("Error saving user:", saveError);
        return createResponse(
          { error: "Failed to save user. Please try again." },
          500
        );
      }

      // Generate token
      const token = generateToken(userId, email);

      return createResponse(
        {
          success: true,
          user: {
            id: userData.id,
            email: userData.email,
            createdAt: userData.createdAt,
          },
          token,
        },
        201
      );
    }

    // POST /api/users/login - Login
    if (httpMethod === "POST" && isUsersEndpoint && queryStringParameters?.action === "login") {
      // Handle both string and already-parsed body
      let data;
      if (typeof body === "string") {
        try {
          data = JSON.parse(body || "{}");
        } catch (e) {
          return createResponse(
            { error: "Invalid JSON in request body" },
            400
          );
        }
      } else {
        data = body || {};
      }
      const { email, password } = data;

      if (!email || !password) {
        return createResponse(
          { error: "Email and password are required" },
          400
        );
      }

      // For workshop, use email-based userId lookup
      const userId = `user_${Buffer.from(email.toLowerCase()).toString("base64url").substring(0, 20)}`;
      const user = await getUserBlob(userId);

      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        return createResponse(
          { error: "Invalid email or password" },
          401
        );
      }

      if (!verifyPassword(password, user.passwordHash)) {
        return createResponse(
          { error: "Invalid email or password" },
          401
        );
      }

      // Update last login
      user.lastLoginAt = new Date().toISOString();
      await saveUserBlob(userId, user);

      // Generate token
      const token = generateToken(userId, email);

      return createResponse({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        token,
      });
    }

    // GET /api/users/{userId} - Get user profile
    if (httpMethod === "GET") {
      const userId = pathParameters?.userId || getUserIdFromPath(pathname);
      
      if (!userId) {
        return createResponse(
          { error: "User ID is required" },
          400
        );
      }

      // Verify auth
      const auth = await verifyAuth({ headers: event.headers });
      if (!auth.authenticated || auth.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          401
        );
      }

      const user = await getUserBlob(userId);
      if (!user) {
        return createResponse(
          { error: "User not found" },
          404
        );
      }

      // Return user without password hash
      return createResponse({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          preferences: user.preferences,
        },
      });
    }

    // PUT /api/users/{userId} - Update user profile
    if (httpMethod === "PUT") {
      const userId = pathParameters?.userId || getUserIdFromPath(pathname);
      
      if (!userId) {
        return createResponse(
          { error: "User ID is required" },
          400
        );
      }

      // Verify auth
      const auth = await verifyAuth({ headers: event.headers });
      if (!auth.authenticated || auth.userId !== userId) {
        return createResponse(
          { error: "Unauthorized" },
          401
        );
      }

      const user = await getUserBlob(userId);
      if (!user) {
        return createResponse(
          { error: "User not found" },
          404
        );
      }

      // Handle both string and already-parsed body
      let data;
      if (typeof body === "string") {
        try {
          data = JSON.parse(body || "{}");
        } catch (e) {
          return createResponse(
            { error: "Invalid JSON in request body" },
            400
          );
        }
      } else {
        data = body || {};
      }
      const { preferences } = data;

      // Update preferences if provided
      if (preferences) {
        user.preferences = { ...user.preferences, ...preferences };
      }

      await saveUserBlob(userId, user);

      return createResponse({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          preferences: user.preferences,
        },
      });
    }

    return createResponse(
      { error: "Method not allowed" },
      405
    );
  } catch (error) {
    console.error("User endpoint error:", error);
    console.error("Error stack:", error.stack);
    // Provide clearer error messages
    let errorMessage = "Internal server error";
    if (error.message) {
      if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "Invalid request data";
      } else if (error.message.includes("pattern") || error.message.includes("match")) {
        errorMessage = "Invalid data format";
      } else {
        errorMessage = error.message;
      }
    }
    try {
      return createResponse(
        {
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        500
      );
    } catch (responseError) {
      console.error("Failed to create error response:", responseError);
      // Fallback - return a basic error
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};
