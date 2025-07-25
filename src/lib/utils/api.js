// API configuration for handling development vs production endpoints
const isDevelopment = typeof window !== "undefined" && window.location.hostname === "localhost";
const BACKEND_URL = isDevelopment
  ? "http://localhost:9888"
  : typeof window !== "undefined"
    ? window.location.origin
    : "";

/**
 * Get the full API endpoint URL
 * @param {string} path - The function path (e.g., '/tools', '/chat')
 * @returns {string} - The full URL
 */
export function getApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}/.netlify/functions${cleanPath.replace("/.netlify/functions", "")}`;
}

/**
 * Enhanced fetch with automatic URL resolution
 * @param {string} path - The API path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function apiFetch(path, options = {}) {
  const url = getApiUrl(path);
  return fetch(url, options);
}

export { BACKEND_URL };
