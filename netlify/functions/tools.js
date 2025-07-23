import { getStore } from "@netlify/blobs";
import { promises as fs } from "fs";
import { join } from "path";

// Local file storage path
const LOCAL_STORAGE_PATH = join(process.cwd(), ".netlify", "blobs-local", "tools-data.json");

// Store will be initialized only when needed in production
let store = null;

function getStoreInstance() {
  if (!store && !isLocalDevelopment()) {
    store = getStore({
      name: "obt-helper-tools",
      consistency: "strong", // Ensures immediate consistency for collaboration
    });
  }
  return store;
}

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
    id: "social-media-creator",
    name: "Social Media Content Creator",
    description: "Create engaging posts, captions, and social media strategies",
    icon: "📱",
    systemPrompt:
      "You are a social media expert who creates viral content. Help users craft engaging posts, write compelling captions, plan content calendars, and develop social media strategies. Focus on current trends, platform-specific best practices, and audience engagement. Always include relevant hashtags and call-to-action suggestions.",
    model: "gpt-4o",
    temperature: 0.8,
    maxTokens: 2000,
    isActive: true,
    orderIndex: 2,
  },
  {
    id: "email-assistant",
    name: "Email Assistant",
    description: "Draft professional emails, replies, and communication",
    icon: "📧",
    systemPrompt:
      "You are a professional email assistant. Help users draft clear, professional emails for business communication. Adjust tone based on context (formal, casual, sales, support). Provide subject line suggestions and ensure proper email etiquette. Handle follow-ups, meeting requests, and difficult conversations with tact.",
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 1500,
    isActive: true,
    orderIndex: 3,
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "Analyze data, create insights, and generate reports",
    icon: "📊",
    systemPrompt:
      "You are a data analyst expert. Help users understand their data, identify trends, create visualizations concepts, and generate actionable business insights. Ask clarifying questions about the data context and business goals. Provide statistical analysis, recommendations, and explain findings in plain language.",
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 3000,
    isActive: true,
    orderIndex: 4,
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
    orderIndex: 5,
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
    orderIndex: 6,
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
    orderIndex: 7,
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
    orderIndex: 8,
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
    orderIndex: 9,
  },
  {
    id: "travel-planner",
    name: "Travel Planner",
    description: "Plan trips, find destinations, and travel advice",
    icon: "✈️",
    systemPrompt:
      "You are a professional travel planner with extensive knowledge of destinations worldwide. Help users plan trips, find accommodations, suggest itineraries, and provide local insights. Consider budget, travel style, and personal preferences. Include practical tips for transportation, dining, and cultural experiences.",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2500,
    isActive: true,
    orderIndex: 10,
  },
];

// Check if we're in local development
function isLocalDevelopment() {
  // Fixed: Proper environment detection for local vs production
  return (
    process.env.NETLIFY_DEV === "true" ||
    process.env.NODE_ENV === "development" ||
    !process.env.DEPLOY_URL
  );
}

export default async (request, context) => {
  const url = new URL(request.url);
  const method = request.method;
  const searchParams = url.searchParams;

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers,
    });
  }

  try {
    switch (method) {
      case "GET":
        // Get all tools or specific tool
        if (searchParams.get("id")) {
          const tool = await getTool(searchParams.get("id"));
          return new Response(JSON.stringify(tool || { error: "Tool not found" }), {
            status: tool ? 200 : 404,
            headers,
          });
        } else {
          const tools = await getAllTools();
          return new Response(JSON.stringify(tools), {
            status: 200,
            headers,
          });
        }

      case "POST":
        // Create or initialize tools
        const parsedBody = await request.json();
        if (parsedBody.action === "initialize") {
          await initializeDefaultTools();
          return new Response(JSON.stringify({ message: "Tools initialized" }), {
            status: 200,
            headers,
          });
        }
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers,
        });

      case "PUT":
        // Update a tool
        const updateData = await request.json();
        const updatedTool = await updateTool(updateData.id, updateData.updates);
        return new Response(JSON.stringify(updatedTool), {
          status: 200,
          headers,
        });

      case "DELETE":
        // Reset to defaults
        if (searchParams.get("action") === "reset") {
          await resetToDefaults();
          return new Response(JSON.stringify({ message: "Tools reset to defaults" }), {
            status: 200,
            headers,
          });
        }
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers,
        });

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers,
        });
    }
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers,
      }
    );
  }
};

export async function getAllTools() {
  try {
    // Use local file storage for development
    if (isLocalDevelopment()) {
      console.log("Development mode: using local file storage");
      try {
        const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf8");
        return JSON.parse(data);
      } catch (fileError) {
        // File doesn't exist or is corrupted, initialize with defaults
        console.log("No local storage file found, initializing with defaults");
        await initializeDefaultTools();
        return defaultTools;
      }
    }

    // Use Netlify Blobs in production
    const storeInstance = getStoreInstance();
    const toolsData = await storeInstance.get("tools-data", { type: "json" });

    if (!toolsData) {
      // Initialize with defaults on first access
      await initializeDefaultTools();
      return defaultTools;
    }

    return toolsData;
  } catch (error) {
    console.error("Error getting tools:", error);
    return defaultTools;
  }
}

async function getTool(id) {
  const tools = await getAllTools();
  return tools.find((tool) => tool.id === id);
}

async function updateTool(id, updates) {
  console.log(`updateTool called for ${id} with updates:`, updates);
  console.log(`Environment: isLocalDevelopment=${isLocalDevelopment()}`);

  const tools = await getAllTools();
  const toolIndex = tools.findIndex((tool) => tool.id === id);

  if (toolIndex === -1) {
    throw new Error("Tool not found");
  }

  tools[toolIndex] = { ...tools[toolIndex], ...updates };

  // Handle storage based on environment
  if (isLocalDevelopment()) {
    console.log("Development mode: saving to local file storage");
    await saveToLocalFile(tools);
  } else {
    console.log("Production mode: saving to Netlify Blobs");
    try {
      const storeInstance = getStoreInstance();
      const serialized = JSON.stringify(tools);
      console.log(
        `Saving ${tools.length} tools to Netlify Blobs, data length: ${serialized.length}`
      );
      await storeInstance.set("tools-data", serialized);
      console.log("Successfully saved to Netlify Blobs");

      // Verify the save worked
      const verification = await storeInstance.get("tools-data", { type: "json" });
      console.log(`Verification: retrieved ${verification?.length || 0} tools from storage`);
    } catch (blobError) {
      console.error("Error saving to Netlify Blobs:", blobError);
      throw new Error(`Storage error: ${blobError.message}`);
    }
  }

  return tools[toolIndex];
}

async function saveToLocalFile(tools) {
  try {
    // Ensure directory exists
    await fs.mkdir(join(process.cwd(), ".netlify", "blobs-local"), { recursive: true });
    // Save to file
    await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(tools, null, 2));
    console.log("Tools saved to local file storage");
  } catch (error) {
    console.error("Error saving to local file:", error);
  }
}

async function initializeDefaultTools() {
  if (isLocalDevelopment()) {
    console.log("Development mode: initializing local file storage");
    await saveToLocalFile(defaultTools);
  } else {
    const storeInstance = getStoreInstance();
    await storeInstance.set("tools-data", JSON.stringify(defaultTools));
  }
}

async function resetToDefaults() {
  if (isLocalDevelopment()) {
    console.log("Development mode: resetting local file storage");
    await saveToLocalFile(defaultTools);
  } else {
    const storeInstance = getStoreInstance();
    await storeInstance.set("tools-data", JSON.stringify(defaultTools));
  }
}
