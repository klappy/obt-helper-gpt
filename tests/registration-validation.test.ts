import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:8888";

test.describe("Registration Form Validation", () => {
  test("should show clear error messages for invalid email", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Try to submit with invalid email
    await page.fill('input[id="email"]', "invalid-email");
    await page.fill('input[id="password"]', "password123");
    await page.fill('input[id="confirmPassword"]', "password123");
    
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation
    await page.waitForTimeout(500);
    
    // Check that email error is shown
    const emailError = page.locator('text=/Email|valid email/i').first();
    await expect(emailError).toBeVisible();
    
    // Check that email field has red border
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toHaveClass(/border-red-500/);
  });

  test("should show clear error messages for short password", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Try to submit with short password
    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="password"]', "123");
    await page.fill('input[id="confirmPassword"]', "123");
    
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation
    await page.waitForTimeout(500);
    
    // Check that password error is shown
    const passwordError = page.locator('text=/Password.*6 characters/i').first();
    await expect(passwordError).toBeVisible();
    
    // Check that password field has red border
    const passwordInput = page.locator('input[id="password"]');
    await expect(passwordInput).toHaveClass(/border-red-500/);
  });

  test("should show clear error messages for mismatched passwords", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Try to submit with mismatched passwords
    await page.fill('input[id="email"]', "test@example.com");
    await page.fill('input[id="password"]', "password123");
    await page.fill('input[id="confirmPassword"]', "different123");
    
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation
    await page.waitForTimeout(500);
    
    // Check that password mismatch error is shown
    const confirmError = page.locator('text=/Passwords do not match/i').first();
    await expect(confirmError).toBeVisible();
    
    // Check that confirm password field has red border
    const confirmInput = page.locator('input[id="confirmPassword"]');
    await expect(confirmInput).toHaveClass(/border-red-500/);
  });

  test("should NOT show browser validation message", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Try to submit with invalid email to trigger validation
    await page.fill('input[id="email"]', "invalid");
    await page.fill('input[id="password"]', "pass");
    await page.click('button[type="submit"]');
    
    // Wait a moment
    await page.waitForTimeout(500);
    
    // Check that browser default validation message is NOT shown
    // The browser default message would be "Please match the requested format" or similar
    const browserValidation = page.locator('text=/match the requested format|match the format/i');
    await expect(browserValidation).not.toBeVisible();
    
    // Instead, we should see our custom error messages
    const customError = page.locator('text=/Email|Password/i').first();
    await expect(customError).toBeVisible();
  });

  test("should show specific field errors, not generic pattern error", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // Should see field-specific errors, not "string doesn't match pattern"
    const patternError = page.locator('text=/string.*match.*pattern|match.*requested.*format/i');
    await expect(patternError).not.toBeVisible();
    
    // Should see our custom errors instead
    const emailError = page.locator('text=/Email is required/i');
    await expect(emailError).toBeVisible();
  });
});
