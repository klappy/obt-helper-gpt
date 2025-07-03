#!/usr/bin/env node

/**
 * Version Management Script for OBT Helper GPT
 *
 * Usage:
 *   node scripts/version.js patch    # 1.0.0 -> 1.0.1
 *   node scripts/version.js minor    # 1.0.0 -> 1.1.0
 *   node scripts/version.js major    # 1.0.0 -> 2.0.0
 *   node scripts/version.js beta     # 1.0.0 -> 1.0.1-beta.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  return packageJson.version;
}

function updatePackageJson(newVersion) {
  const packagePath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
}

function updateLayoutVersion(newVersion) {
  const layoutPath = path.join(rootDir, "src/routes/+layout.svelte");
  let content = fs.readFileSync(layoutPath, "utf8");
  content = content.replace(/Version \d+\.\d+\.\d+(?:-\w+\.\d+)?/, `Version ${newVersion}`);
  fs.writeFileSync(layoutPath, content);
}

function updateAdminVersion(newVersion) {
  const adminPath = path.join(rootDir, "src/routes/admin/+page.svelte");
  let content = fs.readFileSync(adminPath, "utf8");
  content = content.replace(/Version: \d+\.\d+\.\d+(?:-\w+\.\d+)?/, `Version: ${newVersion}`);
  fs.writeFileSync(adminPath, content);
}

function bumpVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split("-")[0].split(".").map(Number);
  const isPrerelease = currentVersion.includes("-");

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "beta":
      if (isPrerelease) {
        const [base, prerelease] = currentVersion.split("-");
        const [type, num] = prerelease.split(".");
        return `${base}-${type}.${parseInt(num) + 1}`;
      } else {
        return `${major}.${minor}.${patch + 1}-beta.0`;
      }
    default:
      throw new Error(`Unknown version type: ${type}`);
  }
}

function updateChangelog(newVersion, currentVersion) {
  const changelogPath = path.join(rootDir, "docs", "CHANGELOG.md");
  let content = fs.readFileSync(changelogPath, "utf8");

  const today = new Date().toISOString().split("T")[0];
  const newEntry = `## [${newVersion}] - ${today}

### Changed
- Version bump from ${currentVersion} to ${newVersion}

`;

  content = content.replace(
    "## [Unreleased]",
    `## [Unreleased]

${newEntry}`
  );
  fs.writeFileSync(changelogPath, content);
}

// Main execution
const versionType = process.argv[2];
if (!versionType || !["major", "minor", "patch", "beta"].includes(versionType)) {
  console.error("Usage: node scripts/version.js [major|minor|patch|beta]");
  process.exit(1);
}

try {
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, versionType);

  console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

  updatePackageJson(newVersion);
  updateLayoutVersion(newVersion);
  updateAdminVersion(newVersion);
  updateChangelog(newVersion, currentVersion);

  console.log("✅ Version updated successfully!");
  console.log(`📝 Don't forget to update CHANGELOG.md with actual changes`);
  console.log(`🚀 Ready to commit and tag: git tag v${newVersion}`);
} catch (error) {
  console.error("❌ Error updating version:", error.message);
  process.exit(1);
}
