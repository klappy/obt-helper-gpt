/**
 * Authentication Utilities
 * 
 * Provides password hashing, token generation, and verification
 * Uses Node.js built-in crypto module
 */

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "obt-helper-secret-key-change-in-production";

/**
 * Hash a password using pbkdf2
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password, hash) {
  const [salt, hashValue] = hash.split(":");
  const hashToVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hashToVerify === hashValue;
}

/**
 * Generate a JWT-like token
 */
export function generateToken(userId, email) {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  };
  
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a token
 */
export function verifyToken(token) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique user ID
 */
export function generateUserId() {
  return `user_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Generate a unique helper ID
 */
export function generateHelperId() {
  return `helper_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Generate a unique conversation ID
 */
export function generateConversationId() {
  return `conv_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Generate a unique share ID for published helpers
 */
export function generateShareId() {
  return crypto.randomBytes(8).toString("hex");
}
