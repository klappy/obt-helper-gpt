// @ts-check
import { writable } from "svelte/store";

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
const mockTools = [
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

export const tools = writable(mockTools);

// Helper functions
export const getActiveTools = () => {
  return mockTools.filter((tool) => tool.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
};

/**
 * @param {string} id
 * @returns {Tool | undefined}
 */
export const getToolById = (id) => {
  return mockTools.find((tool) => tool.id === id);
};

/**
 * @param {string} id
 * @param {Partial<Tool>} updates
 */
export const updateTool = (id, updates) => {
  const toolIndex = mockTools.findIndex((tool) => tool.id === id);
  if (toolIndex !== -1) {
    mockTools[toolIndex] = { ...mockTools[toolIndex], ...updates };
    tools.set([...mockTools]); // Trigger reactivity

    // In a real app, this would save to Netlify Blobs
    console.log("Tool updated:", mockTools[toolIndex]);
  }
};

/**
 * @returns {Tool[]}
 */
export const getAllTools = () => {
  return [...mockTools];
};
