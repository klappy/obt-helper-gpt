/**
 * User Authentication Store
 * 
 * Handles user registration, login, and session management
 * Replaces the simple admin auth for workshop users
 */

import { writable, get } from "svelte/store";

const browser = typeof window !== "undefined";

// User state
export const currentUser = writable(null);
export const authToken = writable(null);
export const isAuthenticated = writable(false);

// API base URL - use relative paths, let the proxy handle it
const API_BASE = "/.netlify/functions";

/**
 * Register a new user
 */
export async function register(email, password) {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      // Check if it's a server error (500/502/503) vs client error
      if (response.status >= 500) {
        throw new Error("Server error. Please try again in a moment.");
      } else {
        throw new Error("Invalid response from server. Please try again.");
      }
    }

    if (!response.ok) {
      // Provide specific error messages based on status code and response
      let errorMessage = "Registration failed";
      
      if (response.status >= 500) {
        // Server error - check if it's a syntax/module error (502) or actual server error
        if (response.status === 502 && data.errorType === "Runtime.UserCodeSyntaxError") {
          errorMessage = "Server configuration error. Please contact support if this persists.";
        } else {
          errorMessage = data.error || data.message || data.errorMessage || "Server error. Please try again in a moment.";
        }
      } else if (response.status === 409) {
        // User already exists
        errorMessage = data.error || "This email is already registered. Please login instead.";
      } else if (response.status === 400) {
        // Bad request - validation error
        errorMessage = data.error || data.message || "Please check your email and password.";
      } else {
        // Other client errors
        errorMessage = data.error || data.message || data.errorMessage || "Registration failed. Please try again.";
      }
      
      throw new Error(errorMessage);
    }

    // Store token and user data
    const token = data.token;
    const user = data.user;

    authToken.set(token);
    currentUser.set(user);
    isAuthenticated.set(true);

    // Persist to sessionStorage
    if (browser) {
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("currentUser", JSON.stringify(user));
    }

    return { success: true, user, token };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

/**
 * Login with email and password
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/users?action=login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error("Empty response from server");
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      // Check if it's a server error (500/502/503) vs client error
      if (response.status >= 500) {
        throw new Error("Server error. Please try again in a moment.");
      } else {
        throw new Error("Invalid response from server. Please try again.");
      }
    }

    if (!response.ok) {
      // Provide specific error messages based on status code and response
      let errorMessage = "Login failed";
      
      if (response.status >= 500) {
        // Server error - check if it's a syntax/module error (502) or actual server error
        if (response.status === 502 && data.errorType === "Runtime.UserCodeSyntaxError") {
          errorMessage = "Server configuration error. Please contact support if this persists.";
        } else {
          errorMessage = data.error || data.message || data.errorMessage || "Server error. Please try again in a moment.";
        }
      } else if (response.status === 401) {
        // Unauthorized - wrong email/password
        errorMessage = data.error || data.message || "Invalid email or password. Please check your credentials.";
      } else if (response.status === 400) {
        // Bad request - validation error
        errorMessage = data.error || data.message || "Please check your email and password.";
      } else {
        // Other client errors
        errorMessage = data.error || data.message || data.errorMessage || "Login failed. Please try again.";
      }
      
      throw new Error(errorMessage);
    }

    // Store token and user data
    const token = data.token;
    const user = data.user;

    authToken.set(token);
    currentUser.set(user);
    isAuthenticated.set(true);

    // Persist to sessionStorage
    if (browser) {
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("currentUser", JSON.stringify(user));
    }

    return { success: true, user, token };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Logout current user
 */
export function logout() {
  authToken.set(null);
  currentUser.set(null);
  isAuthenticated.set(false);

  if (browser) {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUser");
  }
}

/**
 * Get auth token for API requests
 */
export function getAuthToken() {
  return get(authToken);
}

/**
 * Get authenticated user
 */
export function getCurrentUser() {
  return get(currentUser);
}

/**
 * Check if user is authenticated
 */
export function checkAuth() {
  return get(isAuthenticated);
}

/**
 * Restore session from sessionStorage
 */
export function restoreSession() {
  if (!browser) return;

  const token = sessionStorage.getItem("authToken");
  const userStr = sessionStorage.getItem("currentUser");

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      authToken.set(token);
      currentUser.set(user);
      isAuthenticated.set(true);
    } catch (error) {
      console.error("Error restoring session:", error);
      logout();
    }
  }
}

/**
 * Initialize auth on app load
 */
if (browser) {
  restoreSession();
}
