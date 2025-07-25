import { test, expect } from "@playwright/test";

// Example visual regression test for UI components
// This shows the pattern for all visual tests

test.describe("Visual Regression Tests", () => {
  test("homepage renders correctly", async ({ page }) => {
    // Navigate to the page
    await page.goto("/");

    // Wait for animations to complete
    await page.waitForTimeout(500);

    // Take a screenshot for comparison
    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator(".dynamic-metric")], // Mask dynamic content
    });
  });

  test("component states", async ({ page }) => {
    // Test component gallery if exists
    await page.goto("/component-gallery");

    // Test button states
    const button = page.locator(".adaptive-button").first();

    // Default state
    await expect(button).toHaveScreenshot("button-default.png");

    // Hover state
    await button.hover();
    await expect(button).toHaveScreenshot("button-hover.png");

    // Pressed state
    await button.click({ delay: 100 });
    await expect(button).toHaveScreenshot("button-active.png");
  });

  test("responsive layouts", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "iphone-se" },
      { width: 768, height: 1024, name: "ipad" },
      { width: 1440, height: 900, name: "desktop" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`, {
        fullPage: true,
        animations: "disabled",
      });
    }
  });

  test("dark mode support", async ({ page }) => {
    // Test light mode
    await page.goto("/");
    await expect(page).toHaveScreenshot("homepage-light.png");

    // Test dark mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("homepage-dark.png");
  });

  test("accessibility - focus states", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await expect(page).toHaveScreenshot("focus-first-element.png");

    await page.keyboard.press("Tab");
    await expect(page).toHaveScreenshot("focus-second-element.png");
  });
});

// Helper to update baseline images
// Run with: npx playwright test --update-snapshots
