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
  try {
    if (!userStore) {
      userStore = getStore({
        name: "obt-helper-users",
        consistency: "strong",
      });
    }
    return userStore;
  } catch (error) {
    console.error("Error creating user store:", error);
    // Return null as fallback - will use file storage
    return null;
  }
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
  if (!store) {
    // In production, blob store should always be available
    // If it's not, this is a configuration issue
    if (!isLocalDevelopment()) {
      throw new Error("Blob store unavailable in production. Please check Netlify Blob Store configuration.");
    }
    // Only use file fallback in local development
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
  if (!store) {
    // In production, blob store should always be available
    // If it's not, this is a configuration issue
    if (!isLocalDevelopment()) {
      throw new Error("Blob store unavailable in production. Please check Netlify Blob Store configuration.");
    }
    // Only use file fallback in local development
    const dir = join(LOCAL_STORAGE_BASE, "users");
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), "utf8");
    return;
  }
  try {
    await store.set(key, userData);
  } catch (error) {
    console.error("Error saving to blob store:", error);
    // In production, fail fast - don't try file storage
    if (!isLocalDevelopment()) {
      throw new Error(`Failed to save user blob: ${error.message}`);
    }
    // Only try file fallback in local development
    console.warn("Falling back to file storage");
    const dir = join(LOCAL_STORAGE_BASE, "users");
    await fs.mkdir(dir, { recursive: true });
    const filePath = join(dir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), "utf8");
  }
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
 * List ALL helpers across all users (for published helpers listing)
 * Anti-fragile: Dynamically scans all helper blobs
 */
export async function listAllHelpers() {
  const prefix = `helpers/`;
  
  if (isLocalDevelopment()) {
    const baseDir = join(LOCAL_STORAGE_BASE, "helpers");
    try {
      const userDirs = await fs.readdir(baseDir);
      const allHelpers = [];
      for (const userDir of userDirs) {
        const userPath = join(baseDir, userDir);
        const stats = await fs.stat(userPath);
        if (stats.isDirectory()) {
          const files = await fs.readdir(userPath);
          for (const file of files) {
            if (file.endsWith(".json")) {
              const helperId = file.replace(".json", "");
              const helper = await getHelperBlob(userDir, helperId);
              if (helper) {
                allHelpers.push(helper);
              }
            }
          }
        }
      }
      return allHelpers;
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
  
  const store = getHelperStore();
  const list = await store.list({ prefix });
  const allHelpers = [];
  
  for (const blob of list.blobs) {
    // Extract userId and helperId from key: helpers/{userId}/{helperId}.json
    const parts = blob.key.replace("helpers/", "").replace(".json", "").split("/");
    if (parts.length === 2) {
      const [userId, helperId] = parts;
      const helper = await getHelperBlob(userId, helperId);
      if (helper) {
        allHelpers.push(helper);
      }
    }
  }
  
  return allHelpers;
}

/**
 * Get published helpers index (lightweight cache)
 * Returns null if index doesn't exist (anti-fragile - can rebuild)
 */
export async function getPublishedHelpersIndex() {
  const key = "published-helpers-index.json";
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, key);
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

/**
 * Save published helpers index
 */
export async function savePublishedHelpersIndex(index) {
  const key = "published-helpers-index.json";
  
  if (isLocalDevelopment()) {
    const filePath = join(LOCAL_STORAGE_BASE, key);
    await fs.writeFile(filePath, JSON.stringify(index, null, 2), "utf8");
    return;
  }
  
  const store = getHelperStore();
  await store.set(key, JSON.stringify(index));
}

/**
 * Update published helpers index (add helper)
 */
export async function addToPublishedHelpersIndex(helper) {
  try {
    let index = await getPublishedHelpersIndex();
    if (!index) {
      index = { helpers: [] };
    }
    
    // Remove existing entry if present
    index.helpers = index.helpers.filter(h => h.id !== helper.id);
    
    // Add new entry
    index.helpers.push({
      id: helper.id,
      userId: helper.userId,
      shareId: helper.shareId,
      name: helper.name,
      description: helper.description,
      icon: helper.icon,
      model: helper.model,
      publishedAt: helper.publishedAt,
      updatedAt: helper.updatedAt,
    });
    
    // Sort by publishedAt descending
    index.helpers.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0);
      const dateB = new Date(b.publishedAt || 0);
      return dateB - dateA;
    });
    
    await savePublishedHelpersIndex(index);
  } catch (error) {
    console.error("Error updating published helpers index:", error);
    // Don't throw - index is optional
  }
}

