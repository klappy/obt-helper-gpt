// @ts-check

/**
 * Simple in-memory rate limiter for Netlify Functions
 * Uses sliding window approach with cleanup
 */
export class RateLimiter {
  /**
   * @param {Object} options
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {number} options.maxRequests - Max requests per window
   */
  constructor(options = { windowMs: 60000, maxRequests: 30 }) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 30; // 30 requests default
    this.requests = new Map();
  }

  /**
   * Check if request is allowed and update counter
   * @param {string} identifier - IP address or session ID
   * @returns {Object} Result with allowed status and metadata
   */
  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old entries to prevent memory leaks
    for (const [key, timestamps] of this.requests) {
      const validTimestamps = timestamps.filter((/** @type {number} */ t) => t > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }

    // Check current identifier
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter((/** @type {number} */ t) => t > windowStart);

    if (validRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + this.windowMs,
      };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetTime: now + this.windowMs,
    };
  }
}

// Pre-configured rate limiters for different functions
export const chatLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 20, // 20 chats per minute (reasonable for human interaction)
});

export const whatsappLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 WhatsApp messages per minute (more restrictive)
});

export const adminLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 50, // 50 admin actions per 5 minutes (generous for admin work)
});

export const linkingLimiter = new RateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5, // 5 linking attempts per 5 minutes (prevent spam)
});

export const previewLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 15, // 15 previews per minute (testing tools)
});

/**
 * Apply rate limiting to a request
 * @param {RateLimiter} limiter - The rate limiter instance to use
 * @param {string} identifier - IP address or session ID
 * @returns {Response|Object} 429 Response if rate limited, success object if allowed
 */
export function withRateLimit(limiter, identifier) {
  const result = /** @type {any} */ (limiter.isAllowed(identifier));

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests. Please wait before trying again.",
        retryAfter: retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfterSeconds.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
        },
      }
    );
  }

  return {
    allowed: true,
    headers: {
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    },
  };
}

/**
 * Extract client identifier for rate limiting
 * Uses IP address with fallback to session ID
 * @param {Request} req - The request object
 * @param {string|null} sessionId - Optional session ID as fallback
 * @returns {string} Client identifier
 */
export function getClientIdentifier(req, sessionId = null) {
  // Try to get real IP from various headers (Netlify, Cloudflare, etc.)
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // For unknown IPs, use session ID if available
  if (ip === "unknown" && sessionId) {
    return `session:${sessionId}`;
  }

  return ip;
}
