// @ts-check
import { writable } from "svelte/store";

// Simple admin authentication (in production, use proper auth)
export const isAdmin = writable(false);

const ADMIN_PASSWORD = "admin123"; // In production, use proper authentication

/**
 * @param {string} password
 * @returns {boolean}
 */
export function login(password) {
  if (password === ADMIN_PASSWORD) {
    isAdmin.set(true);
    return true;
  }
  return false;
}

export function logout() {
  isAdmin.set(false);
}
