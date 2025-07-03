import { getStore } from "@netlify/blobs";
import { promises as fs } from "fs";
import { join } from "path";

// Local file storage path
const LOCAL_STORAGE_PATH = join(process.cwd(), ".netlify", "blobs-local", "tools-data.json");

const store = getStore({
  name: "obt-helper-tools",
  consistency: "strong", // Ensures immediate consistency for collaboration
});

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

// Check if we're in local development
function isLocalDevelopment() {
  // Check multiple indicators for local development
  const isLocal = !process.env.DEPLOY_CONTEXT || 
                  process.env.DEPLOY_CONTEXT === "dev" ||
                  process.env.NODE_ENV === "development" ||
                  !process.env.NETLIFY;
  
  console.log("Environment check:", {
    DEPLOY_CONTEXT: process.env.DEPLOY_CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
    NETLIFY: process.env.NETLIFY,
    isLocal
  });
  
  return isLocal;
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
        try {
          const updateData = await request.json();
          console.log("PUT request received:", updateData);
          
          if (!updateData.id) {
            throw new Error("Tool ID is required");
          }
          
          const updatedTool = await updateTool(updateData.id, updateData.updates);
          console.log("Tool updated successfully:", updatedTool.id);
          
          return new Response(JSON.stringify(updatedTool), {
            status: 200,
            headers,
          });
        } catch (error) {
          console.error("PUT request error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update tool", details: error.message }),
            {
              status: 400,
              headers,
            }
          );
        }

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

async function getAllTools() {
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
    const toolsData = await store.get("tools-data", { type: "json" });

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
  console.log("updateTool called:", { id, updates });
  
  try {
    const tools = await getAllTools();
    console.log("Current tools count:", tools.length);
    
    const toolIndex = tools.findIndex((tool) => tool.id === id);

    if (toolIndex === -1) {
      console.error("Tool not found:", id);
      throw new Error(`Tool not found: ${id}`);
    }

    tools[toolIndex] = { ...tools[toolIndex], ...updates };
    console.log("Updated tool:", tools[toolIndex]);

    // Handle storage based on environment
    if (isLocalDevelopment()) {
      console.log("Development mode: saving to local file storage");
      await saveToLocalFile(tools);
    } else {
      console.log("Production mode: saving to Netlify Blobs");
      await store.set("tools-data", JSON.stringify(tools));
      console.log("Successfully saved to Netlify Blobs");
    }

    return tools[toolIndex];
  } catch (error) {
    console.error("Error in updateTool:", error);
    throw error;
  }
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
    await store.set("tools-data", JSON.stringify(defaultTools));
  }
}

async function resetToDefaults() {
  if (isLocalDevelopment()) {
    console.log("Development mode: resetting local file storage");
    await saveToLocalFile(defaultTools);
  } else {
    await store.set("tools-data", JSON.stringify(defaultTools));
  }
}
