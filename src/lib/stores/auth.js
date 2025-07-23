// @ts-check
import { writable } from "svelte/store";
import { browser } from "$app/environment";

// Simple admin authentication with email whitelist
export const isAdmin = writable(false);
export const adminEmail = writable("");

// Get from environment variables with fallbacks
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const ALLOWED_EMAILS = (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || "")
  .split(",")
  .map((/** @type {string} */ e) => e.trim())
  .filter((/** @type {string} */ e) => e);

/**
 * @param {string} email
 * @param {string} password
 * @returns {boolean}
 */
export function login(email, password) {
  // Check both email and password
  if (ALLOWED_EMAILS.includes(email) && password === ADMIN_PASSWORD) {
    isAdmin.set(true);
    adminEmail.set(email);

    // Store in sessionStorage so it survives page refresh
    if (browser) {
      sessionStorage.setItem("adminEmail", email);
      sessionStorage.setItem("adminAuth", "true");
    }

    return true;
  }
  return false;
}

export function logout() {
  isAdmin.set(false);
  adminEmail.set("");

  if (browser) {
    sessionStorage.removeItem("adminEmail");
    sessionStorage.removeItem("adminAuth");
  }
}

// Check session on load
if (browser) {
  const savedEmail = sessionStorage.getItem("adminEmail");
  const savedAuth = sessionStorage.getItem("adminAuth");

  if (savedAuth === "true" && savedEmail && ALLOWED_EMAILS.includes(savedEmail)) {
    isAdmin.set(true);
    adminEmail.set(savedEmail);
  }
}
