import { getStore } from "@netlify/blobs";

// Debug endpoint to track tool updates step by step
export default async (request, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  try {
    const debugSteps = [];
    const store = getStore("obt-helper-tools");

    // Step 1: Check current environment
    debugSteps.push({
      step: "environment_check",
      timestamp: new Date().toISOString(),
      environment: {
        DEPLOY_URL: process.env.DEPLOY_URL || "UNSET",
        CONTEXT: process.env.CONTEXT || "UNSET",
        URL: process.env.URL ? "SET" : "UNSET",
        NETLIFY: process.env.NETLIFY ? "SET" : "UNSET",
        NODE_ENV: process.env.NODE_ENV || "UNSET",
      },
    });

    // Step 2: Try to get current tools
    let currentTools;
    try {
      currentTools = await store.get("tools-data", { type: "json" });
      debugSteps.push({
        step: "get_current_tools",
        timestamp: new Date().toISOString(),
        success: true,
        toolCount: currentTools?.length || 0,
        hasData: !!currentTools,
      });
    } catch (error) {
      debugSteps.push({
        step: "get_current_tools",
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      });
      throw error;
    }

    // Step 3: If this is a PUT request, process the update
    if (request.method === "PUT") {
      const updateData = await request.json();
      debugSteps.push({
        step: "receive_update_data",
        timestamp: new Date().toISOString(),
        toolId: updateData.id,
        hasUpdates: !!updateData.updates,
        updateKeys: updateData.updates ? Object.keys(updateData.updates) : [],
      });

      // Step 4: Find and update the tool
      const toolIndex = currentTools.findIndex((tool) => tool.id === updateData.id);
      if (toolIndex === -1) {
        debugSteps.push({
          step: "find_tool",
          timestamp: new Date().toISOString(),
          success: false,
          error: "Tool not found",
        });
        return new Response(JSON.stringify({ error: "Tool not found", debugSteps }), {
          status: 404,
          headers,
        });
      }

      debugSteps.push({
        step: "find_tool",
        timestamp: new Date().toISOString(),
        success: true,
        toolIndex,
        originalTool: currentTools[toolIndex],
      });

      // Update the tool
      const updatedTool = { ...currentTools[toolIndex], ...updateData.updates };
      currentTools[toolIndex] = updatedTool;

      debugSteps.push({
        step: "update_tool_in_memory",
        timestamp: new Date().toISOString(),
        updatedTool,
      });

      // Step 5: Save to Netlify Blobs
      try {
        const serialized = JSON.stringify(currentTools);
        await store.set("tools-data", serialized);

        debugSteps.push({
          step: "save_to_blobs",
          timestamp: new Date().toISOString(),
          success: true,
          dataLength: serialized.length,
          toolCount: currentTools.length,
        });

        // Step 6: Verify the save
        const verification = await store.get("tools-data", { type: "json" });
        const verifiedTool = verification.find((tool) => tool.id === updateData.id);

        debugSteps.push({
          step: "verify_save",
          timestamp: new Date().toISOString(),
          success: true,
          verifiedToolCount: verification.length,
          verifiedTool: verifiedTool,
          matchesUpdate: JSON.stringify(verifiedTool) === JSON.stringify(updatedTool),
        });

        return new Response(
          JSON.stringify({
            success: true,
            updatedTool,
            debugSteps,
          }),
          {
            status: 200,
            headers,
          }
        );
      } catch (error) {
        debugSteps.push({
          step: "save_to_blobs",
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message,
        });
        throw error;
      }
    }

    // For GET requests, just return current state
    return new Response(
      JSON.stringify({
        currentTools,
        debugSteps,
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        debugSteps: debugSteps || [],
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
