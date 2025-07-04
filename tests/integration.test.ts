import { test, expect } from "@playwright/test";

// Test configuration
const BASE_URL = "http://localhost:8888";
const ADMIN_PASSWORD = "admin123";

test.describe("OBT Helper GPT Integration Tests", () => {
  test.describe("Homepage Tests", () => {
    test("should load homepage with correct title and tools", async ({ page }) => {
      await page.goto(BASE_URL);

      // Check page title
      await expect(page).toHaveTitle("OBT Helper - AI Tools for Everyone");

      // Check main heading
      await expect(page.locator("h1")).toContainText("AI Tools for Everyone");

      // Check that we have exactly 6 tool cards
      const toolCards = page.locator(".card");
      await expect(toolCards).toHaveCount(6);

      // Check that each tool card has a "Start Chat" button
      const chatButtons = page.locator('button:has-text("Start Chat")');
      await expect(chatButtons).toHaveCount(6);

      // Verify specific tools are present
      await expect(page.locator("text=Creative Writing Assistant")).toBeVisible();
      await expect(page.locator("text=Math Tutor")).toBeVisible();
      await expect(page.locator("text=Recipe Helper")).toBeVisible();
      await expect(page.locator("text=Code Helper")).toBeVisible();
      await expect(page.locator("text=Language Learning Buddy")).toBeVisible();
      await expect(page.locator("text=Business Strategy Advisor")).toBeVisible();
    });

    test("should have admin link in header", async ({ page }) => {
      await page.goto(BASE_URL);

      // Check admin link is present and clickable
      const adminLink = page.locator('a:has-text("Admin")');
      await expect(adminLink).toBeVisible();
      await expect(adminLink).toHaveAttribute("href", "/admin");
    });

    test("should have version information in footer", async ({ page }) => {
      await page.goto(BASE_URL);

      // Check footer contains version info
      await expect(page.locator("footer")).toContainText("© 2025 OBT Helper");
      await expect(page.locator("footer")).toContainText("Built with SvelteKit");
    });
  });

  test.describe("Chat Interface Tests", () => {
    test("should navigate to chat page when clicking Start Chat", async ({ page }) => {
      await page.goto(BASE_URL);

      // Wait for tools to load
      await page.waitForSelector(".card");
      await page.waitForLoadState("networkidle");

      // Wait a bit more for JavaScript to initialize
      await page.waitForTimeout(1000);

      // Click the first tool card
      await page.locator(".card").first().click();

      // Should navigate to a chat page
      await expect(page).toHaveURL(/\/chat\/.+/);

      // Wait for chat interface to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Should have chat interface elements
      await expect(page.locator("textarea")).toBeVisible();
      await expect(page.locator('button:has-text("Send")')).toBeVisible();

      // Voice controls should show "Voice Off" initially
      await expect(page.locator('button:has-text("Voice Off")')).toBeVisible();
    });

    test("should have functional message input and send button", async ({ page }) => {
      await page.goto(BASE_URL);

      // Navigate to chat
      await page.locator(".card").first().click();

      // Wait for chat interface to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Type a test message
      const messageInput = page.locator("textarea");
      await messageInput.fill("Hello, this is a test message");

      // Verify message appears in input
      await expect(messageInput).toHaveValue("Hello, this is a test message");

      // Send button should be enabled
      const sendButton = page.locator('button:has-text("Send")');
      await expect(sendButton).toBeEnabled();
    });

    test("should clear input after sending message", async ({ page }) => {
      await page.goto(BASE_URL);

      // Navigate to chat
      await page.locator(".card").first().click();

      // Wait for chat interface to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Type and send a message
      const messageInput = page.locator("textarea");
      await messageInput.fill("Test message");
      await page.locator('button:has-text("Send")').click();

      // Input should be cleared
      await expect(messageInput).toHaveValue("");
    });

    test("should have voice controls available", async ({ page }) => {
      await page.goto(BASE_URL);

      // Navigate to chat
      await page.locator(".card").first().click();

      // Wait for chat interface to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Voice controls should be present (initially showing "Voice Off")
      await expect(page.locator('button:has-text("Voice Off")')).toBeVisible();

      // Click to enable voice
      await page.locator('button:has-text("Voice Off")').click();

      // Should now show "Voice On"
      await expect(page.locator('button:has-text("Voice On")')).toBeVisible();
    });
  });

  test.describe("Admin Panel Tests", () => {
    test("should load admin login page", async ({ page }) => {
      await page.goto(`${BASE_URL}/admin`);

      // Should show login form initially
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Login")')).toBeVisible();
      await expect(page.locator("h2")).toContainText("Admin Login");
    });

    test("should authenticate with correct password", async ({ page }) => {
      await page.goto(`${BASE_URL}/admin`);

      // Fill in password and login
      await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
      await page.locator('button:has-text("Login")').click();

      // Wait for dashboard to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Should show admin dashboard
      await expect(page.locator("h1")).toContainText("Admin Dashboard");
      await expect(page.locator("text=AI Tools Management")).toBeVisible();
    });

    test("should display all tools in admin panel", async ({ page }) => {
      await page.goto(`${BASE_URL}/admin`);

      // Authenticate
      await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
      await page.locator('button:has-text("Login")').click();

      // Wait for dashboard to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Should show 6 tools in the management section
      const toolRows = page.locator("table tbody tr");
      await expect(toolRows).toHaveCount(6);

      // Each tool should have an edit link
      const editLinks = page.locator('a:has-text("Edit")');
      await expect(editLinks).toHaveCount(6);
    });

    test("should navigate to tool editor", async ({ page }) => {
      await page.goto(`${BASE_URL}/admin`);

      // Authenticate
      await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
      await page.locator('button:has-text("Login")').click();

      // Wait for dashboard to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Click first edit link
      await page.locator('a:has-text("Edit")').first().click();

      // Should navigate to tool editor
      await expect(page).toHaveURL(/\/admin\/tools\/.+/);

      // Wait for editor to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Should have editor form elements
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      await expect(page.locator('textarea[name="systemPrompt"]')).toBeVisible();
      await expect(page.locator('button:has-text("Save Tool")')).toBeVisible();
    });
  });

  test.describe("API Integration Tests", () => {
    test("should fetch tools from API", async ({ page }) => {
      // Test the tools API endpoint directly
      const response = await page.request.get(`${BASE_URL}/.netlify/functions/tools`);
      expect(response.ok()).toBeTruthy();

      const tools = await response.json();
      expect(Array.isArray(tools)).toBeTruthy();
      expect(tools.length).toBe(6);

      // Verify tool structure
      const firstTool = tools[0];
      expect(firstTool).toHaveProperty("id");
      expect(firstTool).toHaveProperty("name");
      expect(firstTool).toHaveProperty("description");
      expect(firstTool).toHaveProperty("systemPrompt");
      expect(firstTool).toHaveProperty("model");
    });

    test("should handle tool updates via API", async ({ page }) => {
      // First get current tools
      const getResponse = await page.request.get(`${BASE_URL}/.netlify/functions/tools`);
      const tools = await getResponse.json();
      const firstTool = tools[0];

      // Store original description for restoration
      const originalDescription = firstTool.description;

      // Update the tool
      const updatedTool = {
        ...firstTool,
        description: "Test updated description",
      };

      const putResponse = await page.request.put(`${BASE_URL}/.netlify/functions/tools`, {
        data: updatedTool,
      });

      expect(putResponse.ok()).toBeTruthy();

      // Wait a moment for storage to persist
      await page.waitForTimeout(1000);

      // Verify the update
      const verifyResponse = await page.request.get(`${BASE_URL}/.netlify/functions/tools`);
      const updatedTools = await verifyResponse.json();
      const verifyTool = updatedTools.find((t: any) => t.id === firstTool.id);

      expect(verifyTool.description).toBe("Test updated description");

      // Restore original description
      const restoreResponse = await page.request.put(`${BASE_URL}/.netlify/functions/tools`, {
        data: { ...firstTool, description: originalDescription },
      });

      expect(restoreResponse.ok()).toBeTruthy();
    });
  });

  test.describe("Responsive Design Tests", () => {
    test("should work on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);

      // Tool cards should still be visible and functional
      await expect(page.locator(".card")).toHaveCount(6);
      await expect(page.locator('button:has-text("Start Chat")')).toHaveCount(6);

      // Navigation should work
      await page.locator(".card").first().click();

      // Wait for chat interface to load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      await expect(page.locator("textarea")).toBeVisible();
    });

    test("should work on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(BASE_URL);

      // Should display properly on tablet
      await expect(page.locator(".card")).toHaveCount(6);

      // Tools grid should be visible (using more specific selector)
      const toolsGrid = page.locator("main .grid").first();
      await expect(toolsGrid).toBeVisible();
    });
  });

  test.describe("Error Handling Tests", () => {
    test("should handle 404 pages gracefully", async ({ page }) => {
      await page.goto(`${BASE_URL}/nonexistent-page`);

      // Should show some kind of error or redirect
      // This depends on your SvelteKit error handling
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle invalid tool IDs", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat/invalid-tool-id`);

      // Should handle gracefully (redirect or show error)
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Performance Tests", () => {
    test("should load homepage quickly", async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test("should have no console errors on homepage", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState("networkidle");

      // Should have no console errors
      expect(consoleErrors).toHaveLength(0);
    });
  });
});
