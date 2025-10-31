/**
 * Blob Storage Utilities for Separate Blobs
 * 
 * Provides utilities for working with separate blobs for users, helpers, and conversations.
 * This anti-fragile design ensures that if one blob gets corrupted, others remain safe.
 */

import { getStore } from "@netlify/blobs";
import { promises as fs } from "fs";
import { join } from "path";

// Check if we're in local development
function isLocalDevelopment() {
  return (
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV === "development" ||
    !process.env.NETLIFY
  );
}

// Local storage base directory
const LOCAL_STORAGE_BASE = join(process.cwd(), ".netlify", "blobs-local");

// Store instances (lazy-loaded)
let userStore = null;
let helperStore = null;
let conversationStore = null;

/**
 * Get user store instance
 */
export function getUserStore() {
  if (isLocalDevelopment()) {
    return null; // Use file storage in dev
  }
  if (!userStore) {
    userStore = getStore({
      name: "obt-helper-users",
      consistency: "strong",
    });
  }
  return userStore;
}

/**
 * Get helper store instance
 */
export function getHelperStore() {
  if (isLocalDevelopment()) {
    return null; // Use file storage in dev
  }
  if (!helperStore) {
    helperStore = getStore({
      name: "obt-helper-helpers",
      consistency: "strong",
    });
  }
  return helperStore;
}

/**
 * Get conversation store instance
 */
export function getConversationStore() {
  if (isLocalDevelopment()) {
    return null; // Use file storage in dev
  }
  if (!conversationStore) {
    conversationStore = getStore({
      name: "obt-helper-conversations",
      consistency: "strong",
    });
  }
  return conversationStore;
}

/**
 * User blob operations
 */

export async function getUserBlob(userId) {
  const key = `users/${userId}.json`;
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, "users", `${userId}.json`);
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
  
  const store = getUserStore();
  const data = await store.get(key, { type: "json" });
  return data || null;
}

export async function saveUserBlob(userId, userData) {
  const key = `users/${userId}.json`;
  
  if (isLocalDevelopment()) {
    const dir = join(LOCAL_STORAGE_BASE, "users");
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), "utf8");
    return;
  }
  
  const store = getUserStore();
  await store.set(key, JSON.stringify(userData));
}

export async function deleteUserBlob(userId) {
  const key = `users/${userId}.json`;
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, "users", `${userId}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    return;
  }
  
  const store = getUserStore();
  await store.delete(key);
}

/**
 * Helper blob operations
 */

export async function getHelperBlob(userId, helperId) {
  const key = `helpers/${userId}/${helperId}.json`;
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, "helpers", userId, `${helperId}.json`);
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
  
  const store = getHelperStore();
  const data = await store.get(key, { type: "json" });
  return data || null;
}

export async function saveHelperBlob(userId, helperId, helperData) {
  const key = `helpers/${userId}/${helperId}.json`;
  
  if (isLocalDevelopment()) {
    const dir = join(LOCAL_STORAGE_BASE, "helpers", userId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${helperId}.json`);
    await fs.writeFile(filePath, JSON.stringify(helperData, null, 2), "utf8");
    return;
  }
  
  const store = getHelperStore();
  await store.set(key, JSON.stringify(helperData));
}

export async function deleteHelperBlob(userId, helperId) {
  const key = `helpers/${userId}/${helperId}.json`;
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, "helpers", userId, `${helperId}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    return;
  }
  
  const store = getHelperStore();
  await store.delete(key);
}

/**
 * List all helpers for a user
 */
export async function listUserHelpers(userId) {
  const prefix = `helpers/${userId}/`;
  
  if (isLocalDevelopment()) {
    const dir = join(LOCAL_STORAGE_BASE, "helpers", userId);
    try {
      const files = await fs.readdir(dir);
      const helpers = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const helperId = file.replace(".json", "");
          const helper = await getHelperBlob(userId, helperId);
          if (helper) {
            helpers.push(helper);
          }
        }
      }
      return helpers;
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
  
  const store = getHelperStore();
  const list = await store.list({ prefix });
  const helpers = [];
  
  for (const blob of list.blobs) {
    const helperId = blob.key.replace(`${prefix}`, "").replace(".json", "");
    const helper = await getHelperBlob(userId, helperId);
    if (helper) {
      helpers.push(helper);
    }
  }
  
  return helpers;
}

/**
 * Conversation blob operations
 */

export async function getConversationBlob(userId, conversationId) {
  const key = `conversations/${userId}/${conversationId}.json`;
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, "conversations", userId, `${conversationId}.json`);
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
  
  const store = getConversationStore();
  const data = await store.get(key, { type: "json" });
  return data || null;
}

export async function saveConversationBlob(userId, conversationId, conversationData) {
  const key = `conversations/${userId}/${conversationId}.json`;
  
  if (isLocalDevelopment()) {
    const dir = join(LOCAL_STORAGE_BASE, "conversations", userId);
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${conversationId}.json`);
    await fs.writeFile(filePath, JSON.stringify(conversationData, null, 2), "utf8");
    return;
  }
  
  const store = getConversationStore();
  await store.set(key, JSON.stringify(conversationData));
}

export async function deleteConversationBlob(userId, conversationId) {
  const key = `conversations/${userId}/${conversationId}.json`;
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, "conversations", userId, `${conversationId}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    return;
  }
  
  const store = getConversationStore();
  await store.delete(key);
}

/**
 * List all conversations for a user
 */
export async function listUserConversations(userId) {
  const prefix = `conversations/${userId}/`;
  
  if (isLocalDevelopment()) {
    const dir = join(LOCAL_STORAGE_BASE, "conversations", userId);
    try {
      const files = await fs.readdir(dir);
      const conversations = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const conversationId = file.replace(".json", "");
          const conversation = await getConversationBlob(userId, conversationId);
          if (conversation) {
            conversations.push(conversation);
          }
        }
      }
      // Sort by updatedAt descending (most recent first)
      conversations.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      return conversations;
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
  
  const store = getConversationStore();
  const list = await store.list({ prefix });
  const conversations = [];
  
  for (const blob of list.blobs) {
    const conversationId = blob.key.replace(`${prefix}`, "").replace(".json", "");
    const conversation = await getConversationBlob(userId, conversationId);
    if (conversation) {
      conversations.push(conversation);
    }
  }
  
  // Sort by updatedAt descending (most recent first)
  conversations.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || 0);
    return dateB - dateA;
  });
  
  return conversations;
}
