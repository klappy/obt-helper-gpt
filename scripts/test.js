#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const commands = {
  unit: "npm run test",
  integration: "npm run test:integration",
  "integration:ui": "npm run test:integration:ui",
  "integration:headed": "npm run test:integration:headed",
  "integration:debug": "npm run test:integration:debug",
  all: ["npm run test", "npm run test:integration"],
};

function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${cmd} ${args.join(" ")}`);

    const child = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully`);
        resolve(code);
      } else {
        console.log(`❌ Command failed with code ${code}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on("error", (error) => {
      console.error(`❌ Error running command: ${error.message}`);
      reject(error);
    });
  });
}

async function runTests(type = "integration") {
  console.log(`🧪 OBT Helper GPT Test Runner`);
  console.log(`📋 Test type: ${type}`);
  console.log("");

  try {
    if (type === "all") {
      console.log("🔄 Running all tests...");
      for (const cmd of commands.all) {
        await runCommand(cmd);
        console.log("");
      }
    } else if (commands[type]) {
      await runCommand(commands[type]);
    } else {
      console.error(`❌ Unknown test type: ${type}`);
      console.log("Available types:");
      Object.keys(commands).forEach((key) => {
        console.log(`  - ${key}`);
      });
      process.exit(1);
    }

    console.log("🎉 All tests completed successfully!");
  } catch (error) {
    console.error("💥 Tests failed:", error.message);
    process.exit(1);
  }
}

// Get test type from command line arguments
const testType = process.argv[2] || "integration";
runTests(testType);
