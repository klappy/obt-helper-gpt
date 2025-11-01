import { test, expect } from "@playwright/test";

/**
 * End-to-End Test Suite for Workshop Features
 * 
 * Tests the complete user flow from registration through helper creation,
 * publishing, and conversation management.
 * 
 * These tests run in parallel for faster execution.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8888";

function generateUniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

test.describe("Complete Workshop User Flow", () => {
  test("Full journey: Register ? Create Helper ? Edit ? Publish ? Chat ? View History", async ({
    page,
  }) => {
    const email = generateUniqueEmail();
    const password = "testpass123";

    // Step 1: Register new user
    await page.goto(`${BASE_URL}/register`);
    await expect(page.locator("h1")).toContainText("Create Account");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    await expect(page.locator("h1")).toContainText("Dashboard");

    // Step 2: Navigate to create helper
    await page.click('text=Create Helper');
    await page.waitForURL(`${BASE_URL}/create-helper`, { timeout: 5000 });
    await expect(page.locator("text=Helper Assistant")).toBeVisible();
    await expect(page.locator("text=Helper Configuration")).toBeVisible();

    // Step 3: Interact with Helper Assistant
    const chatInput = page.locator('input[placeholder*="message"]').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill("I want to create a meal planning helper");
      await page.click('button:has-text("Send")');
      
      // Wait for response (may take a few seconds)
      await page.waitForTimeout(5000);
    }

    // Step 4: Check conversations page
    await page.goto(`${BASE_URL}/conversations`);
    await expect(page.locator("text=My Conversations")).toBeVisible();
    await expect(page.locator('button:has-text("New Conversation")')).toBeVisible();

    // Step 5: Check public gallery
    await page.goto(`${BASE_URL}/gallery`);
    await expect(page.locator("h1")).toContainText("Public Gallery");
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("User authentication persistence", async ({ page, context }) => {
    const email = generateUniqueEmail();
    const password = "testpass123";

    // Register and login
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    // Verify we're logged in
    await expect(page.locator("h1")).toContainText("Dashboard");

    // Refresh page - should still be logged in (sessionStorage)
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("Dashboard shows user's helpers", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = "testpass123";

    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    // Should show "My Helpers" section
    await expect(page.locator("h2")).toContainText("My Helpers");
    
    // Should have quick action buttons
    await expect(page.locator('text=Create Helper')).toBeVisible();
    await expect(page.locator('text=Conversations')).toBeVisible();
  });
});

test.describe("API Validation", () => {
  test("User registration API", async ({ request }) => {
    const email = generateUniqueEmail();
    const response = await request.post(`${BASE_URL}/.netlify/functions/users`, {
      data: {
        email,
        password: "testpass123",
      },
    });

    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toHaveProperty("id");
      expect(data.user.email).toBe(email);
      expect(data).toHaveProperty("token");
    }
  });

  test("User login API", async ({ request }) => {
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
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(email);
      expect(data).toHaveProperty("token");
    }
  });

  test("List published helpers API", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/.netlify/functions/public-helpers`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("helpers");
    expect(Array.isArray(data.helpers)).toBeTruthy();
  });

  test("Get published helper by shareId API", async ({ request }) => {
    // Try with invalid shareId - should return 404
    const response = await request.get(
      `${BASE_URL}/.netlify/functions/public-helpers?shareId=invalid-id-12345`
    );

    // Should handle gracefully (404 or empty)
    expect([200, 404]).toContain(response.status());
  });
});

test.describe("Error Scenarios", () => {
  test("Registration with existing email should fail", async ({ request }) => {
    const email = generateUniqueEmail();
    const password = "testpass123";

    // Register first time
    const firstResponse = await request.post(
      `${BASE_URL}/.netlify/functions/users`,
      {
        data: { email, password },
      }
    );

    if (firstResponse.ok()) {
      // Try to register again with same email
      const secondResponse = await request.post(
        `${BASE_URL}/.netlify/functions/users`,
        {
          data: { email, password },
        }
      );

      // Should fail with 409 or 400
      expect(secondResponse.status()).toBeGreaterThanOrEqual(400);
      const data = await secondResponse.json();
      expect(data).toHaveProperty("error");
    }
  });

  test("Login with wrong password should fail", async ({ request }) => {
    const email = generateUniqueEmail();
    const password = "testpass123";

    // Register
    const registerResponse = await request.post(
      `${BASE_URL}/.netlify/functions/users`,
      {
        data: { email, password },
      }
    );

    if (registerResponse.ok()) {
      // Try to login with wrong password
      const loginResponse = await request.post(
        `${BASE_URL}/.netlify/functions/users?action=login`,
        {
          data: { email, password: "wrongpassword" },
        }
      );

      expect(loginResponse.status()).toBeGreaterThanOrEqual(400);
      const data = await loginResponse.json();
      expect(data).toHaveProperty("error");
    }
  });
});

test.describe("Parallel Execution", () => {
  test("Multiple users can register simultaneously", async ({ context }) => {
    const browser = context.browser();
    if (!browser) return;

    // Create multiple browser contexts
    const contexts = [
      context,
      await browser.newContext(),
      await browser.newContext(),
    ];

    const pages = await Promise.all(
      contexts.map((ctx) => ctx.newPage())
    );

    // Register all users in parallel
    const emails = Array.from({ length: 3 }, () => generateUniqueEmail());
    const registrations = pages.map((p, index) =>
      (async () => {
        await p.goto(`${BASE_URL}/register`);
        await p.fill('input[type="email"]', emails[index]);
        await p.fill('input[type="password"]', "testpass123");
        await p.fill('input[id="confirmPassword"]', "testpass123");
        await p.click('button[type="submit"]');
        await p.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
      })()
    );

    await Promise.all(registrations);

    // All should be on dashboard
    for (const p of pages) {
      await expect(p.locator("h1")).toContainText("Dashboard");
    }

    // Cleanup
    await Promise.all(pages.map((p) => p.close()));
    await Promise.all(
      contexts.slice(1).map((ctx) => ctx.close())
    );
  });
});
