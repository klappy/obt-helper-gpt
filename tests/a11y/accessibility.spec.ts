import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage passes automated accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('design system components are accessible', async ({ page }) => {
    await page.goto('/tests/components/test-harness.html');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works throughout the app', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    // Test that all interactive elements are reachable
    const interactiveElements = await page.$$('button, a, input, textarea, select, [tabindex="0"]');
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Verify focus is visible
    await page.keyboard.press('Tab');
    const focusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;
      const style = window.getComputedStyle(activeElement);
      return style.outlineStyle !== 'none' || style.boxShadow.includes('focus');
    });
    expect(focusVisible).toBeTruthy();
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('images have appropriate alt text', async ({ page }) => {
    const images = await page.$$('img');
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // All images should have alt attribute
      expect(alt !== null).toBeTruthy();
      
      // Decorative images should have empty alt
      const isDecorative = src?.includes('decoration') || src?.includes('background');
      if (isDecorative) {
        expect(alt).toBe('');
      }
    }
  });

  test('form inputs have associated labels', async ({ page }) => {
    const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = await page.$(`label[for="${id}"]`);
        const hasLabel = label !== null || ariaLabel !== null || ariaLabelledby !== null;
        expect(hasLabel).toBeTruthy();
      } else {
        // Input should have aria-label if no id
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('ARIA attributes are used correctly', async ({ page }) => {
    // Check for common ARIA mistakes
    const elementsWithAriaHidden = await page.$$('[aria-hidden="true"]');
    
    for (const element of elementsWithAriaHidden) {
      // aria-hidden elements should not contain interactive content
      const hasInteractive = await element.$('button, a, input, textarea, select');
      expect(hasInteractive).toBeNull();
    }

    // Check role attributes
    const elementsWithRole = await page.$$('[role]');
    
    for (const element of elementsWithRole) {
      const role = await element.getAttribute('role');
      // Verify role is valid (basic check)
      expect(role).toMatch(/^(button|link|navigation|main|banner|contentinfo|article|region|alert|status|img|list|listitem|heading|tab|tabpanel|menu|menuitem|dialog|alertdialog|tooltip|tree|treeitem|grid|gridcell|row|columnheader|rowheader|table|form|search|complementary|note|presentation|none)$/);
    }
  });

  test('heading hierarchy is logical', async ({ page }) => {
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
      elements.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent
      }))
    );

    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);

    // Heading levels should not skip
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      const previousLevel = headings[i - 1].level;
      
      // Level can stay same, go up by any amount, or increase by 1
      const isValidProgression = 
        currentLevel === previousLevel || 
        currentLevel < previousLevel || 
        currentLevel === previousLevel + 1;
        
      expect(isValidProgression).toBeTruthy();
    }
  });

  test('focus trap works in modals', async ({ page }) => {
    // This test assumes there's a modal trigger
    const modalTrigger = await page.$('[data-modal-trigger]');
    if (modalTrigger) {
      await modalTrigger.click();
      
      // Wait for modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Tab should cycle within modal
      const focusableInModal = await page.$$('[role="dialog"] button, [role="dialog"] a, [role="dialog"] input, [role="dialog"] [tabindex="0"]');
      
      if (focusableInModal.length > 0) {
        // Focus should be trapped in modal
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'));
        expect(focusedElement).toBeTruthy();
      }
    }
  });

  test('skip links are present and functional', async ({ page }) => {
    // Check for skip to main content link
    const skipLink = await page.$('a[href="#main"], a[href="#content"]');
    
    if (skipLink) {
      const isVisibleOnFocus = await page.evaluate((link) => {
        link?.focus();
        const styles = window.getComputedStyle(link);
        return styles.position !== 'absolute' || styles.left !== '-9999px';
      }, skipLink);
      
      expect(isVisibleOnFocus).toBeTruthy();
    }
  });

  test('touch targets are appropriately sized', async ({ page }) => {
    const touchTargets = await page.$$('button, a, input[type="checkbox"], input[type="radio"]');
    
    for (const target of touchTargets) {
      const box = await target.boundingBox();
      if (box) {
        // WCAG 2.1 requires 44x44 CSS pixels minimum
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('motion is reduced when prefers-reduced-motion is set', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Check that animations are disabled
    const animatedElement = await page.$('.fade-in, .slide-up, .scale-in');
    
    if (animatedElement) {
      const hasAnimation = await animatedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration !== '0s' && styles.animationDuration !== '0ms';
      });
      
      expect(hasAnimation).toBeFalsy();
    }
  });

  test('error messages are associated with form fields', async ({ page }) => {
    // Try to submit a form with errors
    const form = await page.$('form');
    
    if (form) {
      const submitButton = await form.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Wait for potential error messages
        await page.waitForTimeout(500);
        
        const errorMessages = await page.$$('[role="alert"], .error-message');
        
        for (const error of errorMessages) {
          // Error should be associated with a form field
          const id = await error.getAttribute('id');
          if (id) {
            const associatedInput = await page.$(`[aria-describedby="${id}"], [aria-errormessage="${id}"]`);
            expect(associatedInput).toBeTruthy();
          }
        }
      }
    }
  });

  test('landmarks are properly defined', async ({ page }) => {
    const landmarks = await page.$$eval('[role="navigation"], [role="main"], [role="banner"], [role="contentinfo"], nav, main, header, footer', 
      elements => elements.map(el => el.tagName.toLowerCase() + (el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : ''))
    );

    // Should have main landmark
    const hasMain = landmarks.some(l => l.includes('main'));
    expect(hasMain).toBeTruthy();

    // Should have navigation
    const hasNav = landmarks.some(l => l.includes('nav'));
    expect(hasNav).toBeTruthy();
  });

  test('tables have proper structure and headers', async ({ page }) => {
    const tables = await page.$$('table');
    
    for (const table of tables) {
      // Check for caption or aria-label
      const caption = await table.$('caption');
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledby = await table.getAttribute('aria-labelledby');
      
      const hasDescription = caption !== null || ariaLabel !== null || ariaLabelledby !== null;
      expect(hasDescription).toBeTruthy();
      
      // Check for th elements
      const headers = await table.$$('th');
      expect(headers.length).toBeGreaterThan(0);
      
      // Check scope attributes on headers
      for (const header of headers) {
        const scope = await header.getAttribute('scope');
        expect(scope).toMatch(/^(col|row|colgroup|rowgroup)$/);
      }
    }
  });

  test('language is properly declared', async ({ page }) => {
    const htmlLang = await page.$eval('html', el => el.getAttribute('lang'));
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
  });

  test('page has proper title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Title should be descriptive
    expect(title).not.toBe('Untitled');
    expect(title).not.toBe('Document');
  });
});

test.describe('Screen Reader Compatibility', () => {
  test('dynamic content updates are announced', async ({ page }) => {
    await page.goto('/');
    
    // Check for live regions
    const liveRegions = await page.$$('[aria-live], [role="alert"], [role="status"]');
    expect(liveRegions.length).toBeGreaterThan(0);
    
    // Verify live regions have appropriate politeness
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const role = await region.getAttribute('role');
      
      if (role === 'alert') {
        // Alerts should be assertive
        expect(ariaLive === 'assertive' || ariaLive === null).toBeTruthy();
      } else if (role === 'status') {
        // Status should be polite
        expect(ariaLive === 'polite' || ariaLive === null).toBeTruthy();
      }
    }
  });

  test('loading states are announced', async ({ page }) => {
    await page.goto('/');
    
    // Find buttons that might trigger loading
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaBusy = await button.getAttribute('aria-busy');
      
      // If button can be in loading state, it should have aria-busy
      const hasLoadingClass = await button.evaluate(el => 
        el.className.includes('loading') || el.querySelector('.spinner')
      );
      
      if (hasLoadingClass) {
        expect(ariaBusy).toBeTruthy();
      }
    }
  });
});