/**
 * Remove from published helpers index
 */
export async function removeFromPublishedHelpersIndex(helperId) {
  try {
    const index = await getPublishedHelpersIndex();
    if (!index) {
      return; // No index to update
    }
    
    index.helpers = index.helpers.filter(h => h.id !== helperId);
    await savePublishedHelpersIndex(index);
  } catch (error) {
    console.error("Error updating published helpers index:", error);
    // Don't throw - index is optional
  }
}

/**
 * Rebuild published helpers index from all helpers
 * Anti-fragile: Can rebuild index if it gets corrupted
 */
export async function rebuildPublishedHelpersIndex() {
  try {
    const allHelpers = await listAllHelpers();
    const publishedHelpers = allHelpers
      .filter(helper => helper.published === true && helper.shareId)
      .map(helper => ({
        id: helper.id,
        userId: helper.userId,
        shareId: helper.shareId,
        name: helper.name,
        description: helper.description,
        icon: helper.icon,
        model: helper.model,
        publishedAt: helper.publishedAt,
        updatedAt: helper.updatedAt,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        return dateB - dateA;
      });
    
    const index = { helpers: publishedHelpers };
    await savePublishedHelpersIndex(index);
    return index;
  } catch (error) {
    console.error("Error rebuilding published helpers index:", error);
    throw error;
  }
}

/**
 * Get all published helpers (uses index if available, otherwise scans dynamically)
 * Anti-fragile: Falls back to dynamic scan if index is missing or corrupted
 */
export async function getAllPublishedHelpers() {
  try {
    // Try to use index first (faster)
    const index = await getPublishedHelpersIndex();
    if (index && index.helpers && index.helpers.length > 0) {
      // Verify entries are still valid by checking a few
      const sampleHelper = index.helpers[0];
      const fullHelper = await getHelperBlob(sampleHelper.userId, sampleHelper.id);
      
      if (fullHelper && fullHelper.published && fullHelper.shareId) {
        // Index looks good, return it
        return index.helpers;
      }
      
      // Index might be stale, rebuild it
      console.log("Published helpers index appears stale, rebuilding...");
      const rebuilt = await rebuildPublishedHelpersIndex();
      return rebuilt.helpers;
    }
    
    // No index or empty index - scan dynamically
    console.log("No published helpers index found, scanning dynamically...");
    const allHelpers = await listAllHelpers();
    const publishedHelpers = allHelpers
      .filter(helper => helper.published === true && helper.shareId)
      .map(helper => ({
        id: helper.id,
        userId: helper.userId,
        shareId: helper.shareId,
        name: helper.name,
        description: helper.description,
        icon: helper.icon,
        model: helper.model,
        publishedAt: helper.publishedAt,
        updatedAt: helper.updatedAt,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        return dateB - dateA;
      });
    
    // Cache the result
    if (publishedHelpers.length > 0) {
      await savePublishedHelpersIndex({ helpers: publishedHelpers });
    }
    
    return publishedHelpers;
  } catch (error) {
    console.error("Error getting published helpers:", error);
    // Final fallback: return empty array
    return [];
  }
}

/**
 * Get published helper by shareId
 */
export async function getPublishedHelperByShareId(shareId) {
  // Try index first
  const index = await getPublishedHelpersIndex();
  if (index && index.helpers) {
    const indexEntry = index.helpers.find(h => h.shareId === shareId);
    if (indexEntry) {
      const fullHelper = await getHelperBlob(indexEntry.userId, indexEntry.id);
      if (fullHelper && fullHelper.published && fullHelper.shareId === shareId) {
        return fullHelper;
      }
    }
  }
  
  // Fallback: scan all helpers
  const allHelpers = await listAllHelpers();
  return allHelpers.find(
    helper => helper.shareId === shareId && helper.published === true
  ) || null;
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
