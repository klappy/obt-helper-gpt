import { test, expect } from '@playwright/test';

test.describe('Design System Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('design tokens render correctly', async ({ page }) => {
    // Create a test page with all design tokens
    await page.goto('/');
    
    // Test color system
    await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.innerHTML = `
        <div style="padding: 2rem; display: grid; gap: 1rem;">
          <h2>Color System</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div style="width: 100px; height: 100px; background: var(--primary); border-radius: 8px;"></div>
            <div style="width: 100px; height: 100px; background: var(--surface-1); border-radius: 8px;"></div>
            <div style="width: 100px; height: 100px; background: var(--surface-2); border-radius: 8px;"></div>
            <div style="width: 100px; height: 100px; background: var(--surface-3); border-radius: 8px;"></div>
          </div>
        </div>
      `;
      document.body.appendChild(testDiv);
    });
    
    await expect(page).toHaveScreenshot('design-tokens.png');
  });

  test('shadow system displays all levels', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.innerHTML = `
        <div style="padding: 2rem; display: grid; gap: 2rem; background: var(--background-primary);">
          <h2>Shadow System</h2>
          <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <div class="depth-1" style="width: 150px; height: 150px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">Depth 1</div>
            <div class="depth-2" style="width: 150px; height: 150px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">Depth 2</div>
            <div class="depth-3" style="width: 150px; height: 150px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">Depth 3</div>
            <div class="depth-4" style="width: 150px; height: 150px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">Depth 4</div>
            <div class="depth-5" style="width: 150px; height: 150px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center;">Depth 5</div>
          </div>
        </div>
      `;
      document.body.appendChild(testDiv);
    });
    
    await expect(page).toHaveScreenshot('shadow-system.png');
  });

  test('animations respect prefers-reduced-motion', async ({ page }) => {
    // Test with reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.className = 'fade-in slide-up';
      testDiv.innerHTML = 'This should not animate';
      testDiv.style.cssText = 'padding: 2rem; background: var(--surface-2); margin: 2rem;';
      document.body.appendChild(testDiv);
    });
    
    // Verify no animation occurs
    await page.waitForTimeout(100);
    await expect(page).toHaveScreenshot('reduced-motion.png');
  });
});

