#!/usr/bin/env node

// Test script to debug tool update persistence issues
async function testToolUpdate() {
  const NETLIFY_DOMAIN = process.env.NETLIFY_DOMAIN || "https://obt-helper-gpt.netlify.app";

  console.log("🔍 Testing tool update persistence...\n");

  try {
    // Step 1: Get current tools
    console.log("1. Getting current tools...");
    const toolsResponse = await fetch(`${NETLIFY_DOMAIN}/.netlify/functions/tools`);
    const tools = await toolsResponse.json();
    console.log(`   Found ${tools.length} tools`);

    if (tools.length === 0) {
      console.log("❌ No tools found, cannot test update");
      return;
    }

    const testTool = tools[0];
    console.log(`   Testing with tool: ${testTool.name} (${testTool.id})`);

    // Step 2: Make a small change to test
    const timestamp = new Date().toISOString();
    const testUpdate = {
      description: `${testTool.description} [Updated at ${timestamp}]`,
    };

    console.log("\n2. Making test update...");
    console.log(`   Adding timestamp to description: ${timestamp}`);

    // Step 3: Use our debug endpoint to update
    const updateResponse = await fetch(`${NETLIFY_DOMAIN}/.netlify/functions/tool-update-debug`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: testTool.id,
        updates: testUpdate,
      }),
    });

    const updateResult = await updateResponse.json();
    console.log("   Update response:", updateResult.success ? "✅ Success" : "❌ Failed");

    if (updateResult.debugSteps) {
      console.log("\n3. Debug steps:");
      updateResult.debugSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.step}: ${step.success !== false ? "✅" : "❌"}`);
        if (step.error) {
          console.log(`      Error: ${step.error}`);
        }
      });
    }

    // Step 4: Wait a moment then fetch again to verify persistence
    console.log("\n4. Waiting 2 seconds then checking persistence...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const verifyResponse = await fetch(`${NETLIFY_DOMAIN}/.netlify/functions/tools`);
    const verifyTools = await verifyResponse.json();
    const verifyTool = verifyTools.find((t) => t.id === testTool.id);

    if (verifyTool && verifyTool.description.includes(timestamp)) {
      console.log("✅ SUCCESS: Update persisted correctly!");
      console.log(`   Description contains timestamp: ${timestamp}`);
    } else {
      console.log("❌ FAILED: Update did not persist");
      console.log(`   Expected description to contain: ${timestamp}`);
      console.log(`   Actual description: ${verifyTool?.description || "Tool not found"}`);
    }

    // Step 5: Test page refresh scenario
    console.log("\n5. Testing fresh page load scenario...");
    const freshResponse = await fetch(`${NETLIFY_DOMAIN}/.netlify/functions/tools`, {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    const freshTools = await freshResponse.json();
    const freshTool = freshTools.find((t) => t.id === testTool.id);

    if (freshTool && freshTool.description.includes(timestamp)) {
      console.log("✅ SUCCESS: Update persists even with fresh request!");
    } else {
      console.log("❌ FAILED: Update lost on fresh request (cache issue?)");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testToolUpdate();
}

export default testToolUpdate;
