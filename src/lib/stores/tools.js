// @ts-check
import { writable } from "svelte/store";
// Server-side safe browser detection
const browser = typeof window !== 'undefined';

/**
 * @typedef {Object} Tool
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {string} systemPrompt
 * @property {string} model
 * @property {number} temperature
 * @property {number} maxTokens
 * @property {boolean} isActive
 * @property {number} orderIndex
 */

/** @type {Tool[]} */
const defaultTools = [
  {
    id: "creative-writing",
    name: "Creative Writing Assistant",
    description: "Help with stories, scripts, and creative content",
    icon: "✍️",
    systemPrompt:
      "You are a creative writing assistant. Help users develop compelling stories, improve their writing style, and overcome writer's block. Be encouraging and offer specific, actionable feedback.",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2048,
    isActive: true,
    orderIndex: 1,
  },
  {
    id: "math-tutor",
    name: "Math Tutor",
    description: "Step-by-step math problem solving",
    icon: "🧮",
    systemPrompt:
      'You are a patient math tutor. Break down problems step-by-step, explain concepts clearly, and help students understand the "why" behind mathematical operations. Never just give answers without explanation.',
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 1500,
    isActive: true,
    orderIndex: 2,
  },
  {
    id: "recipe-helper",
    name: "Recipe Helper",
    description: "Cooking ideas and recipe modifications",
    icon: "👨‍🍳",
    systemPrompt:
      "You are a friendly chef assistant. Help users find recipes based on ingredients they have, suggest modifications for dietary restrictions, and explain cooking techniques in simple terms.",
    model: "gpt-4o-mini",
    temperature: 0.8,
    maxTokens: 2000,
    isActive: true,
    orderIndex: 3,
  },
  {
    id: "code-helper",
    name: "Code Helper",
    description: "Programming assistance and debugging",
    icon: "💻",
    systemPrompt:
      "You are a helpful programming assistant. Help users debug code, explain programming concepts, and suggest best practices. Always provide working examples and explain your reasoning.",
    model: "gpt-4o",
    temperature: 0.2,
    maxTokens: 3000,
    isActive: true,
    orderIndex: 4,
  },
  {
    id: "language-buddy",
    name: "Language Learning Buddy",
    description: "Practice conversations and learn new languages",
    icon: "🗣️",
    systemPrompt:
      "You are a language learning assistant. Help users practice conversations, explain grammar rules, and provide cultural context. Be patient and encouraging, and adapt to their skill level.",
    model: "gpt-4o-mini",
    temperature: 0.6,
    maxTokens: 1800,
    isActive: true,
    orderIndex: 5,
  },
  {
    id: "business-advisor",
    name: "Business Strategy Advisor",
    description: "Business planning and strategy guidance",
    icon: "📊",
    systemPrompt:
      "You are a business strategy consultant. Help users develop business plans, analyze market opportunities, and make strategic decisions. Provide practical, actionable advice based on business best practices.",
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 2500,
    isActive: true,
    orderIndex: 6,
  },
];

// API endpoints
const API_BASE = browser ? window.location.origin : "";
const TOOLS_API = `${API_BASE}/.netlify/functions/tools`;

// Store for tools data
let currentTools = [...defaultTools];
export const tools = writable(currentTools);

// Loading state
export const isLoading = writable(false);

/**
 * Fetch tools from Netlify Blobs
 */
async function fetchTools() {
  if (!browser) return defaultTools;

  try {
    isLoading.set(true);
    const response = await fetch(TOOLS_API);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const toolsData = await response.json();

    if (Array.isArray(toolsData) && toolsData.length > 0) {
      currentTools = toolsData;
      tools.set(currentTools);
      return toolsData;
    }

    return defaultTools;
  } catch (error) {
    console.error("Error fetching tools:", error);
    // Fallback to localStorage if available
    return loadFromLocalStorage();
  } finally {
    isLoading.set(false);
  }
}

/**
 * Fallback to localStorage (for offline/development)
 */
function loadFromLocalStorage() {
  if (!browser) return defaultTools;

  try {
    const stored = localStorage.getItem("obt-helper-tools");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentTools = parsed;
        tools.set(currentTools);
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }

  return defaultTools;
}

/**
 * Save to localStorage as backup
 */
function saveToLocalStorage(toolsData) {
  if (!browser) return;

  try {
    localStorage.setItem("obt-helper-tools", JSON.stringify(toolsData));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

// Initialize tools on load
if (browser) {
  fetchTools();
}

// Helper functions
export const getActiveTools = () => {
  return currentTools.filter((tool) => tool.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
};

/**
 * @param {string} id
 * @returns {Tool | undefined}
 */
export const getToolById = (id) => {
  return currentTools.find((tool) => tool.id === id);
};

/**
 * @param {string} id
 * @param {Partial<Tool>} updates
 */
export const updateTool = async (id, updates) => {
  if (!browser) return false;

  try {
    isLoading.set(true);

    const response = await fetch(TOOLS_API, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, updates }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedTool = await response.json();

    // Update local state
    const toolIndex = currentTools.findIndex((tool) => tool.id === id);
    if (toolIndex !== -1) {
      currentTools[toolIndex] = updatedTool;
      tools.set([...currentTools]);
      saveToLocalStorage(currentTools); // Backup to localStorage
    }

    return true;
  } catch (error) {
    console.error("Error updating tool:", error);

    // Fallback to localStorage update
    const toolIndex = currentTools.findIndex((tool) => tool.id === id);
    if (toolIndex !== -1) {
      currentTools[toolIndex] = { ...currentTools[toolIndex], ...updates };
      tools.set([...currentTools]);
      saveToLocalStorage(currentTools);
    }

    return false;
  } finally {
    isLoading.set(false);
  }
};

/**
 * @returns {Tool[]}
 */
export const getAllTools = () => {
  return [...currentTools];
};

/**
 * Reset tools to defaults
 */
export const resetToolsToDefaults = async () => {
  if (!browser) return false;

  try {
    isLoading.set(true);

    const response = await fetch(`${TOOLS_API}?action=reset`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Refresh tools from server
    await fetchTools();
    return true;
  } catch (error) {
    console.error("Error resetting tools:", error);

    // Fallback to local reset
    currentTools = [...defaultTools];
    tools.set(currentTools);
    saveToLocalStorage(currentTools);
    return false;
  } finally {
    isLoading.set(false);
  }
};

/**
 * Export current tools configuration
 */
export const exportTools = () => {
  return JSON.stringify(currentTools, null, 2);
};

/**
 * Import tools configuration from JSON string
 * @param {string} jsonString
 */
export const importTools = async (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return false;
    }

    // Update each tool individually
    for (const tool of parsed) {
      if (tool.id) {
        await updateTool(tool.id, tool);
      }
    }

    // Refresh from server
    await fetchTools();
    return true;
  } catch (error) {
    console.error("Error importing tools:", error);
    return false;
  }
};

/**
 * Refresh tools from server
 */
export const refreshTools = fetchTools;