test.describe('Component Visual Tests', () => {
  test('FloatingCard renders with all depth levels', async ({ page }) => {
    await page.goto('/');
    
    // Create test harness for FloatingCard
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem; display: grid; gap: 2rem; grid-template-columns: repeat(3, 1fr);';
      
      // Mock the component markup
      for (let i = 1; i <= 5; i++) {
        const card = document.createElement('div');
        card.className = `floating-card depth-${i}`;
        card.innerHTML = `
          <div style="padding: 2rem;">
            <h3>Depth Level ${i}</h3>
            <p>This is a FloatingCard with depth level ${i}</p>
          </div>
        `;
        container.appendChild(card);
      }
      
      document.body.appendChild(container);
    });
    
    await expect(page).toHaveScreenshot('floating-cards.png');
  });

  test('AdaptiveButton renders all variants', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem; display: grid; gap: 1rem;';
      
      const variants = ['primary', 'secondary', 'tertiary', 'ghost'];
      const sizes = ['sm', 'md', 'lg', 'xl'];
      
      variants.forEach(variant => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; gap: 1rem; align-items: center;';
        
        sizes.forEach(size => {
          const button = document.createElement('button');
          button.className = `neu-button neu-button-${variant}`;
          button.textContent = `${variant} ${size}`;
          // Add size classes
          const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
            xl: 'px-8 py-4 text-xl'
          };
          button.className += ` ${sizeClasses[size]}`;
          row.appendChild(button);
        });
        
        container.appendChild(row);
      });
      
      document.body.appendChild(container);
    });
    
    await expect(page).toHaveScreenshot('adaptive-buttons.png');
  });

  test('SpatialGrid adapts to different viewports', async ({ page }) => {
    await page.goto('/');
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => {
      const grid = document.createElement('div');
      grid.className = 'spatial-grid grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      
      for (let i = 1; i <= 6; i++) {
        const item = document.createElement('div');
        item.className = 'depth-2';
        item.style.cssText = 'padding: 2rem; background: var(--surface-1); border-radius: 12px;';
        item.innerHTML = `<h3>Grid Item ${i}</h3>`;
        grid.appendChild(item);
      }
      
      document.body.appendChild(grid);
    });
    
    await expect(page).toHaveScreenshot('spatial-grid-desktop.png');
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('spatial-grid-mobile.png');
  });

  test('LiveMetric displays animated values', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem; display: grid; gap: 2rem; grid-template-columns: repeat(3, 1fr);';
      
      // Create different metric examples
      const metrics = [
        { label: 'Total Users', value: '1,234', trend: 'up', trendValue: '+12%', color: 'primary' },
        { label: 'Revenue', value: '$45,678', trend: 'up', trendValue: '+8%', color: 'success' },
        { label: 'Error Rate', value: '2.3%', trend: 'down', trendValue: '-15%', color: 'error' }
      ];
      
      metrics.forEach(metric => {
        const metricEl = document.createElement('div');
        metricEl.className = 'live-metric p-4';
        metricEl.innerHTML = `
          <div class="metric-label text-base">${metric.label}</div>
          <div class="metric-value text-3xl text-${metric.color}">${metric.value}</div>
          <div class="metric-trend text-sm trend-${metric.trend}">
            <span class="trend-icon">${metric.trend === 'up' ? '↑' : '↓'}</span>
            <span class="trend-value">${metric.trendValue}</span>
          </div>
        `;
        container.appendChild(metricEl);
      });
      
      document.body.appendChild(container);
    });
    
    await expect(page).toHaveScreenshot('live-metrics.png');
  });

  test('ConversationBubble renders all message types', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem; max-width: 600px; margin: 0 auto;';
      
      // User message
      const userBubble = document.createElement('div');
      userBubble.className = 'conversation-bubble conversation-bubble-user';
      userBubble.innerHTML = `
        <div class="bubble-content" style="align-items: flex-end;">
          <div class="bubble-message bubble-message-user">
            <span class="message-text">Hello! Can you help me?</span>
            <span class="message-status status-delivered">✓✓</span>
          </div>
          <div class="bubble-timestamp">3:42 PM</div>
        </div>
      `;
      
      // Assistant message
      const assistantBubble = document.createElement('div');
      assistantBubble.className = 'conversation-bubble conversation-bubble-assistant';
      assistantBubble.innerHTML = `
        <div class="bubble-avatar"><span class="avatar-emoji">🤖</span></div>
        <div class="bubble-content">
          <div class="bubble-name">AI Assistant</div>
          <div class="bubble-message">
            <span class="message-text">Of course! I'd be happy to help. What do you need assistance with?</span>
          </div>
          <div class="bubble-timestamp">3:43 PM</div>
          <div class="bubble-reactions">
            <button class="reaction-pill reaction-active">
              <span class="reaction-emoji">👍</span>
              <span class="reaction-count">1</span>
            </button>
          </div>
        </div>
      `;
      
      // System message
      const systemBubble = document.createElement('div');
      systemBubble.className = 'conversation-bubble conversation-bubble-system';
      systemBubble.innerHTML = `
        <div class="bubble-content" style="max-width: 90%;">
          <div class="bubble-message bubble-message-system">
            <span class="message-text">Conversation started</span>
          </div>
        </div>
      `;
      
      container.appendChild(systemBubble);
      container.appendChild(userBubble);
      container.appendChild(assistantBubble);
      
      document.body.appendChild(container);
    });
    
    await expect(page).toHaveScreenshot('conversation-bubbles.png');
  });
});

test.describe('Dark Mode Visual Tests', () => {
  test('components render correctly in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    await page.evaluate(() => {
      document.documentElement.style.backgroundColor = 'var(--background-primary)';
      
      const container = document.createElement('div');
      container.style.cssText = 'padding: 2rem; display: grid; gap: 2rem;';
      
      // Add various components
      container.innerHTML = `
        <div class="floating-card depth-2 p-4">
          <h3>Dark Mode Card</h3>
          <p>This card should look good in dark mode</p>
        </div>
        
        <div style="display: flex; gap: 1rem;">
          <button class="neu-button neu-button-primary px-4 py-2">Primary</button>
          <button class="neu-button neu-button-secondary px-4 py-2">Secondary</button>
        </div>
        
        <div class="live-metric p-4">
          <div class="metric-label">Dark Mode Metric</div>
          <div class="metric-value text-3xl text-primary">42</div>
        </div>
      `;
      
      document.body.appendChild(container);
    });
    
    await expect(page).toHaveScreenshot('dark-mode-components.png');
  });
});