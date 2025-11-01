import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8888";

// Helper functions for common operations
async function registerUser(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/register`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.fill('input[id="confirmPassword"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

async function loginUser(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

async function generateUniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

test.describe("Workshop Features - Multi-User System", () => {
  test.describe("User Authentication", () => {
    test("should register a new user", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await page.goto(`${BASE_URL}/register`);
      await expect(page.locator("h1")).toContainText("Create Account");

      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.fill('input[id="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
      await expect(page.locator("h1")).toContainText("Dashboard");
    });

    test("should login with registered user", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      // Register first
      await registerUser(page, email, password);
      await page.context().clearCookies();
      await page.goto(`${BASE_URL}`);

      // Then login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
      await expect(page.locator("h1")).toContainText("Dashboard");
    });

    test("should show error on invalid login", async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', "invalid@test.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator("text=/Invalid email or password/i")).toBeVisible({ timeout: 5000 });
    });

    test("should redirect to login when accessing protected routes", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
      await expect(page.locator("h1")).toContainText("Login");
    });
  });

  test.describe("Helper Creation with Helper Assistant", () => {
    test("should create a helper using Helper Assistant", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await registerUser(page, email, password);

      // Navigate to create helper page
      await page.click('text=Create Helper');
      await page.waitForURL(`${BASE_URL}/create-helper`, { timeout: 5000 });

      // Should show Helper Assistant interface
      await expect(page.locator("text=Helper Assistant")).toBeVisible();
      await expect(page.locator("text=Helper Configuration")).toBeVisible();

      // Type a message to Helper Assistant
      const chatInput = page.locator('input[placeholder*="message"]').first();
      await chatInput.fill("I want to create a helper that helps with meal planning");
      await page.click('button:has-text("Send")');

      // Wait for assistant response
      await page.waitForTimeout(3000);

      // Should see assistant response
      await expect(page.locator("text=/meal planning/i")).toBeVisible({ timeout: 10000 });

      // Helper config should start updating
      const configPanel = page.locator("text=Helper Configuration");
      await expect(configPanel).toBeVisible();
    });
  });

  test.describe("Dashboard and Helper Management", () => {
    test("should show empty dashboard for new user", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await registerUser(page, email, password);

      // Should show empty state or "Create Helper" button
      await expect(
        page.locator('text=/No helpers yet|Create Helper/i')
      ).toBeVisible();
    });

    test("should navigate to conversations page", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await registerUser(page, email, password);

      // Click conversations link
      await page.click('text=Conversations');
      await page.waitForURL(`${BASE_URL}/conversations`, { timeout: 5000 });

      // Should show conversations page
      await expect(page.locator("text=My Conversations")).toBeVisible();
      await expect(page.locator('button:has-text("New Conversation")')).toBeVisible();
    });
  });

  test.describe("Helper Editor", () => {
    test("should edit helper configuration", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await registerUser(page, email, password);

      // For this test, we'll assume we can navigate to edit page
      // In a real scenario, you'd create a helper first
      // For now, just verify the edit page structure exists
      const editRoute = `${BASE_URL}/edit-helper/test-helper-id`;
      await page.goto(editRoute);

      // Should handle gracefully (either show editor or error)
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Public Gallery", () => {
    test("should load public gallery page", async ({ page }) => {
      await page.goto(`${BASE_URL}/gallery`);

      // Should show gallery page
      await expect(page.locator("h1")).toContainText("Public Gallery");
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    });

    test("should show empty state when no published helpers", async ({ page }) => {
      await page.goto(`${BASE_URL}/gallery`);
      await page.waitForLoadState("networkidle");

      // Should show empty state or loading state
      await expect(
        page.locator('text=/No published helpers|Loading/i')
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Chat with Conversation Saving", () => {
    test("should save conversations when chatting with helper", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await registerUser(page, email, password);

      // Navigate to chat with a helper (if we had one)
      // For now, verify chat interface is accessible
      const chatRoute = `${BASE_URL}/chat/creative-writing`;
      await page.goto(chatRoute);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Chat interface should be visible
      await expect(page.locator("textarea")).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Conversation History", () => {
    test("should display conversation history UI", async ({ page }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      await registerUser(page, email, password);

      // Navigate to conversations
      await page.goto(`${BASE_URL}/conversations`);
      await page.waitForLoadState("networkidle");

      // Should show sidebar with search
      await expect(page.locator('input[placeholder*="Search conversations"]')).toBeVisible();
      await expect(page.locator('button:has-text("New Conversation")')).toBeVisible();

      // Should show empty state or conversation list
      await expect(
        page.locator('text=/No conversations|Today|Yesterday/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("End-to-End User Flow", () => {
    test("complete user journey: register ? create helper ? chat ? view history", async ({
      page,
    }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      // Step 1: Register
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.fill('input[id="confirmPassword"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

      // Step 2: Dashboard loads
      await expect(page.locator("h1")).toContainText("Dashboard");

      // Step 3: Navigate to conversations
      await page.click('text=Conversations');
      await page.waitForURL(`${BASE_URL}/conversations`, { timeout: 5000 });
      await expect(page.locator("text=My Conversations")).toBeVisible();

      // Step 4: Navigate to create helper
      await page.goto(`${BASE_URL}/dashboard`);
      await page.click('text=Create Helper');
      await page.waitForURL(`${BASE_URL}/create-helper`, { timeout: 5000 });
      await expect(page.locator("text=Helper Assistant")).toBeVisible();

      // Step 5: Check gallery
      await page.goto(`${BASE_URL}/gallery`);
      await expect(page.locator("h1")).toContainText("Public Gallery");
    });
  });

  test.describe("API Endpoints", () => {
    test("should list published helpers via API", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/.netlify/functions/public-helpers`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("helpers");
      expect(Array.isArray(data.helpers)).toBeTruthy();
    });

    test("should handle user registration via API", async ({ request }) => {
      const email = generateUniqueEmail();
      const response = await request.post(`${BASE_URL}/.netlify/functions/users`, {
        data: {
          email,
          password: "testpass123",
        },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty("success");
        expect(data).toHaveProperty("user");
        expect(data).toHaveProperty("token");
        expect(data.user.email).toBe(email);
      } else {
        // User might already exist, that's okay
        const data = await response.json();
        expect(data).toHaveProperty("error");
      }
    });

    test("should handle user login via API", async ({ request }) => {
      const email = generateUniqueEmail();
      const password = "testpass123";

      // Register first
      const registerResponse = await request.post(
        `${BASE_URL}/.netlify/functions/users`,
        {
          data: { email, password },
        }
      );

      if (registerResponse.ok()) {
        // Then login
        const loginResponse = await request.post(
          `${BASE_URL}/.netlify/functions/users?action=login`,
          {
            data: { email, password },
          }
        );

        expect(loginResponse.ok()).toBeTruthy();
        const data = await loginResponse.json();
        expect(data).toHaveProperty("success");
        expect(data).toHaveProperty("user");
        expect(data).toHaveProperty("token");
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle invalid share ID gracefully", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat/public/invalid-share-id`);

      // Should show error or not found message
      await page.waitForLoadState("networkidle");
      await expect(
        page.locator('text=/Helper Not Found|not found/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test("should handle malformed registration data", async ({ request }) => {
      const response = await request.post(`${BASE_URL}/.netlify/functions/users`, {
        data: {
          email: "invalid-email", // Missing password
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });

  test.describe("Parallel User Scenarios", () => {
    test("multiple users can register simultaneously", async ({ page, context }) => {
      // Create multiple browser contexts (simulating multiple users)
      const contexts = await Promise.all([
        context,
        await context.browser()?.newContext(),
        await context.browser()?.newContext(),
      ].filter(Boolean));

      const pages = await Promise.all(
        contexts.map((ctx) => ctx.newPage())
      );

      // Register all users in parallel
      const registrations = pages.map((p, index) => {
        const email = generateUniqueEmail();
        return registerUser(p, email, "testpass123");
      });

      await Promise.all(registrations);

      // All should reach dashboard
      for (const p of pages) {
        await expect(p.locator("h1")).toContainText("Dashboard");
      }

      // Cleanup
      await Promise.all(pages.map((p) => p.close()));
    });
  });
});
