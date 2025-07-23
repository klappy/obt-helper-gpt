// Use native fetch (Node.js 18+) or install node-fetch
// For older Node versions, run: npm install --save-dev node-fetch

async function testSync() {
  console.log("🧪 Testing WhatsApp-Tool Synchronization...\n");

  try {
    // 1. Get current tools
    console.log("1️⃣ Fetching current tools...");
    const toolsRes = await fetch("http://localhost:8888/.netlify/functions/tools");
    if (!toolsRes.ok) throw new Error(`Failed to fetch tools: ${toolsRes.status}`);
    const tools = await toolsRes.json();
    console.log(`✓ Found ${tools.length} tools`);

    // 2. Find creative writing tool
    const creativeWriting = tools.find((t) => t.id === "creative-writing");
    if (!creativeWriting) throw new Error("Creative Writing tool not found");
    console.log(`✓ Found Creative Writing tool`);

    // Store original prompt
    const originalPrompt = creativeWriting.systemPrompt;

    // 3. Update the tool
    console.log("\n2️⃣ Updating tool with test marker...");
    const testMarker = `TEST_SYNC_${Date.now()}`;
    const testPrompt = `${originalPrompt}\n\n[${testMarker}]`;

    const updateRes = await fetch("http://localhost:8888/.netlify/functions/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "creative-writing",
        updates: { systemPrompt: testPrompt },
      }),
    });

    if (!updateRes.ok) throw new Error(`Failed to update tool: ${updateRes.status}`);
    console.log(`✓ Updated tool with test marker: ${testMarker}`);

    // 4. Wait a moment for storage to sync
    console.log("\n⏳ Waiting 2 seconds for storage sync...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Simulate WhatsApp message
    console.log("\n3️⃣ Simulating WhatsApp message...");
    const whatsappRes = await fetch("http://localhost:8888/.netlify/functions/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "From=whatsapp:+1234567890&Body=Write a haiku about testing",
    });

    if (!whatsappRes.ok) {
      const errorText = await whatsappRes.text();
      console.log(`⚠️ WhatsApp function returned ${whatsappRes.status}: ${errorText}`);
    } else {
      console.log(`✓ WhatsApp message processed`);
    }

    // 6. Verify tool was updated by checking it again
    console.log("\n4️⃣ Verifying tool update...");
    const verifyRes = await fetch(
      "http://localhost:8888/.netlify/functions/tools?id=creative-writing"
    );
    if (!verifyRes.ok) throw new Error(`Failed to verify tool: ${verifyRes.status}`);
    const updatedTool = await verifyRes.json();

    if (updatedTool.systemPrompt.includes(testMarker)) {
      console.log("✅ SYNC SUCCESSFUL: Tool update persisted correctly!");
      console.log(`   Test marker found: ${testMarker}`);
    } else {
      console.log("❌ SYNC ISSUE: Tool update not found");
      console.log("   Current prompt length:", updatedTool.systemPrompt.length);
      console.log("   Expected marker:", testMarker);
    }

    // 7. Clean up - restore original prompt
    console.log("\n5️⃣ Cleaning up...");
    const cleanupRes = await fetch("http://localhost:8888/.netlify/functions/tools", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "creative-writing",
        updates: { systemPrompt: originalPrompt },
      }),
    });

    if (cleanupRes.ok) {
      console.log("✓ Restored original prompt");
    } else {
      console.log("⚠️ Failed to restore original prompt");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const res = await fetch("http://localhost:8888/.netlify/functions/tools");
    return res.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log("🚀 WhatsApp-Tool Sync Test\n");

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error("❌ Server not running at http://localhost:8888");
    console.error("   Please run: netlify dev");
    process.exit(1);
  }

  await testSync();
  console.log("\n✨ Test complete!");
})();
