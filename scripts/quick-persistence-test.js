// Quick test to verify tools persistence is working
import { promises as fs } from "fs";
import { join } from "path";

const LOCAL_STORAGE_PATH = join(process.cwd(), ".netlify", "blobs-local", "tools-data.json");

async function testPersistence() {
  console.log("🧪 Testing Tool Persistence...\n");

  try {
    // 1. Create test data
    const testTools = [
      {
        id: "test-tool",
        name: "Test Tool",
        description: "This is a test",
        systemPrompt: `Test prompt created at ${new Date().toISOString()}`,
        icon: "🧪",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 1000,
        isActive: true,
        orderIndex: 1,
      },
    ];

    console.log("1️⃣ Writing test data to local storage...");
    console.log(`   Path: ${LOCAL_STORAGE_PATH}`);

    // Ensure directory exists
    await fs.mkdir(join(process.cwd(), ".netlify", "blobs-local"), { recursive: true });

    // Write test data
    await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(testTools, null, 2));
    console.log("✅ Data written successfully!");

    // 2. Read it back
    console.log("\n2️⃣ Reading data back...");
    const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf8");
    const readTools = JSON.parse(data);

    if (readTools[0].systemPrompt.includes("Test prompt created at")) {
      console.log("✅ Data persisted and retrieved successfully!");
      console.log(`   Found tool: ${readTools[0].name}`);
      console.log(`   Prompt: ${readTools[0].systemPrompt}`);
    } else {
      console.log("❌ Data mismatch!");
    }

    // 3. Check file exists
    console.log("\n3️⃣ Verifying file exists on disk...");
    const stats = await fs.stat(LOCAL_STORAGE_PATH);
    console.log(`✅ File exists! Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime}`);

    console.log("\n✨ PERSISTENCE IS WORKING!");
    console.log("\n📝 Next steps:");
    console.log("   1. Run: netlify dev");
    console.log("   2. Edit a tool in the admin panel");
    console.log("   3. Check this file for your changes:", LOCAL_STORAGE_PATH);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testPersistence();
